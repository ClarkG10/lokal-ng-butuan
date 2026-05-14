# Butuan Lokal — Church Event & Community Engagement Platform

> A modern, editorial, event-first engagement platform for a single church community.
> **Not** a traditional ChMS. The product surface is built around events, surveys,
> QR-driven participation, community comments, masterlists, and analytics.

---

## 1. Repository Layout

```
butuan-lokal-platform/
├── PLAN.md                    ← this file
├── web/                       ← React + Vite + Tailwind + shadcn frontend (public site + admin)
│   ├── public/
│   ├── src/
│   │   ├── app/               route components
│   │   ├── components/        ui, layout, events, surveys, qr, comments, motion
│   │   ├── features/          feature-scoped api + hooks
│   │   ├── lib/               api client, utils, query keys
│   │   ├── hooks/
│   │   ├── styles/            globals.css, tokens.css
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── api/                       ← Laravel 11 API (Sanctum + Spatie Permission + Excel)
    ├── app/
    ├── routes/
    ├── database/migrations/
    ├── composer.json
    └── .env.example
```

---

## 2. Tech Stack

### Frontend (`web/`)
- **React 18** + **TypeScript** + **Vite 5**
- **TailwindCSS 3** with CSS-variable design tokens
- **shadcn/ui** component patterns (Radix primitives, locally generated)
- **Framer Motion** for reveals, parallax, stepper transitions
- **react-fast-marquee** for announcement marquees
- **react-qr-code** for SVG QR rendering
- **TanStack Query v5** for server state
- **react-hook-form** + **zod** for forms
- **react-router-dom v6** for routing
- **recharts** for analytics
- **@dnd-kit** for media drag-reorder

### Backend (`api/`)
- **Laravel 11** (PHP 8.2+)
- **Laravel Sanctum** (cookie SPA auth)
- **Spatie Laravel Permission** (roles)
- **Maatwebsite Laravel Excel** (exports)
- **Intervention Image** (media variants)
- **Mews Purifier** (rich-text sanitation)
- **Predis / Redis** (cache, queue, sessions)
- **Queue Workers** + **Scheduler** for status sync, analytics rollups

---

## 3. Modules

| # | Module | Summary |
|---|---|---|
| 1 | Public Website | Hero · upcoming events · announcements marquee · highlights · surveys · gallery · church info |
| 2 | Events | Primary feature; lifecycle automated by scheduler |
| 3 | Event Graphics | Landscape & portrait media; drag-reorder; cover; carousel |
| 4 | Surveys & Campaigns | Multi-step, conditional logic, masterlist ingestion |
| 5 | QR System | Frontend SVG QR; tokenised redirects; scan logs |
| 6 | Comments | Threaded (1 level), reactions, moderation, pinning, spam |
| 7 | Masterlist | Derived roster of participants; filters; export |
| 8 | Analytics | KPIs, time series, scan funnel, engagement |
| 9 | Announcements / Blog | Rich text, cover, categories, draft/published |
| 10 | Admin Panel | Role-gated `/admin/*` shell |

---

## 4. Roles & Permission Matrix

| Capability | Super Admin | Content Manager | Moderator | Analytics Viewer |
|---|:-:|:-:|:-:|:-:|
| Manage users & roles | ✅ | — | — | — |
| CRUD events / media | ✅ | ✅ | — | — |
| CRUD surveys | ✅ | ✅ | — | — |
| CRUD announcements | ✅ | ✅ | — | — |
| Moderate comments | ✅ | ✅ | ✅ | — |
| Pin / spam comments | ✅ | ✅ | ✅ | — |
| View masterlists | ✅ | ✅ | — | ✅ |
| Export masterlists | ✅ | ✅ | — | — |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| System settings | ✅ | — | — | — |

---

## 5. Data Model (Relational)

```
users, roles, permissions (Spatie pivots)
events            (id, slug, title, description, starts_at, ends_at,
                   location, address, lat, lng, status, capacity,
                   requires_registration, cover_media_id, qr_code_id,
                   published_at, created_by)
event_media       (id, event_id, path, orientation, is_cover,
                   sort_order, alt_text)
surveys           (id, slug, title, description, status, starts_at,
                   ends_at, qr_code_id, settings JSON)
survey_questions  (id, survey_id, step, sort_order, type, label,
                   help_text, options JSON, is_required,
                   visibility_rules JSON)
survey_responses  (id, survey_id, masterlist_id NULL, submitted_at,
                   ip_hash, user_agent)
survey_answers    (id, response_id, question_id, value JSON)
qr_codes          (id, token UNIQUE, target_type, target_id, scan_count)
qr_scans          (id, qr_code_id, scanned_at, ip_hash, user_agent, referrer)
comments          (id, commentable_type, commentable_id, parent_id,
                   author_name, author_email, user_id, body,
                   status, is_pinned)
reactions         (id, comment_id, type, identifier_hash)
announcements     (id, slug, title, excerpt, body_rich, cover_path,
                   category_id, status, published_at, author_id, meta JSON)
announcement_categories (id, name, slug)
masterlists       (id, full_name, email, phone, tags JSON,
                   first_seen_at, last_activity_at,
                   events_count, surveys_count, source)
analytics_logs    (id, event_type, subject_type, subject_id, meta JSON, occurred_at)
```

