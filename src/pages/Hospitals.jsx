import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useApp } from "@/lib/store";
import { EmptyState, PageWrap, Pill, Reveal, btnPrimary, btnSoft, inputCls } from "@/components/clay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Building2, MapPin, Phone, Search, SearchX, Siren, Droplet } from "lucide-react";
import { isApiMode, apiListHospitals } from "@/lib/api";
import { mapHospitalRow } from "@/lib/mappers";

export default function Hospitals() {
  const { data } = useApp();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [selected, setSelected] = useState(null);

  const [apiHospitals, setApiHospitals] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const fetchHospitals = async (opts = {}) => {
    if (!isApiMode) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const params = {};
      if (opts.q) params.search = opts.q;
      if (opts.city && opts.city !== "all") params.city = opts.city;
      if (opts.onlyEmergency) params.emergency = "true";
      const res = await apiListHospitals(params);
      setApiHospitals((res.hospitals ?? []).map(mapHospitalRow));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (isApiMode) fetchHospitals({});
  }, []);

  // Debounced search in API mode
  useEffect(() => {
    if (!isApiMode) return;
    const id = setTimeout(() => fetchHospitals({ q, city, onlyEmergency }), 300);
    return () => clearTimeout(id);
  }, [q, city, onlyEmergency]);

  const hospitalsSource = isApiMode && apiHospitals ? apiHospitals : data.hospitals;

  const cities = useMemo(() => Array.from(new Set(hospitalsSource.map((h) => h.city))), [hospitalsSource]);

  const results = useMemo(() => {
    // In API mode filtering already happened server-side; just return all
    if (isApiMode && apiHospitals) return hospitalsSource;
    return hospitalsSource.filter((h) => {
      if (q && !`${h.name} ${h.city} ${h.address}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (city !== "all" && h.city !== city) return false;
      if (onlyEmergency && !h.emergency24x7) return false;
      return true;
    });
  }, [hospitalsSource, q, city, onlyEmergency, apiHospitals]);

  return (
    <PageWrap>
      <Reveal>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Hospitals &amp; Blood Banks</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Partner hospitals across India with active blood banks.</p>
        {isApiMode && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Live from Flask + Supabase{apiLoading ? " · searching…" : ""}{apiError ? ` · ${apiError}` : ""}
          </p>
        )}
      </Reveal>

      <Reveal delay={0.05} className="mt-8">
        <div className="clay-card grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center sm:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input className={cn(inputCls, "pl-10")} placeholder="Search hospital, area or city…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={cn(inputCls, "appearance-none")} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">All cities</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setOnlyEmergency((v) => !v)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all",
              onlyEmergency ? "bg-primary text-primary-foreground shadow-[0_8px_16px_-6px_rgba(163,40,40,.55)]" : "clay-inset text-muted-foreground hover:text-foreground",
            )}
          >
            <Siren className="size-4" /> 24×7 Emergency
          </button>
        </div>
      </Reveal>

      <p className="mt-5 text-xs font-semibold text-muted-foreground">{results.length} of {hospitalsSource.length} hospitals</p>

      {results.length === 0 ? (
        <div className="mt-4"><EmptyState icon={<SearchX className="size-7" />} title="No hospitals match your filters" message="Try a different keyword or clear the emergency filter." /></div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((h, i) => (
            <Reveal key={h.id} delay={(i % 3) * 0.06}>
              <div className="clay-card flex h-full flex-col p-6 transition-transform duration-200 hover:-translate-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><Building2 className="size-6" /></span>
                  {h.emergency24x7 && <Pill tone="redsolid"><Siren className="size-3.5" /> 24×7 Emergency</Pill>}
                </div>
                <h3 className="mt-4 text-base font-extrabold leading-snug text-foreground">{h.name}</h3>
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" /> {h.address}, {h.city}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="size-3.5 shrink-0" /> {h.phone}</p>
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Blood groups</p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.groups.map((g) => <span key={g} className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-extrabold text-primary">{g}</span>)}
                  </div>
                </div>
                <div className="mt-auto flex gap-2 pt-5">
                  <Button size="sm" className={cn(btnPrimary, "flex-1")} onClick={() => setSelected(h)}>View details</Button>
                  <Button asChild size="sm" variant="secondary" className={cn(btnSoft, "flex-1")}><Link to={`/find-blood?city=${h.city}`}>Find blood</Link></Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="clay-card max-w-md border-0 p-8">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-left text-lg font-extrabold">
                  <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Building2 className="size-5" /></span>
                  {selected.name}
                </DialogTitle>
                <DialogDescription className="text-left">Partner hospital · {selected.city}</DialogDescription>
              </DialogHeader>
              <div className="clay-tile grid gap-2.5 p-4 text-sm">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {selected.address}, {selected.city}</p>
                <p className="flex items-center gap-2"><Phone className="size-4 text-primary" /> {selected.phone}</p>
                <p className="flex items-center gap-2"><Siren className="size-4 text-primary" /> Emergency: {selected.emergency24x7 ? <Pill tone="redsolid">Open 24×7</Pill> : <Pill tone="amber">Day hours only</Pill>}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Droplet className="size-4 text-primary" />
                  {selected.groups.map((g) => <span key={g} className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-extrabold text-primary">{g}</span>)}
                </div>
              </div>
              <Button asChild className={cn(btnPrimary, "mt-4 w-full")}><Link to={`/requests?blood=${selected.groups[0]}&city=${selected.city}`}>Request blood here</Link></Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
