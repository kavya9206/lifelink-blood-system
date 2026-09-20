import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useApp } from "@/lib/store";
import { inventoryStatus, BLOOD_GROUPS, CITIES, type BloodGroup, type InventoryItem } from "@/lib/types";
import {
  EmptyState,
  PageWrap,
  Reveal,
  StatusPill,
  btnPrimary,
  btnSoft,
  selectCls,
} from "@/components/clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, Droplet, Loader2, MapPin, Phone, SearchX, Search } from "lucide-react";

type Availability = "all" | "available" | "low" | "critical";

interface SearchState {
  bloodGroup: BloodGroup | "all";
  city: string;
  units: number;
  urgency: "normal" | "urgent" | "critical";
}

export default function FindBlood() {
  const { data } = useApp();

  const [form, setForm] = useState<SearchState>({ bloodGroup: "all", city: "all", units: 1, urgency: "normal" });
  const [filters, setFilters] = useState<SearchState>({ bloodGroup: "all", city: "all", units: 1, urgency: "normal" });
  const [availability, setAvailability] = useState<Availability>("all");
  const [loading, setLoading] = useState(false);

  const results = useMemo(() => {
    let list = [...data.inventory];
    if (filters.bloodGroup !== "all") list = list.filter((i) => i.bloodGroup === filters.bloodGroup);
    if (filters.city !== "all") list = list.filter((i) => i.city === filters.city);
    if (availability !== "all") list = list.filter((i) => inventoryStatus(i) === availability);
    const urgencyRank = { normal: 0, urgent: 1, critical: 2 } as const;
    if (urgencyRank[filters.urgency] > 0) list.sort((a, b) => b.units - a.units);
    return list;
  }, [data.inventory, filters, availability]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setFilters({ ...form });
      setLoading(false);
    }, 650);
  };

  const matches = (i: InventoryItem) =>
    filters.units <= i.units ? null : filters.units - i.units;

  return (
    <PageWrap>
      <Reveal>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Find Blood</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Search live demo inventory across partner blood banks and hospitals. Results update as
          units are added or fulfilled.
        </p>
      </Reveal>

      {/* Search panel */}
      <Reveal delay={0.05} className="mt-8">
        <form className="clay-card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5 sm:p-8" onSubmit={onSearch} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Blood Group</span>
            <select className={selectCls} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value as BloodGroup | "all" })}>
              <option value="all">All groups</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">City / Location</span>
            <select className={selectCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              <option value="all">All cities</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Required Units</span>
            <select className={selectCls} value={form.units} onChange={(e) => setForm({ ...form, units: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} unit{n > 1 ? "s" : ""}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Urgency</span>
            <select className={selectCls} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as SearchState["urgency"] })}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button size="lg" className={cn(btnPrimary, "w-full")} disabled={loading}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
              Search
            </Button>
          </div>
        </form>
      </Reveal>

      {/* Quick filters */}
      <Reveal delay={0.08} className="mt-6">
        <div className="clay-tile flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Filters</span>
          <div className="flex flex-wrap gap-2">
            {(["all", "available", "low", "critical"] as Availability[]).map((a) => (
              <button
                key={a}
                onClick={() => setAvailability(a)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-all",
                  availability === a
                    ? "bg-primary text-primary-foreground shadow-[0_6px_12px_-4px_rgba(163,40,40,.5)]"
                    : "bg-muted text-muted-foreground hover:bg-secondary",
                )}
              >
                {a === "all" ? "All status" : a}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-semibold text-muted-foreground">
            {results.length} facilit{results.length === 1 ? "y" : "ies"} found
          </span>
        </div>
      </Reveal>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="clay-tile h-44 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-7" />}
            title="No matching blood stock"
            message="Try a different blood group, city or availability filter — or raise a blood request so donors near you are alerted."
            action={
              <Button asChild className={btnPrimary}>
                <Link to="/requests">Raise a blood request</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Table (md+) */}
            <div className="clay-card hidden overflow-hidden p-0 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4">Blood Bank / Hospital</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Units</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((i) => {
                      const shortfall = matches(i);
                      return (
                        <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                          <td className="px-6 py-4">
                            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                              {i.bloodGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">{i.facility}</td>
                          <td className="px-6 py-4 text-muted-foreground">{i.city}</td>
                          <td className="px-6 py-4">
                            <span className={cn("font-extrabold", shortfall ? "text-destructive" : "text-foreground")}>
                              {i.units}
                            </span>
                            {shortfall !== null && (
                              <span className="ml-1.5 text-xs font-semibold text-destructive">
                                (short by {shortfall})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{data.hospitals.find((h) => h.city === i.city)?.phone ?? "+91 22 2610 4000"}</td>
                          <td className="px-6 py-4"><StatusPill status={inventoryStatus(i)} /></td>
                          <td className="px-6 py-4 text-right">
                            <Button asChild size="sm" className={btnPrimary}>
                              <Link to={`/requests?blood=${i.bloodGroup}&city=${i.city}&units=${filters.units}`}>Request</Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards (mobile) */}
            <div className="grid gap-4 sm:grid-cols-2 md:hidden">
              {results.map((i) => {
                const shortfall = matches(i);
                return (
                  <div key={i.id} className="clay-tile p-5">
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-sm font-extrabold text-primary">
                        {i.bloodGroup}
                      </span>
                      <StatusPill status={inventoryStatus(i)} />
                    </div>
                    <h3 className="mt-3 font-extrabold text-foreground">{i.facility}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {i.city}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="size-3.5" /> {i.units} unit(s) {shortfall !== null && <span className="text-destructive">· short by {shortfall}</span>}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="size-3.5" /> {data.hospitals.find((h) => h.city === i.city)?.phone ?? "+91 22 2610 4000"}</p>
                    <Button asChild size="sm" className={cn(btnPrimary, "mt-4 w-full")}>
                      <Link to={`/requests?blood=${i.bloodGroup}&city=${i.city}&units=${filters.units}`}>
                        <Droplet className="size-4" /> Request blood
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className={cn(btnSoft, "clay-tile mt-6 flex items-center gap-2 px-5 py-4 text-xs text-muted-foreground")}>
              <Droplet className="size-4 text-primary" />
              Need {filters.units} unit(s), urgency: <b className="capitalize">{filters.urgency}</b>. Facilities short on stock are flagged — request anyway and nearby donors will be alerted.
            </div>
          </>
        )}
      </div>
    </PageWrap>
  );
}
