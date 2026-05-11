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
export PATH=$PATH:/nix/var/nix/profiles/default/bin:/usr/local/bin:/usr/bin

echo "LOG: Searching for Python..."
PYTHON_BIN=$(which python3 || which python3.11 || which python || find /nix/store -name python3 -type f -executable -print -quit 2>/dev/null)

if [ -n "$PYTHON_BIN" ]; then
    echo "LOG: Python found at $PYTHON_BIN. Starting challenge..."
    $PYTHON_BIN challenge.py &
else
    echo "FATAL: Python not found even after deep search! Check Nixpacks config."
fi

# Start the PHP server
if command -v frankenphp > /dev/null; then
    echo "LOG: Starting PHP server with FrankenPHP on port $WEB_PORT..."
    frankenphp php-server --root=public/ --listen=:$WEB_PORT
else
    echo "LOG: Starting PHP server with php -S on port $WEB_PORT..."
    php -S 0.0.0.0:$WEB_PORT -t public
fi
