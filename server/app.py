"""
LifeLink — Flask + Supabase API
───────────────────────────────
Run:
  cd server
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env   # fill SUPABASE_URL + SERVICE_ROLE_KEY
  python app.py          # http://localhost:5000

Environment (server/.env):
  SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  # optional:
  PORT=5000
  FLASK_ENV=development
  CORS_ORIGINS=http://localhost:5173,http://localhost:3000

The React app talks to this server via VITE_API_URL=http://localhost:5000
If VITE_API_URL is not set, React falls back to demo localStorage mode
so the preview keeps working with zero backend config.
"""
import os
import re
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client, Client  # type: ignore
except Exception:  # supabase not installed in type-check env
    create_client = None  # type: ignore
    Client = object  # type: ignore

# ── config ─────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_SERVICE_KEY", "")
PORT = int(os.getenv("PORT", "5000"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

BLOOD_GROUPS = {"A+","A-","B+","B-","AB+","AB-","O+","O-"}
URGENCIES = {"normal","urgent","critical"}
STATUSES = {"pending","approved","fulfilled","rejected"}
ROLES = {"donor","recipient","hospital","admin"}
GENDERS = {"Male","Female","Other"}

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS or "*"}}, supports_credentials=True)

# ── supabase client ────────────────────────────────────────────────
_supabase: "Client | None" = None

def sb() -> "Client":
    global _supabase
    if _supabase is not None:
        return _supabase
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env. "
            "Get them from Supabase Dashboard → Project Settings → API."
        )
    if create_client is None:
        raise RuntimeError("supabase package not installed. Run: pip install -r requirements.txt")
    _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase

def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

# ── helpers ────────────────────────────────────────────────────────
def err(msg, code=400, **extra):
    body = {"error": msg}
    body.update(extra)
    return jsonify(body), code

def ok(data, code=200):
    return jsonify(data), code

def parse_json():
    try:
        return request.get_json(force=True) or {}
    except Exception:
        return {}

def require_fields(data, fields):
    missing = [f for f in fields if not data.get(f) and data.get(f) != 0]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    return None

def get_bearer_token():
    h = request.headers.get("Authorization", "")
    if h.lower().startswith("bearer "):
        return h[7:].strip()
    return None

def verify_token(token: str):
    """Verify Supabase JWT via supabase.auth.get_user(). Returns dict user or None."""
    if not token:
        return None
    try:
        # supabase-py: auth.get_user(jwt) validates the JWT
        res = sb().auth.get_user(token)
        # res.user may be dict-like or object with attributes
        user = getattr(res, "user", None) or getattr(res, "data", None)
        if user is None and isinstance(res, dict):
            user = res.get("user")
        if user is None:
            return None
        # normalize to dict
        if hasattr(user, "id"):
            return {"id": user.id, "email": getattr(user, "email", None), "role": getattr(user, "user_metadata", {}).get("role") if hasattr(user, "user_metadata") else None, "_raw": user}
        if isinstance(user, dict):
            return {"id": user.get("id"), "email": user.get("email"), "_raw": user}
        return None
    except Exception as e:
        # fallback: try decoding without verification for local dev visibility
        # (don't rely on this for authorization — just helps surface errors)
        app.logger.warning(f"verify_token failed: {e}")
        return None

