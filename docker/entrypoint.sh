#!/bin/sh
set -e

node /app/backend/dist/src/server.js &
BACKEND_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

# If the backend dies (e.g. crashes at boot on a missing env var), nginx would
# otherwise keep running and silently 502 every /api/* request forever. Exit
# the whole container instead so the platform sees a failed/unhealthy deploy.
wait "$BACKEND_PID"
BACKEND_EXIT=$?
echo "backend process exited (code $BACKEND_EXIT), stopping nginx" >&2
kill "$NGINX_PID" 2>/dev/null
exit "$BACKEND_EXIT"