Indexes: `events(status, starts_at)`, `survey_responses(survey_id, submitted_at)`,
`qr_scans(qr_code_id, scanned_at)`, `masterlists(email)`, `masterlists(phone)`,
`analytics_logs(event_type, occurred_at)`.

---

## 6. Design System (Warm Kinetic Editorial)

### Color Tokens
```
--background       #FFFFFF
--foreground       #111827
--muted            #F5F5F5
--muted-foreground #6B7280
--border           #E5E7EB
--card             #FFFFFF
--secondary-surface #FAFAFA
--primary-yellow   #F4D03F
--primary-green    #3FA34D
--primary-red      #D64545
```

### Typography
- Display: **Space Grotesk**
- Body:    **Inter** / **Plus Jakarta Sans**
- Hero: `text-[clamp(3rem,8vw,8rem)] tracking-tight font-bold leading-[0.95]`
- Body:  `text-base md:text-lg leading-relaxed`

### Shape & Depth
- Radii: `rounded-xl` / `rounded-2xl`
- Borders: `border border-gray-200`
- Shadows: `shadow-sm`, `shadow-md`

### Motion
- Reveal: opacity 0→1, translateY 16→0, dur 520ms, ease `cubic-bezier(0.22,1,0.36,1)`
- Marquee: speed 30–45, **disabled** when `prefers-reduced-motion`
- Parallax hero: ≤ 60px translate
- Hover: `-translate-y-0.5` + soft shadow lift

### Status Badges
| Status | Class hint |
|---|---|
| upcoming | `bg-yellow-100 text-yellow-900` |
| ongoing  | `bg-green-100 text-green-900` |
| completed| `bg-gray-100 text-gray-700` |
| cancelled| `bg-red-100 text-red-900` |

---

## 7. Backend Conventions

- Base URL: `/api/v1`
- Auth: Sanctum cookie session for SPA
- Response envelope: `{ data, meta?, links? }`
- Validation: Form Requests
- Authorization: Policies + Spatie middleware
- Scheduler:
  ```
  events:sync-statuses     every minute
  analytics:rollup         every five minutes
  comments:purge-spam      daily
  masterlist:recount       hourly
  ```
- Queues: `media`, `analytics`, `default`, `high`
- IPs hashed before storage (`sha256(ip + APP_KEY)`)

---

## 8. Key Workflows

### QR → Survey Submission
```
Print poster → scan → GET /q/{token}
  → log scan, 302 → /surveys/:slug?qr=1
  → multi-step form (conditional logic, client-side)
  → POST /surveys/:id/responses
  → Job IngestSurveyResponse
       ├ upsert masterlist by email/phone
       ├ bump counters + last_activity_at
       └ insert analytics_logs(survey_completed)
```

### Event Lifecycle
```
draft → published → (scheduler) upcoming → ongoing → completed
                                                    ↘ cancelled (sticky)
```

---

## 9. Removed Features (Intentional)

Multi-church · donations · ministry/small-group mgmt · member directory ·
sermon library · CalDAV sync.

---

## 10. Build Order

1. ✅ Bootstrap repo + tokens + layout shell
2. Events CRUD + media + scheduler + public list/detail
3. QR generation + scan logging
4. Surveys (builder + multi-step renderer + ingestion)
5. Comments + reactions + moderation
6. Announcements / blog
7. Masterlists + export
8. Analytics dashboard
9. Admin polish + role gating + settings
10. Hardening + deployment

---

## 11. Deployment

- **Web:** static build → Vercel/Netlify/Nginx; env `VITE_API_BASE`
- **API:** PHP-FPM + Nginx on VPS or container
- **DB:** MySQL 8 / PostgreSQL 16
- **Cache/Queue/Sessions:** Redis
- **Workers:** `php artisan queue:work` under Supervisor
- **Scheduler:** `* * * * * php artisan schedule:run`
- **Media:** S3-compatible (R2 / Spaces) + CDN
