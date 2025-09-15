import sqlite3
import requests
import time
from datetime import datetime
import logging
import os
import traceback
import sys
import json

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Python not looking in parent directories for common files you might want to use is stupid
sys.path.append("../")
from diet_logger import setup_logger


LOG_LEVEL = logging.INFO
LOG_FILE = "../logs/db_updater.log"

API_URL = "https://ip1.realwizardhosting.online:7070/api"
DB_FILE = "../db/atlascivs.db"

SKIN_TTL_HOURS = 8
BODY_SKIN_API_URL = "https://starlightskins.lunareclipse.studio/render/ultimate/{uuid}/full?capeEnabled=false"
BODY_SKINS_DIR = "../db/player_body_skins"

FACE_SKIN_API_URL = "https://mc-heads.net/avatar/{uuid}/8"   # Should really just use the Mojang API
FACE_SKINS_DIR = "../db/player_face_skins"



class BadGatewayError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


def upsert_variable(variable: str, value: str) -> None:    # the shitfuck
    """
    Upserts a value in the miscellaneous `variables` table.
    Variable names and values are stored as the `TEXT` type.
    """

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO variables (variable, value)
            VALUES (?, ?)
            ON CONFLICT(variable) DO UPDATE SET 
                value = excluded.value
        """, (str(variable), str(value)))

        conn.commit()


def update_players_table() -> None:
    log.debug("Updating players table...")

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        response = requests.get(API_URL + "/online_players", timeout=20)
        log.debug("Got response from API")

        start_time = time.time()
        if response.status_code == 200:
            data = response.json()
            online_players = data.get("online_players", {})

            for uuid, player_data in online_players.items():
                name = player_data.get("name")
                online_duration = player_data.get("online_duration", 0)
                afk_duration = player_data.get("afk_duration", 0)
                bio = player_data.get("bio", "")
                first_joined = player_data.get("first_joined", 0)
                last_online = int(time.time() * 1000)   # convert to ms, as that is what we do everywhere

                # NOTE: online_duration and afk_duration can still be non-zero even if the player is offline
                cursor.execute("""
                    INSERT INTO players (
                        uuid, name, online_duration, afk_duration, bio, first_joined, last_online
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?
                    ) ON CONFLICT(uuid) DO UPDATE SET
                        name = excluded.name,
                        online_duration = excluded.online_duration,
                        afk_duration = excluded.afk_duration,
                        bio = excluded.bio,
                        first_joined = excluded.first_joined,
                        last_online = excluded.last_online
                """, (uuid, name, online_duration, afk_duration, bio, first_joined, last_online))
            log.debug("Executed SQL commands")

            # Offline players should have their online_duration reset to 0
            cursor.execute("""
                UPDATE players
                SET online_duration = 0
                WHERE uuid NOT IN (
                    SELECT value FROM json_each(?)
                )
            """, (json.dumps(list(online_players.keys())),))
            log.debug("Executed SQL commands")

            conn.commit()
            log.debug("Committed SQL commands")

            upsert_variable("last_players_update", int(time.time() * 1000))
            log.debug("Updated last_players_update variable")

        elif response.status_code == 502:
            raise BadGatewayError("API server returned 502 Bad Gateway. Is server offline or restarting?")
        else:
            log.warning(f"Failed to fetch player data: {response.status_code}")

    end_time = time.time()
    log.debug(f"Players table updated in {round((end_time - start_time) * 1000, 3)}ms")   # Does not include network request time


def update_kills_table() -> None:
    log.debug("Updating kills table...")

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        response = requests.get(API_URL + "/kill_history", timeout=20)
        log.debug("Got response from API")

        start_time = time.time()
        
        cursor.execute("SELECT MAX(timestamp) FROM kills")
        last_timestamp = cursor.fetchone()[0] or 0  # Default to 0 if no kills exist

        if response.status_code == 200:
            kills_data = response.json()

            for kill_entry in kills_data:
                killer_uuid = kill_entry.get("killer_uuid")
                killer_name = kill_entry.get("killer_name")
                victim_uuid = kill_entry.get("victim_uuid")
                victim_name = kill_entry.get("victim_name")
                death_message = kill_entry.get("death_message")
                weapon = kill_entry.get("weapon")
                timestamp = kill_entry.get("timestamp")

                if timestamp > last_timestamp:
                    cursor.execute("""
                        INSERT INTO kills (
                            killer_uuid, killer_name, victim_uuid, victim_name, death_message, weapon_json, timestamp
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        killer_uuid,
                        killer_name,
                        victim_uuid,
                        victim_name,
                        death_message,
                        json.dumps(weapon) if weapon else None,
                        timestamp
                    ))

            log.debug("Executed SQL commands")
            conn.commit()
            log.debug("Committed SQL commands")
            upsert_variable("last_kills_update", int(time.time() * 1000))

        elif response.status_code == 502:
            raise BadGatewayError("API server returned 502 Bad Gateway. Is server offline or restarting?")
        else:
            log.warning(f"Failed to fetch kills data: {response.status_code}")

    end_time = time.time()
    log.debug(f"Kills table updated in {round((end_time - start_time) * 1000, 3)}ms")