def auth_optional(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()
        g.current_user = verify_token(token) if token else None
        # also load app profile (role) from public.users if verified
        if g.current_user and g.current_user.get("id"):
            try:
                prof = sb().table("users").select("*").eq("id", g.current_user["id"]).limit(1).execute()
                rows = getattr(prof, "data", []) or []
                if rows:
                    g.current_user["profile"] = rows[0]
                    # prefer DB role over JWT metadata
                    if rows[0].get("role"):
                        g.current_user["role"] = rows[0]["role"]
            except Exception as e:
                app.logger.warning(f"profile lookup failed: {e}")
        return f(*args, **kwargs)
    return wrapper

def auth_required(f):
    @wraps(f)
    @auth_optional
    def wrapper(*args, **kwargs):
        if not g.get("current_user"):
            return err("Unauthorized — missing or invalid Bearer token.", 401)
        return f(*args, **kwargs)
    return wrapper

def require_roles(*roles):
    def decorator(f):
        @wraps(f)
        @auth_required
        def wrapper(*args, **kwargs):
            role = (g.current_user or {}).get("role") or (g.current_user or {}).get("profile", {}).get("role")
            if roles and role not in roles:
                return err(f"Forbidden — requires role: {', '.join(roles)}.", 403)
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ── health ─────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return ok({"ok": True, "supabase_configured": is_configured(), "time": datetime.utcnow().isoformat() + "Z"})

@app.get("/api/config-check")
def config_check():
    # no secrets leaked — just booleans
    return ok({
        "supabase_url_set": bool(SUPABASE_URL),
        "service_role_set": bool(SUPABASE_SERVICE_ROLE_KEY),
        "cors_origins": CORS_ORIGINS,
    })

# ── auth ───────────────────────────────────────────────────────────
@app.post("/api/auth/register")
def auth_register():
    if not is_configured():
        return err("Supabase not configured on server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.", 503)
    data = parse_json()
    missing = require_fields(data, ["name","email","password"])
    if missing:
        return err(missing)
    name = data["name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    phone = (data.get("phone") or "").strip()
    role = (data.get("role") or "donor").strip().lower()
    if role not in ROLES:
        role = "donor"
    if len(name) < 2:
        return err("Name must be at least 2 characters.")
    if not re.match(r"^\S+@\S+\.\S+$", email):
        return err("Invalid email.")
    if len(password) < 6:
        return err("Password must be at least 6 characters.")
    # create auth user via Supabase Admin API (service role) — auto-confirms email
    try:
        # Use sign_up with email_confirm=True behaviour via admin.create_user
        created = sb().auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name, "role": role, "phone": phone}
        })
        # supabase-py returns object with .user
        user_obj = getattr(created, "user", None) or getattr(created, "data", None) or created
        if isinstance(user_obj, dict):
            uid = user_obj.get("user", {}).get("id") if "user" in user_obj else user_obj.get("id")
        else:
            uid = getattr(user_obj, "id", None)
        if not uid and isinstance(created, dict) and "id" in created:
            uid = created["id"]
        # fallback: fetch by email if create didn't return id
        if not uid:
            # try list users
            try:
                listed = sb().auth.admin.list_users()
                for u in getattr(listed, "users", []) or []:
                    if getattr(u, "email", "").lower() == email:
                        uid = u.id
                        break
            except Exception:
                pass
        if not uid:
            return err("Registration succeeded but user id not returned. Check Supabase Auth users.", 500)
        # upsert public.users profile
        sb().table("users").upsert({
            "id": uid,
            "name": name,
            "email": email,
            "phone": phone,
            "role": role,
        }, on_conflict="id").execute()
        # auto-create a donor stub if role == donor (so Donor Dashboard has a profile immediately)
        if role == "donor":
            existing = sb().table("donors").select("id").eq("user_id", uid).limit(1).execute()
            if not (getattr(existing, "data", None) or []):
                sb().table("donors").insert({
                    "user_id": uid,
                    "name": name,
                    "age": 0,
                    "gender": "Other",
                    "blood_group": "O+",
                    "phone": phone or "",
                    "email": email,
                    "city": "",
                    "address": "",
                    "last_donation": None,
                    "available": True,
                }).execute()
        # now sign in to return access token (so frontend can store session)
        try:
            session = sb().auth.sign_in_with_password({"email": email, "password": password})
            access = getattr(session, "session", None)
            token = getattr(access, "access_token", None) if access else None
            if isinstance(session, dict):
                token = session.get("access_token") or session.get("session", {}).get("access_token")
            if token:
                return ok({"user": {"id": uid, "name": name, "email": email, "role": role}, "access_token": token, "token_type": "bearer"}, 201)
        except Exception as e:
            app.logger.warning(f"auto sign-in after register failed: {e}")
        return ok({"user": {"id": uid, "name": name, "email": email, "role": role}}, 201)
    except Exception as e:
        msg = str(e)
        # map common Supabase errors to friendly messages
        if "already registered" in msg.lower() or "already exists" in msg.lower() or "duplicate" in msg.lower():
            return err("An account with this email already exists.", 409)
        app.logger.exception("register failed")
        return err(msg or "Registration failed.", 400)

