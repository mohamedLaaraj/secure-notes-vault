#!/bin/sh

echo "LOG: Starting startup script..."
echo "LOG: Main Web Port (PORT) is $PORT"

# Start the Python challenge in the background on port 9050
echo "LOG: Starting Python challenge on port 9050..."
CHALLENGE_PORT=9050 python3 challenge.py > challenge.log 2>&1 &

# Start the PHP server
if command -v frankenphp > /dev/null; then
    echo "LOG: Starting PHP server with FrankenPHP on port $PORT..."
    frankenphp php-server --root=public/ --listen=:$PORT
else
    echo "LOG: Starting PHP server with php -S on port $PORT..."
    php -S 0.0.0.0:$PORT -t public
fi
