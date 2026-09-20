import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BLOOD_GROUPS, type BloodGroup, type BloodRequest, type Donor, type Hospital, type LifeLinkData, type RequestStatus, type UserAccount } from "./types";
import { DEMO_PASSWORD, seedData } from "./seed";

const DATA_KEY = "lifelink-demo-data-v1";
const SESSION_KEY = "lifelink-session";
const SESSION_TEMP_KEY = "lifelink-session-temp";

export const LIVES_PER_DONATION = 3;

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Next date the donor is eligible again (90-day gap). */
export function nextEligibleDate(lastDonation: string | null): string | null {
  if (!lastDonation) return todayISO();
  const d = new Date(lastDonation + "T00:00:00");
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function load(): LifeLinkData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LifeLinkData;
      if (parsed.users && parsed.donors && parsed.requests && parsed.inventory && parsed.hospitals) {
        return parsed;
      }
    }
  } catch {
    // corrupted storage — fall through and reseed
  }
  const seeded = seedData();
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(seeded));
  } catch {
    /* storage unavailable — run in-memory */
  }
  return seeded;
}

function loadSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_TEMP_KEY);
}

interface NewDonorInput {
  name: string;
  age: number;
  gender: Donor["gender"];
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  city: string;
  address: string;
  lastDonation: string | null;
  available: boolean;
}

interface NewRequestInput {
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospitalName: string;
  hospitalCity: string;
  contact: string;
  neededBy: string;
  urgency: BloodRequest["urgency"];
  notes: string;
}

