import re
from flask import request


# Time constants
SEVEN_DAYS = 7 * 24 * 60 * 60
TWO_DAYS = 2 * 24 * 60 * 60
ONE_DAY = 24 * 60 * 60
EIGHT_HOURS = 8 * 60 * 60

# Regex-based cache rules (order matters, first match wins)
# Be SUPER careful with regex here, double check it. 
CACHE_RULES = [
    (r"^/api/player_skin/", f"public, max-age={EIGHT_HOURS}"),    # Skin update interval, so cache for that long
    (r"^/api/player_face/", f"public, max-age={EIGHT_HOURS}"),

    (r"^/api/showcase_img/", f"public, max-age={SEVEN_DAYS}"),
    (r"^/imgs/bluemap_embedded\.png$", f"public, max-age={SEVEN_DAYS}"),

    (r"^/api/", "no-store"),  # catch-all for other API calls
]

DEFAULT_CACHE = f"public, max-age={TWO_DAYS}"


# NOTE: ETags seem to work, but IDK. Yakub has a proxy cache, so ETags wont see changes until the proxy
# cache fetches the new resource.
def init_cache_headers(app):
    """Attach Cache-Control + ETag logic to a Flask app."""

    # Enable ETags and disable default static max-age
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
    app.config["USE_ETAGS"] = True

    # Precompile regexes once at startup for performance
    compiled_rules = [(re.compile(p), v) for p, v in CACHE_RULES]

    @app.after_request
    def _add_cache_headers(response): # Ignore not accessed. Flask uses it.
        path = request.path
        cache_control = DEFAULT_CACHE

        for pattern, value in compiled_rules:
            if pattern.match(path):
                cache_control = value
                break

        response.headers["Cache-Control"] = cache_control
        return response

    return app