@app.post("/api/auth/login")
def auth_login():
    if not is_configured():
        return err("Supabase not configured on server.", 503)
    data = parse_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return err("Email and password are required.")
    try:
        res = sb().auth.sign_in_with_password({"email": email, "password": password})
        # res has .session and .user
        session = getattr(res, "session", None)
        user = getattr(res, "user", None)
        if isinstance(res, dict):
            session = res.get("session") or res.get("data", {}).get("session") if isinstance(res.get("data"), dict) else res.get("session")
            user = res.get("user") or res.get("data", {}).get("user") if isinstance(res.get("data"), dict) else res.get("user")
        token = None
        if session:
            token = getattr(session, "access_token", None) if hasattr(session, "access_token") else session.get("access_token") if isinstance(session, dict) else None
        if isinstance(res, dict) and not token:
            token = res.get("access_token")
        if not token:
            return err("Login failed — no session returned. Check Supabase Auth settings.", 500)
        # fetch profile for role
        uid = getattr(user, "id", None) if user and hasattr(user, "id") else (user.get("id") if isinstance(user, dict) else None)
        profile = None
        role = None
        if uid:
            try:
                prof = sb().table("users").select("*").eq("id", uid).limit(1).execute()
                rows = getattr(prof, "data", []) or []
                if rows:
                    profile = rows[0]
                    role = profile.get("role")
            except Exception:
                pass
        # fallback role from user_metadata
        if not role and user:
            meta = getattr(user, "user_metadata", None) if hasattr(user, "user_metadata") else (user.get("user_metadata") if isinstance(user, dict) else None)
            if isinstance(meta, dict):
                role = meta.get("role")
        return ok({
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": uid,
                "email": email,
                "name": (profile or {}).get("name") or getattr(user, "user_metadata", {}).get("name", "") if hasattr(user, "user_metadata") else email,
                "role": role or "donor",
                "phone": (profile or {}).get("phone", ""),
            }
        })
    except Exception as e:
        msg = str(e)
        if "invalid login" in msg.lower() or "invalid" in msg.lower():
            return err("Incorrect email or password.", 401)
        app.logger.exception("login failed")
        return err(msg or "Login failed.", 401)

@app.get("/api/auth/me")
@auth_required
def auth_me():
    u = g.current_user
    prof = u.get("profile") or {}
    return ok({"user": {
        "id": u.get("id"),
        "email": u.get("email") or prof.get("email"),
        "name": prof.get("name") or "",
        "phone": prof.get("phone") or "",
        "role": u.get("role") or prof.get("role") or "donor",
        "created_at": prof.get("created_at"),
    }})

# ── donors ─────────────────────────────────────────────────────────
@app.get("/api/donors")
@auth_optional
def list_donors():
    if not is_configured():
        return err("Supabase not configured.", 503)
    q = sb().table("donors").select("*, donation_history(id, date, location, units)")
    bg = request.args.get("blood_group")
    city = request.args.get("city")
    avail = request.args.get("available")
    search = request.args.get("search")
    if bg and bg in BLOOD_GROUPS:
        q = q.eq("blood_group", bg)
    if city:
        q = q.eq("city", city)
    if avail in ("true","false"):
        q = q.eq("available", avail == "true")
    if search:
        q = q.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,phone.ilike.%{search}%")
    q = q.order("created_at", desc=True).limit(200)
    res = q.execute()
    rows = getattr(res, "data", []) or []
    # normalize nested history key
    for r in rows:
        if "donation_history" in r:
            r["history"] = r.pop("donation_history") or []
    return ok({"donors": rows})