interface AppContextValue {
  data: LifeLinkData;
  user: UserAccount | null;
  login: (email: string, password: string, remember: boolean) => string | null;
  register: (input: { name: string; email: string; phone: string; password: string; role: UserAccount["role"] }) => string | null;
  logout: () => void;
  addDonor: (input: NewDonorInput) => Donor;
  updateDonor: (id: string, patch: Partial<Donor>) => void;
  deleteDonor: (id: string) => void;
  logDonation: (donorId: string, rec: { date: string; location: string; units: number }) => void;
  addRequest: (input: NewRequestInput, requestedBy?: string | null) => BloodRequest;
  setRequestStatus: (id: string, status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  adjustInventory: (id: string, units: number) => void;
  updateHospital: (id: string, patch: Partial<Hospital>) => void;
  deleteHospital: (id: string) => void;
  deleteUser: (id: string) => void;
  resetDemo: () => void;
  totals: {
    donors: number;
    units: number;
    livesSaved: number;
    pendingRequests: number;
    emergencyRequests: number;
    hospitals: number;
    groupTotals: Record<BloodGroup, number>;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LifeLinkData>(load);
  const [sessionId, setSessionId] = useState<string | null>(loadSessionId);

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors in demo */
    }
  }, [data]);

  const user = useMemo(
    () => data.users.find((u) => u.id === sessionId) ?? null,
    [data.users, sessionId],
  );

  const login = useCallback(
    (email: string, password: string, remember: boolean): string | null => {
      const found = load().users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!found) return "No account found with this email.";
      if (found.password !== password) return "Incorrect password. Try again.";
      localStorage.removeItem(SESSION_TEMP_KEY);
      localStorage.removeItem(SESSION_KEY);
      if (remember) localStorage.setItem(SESSION_KEY, found.id);
      else sessionStorage.setItem(SESSION_TEMP_KEY, found.id);
      setSessionId(found.id);
      return null;
    },
    [],
  );

  const register = useCallback<AppContextValue["register"]>((input) => {
    const current = load();
    if (current.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return "An account with this email already exists.";
    }
    const account: UserAccount = {
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
      donors:
        account.role === "donor"
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

  const addDonor = useCallback<AppContextValue["addDonor"]>((input) => {
    const donor: Donor = {
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

  const updateDonor = useCallback<AppContextValue["updateDonor"]>((id, patch) => {
    setData((d) => ({
      ...d,
      donors: d.donors.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }, []);

  const deleteDonor = useCallback((id: string) => {
    setData((d) => ({ ...d, donors: d.donors.filter((x) => x.id !== id) }));
  }, []);

  const logDonation = useCallback<AppContextValue["logDonation"]>((donorId, rec) => {
    setData((d) => {
      const donor = d.donors.find((x) => x.id === donorId);
      if (!donor) return d;
      const donors = d.donors.map((x) =>
        x.id === donorId
          ? {
              ...x,
              lastDonation: rec.date,
              history: [{ id: uid("dh"), ...rec }, ...x.history],
            }
          : x,
      );
      // Add the collected unit to a blood bank in the same city (demo simulation)
      const target =
        d.inventory.find((i) => i.bloodGroup === donor.bloodGroup && i.city === donor.city) ??
        d.inventory.find((i) => i.bloodGroup === donor.bloodGroup);
      const inventory = target
        ? d.inventory.map((i) =>
            i.id === target.id
              ? { ...i, units: i.units + rec.units, updatedAt: new Date().toISOString() }
              : i,
          )
        : d.inventory;
      return { ...d, donors, inventory };
    });
  }, []);

  const addRequest = useCallback<AppContextValue["addRequest"]>((input, requestedBy = null) => {
    const req: BloodRequest = {
      id: uid("r"),
      ...input,
      status: "pending",
      requestedBy,
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, requests: [req, ...d.requests] }));
    return req;
  }, []);

  const setRequestStatus = useCallback<AppContextValue["setRequestStatus"]>((id, status) => {
    setData((d) => {
      const req = d.requests.find((r) => r.id === id);
      if (!req) return d;
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
        const drawFrom = new Map<string, number>();
        for (const item of pool) {
          if (remaining <= 0) break;
          const take = Math.min(item.units, remaining);
          drawFrom.set(item.id, take);
          remaining -= take;
        }
        inventory = d.inventory.map((i) =>
          drawFrom.has(i.id)
            ? {
                ...i,
                units: i.units - drawFrom.get(i.id)!,
                updatedAt: new Date().toISOString(),
              }
            : i,
        );
      }
      return {
        ...d,
        inventory,
        requests: d.requests.map((r) => (r.id === id ? { ...r, status } : r)),
      };
    });
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== id) }));
  }, []);

  const adjustInventory = useCallback<AppContextValue["adjustInventory"]>((id, units) => {
    setData((d) => ({
      ...d,
      inventory: d.inventory.map((i) =>
        i.id === id
          ? { ...i, units: Math.max(0, units), updatedAt: new Date().toISOString() }
          : i,
      ),
    }));
  }, []);

  const updateHospital = useCallback<AppContextValue["updateHospital"]>((id, patch) => {
    setData((d) => ({
      ...d,
      hospitals: d.hospitals.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const deleteHospital = useCallback((id: string) => {
    setData((d) => ({ ...d, hospitals: d.hospitals.filter((h) => h.id !== id) }));
  }, []);

  const deleteUser = useCallback((id: string) => {
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
    const groupTotals = Object.fromEntries(
      BLOOD_GROUPS.map((g) => [g, 0]),
    ) as Record<BloodGroup, number>;
    for (const item of data.inventory) groupTotals[item.bloodGroup] += item.units;
    const totalDonations = data.donors.reduce((n, d) => n + d.history.length, 0);
    return {
      donors: data.donors.length,
      units: data.inventory.reduce((n, i) => n + i.units, 0),
      livesSaved: totalDonations * LIVES_PER_DONATION,
      pendingRequests: data.requests.filter((r) => r.status === "pending").length,
      emergencyRequests: data.requests.filter(
        (r) => r.status === "pending" && r.urgency !== "normal",
      ).length,
      hospitals: data.hospitals.length,
      groupTotals,
    };
  }, [data]);

  const value: AppContextValue = {
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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export { DEMO_PASSWORD };
