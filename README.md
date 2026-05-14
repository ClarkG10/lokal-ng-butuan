# Butuan Lokal Platform — Monorepo

A modern, editorial, **event-first** church engagement platform built around
events, surveys, QR participation, comments, masterlists, and analytics.

> See [PLAN.md](./PLAN.md) for the full architectural blueprint.

## Structure

```
butuan-lokal-platform/
├── PLAN.md          ← architecture, design system, data model
├── web/             ← React + Vite + Tailwind + shadcn frontend
└── api/             ← Laravel 11 API (Sanctum + Spatie Permission)
```

## Bootstrap (first-time setup)

### Frontend

```bash
cd web
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

### Backend

The `api/` directory currently contains the **manifest, routes, models,
migrations, and seeders** — the rest of the Laravel framework files
(`artisan`, `bootstrap/`, `config/`, public `index.php`, etc.) are installed
by Composer.

The cleanest path is to install Laravel 11 fresh into the directory and let
our manifest take over:

```bash
# From the repo root, in PowerShell
cd api
composer install                                    # uses our composer.json
# OR, if you don't yet have a Laravel skeleton:
#   composer create-project laravel/laravel . "^11.0" --remove-vcs
#   then merge our composer.json additions and re-run composer update

cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan storage:link

# Run
php artisan serve                                   # http://localhost:8000
php artisan queue:work --queue=high,default,media   # (separate terminal)
php artisan schedule:work                           # (separate terminal, dev)
```

## Roles seeded

- `super_admin` · `content_manager` · `moderator` · `analytics_viewer`
- Default admin: `admin@butuanlokal.local` (change the password immediately)

## Scheduled commands

| Command | Frequency |
|---|---|
| `events:sync-statuses` | every minute |
| `analytics:rollup`     | every five minutes |
| `comments:purge-spam`  | daily |
| `masterlist:recount`   | hourly |

## Public QR shortlink

`GET /q/{token}` → logs the scan → 302 redirects to the SPA URL on
`APP_FRONTEND_URL`, e.g. `http://localhost:5173/events/youth-night?qr=1`.

## Design system (TL;DR)

- **Colors:** white background · `#111827` text · yellow `#F4D03F` ·
  green `#3FA34D` · red `#D64545` · borders `#E5E7EB`.
- **Type:** Space Grotesk (display), Inter (body).
- **Motion:** soft `cubic-bezier(0.22,1,0.36,1)`, 280–520 ms; respects
  `prefers-reduced-motion`.
- **Cards:** `rounded-2xl`, soft borders, subtle hover lift.

See [PLAN.md](./PLAN.md) for the full token table and component conventions.

## Build order (next steps)

1. **Events** — full CRUD, media uploads with reorder, public detail page
2. **QR** — `<QrPoster/>` component + admin "Generate Poster" UI
3. **Surveys** — admin builder + multi-step renderer + ingestion job
4. **Comments** — threaded UI + moderation queue
5. **Announcements / Blog** — TipTap editor + index/detail
6. **Masterlists** — filtered table + Excel export
7. **Analytics** — dashboard with recharts
8. **Admin polish** — role gating, settings, hardening
