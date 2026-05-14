# Butuan Lokal — Setup

This is a hand-written Laravel 11 project skeleton. Run the bootstrapping
steps below once before first run; the framework will auto-generate the
remaining `config/*` files via `vendor:publish`.

## 0. PHP extensions (Windows / Laragon)

`maatwebsite/excel` (used by the masterlist CSV export) needs `ext-zip`.
Open `C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.ini` and uncomment:

```ini
extension=zip
extension=fileinfo
extension=gd
extension=intl
```

Restart Laragon (or your terminal) after editing. Verify with:

```bash
php -m | grep -i zip
```

## 1. Install PHP dependencies

```bash
cd api
composer install
php artisan key:generate
```

## 2. Configure environment

```bash
cp .env.example .env
# edit DB credentials, REDIS_*, SANCTUM_STATEFUL_DOMAINS, APP_FRONTEND_URL
```

Key variables for SPA cookie auth:

```env
APP_URL=http://localhost:8000
APP_FRONTEND_URL=http://localhost:5173
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DRIVER=cookie
```

## 3. Publish vendor configs (Sanctum, Spatie, Purifier)

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --provider="Mews\Purifier\PurifierServiceProvider"
php artisan vendor:publish --provider="Intervention\Image\Laravel\ServiceProvider"
```

## 4. Migrate + seed

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

The seeder creates 4 roles (`super_admin`, `content_manager`, `moderator`,
`analytics_viewer`) and a default super admin (`admin@butuanlokal.test` /
`password123!` — override via `SEED_ADMIN_*` env vars before seeding).

## 5. Run

```bash
php artisan serve
php artisan queue:work          # in another terminal (jobs)
php artisan schedule:work       # in another terminal (event status sync)
```

Frontend (separate terminal):

```bash
cd ../web
npm install
npm run dev
```

Visit `http://localhost:5173/admin/login`.

## Authentication model

- Sanctum **SPA cookie session** (no API tokens needed for the admin UI).
- The web app sets the CSRF cookie via `GET /sanctum/csrf-cookie`, then
  `POST /api/v1/auth/login` with email + password.
- Subsequent admin requests are authenticated by the `laravel_session`
  cookie + `XSRF-TOKEN` header.
- Roles are checked by Spatie's `role:` middleware in `routes/api.php`.

## File uploads

`config/filesystems.php` (auto-generated): the project uses the **public**
disk for event media in dev; switch to S3-compatible (R2/Spaces) in prod
by setting `FILESYSTEM_DISK=s3` and `AWS_*` env vars.

## Scheduled jobs

`bootstrap/app.php` registers `events:sync-statuses` (every minute).
Add additional schedules in the `withSchedule(...)` block.
