#!/bin/bash
gunicorn --workers 4 --bind 0.0.0.0:1852 --name gunicorn_atlas atlas_webserver:app