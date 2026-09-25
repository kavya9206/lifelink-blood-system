import { createClient } from "@supabase/supabase-js";
/**
 * Browser Supabase client — used when VITE_SUPABASE_* is set.
 * If env is missing, this module still imports safely; the app stays
 * in demo localStorage mode (api.ts guards on `isApiMode`).
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured && url && anonKey
    ? createClient(url, anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: "lifelink-supabase-auth",
        },
    })
    : null;
export function supabaseUrl() {
    return url ?? null;
}
