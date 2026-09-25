import { useState } from "react";
import { Link } from "react-router";
import { useApp } from "@/lib/store";
import { BLOOD_GROUPS, CITIES } from "@/lib/types";
import { Field, PageWrap, Reveal, btnPrimary, btnSoft, inputCls, selectCls } from "@/components/clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BadgeCheck, CalendarDays, Droplet, HeartHandshake, RotateCcw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { isApiMode, apiCreateDonor, apiUpdateDonor } from "@/lib/api";
import { donorPayloadForApi, mapDonorRow } from "@/lib/mappers";

const initial = { name: "", age: "", gender: "", bloodGroup: "", phone: "", email: "", city: "", address: "", lastDonation: "", healthConfirm: false, available: true };

export default function DonateBlood() {
  const { data, user, addDonor, updateDonor } = useApp();
  const linkedDonor = data.donors.find((d) => d.userId === user?.id);

  const [form, setForm] = useState(
    linkedDonor
      ? { name: linkedDonor.name, age: linkedDonor.age ? String(linkedDonor.age) : "", gender: linkedDonor.gender, bloodGroup: linkedDonor.bloodGroup, phone: linkedDonor.phone, email: linkedDonor.email, city: linkedDonor.city, address: linkedDonor.address, lastDonation: linkedDonor.lastDonation ?? "", healthConfirm: true, available: linkedDonor.available }
      : initial,
  );
  const [errors, setErrors] = useState({});
  const [successId, setSuccessId] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Please enter your full name.";
    const age = Number(form.age);
    if (!form.age || Number.isNaN(age) || age < 18 || age > 65) e.age = "Donors must be between 18 and 65 years.";
    if (!form.gender) e.gender = "Please select your gender.";
    if (!form.bloodGroup) e.bloodGroup = "Please select your blood group.";
    if (!/^[+]?[\d\s-]{10,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number (10+ digits).";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (!form.city) e.city = "Please select your city.";
    if (form.address.trim().length < 8) e.address = "Address should be at least 8 characters.";
    if (form.lastDonation) {
      const chosen = new Date(form.lastDonation);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (chosen > today) e.lastDonation = "Last donation date cannot be in the future.";
    }
    if (!form.healthConfirm) e.healthConfirm = "Please confirm you meet the basic eligibility criteria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields."); return; }
    const payload = { name: form.name.trim(), age: Number(form.age), gender: form.gender, bloodGroup: form.bloodGroup, phone: form.phone.trim(), email: form.email.trim(), city: form.city, address: form.address.trim(), lastDonation: form.lastDonation || null, available: form.available };

    if (isApiMode) {
      setBusy(true);
      try {
        if (linkedDonor) {
          await apiUpdateDonor(linkedDonor.id, donorPayloadForApi(payload));
          setSuccessId(linkedDonor.id);
          // also keep local store in sync for immediate UI
          updateDonor(linkedDonor.id, payload);
          toast.success("Profile updated in Flask + Supabase!");
        } else {
          const res = await apiCreateDonor(donorPayloadForApi(payload));
          const created = mapDonorRow(res.donor);
          setSuccessId(created.id);
          addDonor(payload);
          toast.success("You're registered as a donor in Supabase!", { description: "Hospitals near you can now see your availability." });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (linkedDonor) { updateDonor(linkedDonor.id, payload); setSuccessId(linkedDonor.id); toast.success("Profile updated successfully!"); }
    else { const donor = addDonor(payload); setSuccessId(donor.id); toast.success("You're registered as a donor!", { description: "Hospitals near you can now see your availability (demo data)." }); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (successId) {
    const saved = data.donors.find((d) => d.id === successId);
    return (
      <PageWrap className="max-w-3xl">
        <div className="clay-card p-10 text-center sm:p-14">
          <span className="mx-auto mb-5 grid size-20 place-items-center rounded-[1.75rem] bg-emerald-100 text-emerald-600 shadow-[inset_0_3px_4px_rgba(255,255,255,.9),inset_0_-8px_14px_rgba(16,120,80,.15)]"><BadgeCheck className="size-10" /></span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{linkedDonor ? "Profile updated!" : "Welcome aboard, hero!"}</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{saved?.name}, you are registered as an available <b className="text-primary">{saved?.bloodGroup}</b> donor in <b className="text-foreground">{saved?.city}</b>. Hospitals and patients on LifeLink can now find you.{isApiMode && " · Saved to Supabase."}</p>
          <div className="clay-tile mx-auto mt-7 grid max-w-sm gap-2 p-5 text-left text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Blood group</span><b>{saved?.bloodGroup}</b></p>
            <p className="flex justify-between"><span className="text-muted-foreground">City</span><b>{saved?.city}</b></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Availability</span><b>{saved?.available ? "Available now" : "Not available"}</b></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Next eligible</span><b>{saved?.lastDonation ? "90 days after last donation" : "Eligible today"}</b></p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className={btnPrimary}><Link to={user ? "/dashboard" : "/auth?mode=register"}><UserRound className="size-4" /> {user ? "Open my dashboard" : "Create an account"}</Link></Button>
            <Button variant="secondary" className={btnSoft} onClick={() => { setSuccessId(null); setForm(initial); }}><RotateCcw className="size-4" /> Register another donor</Button>
          </div>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap className="max-w-4xl">
      <Reveal>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{linkedDonor ? "Update Donor Profile" : "Donate Blood"}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{linkedDonor ? "Keep your details current so hospitals can reach you when it matters." : "Join thousands of voluntary donors. Fill in your details — it takes about two minutes."}{isApiMode && <span className="font-semibold text-emerald-700"> · Saving to Flask + Supabase.</span>}</p>
      </Reveal>
      <Reveal delay={0.05} className="mt-8">
        <form className="clay-card grid gap-5 p-6 sm:grid-cols-2 sm:p-10" onSubmit={submit} noValidate>
          <Field label="Full Name" error={errors.name}><input className={inputCls} placeholder="e.g. Aarav Sharma" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Age" error={errors.age} hint="18–65 years"><input className={inputCls} type="number" min={18} max={65} placeholder="e.g. 27" value={form.age} onChange={(e) => set("age", e.target.value)} /></Field>
          <Field label="Gender" error={errors.gender}><select className={selectCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
          <Field label="Blood Group" error={errors.bloodGroup}><select className={selectCls} value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}><option value="">Select blood group</option>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Phone Number" error={errors.phone}><input className={inputCls} inputMode="tel" placeholder="+91 98XXX XXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email" error={errors.email}><input className={inputCls} type="email" placeholder="you@example.in" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="City" error={errors.city}><select className={selectCls} value={form.city} onChange={(e) => set("city", e.target.value)}><option value="">Select city</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Last Donation Date" error={errors.lastDonation} hint="Leave blank if this is your first donation"><input className={inputCls} type="date" max={new Date().toISOString().slice(0, 10)} value={form.lastDonation} onChange={(e) => set("lastDonation", e.target.value)} /></Field>
          <Field label="Address" error={errors.address} className="sm:col-span-2"><textarea className={cn(inputCls, "h-24 resize-none py-3")} placeholder="House / street / locality" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="clay-tile flex flex-col gap-3 p-5 sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#e5484d]" checked={form.healthConfirm} onChange={(e) => set("healthConfirm", e.target.checked)} /><span className="leading-relaxed"><b>Eligibility confirmation:</b> I am between 18–65 years, weigh over 50 kg, and do not have fever, infection, or a recent surgery / tattoo (within 6 months). I confirm the information provided is accurate.</span></label>
            {errors.healthConfirm && <p className="text-xs font-semibold text-destructive">{errors.healthConfirm}</p>}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-sm font-semibold">Availability status</span>
              <div className="flex gap-2">
                {[{ v: true, label: "Available", icon: <Droplet className="size-3.5" /> }, { v: false, label: "Not available", icon: <CalendarDays className="size-3.5" /> }].map((o) => (
                  <button type="button" key={o.label} onClick={() => set("available", o.v)} className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all", form.available === o.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary")}>{o.icon} {o.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button size="lg" className={btnPrimary} disabled={busy}><HeartHandshake className="size-5" /> {busy ? "Saving…" : linkedDonor ? "Save changes" : "Register as donor"}</Button>
            <p className="text-xs text-muted-foreground">{isApiMode ? "Saving to Flask + Supabase." : "Demo app — data is stored only in your browser's localStorage."}</p>
          </div>
        </form>
      </Reveal>
    </PageWrap>
  );
}
