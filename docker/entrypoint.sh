#!/bin/sh
set -e

node /app/backend/dist/src/server.js &

exec nginx -g 'daemon off;'