@app.post("/api/donors")
@auth_optional
def create_donor():
    if not is_configured():
        return err("Supabase not configured.", 503)
    data = parse_json()
    missing = require_fields(data, ["name","blood_group","phone","email","city","address"])
    if missing:
        return err(missing)
    bg = data["blood_group"]
    if bg not in BLOOD_GROUPS:
        return err(f"Invalid blood_group. Must be one of {', '.join(sorted(BLOOD_GROUPS))}")
    gender = data.get("gender") or "Other"
    if gender not in GENDERS:
        gender = "Other"
    # if authenticated, link to current user; otherwise leave null
    user_id = g.get("current_user", {}).get("id") if g.get("current_user") else None
    # allow explicit user_id override for admin flows
    if data.get("user_id"):
        user_id = data["user_id"]
    payload = {
        "user_id": user_id,
        "name": data["name"].strip(),
        "age": int(data.get("age") or 0),
        "gender": gender,
        "blood_group": bg,
        "phone": data["phone"].strip(),
        "email": data["email"].strip().lower(),
        "city": data["city"].strip(),
        "address": data["address"].strip(),
        "last_donation": data.get("last_donation") or None,
        "available": bool(data.get("available", True)),
    }
    if payload["age"] < 0 or payload["age"] > 110:
        return err("Age must be between 0 and 110.")
    res = sb().table("donors").insert(payload).select().execute()
    row = (getattr(res, "data", []) or [None])[0]
    if not row:
        return err("Failed to create donor.", 500)
    # if last_donation provided, also seed one history row
    if payload["last_donation"]:
        try:
            sb().table("donation_history").insert({
                "donor_id": row["id"],
                "date": payload["last_donation"],
                "location": "Previous donation",
                "units": 1
            }).execute()
        except Exception as e:
            app.logger.warning(f"history seed failed: {e}")
    return ok({"donor": row}, 201)

