# LifeLink — Blood Donation Management System

A modern, responsive blood-donation platform for connecting donors, patients, hospitals and blood banks. Built with **React (JavaScript/JSX)**, **Vite**, **Flask** and **Supabase (PostgreSQL)**, styled with Tailwind CSS and Radix UI — claymorphism theme (red / white / light gray).

> Frontend is **JavaScript/JSX only** (no TypeScript). Backend is a Python **Flask** API that talks to **Supabase** with a `service_role` key — that key never leaves the server.

---

## Features

- **Home** — hero, impact stats, why-donate, how-it-works, emergency request form, testimonials
- **Donor registration** (`/donate`) — validation, eligibility check, availability toggle
- **Find blood** (`/find-blood`) — filter by blood group / city / units / urgency
- **Blood requests** (`/requests`) — raise requests + live board with approval workflow
- **Blood bank inventory** (`/blood-bank`) — group cards with low/critical warnings + per-facility stock table
- **Hospitals directory** (`/hospitals`) — search, city filter, 24×7 emergency filter, detail dialog
- **Donor dashboard** (`/dashboard`) — profile, eligibility timeline, donation history, log donation
- **Admin dashboard** (`/admin`) — stats, donors / inventory / requests / hospitals / users management
- **Auth** (`/auth`) — register & login with role-based routing (`donor` / `recipient` / `hospital` / `admin`)

Auth uses **Supabase Auth** via the Flask API (`/api/auth/*`). The API creates users with `email_confirm: true` (service_role) so registration returns a usable `access_token` immediately — stored as `lifelink_access_token` and sent as `Authorization: Bearer <token>`.

Without a backend (`VITE_API_URL` unset) the app runs in **localStorage demo mode** — all pages remain functional with seeded sample data.

---

## Tech stack

- **Frontend:** React 19 (JS/JSX), Vite 7, React Router 7, Tailwind CSS 4, Radix UI, Framer Motion, Sonner
- **Backend:** Flask 3, Flask-Cors, `supabase-py`, `python-dotenv`, PyJWT, gunicorn
- **Database:** Supabase Postgres — schema in `supabase/schema.sql`, seed in `supabase/seed.sql`
- **Auth:** Supabase Auth (email/password) via Flask service_role

---

## Project structure

```
.
├── src/                    # React frontend (JS/JSX only)
│   ├── components/         # Navbar, Footer, RequireAuth, clay helpers, ui/*
│   ├── pages/              # Landing, Auth, Dashboard, AdminDashboard, FindBlood, ...
│   ├── lib/
│   │   ├── api.js          # Flask API client (isApiMode, Bearer token)
│   │   ├── supabase.js     # Browser anon client (optional)
│   │   ├── store.jsx       # Demo localStorage store (fallback when no API)
│   │   ├── types.js        # Blood-group / role constants
│   │   ├── mappers.js      # Supabase ↔ UI mappers
│   │   └── useInventory.js # Inventory hook (API or store)
│   ├── hooks/use-mobile.js
│   └── main.jsx            # App shell + routing
├── server/
│   ├── app.py              # Flask API (all /api/* endpoints)
│   └── requirements.txt
├── supabase/
│   ├── schema.sql          # Postgres schema (enums, tables, triggers)
│   └── seed.sql            # Hospitals, inventory, donors, requests, history
├── public/                 # Static assets
├── vite.config.js
├── index.html
└── package.json
```

---

## Local development

### 1) Frontend

```bash
npm install
npm run dev
# → http://localhost:5173
```

### 2) Supabase

1. Create a project at https://supabase.com
2. Open **SQL Editor** and run, in order:
   - `supabase/schema.sql` — creates all tables
   - `supabase/seed.sql` — inserts hospitals, inventory, donor stubs, sample requests
3. Copy **Project URL** and **anon key** from **Project Settings → API**

### 3) Flask backend

```bash
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt

# create server/.env (never commit this file)
cat > .env <<'EOF'
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
PORT=5000
CORS_ORIGINS=http://localhost:5173
EOF

python app.py
# → http://localhost:5000
# check: curl http://localhost:5000/api/health
```

The `service_role` key is **server-only** — it is read from `server/.env` and never exposed to the browser or committed to git.

### 4) Wire frontend to backend

Create `.env` (or `.env.local`) in the **project root**:

```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...
```

Restart `npm run dev` after changing env. If `VITE_API_URL` is empty/unset, the app falls back to localStorage demo mode automatically.

---

## Environment variables

**Frontend (project root `.env` — not committed):**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no | Flask origin, e.g. `http://localhost:5000`. Empty → demo mode. |
| `VITE_SUPABASE_URL` | no | Supabase Project URL (anon usage only). |
| `VITE_SUPABASE_ANON_KEY` | no | Supabase **anon** key — safe for the browser. |

**Backend (`server/.env` — not committed):**

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **service_role** key — keep server-only |
| `PORT` | no | default `5000` |
| `CORS_ORIGINS` | no | default `http://localhost:5173` |

> Never put `SUPABASE_SERVICE_ROLE_KEY` in the frontend, in `.env.example`, or in git. See `.gitignore`.

A template is provided at `.env.example` (frontend) and `server/.env.example` (backend).

---

## API overview

Base: `VITE_API_URL` (e.g. `http://localhost:5000`)

- `GET  /api/health` · `GET /api/config-check` · `GET /api/stats`
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` (Bearer)
- `GET  /api/donors` · `POST /api/donors` · `PUT /api/donors/:id` · `DELETE /api/donors/:id`
- `GET  /api/donors/:id/history` · `POST /api/donors/:id/donations`
- `GET  /api/requests` · `POST /api/requests` · `PATCH /api/requests/:id/status` · `DELETE /api/requests/:id`
- `GET  /api/inventory` · `PATCH /api/inventory/:id`
- `GET  /api/hospitals` · `PUT /api/hospitals/:id` · `DELETE /api/hospitals/:id`
- `GET  /api/users` (admin) · `DELETE /api/users/:id` (admin)

Protected routes expect `Authorization: Bearer <supabase_access_token>`.

---

## Demo accounts

Create these via the app's **Register** page (the Flask API auto-confirms email). All use the same password:

**Password:** `demo1234`

- `admin@lifelink.in` (admin)
- `donor@lifelink.in` (donor)
- `recipient@lifelink.in` (recipient)
- `hospital@lifelink.in` (hospital)

The seed file also contains 9 demo donors, 10 hospitals, 48 inventory rows and 5 sample requests with donation history — visible immediately after running `seed.sql`, even before creating auth users.

---

## Build

```bash
npm run build
# output in dist/
npm run preview
```

`build_static.mjs` exists for the previous Pages-oriented static export; for the current full-stack setup use `npm run build` + a Flask host (gunicorn) and a static host for `dist/`.

---

## Security notes

- `server/.env` (with `SUPABASE_SERVICE_ROLE_KEY`) is git-ignored and must not be committed.
- `.env`, `.env.local`, `.env.keys` are git-ignored.
- The browser only ever sees `VITE_SUPABASE_ANON_KEY` — RLS is disabled; authorization is enforced in Flask.
- Verify no secrets are tracked: `git ls-files | xargs grep -l SERVICE_ROLE` should return only `server/app.py` and docs, never a committed `.env`.

---

## License

Demo project — sample data only. Blood availability and requests are illustrative and not for real medical decisions.
