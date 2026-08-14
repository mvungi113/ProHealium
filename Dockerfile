FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    unzip \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pgsql gd zip mbstring intl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY server/composer.json server/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY server .

RUN rm -f .env \
    && mkdir -p storage/framework/{sessions,views,cache} \
    && mkdir -p storage/logs \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

CMD ["sh", "-c", "echo 'APP_KEY=' > .env && php artisan key:generate --force 2>/dev/null; php artisan migrate --force 2>&1 && php artisan serve --host=0.0.0.0 --port=8000 2>&1"]