@app.put("/api/donors/<donor_id>")
@auth_optional
def update_donor(donor_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    data = parse_json()
    allowed = {"name","age","gender","blood_group","phone","email","city","address","last_donation","available"}
    patch = {k: v for k, v in data.items() if k in allowed}
    if "blood_group" in patch and patch["blood_group"] not in BLOOD_GROUPS:
        return err("Invalid blood_group.")
    if "gender" in patch and patch["gender"] not in GENDERS:
        patch["gender"] = "Other"
    if "email" in patch:
        patch["email"] = patch["email"].strip().lower()
    # ownership check: donors can edit own donor profile; admin/hospital can edit any
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin","hospital"):
            # if not admin, ensure donor belongs to current user
            try:
                existing = sb().table("donors").select("user_id").eq("id", donor_id).limit(1).execute()
                rows = getattr(existing, "data", []) or []
                if rows and rows[0].get("user_id") and rows[0]["user_id"] != g.current_user["id"]:
                    return err("Forbidden — you can only update your own donor profile.", 403)
            except Exception:
                pass
    if not patch:
        return err("No valid fields to update.")
    res = sb().table("donors").update(patch).eq("id", donor_id).select().execute()
    row = (getattr(res, "data", []) or [None])[0]
    if not row:
        return err("Donor not found.", 404)
    return ok({"donor": row})

@app.delete("/api/donors/<donor_id>")
@auth_optional
def delete_donor(donor_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    # role gating if authenticated
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin","hospital"):
            return err("Forbidden — admin/hospital only.", 403)
    res = sb().table("donors").delete().eq("id", donor_id).execute()
    return ok({"ok": True})

@app.get("/api/donors/<donor_id>/history")
def donor_history(donor_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    res = sb().table("donation_history").select("*").eq("donor_id", donor_id).order("date", desc=True).execute()
    return ok({"history": getattr(res, "data", []) or []})

@app.post("/api/donors/<donor_id>/donations")
@auth_optional
def log_donation(donor_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    data = parse_json()
    date = (data.get("date") or datetime.utcnow().date().isoformat())
    location = (data.get("location") or "LifeLink donation").strip()
    units = int(data.get("units") or 1)
    if units <= 0 or units > 10:
        return err("Units must be 1-10.")
    # validate donor exists
    donor_res = sb().table("donors").select("id, blood_group, city").eq("id", donor_id).limit(1).execute()
    donor = (getattr(donor_res, "data", []) or [None])[0]
    if not donor:
        return err("Donor not found.", 404)
    # insert history
    hist = sb().table("donation_history").insert({
        "donor_id": donor_id, "date": date, "location": location, "units": units
    }).select().execute()
    # update donor last_donation
    sb().table("donors").update({"last_donation": date}).eq("id", donor_id).execute()
    # increment inventory for same blood group in donor's city (demo simulation of real supply chain)
    try:
        inv_q = sb().table("inventory").select("id, units").eq("blood_group", donor["blood_group"])
        if donor.get("city"):
            inv_q = inv_q.eq("city", donor["city"])
        inv_res = inv_q.limit(1).execute()
        inv_rows = getattr(inv_res, "data", []) or []
        target = inv_rows[0] if inv_rows else None
        if not target:
            # fallback: any facility with that group
            fb = sb().table("inventory").select("id, units").eq("blood_group", donor["blood_group"]).limit(1).execute()
            fb_rows = getattr(fb, "data", []) or []
            target = fb_rows[0] if fb_rows else None
        if target:
            sb().table("inventory").update({"units": (target["units"] or 0) + units}).eq("id", target["id"]).execute()
    except Exception as e:
        app.logger.warning(f"inventory increment failed: {e}")
    row = (getattr(hist, "data", []) or [None])[0]
    return ok({"donation": row}, 201)

# ── requests ───────────────────────────────────────────────────────
@app.get("/api/requests")
@auth_optional
def list_requests():
    if not is_configured():
        return err("Supabase not configured.", 503)
    q = sb().table("blood_requests").select("*")
    status = request.args.get("status")
    bg = request.args.get("blood_group")
    city = request.args.get("city")
    urgency = request.args.get("urgency")
    if status and status in STATUSES:
        q = q.eq("status", status)
    if bg and bg in BLOOD_GROUPS:
        q = q.eq("blood_group", bg)
    if city:
        q = q.eq("hospital_city", city)
    if urgency and urgency in URGENCIES:
        q = q.eq("urgency", urgency)
    q = q.order("created_at", desc=True).limit(200)
    res = q.execute()
    return ok({"requests": getattr(res, "data", []) or []})

@app.post("/api/requests")
@auth_optional
def create_request():
    if not is_configured():
        return err("Supabase not configured.", 503)
    data = parse_json()
    missing = require_fields(data, ["patient_name","blood_group","units","hospital_name","hospital_city","contact","needed_by"])
    if missing:
        return err(missing)
    bg = data["blood_group"]
    if bg not in BLOOD_GROUPS:
        return err("Invalid blood_group.")
    try:
        units = int(data["units"])
    except Exception:
        return err("Units must be a number.")
    if units <= 0 or units > 50:
        return err("Units must be 1-50.")
    urgency = (data.get("urgency") or "normal")
    if urgency not in URGENCIES:
        urgency = "normal"
    requested_by = g.get("current_user", {}).get("id") if g.get("current_user") else None
    payload = {
        "patient_name": data["patient_name"].strip(),
        "blood_group": bg,
        "units": units,
        "hospital_name": data["hospital_name"].strip(),
        "hospital_city": data["hospital_city"].strip(),
        "contact": data["contact"].strip(),
        "needed_by": data["needed_by"],
        "urgency": urgency,
        "notes": (data.get("notes") or "").strip(),
        "status": "pending",
        "requested_by": requested_by,
    }
    res = sb().table("blood_requests").insert(payload).select().execute()
    row = (getattr(res, "data", []) or [None])[0]
    if not row:
        return err("Failed to create request.", 500)
    return ok({"request": row}, 201)

@app.patch("/api/requests/<req_id>/status")
@auth_optional
def set_request_status(req_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    # status transitions are privileged — require auth in production
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        # allow any authenticated user to approve own? restrict fulfill to admin/hospital
        new_status = (parse_json().get("status") or "").strip()
        if new_status not in STATUSES:
            return err(f"Invalid status. Must be one of {', '.join(sorted(STATUSES))}")
        if new_status == "fulfilled" and role not in ("admin","hospital"):
            return err("Only admin/hospital can mark fulfilled.", 403)
    else:
        new_status = (parse_json().get("status") or "").strip()
        if new_status not in STATUSES:
            return err(f"Invalid status. Must be one of {', '.join(sorted(STATUSES))}")
    # fetch existing to handle inventory deduction on fulfill
    existing = sb().table("blood_requests").select("*").eq("id", req_id).limit(1).execute()
    row = (getattr(existing, "data", []) or [None])[0]
    if not row:
        return err("Request not found.", 404)
    # if transitioning to fulfilled and wasn't fulfilled before, deduct inventory
    if new_status == "fulfilled" and row.get("status") != "fulfilled":
        try:
            bg = row["blood_group"]
            city = row["hospital_city"]
            needed = int(row["units"])
            # draw from same city first, highest stock first
            inv_res = sb().table("inventory").select("id, units").eq("blood_group", bg).eq("city", city).order("units", desc=True).execute()
            pool = getattr(inv_res, "data", []) or []
            if not pool:
                fallback = sb().table("inventory").select("id, units").eq("blood_group", bg).order("units", desc=True).execute()
                pool = getattr(fallback, "data", []) or []
            remaining = needed
            for item in pool:
                if remaining <= 0:
                    break
                take = min(item["units"] or 0, remaining)
                if take > 0:
                    sb().table("inventory").update({"units": (item["units"] or 0) - take}).eq("id", item["id"]).execute()
                    remaining -= take
        except Exception as e:
            app.logger.warning(f"inventory deduction on fulfill failed: {e}")
    res = sb().table("blood_requests").update({"status": new_status}).eq("id", req_id).select().execute()
    updated = (getattr(res, "data", []) or [None])[0]
    return ok({"request": updated or row})

@app.delete("/api/requests/<req_id>")
@auth_optional
def delete_request(req_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    sb().table("blood_requests").delete().eq("id", req_id).execute()
    return ok({"ok": True})

# ── inventory ──────────────────────────────────────────────────────
@app.get("/api/inventory")
def list_inventory():
    if not is_configured():
        return err("Supabase not configured.", 503)
    q = sb().table("inventory").select("*")
    city = request.args.get("city")
    bg = request.args.get("blood_group")
    if city:
        q = q.eq("city", city)
    if bg and bg in BLOOD_GROUPS:
        q = q.eq("blood_group", bg)
    q = q.order("city").order("blood_group")
    res = q.execute()
    rows = getattr(res, "data", []) or []
    # convenience totals
    totals = {}
    for r in rows:
        totals[r["blood_group"]] = totals.get(r["blood_group"], 0) + (r["units"] or 0)
    return ok({"inventory": rows, "totals": totals, "units_total": sum(totals.values())})

@app.patch("/api/inventory/<item_id>")
@auth_optional
def adjust_inventory(item_id):
    if not is_configured():
        return err("Supabase not configured.", 503)
    # restrict to admin/hospital when authenticated; allow in demo mode for UI edits
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin","hospital"):
            return err("Forbidden — admin/hospital only.", 403)
    units = parse_json().get("units")
    if units is None:
        return err("units is required.")
    try:
        units = int(units)
    except Exception:
        return err("units must be a number.")
    if units < 0:
        return err("units cannot be negative.")
    res = sb().table("inventory").update({"units": units}).eq("id", item_id).select().execute()
    row = (getattr(res, "data", []) or [None])[0]
    if not row:
        return err("Inventory item not found.", 404)
    return ok({"item": row})

# ── hospitals ──────────────────────────────────────────────────────
@app.get("/api/hospitals")
def list_hospitals():
    if not is_configured():
        return err("Supabase not configured.", 503)
    q = sb().table("hospitals").select("*")
    city = request.args.get("city")
    search = request.args.get("search")
    emergency = request.args.get("emergency")
    if city:
        q = q.eq("city", city)
    if search:
        q = q.or_(f"name.ilike.%{search}%,city.ilike.%{search}%")
    if emergency in ("true","false"):
        q = q.eq("emergency_24x7", emergency == "true")
    q = q.order("name")
    res = q.execute()
    return ok({"hospitals": getattr(res, "data", []) or []})

@app.put("/api/hospitals/<hid>")
@auth_optional
def update_hospital(hid):
    if not is_configured():
        return err("Supabase not configured.", 503)
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin","hospital"):
            return err("Forbidden — admin/hospital only.", 403)
    data = parse_json()
    allowed = {"name","city","address","phone","emergency_24x7","groups"}
    patch = {k: v for k, v in data.items() if k in allowed}
    if "groups" in patch and isinstance(patch["groups"], list):
        # validate
        patch["groups"] = [g for g in patch["groups"] if g in BLOOD_GROUPS]
    if not patch:
        return err("No valid fields to update.")
    res = sb().table("hospitals").update(patch).eq("id", hid).select().execute()
    row = (getattr(res, "data", []) or [None])[0]
    if not row:
        return err("Hospital not found.", 404)
    return ok({"hospital": row})

@app.delete("/api/hospitals/<hid>")
@auth_optional
def delete_hospital(hid):
    if not is_configured():
        return err("Supabase not configured.", 503)
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin",):
            return err("Forbidden — admin only.", 403)
    sb().table("hospitals").delete().eq("id", hid).execute()
    return ok({"ok": True})

# ── stats ──────────────────────────────────────────────────────────
@app.get("/api/stats")
def stats():
    if not is_configured():
        return err("Supabase not configured.", 503)
    try:
        donors = sb().table("donors").select("id", count="exact").execute()
        requests = sb().table("blood_requests").select("id, status, urgency", count="exact").execute()
        inventory = sb().table("inventory").select("blood_group, units").execute()
        hospitals = sb().table("hospitals").select("id", count="exact").execute()
        history = sb().table("donation_history").select("id", count="exact").execute()
        donor_count = getattr(donors, "count", len(getattr(donors, "data", []) or [])) or 0
        request_rows = getattr(requests, "data", []) or []
        inv_rows = getattr(inventory, "data", []) or []
        hosp_count = getattr(hospitals, "count", len(getattr(hospitals, "data", []) or [])) or 0
        total_donations = getattr(history, "count", len(getattr(history, "data", []) or [])) or 0
        group_totals = {g: 0 for g in BLOOD_GROUPS}
        for r in inv_rows:
            group_totals[r["blood_group"]] = group_totals.get(r["blood_group"], 0) + (r["units"] or 0)
        pending = sum(1 for r in request_rows if r.get("status") == "pending")
        emergency = sum(1 for r in request_rows if r.get("status") == "pending" and r.get("urgency") in ("urgent","critical"))
        return ok({
            "donors": donor_count,
            "hospitals": hosp_count,
            "units": sum(group_totals.values()),
            "lives_saved": total_donations * 3,
            "pending_requests": pending,
            "emergency_requests": emergency,
            "total_requests": len(request_rows),
            "group_totals": group_totals,
        })
    except Exception as e:
        app.logger.exception("stats failed")
        return err(str(e), 500)

# ── users (admin) ──────────────────────────────────────────────────
@app.get("/api/users")
@auth_optional
def list_users():
    if not is_configured():
        return err("Supabase not configured.", 503)
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin",):
            return err("Forbidden — admin only.", 403)
    res = sb().table("users").select("*").order("created_at", desc=True).limit(200).execute()
    return ok({"users": getattr(res, "data", []) or []})

@app.delete("/api/users/<uid>")
@auth_optional
def delete_user(uid):
    if not is_configured():
        return err("Supabase not configured.", 503)
    if g.get("current_user"):
        role = g.current_user.get("role") or g.current_user.get("profile", {}).get("role")
        if role not in ("admin",):
            return err("Forbidden — admin only.", 403)
    # unlink donors first
    try:
        sb().table("donors").update({"user_id": None}).eq("user_id", uid).execute()
    except Exception:
        pass
    sb().table("users").delete().eq("id", uid).execute()
    # also delete auth user
    try:
        sb().auth.admin.delete_user(uid)
    except Exception as e:
        app.logger.warning(f"auth delete failed for {uid}: {e}")
    return ok({"ok": True})

# ── error handlers ─────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(_e):
    return err("Not found.", 404)

@app.errorhandler(405)
def method_not_allowed(_e):
    return err("Method not allowed.", 405)

if __name__ == "__main__":
    if not is_configured():
        print("⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — /api/* will return 503 until configured.")
        print("   Fill server/.env from server/.env.example and restart.")
    print(f"LifeLink Flask API → http://localhost:{PORT}")
    print(f"CORS origins: {', '.join(CORS_ORIGINS) or '*'}")
    app.run(host="0.0.0.0", port=PORT, debug=True)
