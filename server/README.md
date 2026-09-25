# LifeLink Flask API

Python Flask + Supabase backend for LifeLink.

## Setup

```bash
cd server
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure Supabase — create server/.env with:
#   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   (get these from Supabase Dashboard → Project Settings → API → service_role)

cp .env.example .env   # then fill in the values above
python app.py          # http://localhost:5000
```

Verify: `curl http://localhost:5000/api/health`

## Supabase

Run in Supabase SQL Editor, in order:

1. `supabase/schema.sql` — creates all tables
2. `supabase/seed.sql` — hospitals, inventory, donor seed, sample requests

Create demo auth users via the app's Register page or via Supabase Auth Dashboard:

- `admin@lifelink.in` / aux
- `donor@lifelink.in`
- `recipient@lifelink.in`
- `hospital@lifelink.in`

Password: `demo1234`

The Flask API uses the `service_role` key and manages authorization in application logic (RLS stays disabled).

## React env

In the project root `.env` (or `.env.local`), set:

```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

If `VITE_API_URL` is empty/unset, the React app stays in localStorage demo mode (no backend required) — preview keeps working as before.

## Endpoints

- `GET  /api/health`, `GET /api/config-check`, `GET /api/stats`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (Bearer)
- `GET/POST /api/donors`, `PUT /api/donors/:id`, `DELETE /api/donors/:id`
- `GET  /api/donors/:id/history`, `POST /api/donors/:id/donations`
- `GET/POST /api/requests`, `PATCH /api/requests/:id/status`, `DELETE /api/requests/:id`
- `GET  /api/inventory`, `PATCH /api/inventory/:id`
- `GET /api/hospitals`, `PUT /api/hospitals/:id`, `DELETE /api/hospitals/:id`
- `GET /api/users` (admin), `DELETE /api/users/:id` (admin)

Auth: `Authorization: Bearer <supabase_access_token>` on protected routes.
