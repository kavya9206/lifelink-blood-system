import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useApp, todayISO, LIVES_PER_DONATION } from "@/lib/store";
import { BLOOD_GROUPS, CITIES, type BloodGroup } from "@/lib/types";
import {
  Field,
  PageWrap,
  Reveal,
  SectionHeading,
  StatCard,
  btnPrimary,
  btnSoft,
  inputCls,
  selectCls,
} from "@/components/clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Baby,
  BedDouble,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  Droplet,
  Droplets,
  HeartHandshake,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const groupDot = (units: number) =>
  units <= 5 ? "bg-red-500" : units <= 12 ? "bg-amber-500" : "bg-emerald-500";

export default function Landing() {
  const { data, totals, addRequest } = useApp();
  const navigate = useNavigate();

  const donors = useCountUp(totals.donors);
  const units = useCountUp(totals.units);
  const lives = useCountUp(totals.livesSaved);
  const hospitals = useCountUp(totals.hospitals);

  // Emergency quick request form
  const [em, setEm] = useState({
    patientName: "",
    bloodGroup: "O+" as BloodGroup,
    units: 1,
    hospitalName: "",
    hospitalCity: "Mumbai",
    contact: "",
  });
  const [emErrors, setEmErrors] = useState<Record<string, string>>({});

  const submitEmergency = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (em.patientName.trim().length < 3) errs.patientName = "Please enter the patient's full name.";
    if (!/^[+]?[\d\s-]{10,15}$/.test(em.contact.trim()))
      errs.contact = "Enter a valid phone number (10+ digits).";
    if (em.hospitalName.trim().length < 3) errs.hospitalName = "Hospital name is required.";
    setEmErrors(errs);
    if (Object.keys(errs).length) return;
    addRequest(
      {
        patientName: em.patientName.trim(),
        bloodGroup: em.bloodGroup,
        units: em.units,
        hospitalName: em.hospitalName.trim(),
        hospitalCity: em.hospitalCity,
        contact: em.contact.trim(),
        neededBy: todayISO(),
        urgency: "critical",
        notes: "Emergency request raised from the LifeLink home page.",
      },
      null,
    );
    toast.success("Emergency request submitted!", {
      description: `${em.units} unit(s) of ${em.bloodGroup} — nearby blood banks have been alerted (demo).`,
    });
    setEm({ patientName: "", bloodGroup: "O+", units: 1, hospitalName: "", hospitalCity: "Mumbai", contact: "" });
  };

  return (
    <PageWrap className="overflow-x-clip">
      {/* ---------------- HERO ---------------- */}
      <section className="relative">
        <div className="clay-blob absolute -top-10 right-[8%] hidden size-40 animate-floaty lg:block" />
        <div className="clay-blob absolute top-40 -left-10 hidden size-24 animate-floaty-slow lg:block" />

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-secondary-foreground">
              <Zap className="size-3.5 text-primary" /> India's friendly blood-donation network · demo with sample data
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Every Drop <br className="hidden sm:block" />
              Can <span className="text-gradient-red">Save a Life</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              LifeLink connects voluntary donors with patients, hospitals and blood banks in real
              time. Register in two minutes, find matching blood nearby, and help ensure no one
              waits for a transfusion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className={cn(btnPrimary, "h-13 px-7 text-base")}>
                <Link to="/donate">
                  <Droplet className="size-5" /> Donate Blood
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={cn(btnSoft, "h-13 px-7 text-base")}>
                <Link to="/find-blood">
                  <Search className="size-5" /> Find Blood
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" /> Verified donors</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" /> {CITIES.length} cities</span>
              <span className="flex items-center gap-1.5"><BedDouble className="size-4 text-primary" /> 24×7 emergency support</span>
            </div>
          </motion.div>

          {/* Hero visual — live availability card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="clay-card relative mx-auto max-w-md p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_18px_-8px_rgba(163,40,40,.6),inset_0_2px_3px_rgba(255,255,255,.4),inset_0_-5px_9px_rgba(0,0,0,.16)]">
                    <Droplets className="size-6" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">Live Availability</p>
                    <p className="text-xs text-muted-foreground">Across partner blood banks</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-700">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {BLOOD_GROUPS.map((g) => (
                  <div key={g} className="clay-tile flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-extrabold text-foreground">{g}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <span className={cn("size-2 rounded-full", groupDot(totals.groupTotals[g]))} />
                      {totals.groupTotals[g]} units
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="clay-tile absolute -right-2 top-6 hidden animate-floaty items-center gap-2 px-4 py-2.5 sm:flex">
              <Users className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">+3 donors today</span>
            </div>
            <div className="clay-tile absolute -left-4 bottom-8 hidden animate-floaty-slow items-center gap-2 px-4 py-2.5 sm:flex">
              <HeartHandshake className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{totals.livesSaved}+ lives helped</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- IMPACT STATS ---------------- */}
      <section className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard icon={<Users className="size-5" />} value={donors.toLocaleString("en-IN")} label="Registered Donors" sub="Voluntary donors on LifeLink" />
        <StatCard icon={<Droplets className="size-5" />} value={units.toLocaleString("en-IN")} label="Blood Units Available" sub="Across partner blood banks" />
        <StatCard icon={<HeartHandshake className="size-5" />} value={lives.toLocaleString("en-IN")} label="Lives Potentially Helped" sub={`≈ ${LIVES_PER_DONATION} people per donation`} />
        <StatCard icon={<Building2 className="size-5" />} value={hospitals} label="Partner Hospitals" sub="With active blood banks" />
      </section>

      {/* ---------------- WHY DONATE ---------------- */}
      <section className="mt-24">
        <SectionHeading
          eyebrow="Why Donate"
          title={<>A small act with a <span className="text-gradient-red">huge ripple</span></>}
          subtitle="One unit of donated blood can be separated into red cells, plasma and platelets — helping several different patients."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <HeartHandshake className="size-6" />, title: "Save up to 3 lives", text: "Your single donation can support accident victims, mothers in labour and cancer patients." },
            { icon: <Stethoscope className="size-6" />, title: "Free mini health check", text: "Every camp screens your haemoglobin, blood pressure and pulse before you donate." },
            { icon: <Zap className="size-6" />, title: "Emergency readiness", text: "Registered donors get priority alerts when O−, AB− and other rare stocks run low." },
            { icon: <Users className="size-6" />, title: "Strengthen your community", text: "Cities with steady voluntary donors rarely face the dreaded 'blood shortage' calls." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="clay-card h-full p-6 transition-transform duration-200 hover:-translate-y-1.5">
                <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-primary">{f.icon}</div>
                <h3 className="text-base font-extrabold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="mt-24">
        <SectionHeading
          eyebrow="How It Works"
          title="From sign-up to life-saved in four steps"
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: 1, icon: <ClipboardCheck className="size-5" />, title: "Register", text: "Create your donor profile with blood group, city and availability." },
            { n: 2, icon: <Search className="size-5" />, title: "Get matched", text: "Patients and hospitals search by group, city and urgency to find you." },
            { n: 3, icon: <CalendarCheck2 className="size-5" />, title: "Donate", text: "Visit a partner hospital or camp — whole blood takes about 20 minutes." },
            { n: 4, icon: <Baby className="size-5" />, title: "Rest & return", text: "Relax, and become eligible again after 90 days. We'll remind you." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="clay-card relative h-full p-6 pt-8">
                <span className="absolute -top-4 left-6 grid size-9 place-items-center rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-[0_8px_16px_-6px_rgba(163,40,40,.6),inset_0_2px_2px_rgba(255,255,255,.4),inset_0_-3px_6px_rgba(0,0,0,.16)]">
                  {s.n}
                </span>
                <div className="mb-3 mt-1 flex items-center gap-2 text-primary">{s.icon}
                  <h3 className="text-base font-extrabold text-foreground">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- EMERGENCY REQUEST ---------------- */}
      <section className="mt-24">
        <Reveal>
          <div className="clay-card mx-auto max-w-5xl overflow-hidden p-0">
            <div className="grid lg:grid-cols-[1fr_1.2fr]">
              <div className="bg-secondary p-8 sm:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                  <Zap className="size-3.5" /> Emergency
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                  Need blood <span className="text-gradient-red">right now</span>?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
                  Raise a critical request and it appears instantly on the blood-requests board,
                  visible to hospitals and registered donors near you.
                </p>
                <ul className="mt-6 space-y-3 text-sm font-semibold text-secondary-foreground">
                  <li className="flex items-center gap-2.5"><PhoneCall className="size-4 shrink-0 text-primary" /> Also call our 24×7 helpline 1910</li>
                  <li className="flex items-center gap-2.5"><MapPin className="size-4 shrink-0 text-primary" /> Check nearest stock under Blood Banks</li>
                </ul>
              </div>
              <form className="grid gap-4 p-8 sm:grid-cols-2 sm:p-10" onSubmit={submitEmergency} noValidate>
                <Field label="Patient name" error={emErrors.patientName} className="sm:col-span-2">
                  <input
                    className={inputCls}
                    placeholder="e.g. Ramesh Gupta"
                    value={em.patientName}
                    onChange={(e) => setEm({ ...em, patientName: e.target.value })}
                  />
                </Field>
                <Field label="Blood group">
                  <select className={selectCls} value={em.bloodGroup} onChange={(e) => setEm({ ...em, bloodGroup: e.target.value as BloodGroup })}>
                    {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Units needed">
                  <select className={selectCls} value={em.units} onChange={(e) => setEm({ ...em, units: Number(e.target.value) })}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} unit{n > 1 ? "s" : ""}</option>)}
                  </select>
                </Field>
                <Field label="Hospital" error={emErrors.hospitalName}>
                  <input className={inputCls} placeholder="e.g. KEM Hospital" value={em.hospitalName} onChange={(e) => setEm({ ...em, hospitalName: e.target.value })} />
                </Field>
                <Field label="City">
                  <select className={selectCls} value={em.hospitalCity} onChange={(e) => setEm({ ...em, hospitalCity: e.target.value })}>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Contact number" error={emErrors.contact} className="sm:col-span-2">
                  <input className={inputCls} inputMode="tel" placeholder="+91 98XXX XXXXX" value={em.contact} onChange={(e) => setEm({ ...em, contact: e.target.value })} />
                </Field>
                <Button size="lg" className={cn(btnPrimary, "sm:col-span-2")}>
                  <Zap className="size-5" /> Submit emergency request
                </Button>
              </form>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="mt-24">
        <SectionHeading
          eyebrow="Testimonials"
          title="Stories from the LifeLink family"
          subtitle="Sample testimonials from our demo dataset."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { name: "Rohit Malhotra", meta: "Regular donor · Mumbai", quote: "I've donated 11 times through LifeLink. The eligibility reminders and camp alerts make it impossible to forget — and the thank-you notes keep me coming back." },
            { name: "Dr. Sunita Deshmukh", meta: "Blood bank in-charge · Pune", quote: "Finding O− units used to mean frantic phone calls. Now we check LifeLink inventory first and most requests are fulfilled within the hour." },
            { name: "Farah Sheikh", meta: "Recipient's daughter · Delhi", quote: "During my father's surgery we needed AB+ units urgently. The emergency request board connected us to two donors the same evening." },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="clay-card flex h-full flex-col p-7">
                <div className="mb-4 flex gap-1" aria-label="5 star rating">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} viewBox="0 0 20 20" className="size-4 fill-amber-400"><path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.4l-5.4 3.1L5.9 11.6l-4.5-4 6-.6Z" /></svg>
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-extrabold text-primary">
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <span>
                    <p className="text-sm font-extrabold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.meta}</p>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mt-24">
        <Reveal>
          <div className="clay-card relative overflow-hidden p-10 text-center sm:p-14">
            <div className="clay-blob absolute -left-8 -top-10 size-32 opacity-70" />
            <div className="clay-blob absolute -bottom-12 -right-6 size-40 opacity-70" />
            <Droplet className="mx-auto mb-4 size-10 animate-heartbeat text-primary" />
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Be someone's reason to smile today
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Join {data.donors.length.toLocaleString("en-IN")}+ registered donors. It takes two
              minutes to register and twenty minutes to donate.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className={cn(btnPrimary, "px-7")}>
                <Link to="/donate">Become a Donor <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={cn(btnSoft, "px-7")}>
                <Link to="/requests">View Blood Requests</Link>
              </Button>
            </div>
            <button
              onClick={() => navigate("/blood-bank")}
              className="mt-6 text-sm font-bold text-primary underline-offset-4 hover:underline"
            >
              or browse live blood-bank inventory →
            </button>
          </div>
        </Reveal>
      </section>
    </PageWrap>
  );
}
