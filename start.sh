#!/bin/sh

# Start the Python challenge in the background
echo "Starting Python challenge..."
python3 challenge.py > challenge.log 2>&1 &

# Start the PHP server
echo "Starting PHP server on port $PORT..."
php -S 0.0.0.0:$PORT -t public
