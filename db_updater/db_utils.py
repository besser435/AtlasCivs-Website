import sqlite3
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

DB_FILE = "../db/atlascivs.db"
STATS_DB_FILE = "../db/atlas_stats.db"


# what the fuck is database normalization
def create_general_tables(db_file=DB_FILE):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()

        # Create players table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                uuid TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                online_duration INTEGER,
                afk_duration INTEGER,
                bio TEXT, 
                first_joined INTEGER,
                last_online INTEGER     -- added by db_updater.py, not AC-API
            )
        """)

        # Create kills table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS kills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                killer_uuid TEXT NOT NULL,
                killer_name TEXT NOT NULL,
                victim_uuid TEXT NOT NULL,
                victim_name TEXT NOT NULL,
                death_message TEXT,
                weapon_json TEXT,                  -- store raw weapon JSON
                timestamp INTEGER NOT NULL
            )
        """)

        # Create misc. variables table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS variables (
                variable TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        conn.commit()

    print("General database initialized")


def create_stats_tables(db_file=STATS_DB_FILE):
    with sqlite3.connect(STATS_DB_FILE) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS player_statistics (
                player_uuid TEXT NOT NULL,         -- UUID of the player
                category TEXT NOT NULL,            -- Category of the statistic (e.g., 'general', 'mob', 'item')
                stat_key TEXT NOT NULL,            -- The name of the statistic (e.g., 'DAMAGE_DEALT', 'KILL_ENTITY:FROG')
                stat_value INTEGER NOT NULL,       -- The value of the statistic
                PRIMARY KEY (player_uuid, category, stat_key)
            )
        """)

        conn.commit()

    print("Stats database initialized")


def drop_stats_table(db_file=STATS_DB_FILE, table=None):
    with sqlite3.connect(STATS_DB_FILE) as conn:
        cursor = conn.cursor()

        cursor.execute(f"DROP TABLE IF EXISTS {table};")
        conn.commit()

    print(f"Dropped stats table: {table}")


def drop_general_table(db_file=DB_FILE, table=None):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()

        cursor.execute(f"DROP TABLE IF EXISTS {table};")
        conn.commit()

    print(f"Dropped general table: {table}")


def get_stat(player_uuid, category, stat_key):
    with sqlite3.connect(STATS_DB_FILE) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT stat_value
            FROM player_statistics
            WHERE player_uuid = ? AND category = ? AND stat_key = ?
        """, (player_uuid, category, stat_key))

        result = cursor.fetchone()
        return result[0] if result else None


def insert_player(
    uuid, name, online_duration=0, afk_duration=0, bio=None, last_online=None, db_file=DB_FILE
):
    
    with sqlite3.connect(db_file) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO players (
                uuid, name, online_duration, afk_duration, bio, last_online
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            uuid, name, online_duration, afk_duration, bio, last_online
        ))
        
        conn.commit()

    print(f"Inserted or updated player: {name} ({uuid})")



if __name__ == "__main__":
    create_general_tables()
    create_stats_tables()

    pass