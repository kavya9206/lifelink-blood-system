import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { BLOOD_GROUPS } from "./types";
import { DEMO_PASSWORD, seedData } from "./seed";
const DATA_KEY = "lifelink-demo-data-v1";
const SESSION_KEY = "lifelink-session";
const SESSION_TEMP_KEY = "lifelink-session-temp";
export const LIVES_PER_DONATION = 3;
export function uid(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
/** Next date the donor is eligible again (90-day gap). */
export function nextEligibleDate(lastDonation) {
    if (!lastDonation)
        return todayISO();
    const d = new Date(lastDonation + "T00:00:00");
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
}
export function fmtDate(iso) {
    if (!iso)
        return "—";
    return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
function load() {
    try {
        const raw = localStorage.getItem(DATA_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.users && parsed.donors && parsed.requests && parsed.inventory && parsed.hospitals) {
                return parsed;
            }
        }
    }
    catch {
        // corrupted storage — fall through and reseed
    }
    const seeded = seedData();
    try {
        localStorage.setItem(DATA_KEY, JSON.stringify(seeded));
    }
    catch {
        /* storage unavailable — run in-memory */
    }
    return seeded;
}
function loadSessionId() {
    return localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_TEMP_KEY);
}
const AppContext = createContext(null);
export function AppProvider({ children }) {
    const [data, setData] = useState(load);
    const [sessionId, setSessionId] = useState(loadSessionId);
    useEffect(() => {
        try {
            localStorage.setItem(DATA_KEY, JSON.stringify(data));
        }
        catch {
            /* ignore quota errors in demo */
        }
    }, [data]);
    const user = useMemo(() => data.users.find((u) => u.id === sessionId) ?? null, [data.users, sessionId]);
    const login = useCallback((email, password, remember) => {
        const found = load().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!found)
            return "No account found with this email.";
        if (found.password !== password)
            return "Incorrect password. Try again.";
        localStorage.removeItem(SESSION_TEMP_KEY);
        localStorage.removeItem(SESSION_KEY);
        if (remember)
            localStorage.setItem(SESSION_KEY, found.id);
        else
            sessionStorage.setItem(SESSION_TEMP_KEY, found.id);
        setSessionId(found.id);
        return null;
    }, []);
    const register = useCallback((input) => {
        const current = load();
        if (current.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
            return "An account with this email already exists.";
        }
        const account = {
            id: uid("u"),
            name: input.name.trim(),
            email: input.email.trim(),
            phone: input.phone.trim(),
            password: input.password,
            role: input.role,
            createdAt: todayISO(),
        };
        setData((d) => ({
            ...d,
            users: [...d.users, account],
            donors: account.role === "donor"
                ? [
                    ...d.donors,
                    {
                        id: uid("d"),
                        userId: account.id,
                        name: account.name,
                        age: 0,
                        gender: "Other",
                        bloodGroup: "O+",
                        phone: account.phone,
                        email: account.email,
                        city: "",
                        address: "",
                        lastDonation: null,
                        available: true,
                        history: [],
                        createdAt: todayISO(),
                    },
                ]
                : d.donors,
        }));
        localStorage.removeItem(SESSION_TEMP_KEY);
        localStorage.removeItem(SESSION_KEY);
        localStorage.setItem(SESSION_KEY, account.id);
        setSessionId(account.id);
        return null;
    }, []);
    const logout = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_TEMP_KEY);
        setSessionId(null);
    }, []);
    const addDonor = useCallback((input) => {
        const donor = {
            id: uid("d"),
            userId: null,
            ...input,
            history: input.lastDonation
                ? [{ id: uid("dh"), date: input.lastDonation, location: "Previous donation", units: 1 }]
                : [],
            createdAt: todayISO(),
        };
        setData((d) => ({ ...d, donors: [...d.donors, donor] }));
        return donor;
    }, []);
    const updateDonor = useCallback((id, patch) => {
        setData((d) => ({
            ...d,
            donors: d.donors.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
    }, []);
    const deleteDonor = useCallback((id) => {
        setData((d) => ({ ...d, donors: d.donors.filter((x) => x.id !== id) }));
    }, []);
    const logDonation = useCallback((donorId, rec) => {
        setData((d) => {
            const donor = d.donors.find((x) => x.id === donorId);
            if (!donor)
                return d;
            const donors = d.donors.map((x) => x.id === donorId
                ? {
                    ...x,
                    lastDonation: rec.date,
                    history: [{ id: uid("dh"), ...rec }, ...x.history],
                }
                : x);
            // Add the collected unit to a blood bank in the same city (demo simulation)
            const target = d.inventory.find((i) => i.bloodGroup === donor.bloodGroup && i.city === donor.city) ??
                d.inventory.find((i) => i.bloodGroup === donor.bloodGroup);
            const inventory = target
                ? d.inventory.map((i) => i.id === target.id
                    ? { ...i, units: i.units + rec.units, updatedAt: new Date().toISOString() }
                    : i)
                : d.inventory;
            return { ...d, donors, inventory };
        });
    }, []);
    const addRequest = useCallback((input, requestedBy = null) => {
        const req = {
            id: uid("r"),
            ...input,
            status: "pending",
            requestedBy,
            createdAt: new Date().toISOString(),
        };
        setData((d) => ({ ...d, requests: [req, ...d.requests] }));
        return req;
    }, []);
    const setRequestStatus = useCallback((id, status) => {
        setData((d) => {
            const req = d.requests.find((r) => r.id === id);
            if (!req)
                return d;
            let inventory = d.inventory;
            if (status === "fulfilled" && req.status !== "fulfilled") {
                // Deduct units from facilities in that city (demo simulation)
                const inCity = d.inventory
                    .filter((i) => i.bloodGroup === req.bloodGroup && i.city === req.hospitalCity)
                    .sort((a, b) => b.units - a.units);
                const pool = inCity.length
                    ? inCity
                    : d.inventory.filter((i) => i.bloodGroup === req.bloodGroup).sort((a, b) => b.units - a.units);
                let remaining = req.units;
                const drawFrom = new Map();
                for (const item of pool) {
                    if (remaining <= 0)
                        break;
                    const take = Math.min(item.units, remaining);
                    drawFrom.set(item.id, take);
                    remaining -= take;
                }
                inventory = d.inventory.map((i) => drawFrom.has(i.id)
                    ? {
                        ...i,
                        units: i.units - drawFrom.get(i.id),
                        updatedAt: new Date().toISOString(),
                    }
                    : i);
            }
            return {
                ...d,
                inventory,
                requests: d.requests.map((r) => (r.id === id ? { ...r, status } : r)),
            };
        });
    }, []);
    const deleteRequest = useCallback((id) => {
        setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== id) }));
    }, []);
    const adjustInventory = useCallback((id, units) => {
        setData((d) => ({
            ...d,
            inventory: d.inventory.map((i) => i.id === id
                ? { ...i, units: Math.max(0, units), updatedAt: new Date().toISOString() }
                : i),
        }));
    }, []);
    const updateHospital = useCallback((id, patch) => {
        setData((d) => ({
            ...d,
            hospitals: d.hospitals.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        }));
    }, []);
    const deleteHospital = useCallback((id) => {
        setData((d) => ({ ...d, hospitals: d.hospitals.filter((h) => h.id !== id) }));
    }, []);
    const deleteUser = useCallback((id) => {
        setData((d) => ({
            ...d,
            users: d.users.filter((u) => u.id !== id),
            // Unlink any donor profile owned by that account
            donors: d.donors.map((x) => (x.userId === id ? { ...x, userId: null } : x)),
        }));
    }, []);
    const resetDemo = useCallback(() => {
        const fresh = seedData();
        setData(fresh);
    }, []);
    const totals = useMemo(() => {
        const groupTotals = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0]));
        for (const item of data.inventory)
            groupTotals[item.bloodGroup] += item.units;
        const totalDonations = data.donors.reduce((n, d) => n + d.history.length, 0);
        return {
            donors: data.donors.length,
            units: data.inventory.reduce((n, i) => n + i.units, 0),
            livesSaved: totalDonations * LIVES_PER_DONATION,
            pendingRequests: data.requests.filter((r) => r.status === "pending").length,
            emergencyRequests: data.requests.filter((r) => r.status === "pending" && r.urgency !== "normal").length,
            hospitals: data.hospitals.length,
            groupTotals,
        };
    }, [data]);
    const value = {
        data,
        user,
        login,
        register,
        logout,
        addDonor,
        updateDonor,
        deleteDonor,
        logDonation,
        addRequest,
        setRequestStatus,
        deleteRequest,
        adjustInventory,
        updateHospital,
        deleteHospital,
        deleteUser,
        resetDemo,
        totals,
    };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx)
        throw new Error("useApp must be used inside <AppProvider>");
    return ctx;
}
export { DEMO_PASSWORD };
