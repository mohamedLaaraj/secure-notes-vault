# Use the official FrankenPHP image
FROM dunglas/frankenphp:latest-php8.2-alpine

# Install system dependencies and Python
RUN apk add --no-cache \
    python3 \
    bash \
    icu-dev \
    libzip-dev \
    zlib-dev \
    mariadb-client

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    intl \
    zip \
    bcmath

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

# Give execution permissions to start script
RUN chmod +x start.sh

# Expose ports
# PORT will be injected by Railway for web
# 9050 is for the challenge
EXPOSE 8080
EXPOSE 9050

# Use start.sh as the entrypoint
CMD ["./start.sh"]
