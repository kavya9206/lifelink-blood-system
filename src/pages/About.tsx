import { Link } from "react-router";
import { PageWrap, Reveal, SectionHeading, btnPrimary, btnSoft } from "@/components/clay";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  Droplet,
  Droplets,
  HandHeart,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

export default function About() {
  return (
    <PageWrap className="max-w-6xl">
      {/* Mission */}
      <Reveal className="text-center">
        <span className="mx-auto mb-4 grid size-16 place-items-center rounded-[1.4rem] bg-primary text-primary-foreground shadow-[0_16px_28px_-12px_rgba(163,40,40,.6),inset_0_3px_4px_rgba(255,255,255,.4),inset_0_-6px_12px_rgba(0,0,0,.16)]">
          <Droplet className="size-8 animate-heartbeat" />
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">About LifeLink</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          <b className="text-foreground">Our mission:</b> make sure that no patient in India waits
          for blood because the right donor couldn't be found in time. LifeLink brings donors,
          recipients, hospitals and blood banks onto one friendly platform.
        </p>
      </Reveal>

      {/* How the platform works */}
      <section className="mt-20">
        <SectionHeading eyebrow="The Platform" title="How LifeLink works" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Users className="size-5" />, title: "Donors register", text: "Voluntary donors create a profile with blood group, city, contact and availability status." },
            { icon: <Search className="size-5" />, title: "Patients & hospitals search", text: "Anyone can search live inventory by blood group, city, units needed and urgency." },
            { icon: <ClipboardCheck className="size-5" />, title: "Requests get tracked", text: "Blood requests appear on a shared board — hospitals approve, fulfil and update stock." },
            { icon: <CalendarCheck2 className="size-5" />, title: "Donors stay eligible", text: "Dashboards track donation history and the next eligible date (90-day gap)." },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 0.07}>
              <div className="clay-card h-full p-6">
                <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-secondary text-primary">{s.icon}</div>
                <h3 className="text-base font-extrabold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Importance */}
      <section className="mt-20 grid items-center gap-8 lg:grid-cols-2">
        <Reveal>
          <div className="clay-card relative overflow-hidden p-8 sm:p-10">
            <div className="clay-blob absolute -right-10 -top-12 size-36 opacity-70" />
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
              <HeartPulse className="size-6 text-primary" /> Why blood donation matters
            </h2>
            <ul className="mt-5 space-y-3.5 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-3"><Droplets className="mt-0.5 size-4 shrink-0 text-primary" /> India needs millions of units of blood every year — and voluntary, repeat donors are the safest source.</li>
              <li className="flex gap-3"><Droplets className="mt-0.5 size-4 shrink-0 text-primary" /> Blood cannot be manufactured. Every transfusion — for accidents, surgeries, cancer care, thalassemia or childbirth — starts with a donor.</li>
              <li className="flex gap-3"><Droplets className="mt-0.5 size-4 shrink-0 text-primary" /> One whole-blood donation is about 450 ml, your body replaces it within weeks, and it can be split into red cells, plasma and platelets.</li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="clay-card p-8 sm:p-10">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
              <Target className="size-6 text-primary" /> Donor eligibility basics
            </h2>
            <ul className="mt-5 grid gap-2.5 text-sm font-semibold text-foreground">
              {[
                "Age 18–65 years and weight above 50 kg",
                "Haemoglobin ≥ 12.5 g/dL (checked at the camp)",
                "At least 90 days since your last whole-blood donation",
                "No fever, cold or infection in the past week",
                "No surgery, dental work or tattoo in the last 6 months",
                "Not pregnant or breastfeeding",
              ].map((r) => (
                <li key={r} className="flex items-start gap-2.5 rounded-2xl bg-muted px-4 py-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Safety */}
      <section className="mt-20">
        <SectionHeading
          eyebrow="Safety First"
          title="Is donating blood safe?"
          subtitle="Absolutely — when done at licensed blood banks and camps, using sterile, single-use equipment."
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: <ShieldCheck className="size-5" />, title: "Sterile & single-use", text: "Needles, bags and tubing are brand new and used only once — you cannot catch an infection from donating." },
            { icon: <HandHeart className="size-5" />, title: "Gentle on your body", text: "The body holds large reserves; the collected 450 ml is replenished quickly. Eat well and hydrate before and after." },
            { icon: <ClipboardCheck className="size-5" />, title: "Screened every time", text: "Every donation is tested for transmissible infections, and units are used only after clearing screening." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.07}>
              <div className="clay-card h-full p-6">
                <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-secondary text-primary">{c.icon}</div>
                <h3 className="text-base font-extrabold text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mt-20">
        <Reveal>
          <div className="clay-card grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">Contact us</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Questions about donating, partnering as a hospital, or running a camp with LifeLink?
                We'd love to hear from you.
              </p>
              <div className="mt-5 grid gap-2.5 text-sm font-semibold text-foreground">
                <p className="flex items-center gap-2.5"><Phone className="size-4 text-primary" /> 1910 — toll-free donor helpline (24×7)</p>
                <p className="flex items-center gap-2.5"><Mail className="size-4 text-primary" /> hello@lifelink.in</p>
                <p className="flex items-center gap-2.5"><MapPin className="size-4 text-primary" /> 2nd Floor, Health Hub, Mumbai 400001</p>
                <p className="flex items-center gap-2.5"><Building2 className="size-4 text-primary" /> Partnerships: hospitals@lifelink.in</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className={btnPrimary}>
                <Link to="/donate"><Droplet className="size-5" /> Become a donor</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={btnSoft}>
                <Link to="/find-blood">Find blood now</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </PageWrap>
  );
}
