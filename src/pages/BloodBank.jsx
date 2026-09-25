import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useApp, fmtDate } from "@/lib/store";
import { inventoryStatus, BLOOD_GROUPS, CITIES } from "@/lib/types";
import { EmptyState, PageWrap, Pill, Reveal, StatusPill, btnPrimary } from "@/components/clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Droplet, Droplets, Warehouse } from "lucide-react";
import { isApiMode, apiListInventory } from "@/lib/api";
import { mapInventoryRow } from "@/lib/mappers";

const CAPACITY = 40;
const groupStatus = (units) => (units <= 8 ? "critical" : units <= 18 ? "low" : "available");
const barTone = { available: "bg-emerald-500", low: "bg-amber-500", critical: "bg-red-500" };

export default function BloodBank() {
  const { data, totals } = useApp();
  const [city, setCity] = useState("all");

  const [apiInventory, setApiInventory] = useState(null);
  const [apiTotals, setApiTotals] = useState(null);
  const [apiUnits, setApiUnits] = useState(null);

  const fetchInventory = async (cityParam = city) => {
    if (!isApiMode) return;
    const params = {};
    if (cityParam !== "all") params.city = cityParam;
    try {
      const res = await apiListInventory(params);
      setApiInventory((res.inventory ?? []).map(mapInventoryRow));
      setApiTotals(res.totals ?? null);
      setApiUnits(res.units_total ?? null);
    } catch {
      // silent — keep showing cached / demo data
    }
  };

  useEffect(() => {
    if (isApiMode) fetchInventory("all");
  }, []);

  const inventory = isApiMode && apiInventory ? apiInventory : data.inventory;
  const unitsTotal = isApiMode && apiUnits != null ? apiUnits : totals.units;
  const distinctCities = new Set(inventory.map((i) => i.city)).size;

  const groups = useMemo(() => {
    return BLOOD_GROUPS.map((g) => {
      const items = inventory.filter((i) => i.bloodGroup === g);
      const units = items.reduce((n, i) => n + i.units, 0);
      const last = items.reduce((m, i) => (i.updatedAt > m ? i.updatedAt : m), "");
      return { group: g, units, status: groupStatus(units), lastUpdated: last };
    });
  }, [inventory]);

  const facilityRows = useMemo(() => {
    let rows = [...inventory];
    if (city !== "all") rows = rows.filter((i) => i.city === city);
    return rows.sort((a, b) => a.city.localeCompare(b.city) || a.bloodGroup.localeCompare(b.bloodGroup));
  }, [inventory, city]);

  const handleCity = (c) => {
    setCity(c);
    if (isApiMode) fetchInventory(c);
  };

  return (
    <PageWrap>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Blood Bank Inventory</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Live stock across {distinctCities} blood banks — <b className="text-foreground">{unitsTotal} units</b> in total. Inventory updates
            automatically when donations are logged or requests are fulfilled.
            {isApiMode && <span className="ml-1 font-semibold text-emerald-700">· Live from Supabase.</span>}
          </p>
        </div>
        <Button asChild size="lg" className={btnPrimary}>
          <Link to="/donate"><Droplet className="size-5" /> Donate blood</Link>
        </Button>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {groups.map((g, i) => (
          <Reveal key={g.group} delay={i * 0.05}>
            <div className={cn("clay-card p-5 transition-transform duration-200 hover:-translate-y-1", g.status === "critical" && "ring-2 ring-red-300/70")}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-lg font-extrabold text-primary">{g.group}</span>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-foreground">{g.units}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">units</p>
                  </div>
                </div>
                <StatusPill status={g.status} />
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_3px_rgba(146,47,47,.12)]">
                <div className={cn("h-full rounded-full transition-all duration-700", barTone[g.status])} style={{ width: `${Math.min(100, (g.units / CAPACITY) * 100)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                {g.status !== "available" ? (
                  <span className="flex items-center gap-1 font-bold text-red-600"><AlertTriangle className="size-3.5" /> {g.status === "critical" ? "Critical — donations needed!" : "Low stock"}</span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600"><Droplets className="size-3.5" /> Healthy stock</span>
                )}
                <span className="text-muted-foreground/80">upd. {fmtDate(g.lastUpdated.slice(0, 10))}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-12">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground"><Warehouse className="size-5 text-primary" /> Facility-wise stock</h2>
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={() => handleCity("all")} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition-all", city === "all" ? "bg-primary text-primary-foreground" : "clay-inset text-muted-foreground hover:text-foreground")}>All cities</button>
            {CITIES.filter((c) => inventory.some((i) => i.city === c)).map((c) => (
              <button key={c} onClick={() => handleCity(c)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition-all", city === c ? "bg-primary text-primary-foreground" : "clay-inset text-muted-foreground hover:text-foreground")}>{c}</button>
            ))}
          </div>
        </div>

        {facilityRows.length === 0 ? (
          <EmptyState icon={<Droplets className="size-7" />} title="No facilities here" message="Pick another city to see blood bank stock." />
        ) : (
          <div className="clay-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Blood Bank</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4">Units</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityRows.map((i) => (
                    <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                      <td className="px-6 py-3.5 font-bold text-foreground">{i.facility}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{i.city}</td>
                      <td className="px-6 py-3.5"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{i.bloodGroup}</span></td>
                      <td className="px-6 py-3.5 font-extrabold text-foreground">{i.units}</td>
                      <td className="px-6 py-3.5"><StatusPill status={inventoryStatus(i)} /></td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">{fmtDate(i.updatedAt.slice(0, 10))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Pill tone="amber">Live</Pill> Real availability via Flask + Supabase. Confirm with the blood bank before visiting.
        </p>
      </Reveal>
    </PageWrap>
  );
}
