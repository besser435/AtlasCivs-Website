import os
from flask import Flask, request

os.chdir(os.path.dirname(os.path.abspath(__file__)))

from template_routes import template_routes
from api_routes import api_routes
from stats_routes import stats_routes
from config import log
import socket
import re


log.info("---- Starting AtlasCivs Webserver ----")

app = Flask(__name__, template_folder="html", static_folder="")  # Tell Flask `static` is the current directory

app.register_blueprint(template_routes)
app.register_blueprint(api_routes)
app.register_blueprint(stats_routes)



# TODO: Clean later into cache module
# TODO: Ensure etags work. change a file after it gets cached to see if it fetches a new version.
# I dont see any networks for revalidation, but that might be because they are just etag headers and no body changes.


# ETags on, disable Flask's built-in static max-age
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["USE_ETAGS"] = True

# Time constants
SEVEN_DAYS = 7 * 24 * 60 * 60
TWO_DAYS = 2 * 24 * 60 * 60
ONE_DAY = 24 * 60 * 60
EIGHT_HOURS = 8 * 60 * 60

# Regex-based cache rules (order matters, first match wins)
# NOTE: Be SUPER careful with regex here, double check it. 
# Ensure public is okay. Do not want private data cached by browsers or CDNs!
CACHE_RULES = [
    (r"^/api/player_skin/", f"public, max-age={EIGHT_HOURS}"),  # Skin update interval, so cache for that long
    (r"^/api/player_face/", f"public, max-age={EIGHT_HOURS}"),

    (r"^/api/showcase_img/", f"public, max-age={SEVEN_DAYS}"),
    (r"^/imgs/bluemap_embedded\.png$", f"public, max-age={SEVEN_DAYS}"),

    (r"^/api/", "no-store"),  # catch-all for other API calls
]

DEFAULT_CACHE = f"public, max-age={TWO_DAYS}"


@app.after_request
def add_cache_headers(response):
    path = request.path
    cache_control = DEFAULT_CACHE

    for pattern_str, value in CACHE_RULES:
        pattern = re.compile(pattern_str)
        if pattern.match(path):
            cache_control = value
            break

    response.headers["Cache-Control"] = cache_control
    return response



if __name__ == "__main__":
    # So you can access it from other devices on the LAN. Might not always work.
    host_ip = socket.gethostbyname(socket.gethostname())
    log.info(f"Current IP: {host_ip}")


    # Run in debug mode if this file is being run.
    # Otherwise run `app` from a WSGI server.
    app.run(debug=True, host=host_ip, port=1901)