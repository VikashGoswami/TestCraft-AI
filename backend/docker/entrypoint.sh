#!/bin/sh
set -e

# Ensure .env exists so Laravel artisan commands don't crash on file_get_contents(.env)
if [ ! -f /var/www/html/.env ]; then
    if [ -f /var/www/html/.env.example ]; then
        echo "Creating .env from .env.example..."
        cp /var/www/html/.env.example /var/www/html/.env
    else
        echo "Creating blank .env file..."
        touch /var/www/html/.env
    fi
fi

# Ensure storage and bootstrap cache directories exist with correct permissions
mkdir -p /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache \
         /var/www/html/database

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/.env /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
chmod 664 /var/www/html/.env

# Generate application key if APP_KEY environment variable is not passed
if [ -z "$APP_KEY" ]; then
    echo "Generating application encryption key into .env..."
    php artisan key:generate --force || true
fi

# SQLite support: ensure database file exists
if [ "$DB_CONNECTION" = "sqlite" ] || [ -z "$DB_CONNECTION" ]; then
    if [ ! -f /var/www/html/database/database.sqlite ]; then
        echo "Creating database.sqlite file..."
        touch /var/www/html/database/database.sqlite
    fi
    chown -R www-data:www-data /var/www/html/database
    chmod 664 /var/www/html/database/database.sqlite || true
fi

# Dynamic Render Port: configure Nginx to listen on $PORT (defaults to 80 if not set)
PORT_TO_USE="${PORT:-80}"
echo "Configuring Nginx to listen on port ${PORT_TO_USE}..."
sed -i "s/listen 80;/listen ${PORT_TO_USE};/g" /etc/nginx/http.d/default.conf

# Run database migrations and seed default roles
echo "Running migrations..."
php artisan migrate --force || true

echo "Seeding roles..."
php artisan db:seed --force --class=RolesSeeder || true

# Optimize cache for production
echo "Caching configurations and routes..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Starting Nginx and PHP-FPM on port ${PORT_TO_USE} via Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
