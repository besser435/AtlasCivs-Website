import logging
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

sys.path.append("../")
from diet_logger import setup_logger

# Config
log_level = logging.DEBUG

LOG_FILE = "../logs/webserver.log"

ATLAS_DB_FILE = "../db/atlascivs.db"
STATS_DB_FILE = "../db/atlas_stats.db"

PLAYER_BODY_SKIN_DIR = "../db/player_body_skins/"
PLAYER_FACE_SKIN_DIR = "../db/player_face_skins/"

SHOWCASE_SUBMISSIONS_DIR = "../db/showcase_submissions/"
SHOWCASE_IMAGES_DIR = "../db/showcase_imgs/"


# Setup Logger
log = setup_logger(LOG_FILE, log_level)
