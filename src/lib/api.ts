/**
 * LifeLink API client — React → Flask (`VITE_API_URL`) → Supabase.
 *
 * When VITE_API_URL is not set, `isApiMode` is false and callers should
 * fall back to the localStorage demo store (src/lib/store.tsx). All pages
 * remain functional either way — no white screens.
 *
 * Auth tokens are stored in localStorage under `lifelink_access_token`
 * and attached as `Authorization: Bearer <token>` on every request.
 * Supabase Auth email-confirmation is bypassed on the Flask side via
 * service_role (admin.create_user with email_confirm: true), so register
 * returns a real access token immediately.
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const isApiMode = Boolean(API_URL);

const TOKEN_KEY = "lifelink_access_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true when token present
  signal?: AbortSignal;
};

async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  if (!isApiMode) throw new Error("API not configured — set VITE_API_URL to enable Flask mode.");
  const url = `${API_URL}${path}`;
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const useAuth = opts.auth !== false && !!token;
  if (useAuth && token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & { error?: string }) : ({} as T);
  if (!res.ok) {
    const msg = (data as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// ── shapes (snake_case from Postgres → same keys the DB returns) ─────────
// Frontend can map to its camelCase domain types where convenient; we keep
// the wire types explicit so the contract is obvious.

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "donor" | "recipient" | "hospital" | "admin";
  created_at: string;
};

export type ApiDonor = {
  id: string;
  user_id: string | null;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  blood_group: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  last_donation: string | null;
  available: boolean;
  created_at: string;
  history?: { id: string; date: string; location: string; units: number }[];
};

export type ApiRequest = {
  id: string;
  patient_name: string;
  blood_group: string;
  units: number;
  hospital_name: string;
  hospital_city: string;
  contact: string;
  needed_by: string;
  urgency: "normal" | "urgent" | "critical";
  notes: string;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  requested_by: string | null;
  created_at: string;
};

export type ApiInventoryItem = {
  id: string;
  blood_group: string;
  facility: string;
  city: string;
  units: number;
  low_stock_threshold: number;
  updated_at: string;
};

export type ApiHospital = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  emergency_24x7: boolean;
  groups: string[];
  created_at?: string;
};

export type ApiStats = {
  donors: number;
  hospitals: number;
  units: number;
  lives_saved: number;
  pending_requests: number;
  emergency_requests: number;
  total_requests: number;
  group_totals: Record<string, number>;
};

// ── auth ───────────────────────────────────────────────────────────────
export async function apiRegister(input: { name: string; email: string; phone: string; password: string; role: string }) {
  const res = await apiFetch<{ user: ApiUser; access_token?: string; token_type?: string }>("/api/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  if (res.access_token) setToken(res.access_token);
  return res;
}

export async function apiLogin(email: string, password: string) {
  const res = await apiFetch<{ access_token: string; token_type: string; user: ApiUser }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setToken(res.access_token);
  return res;
}

export async function apiMe() {
  return apiFetch<{ user: ApiUser }>("/api/auth/me");
}

export function apiLogout() {
  setToken(null);
}

// ── donors ─────────────────────────────────────────────────────────────
export async function apiListDonors(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch<{ donors: ApiDonor[] }>(`/api/donors${qs ? `?${qs}` : ""}`);
}
export async function apiCreateDonor(payload: Record<string, unknown>) {
  return apiFetch<{ donor: ApiDonor }>("/api/donors", { method: "POST", body: payload });
}
export async function apiUpdateDonor(id: string, patch: Record<string, unknown>) {
  return apiFetch<{ donor: ApiDonor }>(`/api/donors/${id}`, { method: "PUT", body: patch });
}
export async function apiDeleteDonor(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/donors/${id}`, { method: "DELETE" });
}
export async function apiDonorHistory(id: string) {
  return apiFetch<{ history: { id: string; date: string; location: string; units: number }[] }>(`/api/donors/${id}/history`);
}
export async function apiLogDonation(id: string, payload: { date: string; location: string; units: number }) {
  return apiFetch<{ donation: { id: string; date: string; location: string; units: number } }>(`/api/donors/${id}/donations`, {
    method: "POST",
    body: payload,
  });
}

// ── requests ───────────────────────────────────────────────────────────
export async function apiListRequests(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch<{ requests: ApiRequest[] }>(`/api/requests${qs ? `?${qs}` : ""}`);
}
export async function apiCreateRequest(payload: Record<string, unknown>) {
  return apiFetch<{ request: ApiRequest }>("/api/requests", { method: "POST", body: payload });
}
export async function apiSetRequestStatus(id: string, status: string) {
  return apiFetch<{ request: ApiRequest }>(`/api/requests/${id}/status`, { method: "PATCH", body: { status } });
}
export async function apiDeleteRequest(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/requests/${id}`, { method: "DELETE" });
}

// ── inventory & hospitals & stats ──────────────────────────────────────
export async function apiListInventory(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch<{ inventory: ApiInventoryItem[]; totals: Record<string, number>; units_total: number }>(
    `/api/inventory${qs ? `?${qs}` : ""}`,
  );
}
export async function apiAdjustInventory(id: string, units: number) {
  return apiFetch<{ item: ApiInventoryItem }>(`/api/inventory/${id}`, { method: "PATCH", body: { units } });
}
export async function apiListHospitals(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch<{ hospitals: ApiHospital[] }>(`/api/hospitals${qs ? `?${qs}` : ""}`);
}
export async function apiUpdateHospital(id: string, patch: Record<string, unknown>) {
  return apiFetch<{ hospital: ApiHospital }>(`/api/hospitals/${id}`, { method: "PUT", body: patch });
}
export async function apiDeleteHospital(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/hospitals/${id}`, { method: "DELETE" });
}
export async function apiStats() {
  return apiFetch<ApiStats>("/api/stats");
}
export async function apiListUsers() {
  return apiFetch<{ users: ApiUser[] }>("/api/users");
}
export async function apiDeleteUser(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/users/${id}`, { method: "DELETE" });
}
export async function apiHealth() {
  return apiFetch<{ ok: boolean; supabase_configured: boolean; time: string }>("/api/health");
}
