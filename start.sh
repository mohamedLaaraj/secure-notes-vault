#!/bin/sh

echo "LOG: Starting startup script..."
echo "LOG: Main Web Port (PORT) is $PORT"

# Run migrations and seeders at startup to ensure database is populated
echo "LOG: Running database migrations and seeding..."
php artisan migrate --force
php artisan db:seed --class=CtfChallengeSeeder --force

# PROTECTION: If Railway set $PORT to the challenge port (9050), 
# we need to find the real web port or fallback to 8080
if [ "$PORT" = "9050" ]; then
    echo "WARNING: $PORT is set to the challenge port! Falling back to 8080 for web."
    export WEB_PORT=8080
else
    export WEB_PORT=$PORT
fi

# Start the Python challenge in the background on port 9050
export CHALLENGE_PORT=9050
echo "LOG: Starting Python challenge on port $CHALLENGE_PORT..."
python3 challenge.py &

# Start the PHP server
if command -v frankenphp > /dev/null; then
    echo "LOG: Starting PHP server with FrankenPHP on port $WEB_PORT..."
    frankenphp php-server --root=public/ --listen=:$WEB_PORT
else
    echo "LOG: Starting PHP server with php -S on port $WEB_PORT..."
    php -S 0.0.0.0:$WEB_PORT -t public
fi
