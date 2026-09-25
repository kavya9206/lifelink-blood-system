import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useApp, fmtDate, nextEligibleDate, LIVES_PER_DONATION } from "@/lib/store";
import { EmptyState, Field, PageWrap, Pill, Reveal, StatCard, btnPrimary, btnSoft, inputCls } from "@/components/clay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BadgeCheck, CalendarClock, CalendarPlus, Droplet, Droplets, HeartHandshake, History, PencilLine, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { isApiMode, apiDonorHistory, apiLogDonation, apiUpdateDonor } from "@/lib/api";

function daysUntil(iso) { const ms = new Date(iso + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime(); return Math.ceil(ms / 86400000); }

export default function Dashboard() {
  const { data, user, updateDonor, logDonation } = useApp();
  const donor = data.donors.find((d) => d.userId === user?.id);

  const [logOpen, setLogOpen] = useState(false);
  const [log, setLog] = useState({ date: new Date().toISOString().slice(0, 10), location: "", units: 1 });
  const [busy, setBusy] = useState(false);

  // API history (authoritative when Flask mode is on)
  const [apiHistory, setApiHistory] = useState(null);
  const fetchHistory = async () => {
    if (!isApiMode || !donor) return;
    try {
      const res = await apiDonorHistory(donor.id);
      setApiHistory(res.history ?? []);
    } catch { /* silent — fall back to store history */ }
  };
  useEffect(() => { if (isApiMode && donor) fetchHistory(); }, [donor?.id]);

  const history = (isApiMode && apiHistory) ? apiHistory : (donor?.history ?? []);
  const lastDonation = history.length ? history[0].date : (donor?.lastDonation ?? null);

  if (!donor) {
    return (
      <PageWrap className="max-w-2xl">
        <EmptyState icon={<UserRound className="size-7" />} title="No donor profile yet" message={user?.role === "admin" || user?.role === "hospital" ? "This is the donor dashboard — admin and hospital accounts manage the system from the Admin Dashboard." : "Complete your donor registration to unlock your donation history, eligibility timeline and availability controls."} action={<Button asChild className={btnPrimary}><Link to={user?.role === "admin" || user?.role === "hospital" ? "/admin" : "/donate"}>{user?.role === "admin" || user?.role === "hospital" ? "Open Admin Dashboard" : "Register as donor"}</Link></Button>} />
      </PageWrap>
    );
  }

  const eligibleOn = nextEligibleDate(lastDonation) ?? new Date().toISOString().slice(0, 10);
  const daysLeft = daysUntil(eligibleOn);
  const canDonate = daysLeft <= 0;
  const livesHelped = history.length * LIVES_PER_DONATION;

  const handleToggleAvailable = async () => {
    const next = !donor.available;
    if (isApiMode) {
      try { await apiUpdateDonor(donor.id, { available: next }); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return; }
    }
    updateDonor(donor.id, { available: next });
    toast.success(`You are now ${next ? "available" : "marked unavailable"}.`);
  };

  const saveLog = async () => {
    if (log.location.trim().length < 3) { toast.error("Enter where you donated (hospital / camp name)."); return; }
    if (isApiMode) {
      setBusy(true);
      try {
        await apiLogDonation(donor.id, { date: log.date, location: log.location.trim(), units: log.units });
        // keep local store in sync for immediate feedback
        logDonation(donor.id, { ...log, location: log.location.trim() });
        setLogOpen(false);
        setLog({ date: new Date().toISOString().slice(0, 10), location: "", units: 1 });
        toast.success("Donation recorded in Supabase!", { description: "History and blood-bank inventory were updated in Postgres." });
        await fetchHistory();
      } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
      return;
    }
    logDonation(donor.id, { ...log, location: log.location.trim() });
    setLogOpen(false);
    setLog({ date: new Date().toISOString().slice(0, 10), location: "", units: 1 });
    toast.success("Donation recorded!", { description: "Your last donation date and the blood-bank inventory were updated." });
  };

  return (
    <PageWrap>
      <Reveal>
        <div className="clay-card flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:p-8">
          <span className="grid size-20 shrink-0 place-items-center rounded-[1.6rem] bg-primary text-3xl font-extrabold text-primary-foreground shadow-[0_16px_28px_-12px_rgba(163,40,40,.6),inset_0_3px_4px_rgba(255,255,255,.4),inset_0_-6px_12px_rgba(0,0,0,.16)]">{donor.name.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{donor.name}</h1>
              <Pill tone="redsolid"><Droplet className="size-3.5" /> {donor.bloodGroup}</Pill>
              <Pill tone={donor.available ? "green" : "gray"}>{donor.available ? "Available" : "Unavailable"}</Pill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{donor.age ? `${donor.age} yrs · ` : ""}{donor.gender} · {donor.city || "City not set"} · {donor.phone}</p>
            {isApiMode && <p className="mt-1 text-xs font-semibold text-emerald-700">Live from Flask + Supabase</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary" className={btnSoft}><Link to="/donate"><PencilLine className="size-4" /> Update Profile</Link></Button>
            <Button size="sm" className={donor.available ? btnSoft : btnPrimary} variant={donor.available ? "secondary" : "default"} onClick={handleToggleAvailable}><ShieldCheck className="size-4" /> {donor.available ? "Set Unavailable" : "Set Available"}</Button>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard icon={<Droplets className="size-5" />} value={history.length} label="Total Donations" sub={isApiMode ? "From Supabase" : "Recorded on LifeLink"} />
        <StatCard icon={<HeartHandshake className="size-5" />} value={livesHelped} label="Lives Potentially Helped" sub={`≈ ${LIVES_PER_DONATION} per donation`} />
        <StatCard icon={<CalendarClock className="size-5" />} value={fmtDate(lastDonation)} label="Last Donation" sub={lastDonation ? undefined : "No donation recorded yet"} />
        <StatCard icon={<BadgeCheck className="size-5" />} value={canDonate ? "Eligible now" : fmtDate(eligibleOn)} label="Next Eligible Date" sub={canDonate ? "You can donate today 🎉" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`} />
      </div>

      <Reveal delay={0.05} className="mt-6">
        <div className={cn("clay-tile flex flex-wrap items-center gap-4 p-5", canDonate ? "bg-emerald-50/60" : "bg-amber-50/60")}>
          <span className={cn("grid size-11 place-items-center rounded-2xl", canDonate ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}><CalendarPlus className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-foreground">{canDonate ? "You're eligible to donate today!" : `Next donation possible on ${fmtDate(eligibleOn)}`}</p>
            <p className="text-xs text-muted-foreground">Blood banks recommend a 90-day gap between whole-blood donations.</p>
          </div>
          <Button size="sm" className={btnPrimary} onClick={() => setLogOpen(true)}><Droplet className="size-4" /> Log a donation</Button>
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-foreground"><History className="size-5 text-primary" /> Donation History{isApiMode ? <span className="text-xs font-semibold text-emerald-700">· Supabase</span> : null}</h2>
        {history.length === 0 ? (
          <EmptyState icon={<Droplets className="size-7" />} title="No donations recorded yet" message="Once you donate, log it here to keep your eligibility timeline and inventory counts accurate." action={<Button size="sm" className={btnPrimary} onClick={() => setLogOpen(true)}><Droplet className="size-4" /> Log your first donation</Button>} />
        ) : (
          <div className="clay-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground"><th className="px-6 py-4">Date</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Units</th><th className="px-6 py-4">Impact</th></tr></thead>
                <tbody>{history.map((h) => <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40"><td className="px-6 py-3.5 font-bold text-foreground">{fmtDate(h.date)}</td><td className="px-6 py-3.5 text-muted-foreground">{h.location}</td><td className="px-6 py-3.5">{h.units}</td><td className="px-6 py-3.5"><Pill tone="green">~{h.units * LIVES_PER_DONATION} lives</Pill></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </Reveal>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="clay-card max-w-sm border-0 p-8">
          <DialogHeader><DialogTitle className="text-left">Log a donation</DialogTitle><DialogDescription className="text-left">{isApiMode ? `Saves to Supabase and increments ${donor.bloodGroup} inventory in ${donor.city || "your city"}.` : `Demo tool: records the donation and adds ${log.units} unit(s) of ${donor.bloodGroup} to the blood bank in ${donor.city || "your city"}.`}</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <Field label="Date"><input className={inputCls} type="date" max={new Date().toISOString().slice(0, 10)} value={log.date} onChange={(e) => setLog({ ...log, date: e.target.value })} /></Field>
            <Field label="Where did you donate?"><input className={inputCls} placeholder="e.g. KEM Hospital, Mumbai" value={log.location} onChange={(e) => setLog({ ...log, location: e.target.value })} /></Field>
            <Field label="Units"><select className={cn(inputCls, "appearance-none")} value={log.units} onChange={(e) => setLog({ ...log, units: Number(e.target.value) })}>{[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
            <Button className={btnPrimary} onClick={saveLog} disabled={busy}><Droplet className="size-4" /> {busy ? "Saving…" : "Save donation"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
