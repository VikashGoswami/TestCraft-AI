#!/bin/sh
set -e

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application encryption key..."
    php artisan key:generate --force
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

echo "Starting Nginx and PHP-FPM via Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