def update_skin_dir(type) -> None:
    # Could honestly just store the face image in the players table. They are only about 160 bytes each.
    log.debug(f"Updating {type} skins...")

    start_time = time.time()

    os.makedirs(BODY_SKINS_DIR, exist_ok=True)
    os.makedirs(FACE_SKINS_DIR, exist_ok=True)

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT uuid FROM players")
        players = cursor.fetchall()

    current_time = time.time()

    for (uuid,) in players:
        if type == "body": skin_path = os.path.join(BODY_SKINS_DIR, f"{uuid}.png")
        elif type == "face": skin_path = os.path.join(FACE_SKINS_DIR, f"{uuid}.png")

        if os.path.exists(skin_path):
            last_modified_time = os.path.getmtime(skin_path)
            if current_time - last_modified_time < SKIN_TTL_HOURS * 3600:
                continue    # Skip if skin is still fresh

        if type == "body": response = requests.get(BODY_SKIN_API_URL.format(uuid=uuid), timeout=20)
        elif type == "face": response = requests.get(FACE_SKIN_API_URL.format(uuid=uuid), timeout=20)

        if response.status_code == 200:
            with open(skin_path, "wb") as skin_file:
                skin_file.write(response.content)
            log.debug(f"Updated {type} skin for UUID: {uuid}")
        else:
            log.warning(f"Failed to fetch {type} skin for UUID {uuid}: HTTP {response.status_code}")


    end_time = time.time()
    log.debug(f"Player face skins updated in {round((end_time - start_time) * 1000, 3)}ms")   # Includes network request time


def update_server_info_table() -> None:
    log.debug("Updating server info...")

    response = requests.get(API_URL + "/server_info", timeout=20)
    log.debug("Got response from API")

    start_time = time.time()

    if response.status_code == 200:
        data = response.json()
        weather = data.get("weather")
        world_time_24h = data.get("world_time_24h")
        day = data.get("day")

        system_time = data.get("system_time")
        api_version = data.get("acapi_version")
        api_build = data.get("acapi_build")

        # because 3 discrete DB operations is better than one, right?
        upsert_variable("weather", weather)
        upsert_variable("world_time_24h", world_time_24h)
        upsert_variable("day", day)
        upsert_variable("system_time", system_time)
        upsert_variable("acapi_version", api_version)
        upsert_variable("acapi_build", api_build)
        log.debug("Updated variables")
    elif response.status_code == 502:
        raise BadGatewayError("API server returned 502 Bad Gateway. Is server offline or restarting?")
    else:
        log.warning(f"Failed to fetch server info: {response.status_code}")

    end_time = time.time()
    log.debug(f"Server info updated in {round((end_time - start_time) * 1000, 3)}ms")   # Does not include network request time

# TODO: 
# Restart the script every 2 hours in case the internet goes out.
# When the internet comes back, it has a bug where it will stop updating.

if __name__ == "__main__":
    try:
        log = setup_logger(LOG_FILE, LOG_LEVEL)
        log.info("---- Starting DB Updater ----")

        while True: 
            """TODO: 
            Should be async, so we can have different intervals for different tasks.
            chat should be updated frequently, but towns only needs to be ran every few minutes.

            Should raise an error if an update takes longer than a few hundred milliseconds
            """

            start_time = time.time()

            update_players_table()
            update_kills_table()
            update_server_info_table()

            try:
                update_skin_dir("body")
                update_skin_dir("face")
            except Exception as e:  # Not super critical, sometimes the APIs go down
                log.warning(f"Failed to update skins: {e}")

            end_time = time.time()

            # Print to not fill log file
            print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} Time to update general DB was {round((end_time - start_time) * 1000, 2)}ms")

            time.sleep(2)


    # This generally isn't a thing anymore, as its now behind Cloudflare. CF will return 502 instead of this throwing an error.
    # This still happens on occasion however, so we still catch it.
    except (BadGatewayError, requests.exceptions.ConnectionError, requests.exceptions.ConnectTimeout) as e:
        # When the server restarts, it can rarely cause requests to not be able to reconnect.
        # This should restart the script and fix the issue, hopefully.
        # We dont log the error, as its probably just the server restarting.

        # TODO: when the server goes offline (say for maintenance) this will not trigger the website to report
        # an outdated status

        log.info(f"Connection timed out. Restarting in 30s")

        time.sleep(30)

        log.info("Restarting script (timeout)...")
        os.execl(sys.executable, sys.executable, *sys.argv) 

    except Exception:
        log.error(traceback.format_exc())

        time.sleep(30)

        log.info("Restarting script (general exception)...")
        os.execl(sys.executable, sys.executable, *sys.argv) 

    except KeyboardInterrupt:
        pass
