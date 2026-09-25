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
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
export const isApiMode = Boolean(API_URL);
const TOKEN_KEY = "lifelink_access_token";
export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    }
    catch {
        return null;
    }
}
export function setToken(t) {
    try {
        if (t)
            localStorage.setItem(TOKEN_KEY, t);
        else
            localStorage.removeItem(TOKEN_KEY);
    }
    catch { /* ignore */ }
}
async function apiFetch(path, opts = {}) {
    if (!isApiMode)
        throw new Error("API not configured — set VITE_API_URL to enable Flask mode.");
    const url = `${API_URL}${path}`;
    const token = getToken();
    const headers = { "Content-Type": "application/json" };
    const useAuth = opts.auth !== false && !!token;
    if (useAuth && token)
        headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, {
        method: opts.method ?? (opts.body ? "POST" : "GET"),
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
        const msg = data.error || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}
// ── auth ───────────────────────────────────────────────────────────────
export async function apiRegister(input) {
    const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: input,
        auth: false,
    });
    if (res.access_token)
        setToken(res.access_token);
    return res;
}
export async function apiLogin(email, password) {
    const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
    });
    setToken(res.access_token);
    return res;
}
export async function apiMe() {
    return apiFetch("/api/auth/me");
}
export function apiLogout() {
    setToken(null);
}
// ── donors ─────────────────────────────────────────────────────────────
export async function apiListDonors(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/donors${qs ? `?${qs}` : ""}`);
}
export async function apiCreateDonor(payload) {
    return apiFetch("/api/donors", { method: "POST", body: payload });
}
export async function apiUpdateDonor(id, patch) {
    return apiFetch(`/api/donors/${id}`, { method: "PUT", body: patch });
}
export async function apiDeleteDonor(id) {
    return apiFetch(`/api/donors/${id}`, { method: "DELETE" });
}
export async function apiDonorHistory(id) {
    return apiFetch(`/api/donors/${id}/history`);
}
export async function apiLogDonation(id, payload) {
    return apiFetch(`/api/donors/${id}/donations`, {
        method: "POST",
        body: payload,
    });
}
// ── requests ───────────────────────────────────────────────────────────
export async function apiListRequests(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/requests${qs ? `?${qs}` : ""}`);
}
export async function apiCreateRequest(payload) {
    return apiFetch("/api/requests", { method: "POST", body: payload });
}
export async function apiSetRequestStatus(id, status) {
    return apiFetch(`/api/requests/${id}/status`, { method: "PATCH", body: { status } });
}
export async function apiDeleteRequest(id) {
    return apiFetch(`/api/requests/${id}`, { method: "DELETE" });
}
// ── inventory & hospitals & stats ──────────────────────────────────────
export async function apiListInventory(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/inventory${qs ? `?${qs}` : ""}`);
}
export async function apiAdjustInventory(id, units) {
    return apiFetch(`/api/inventory/${id}`, { method: "PATCH", body: { units } });
}
export async function apiListHospitals(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/hospitals${qs ? `?${qs}` : ""}`);
}
export async function apiUpdateHospital(id, patch) {
    return apiFetch(`/api/hospitals/${id}`, { method: "PUT", body: patch });
}
export async function apiDeleteHospital(id) {
    return apiFetch(`/api/hospitals/${id}`, { method: "DELETE" });
}
export async function apiStats() {
    return apiFetch("/api/stats");
}
export async function apiListUsers() {
    return apiFetch("/api/users");
}
export async function apiDeleteUser(id) {
    return apiFetch(`/api/users/${id}`, { method: "DELETE" });
}
export async function apiHealth() {
    return apiFetch("/api/health");
}
