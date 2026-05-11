#!/bin/sh

# Start the Python challenge in the background on port 8888
echo "Starting Python challenge on port 8888..."
CHALLENGE_PORT=8888 python3 challenge.py > challenge.log 2>&1 &

# Start the PHP server (Laravel/PHP default server)
echo "Starting PHP server on port $PORT..."
php -S 0.0.0.0:$PORT -t public
