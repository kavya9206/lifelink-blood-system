import { Link } from "react-router";
import { LifeLinkLogo } from "@/components/clay";
import { Mail, MapPin, Phone } from "lucide-react";
export function Footer() {
    return (<footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="clay-card rounded-[2.5rem] p-8 sm:p-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <LifeLinkLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Connecting blood donors, patients, hospitals and blood banks across India — because
              every drop can save a life.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <MapPin className="size-4 text-primary"/>
              <span className="text-sm font-semibold text-muted-foreground">Mumbai · Delhi · Bengaluru · Chennai</span>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-foreground">Explore</h3>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" to="/find-blood">Find Blood</Link></li>
              <li><Link className="transition-colors hover:text-primary" to="/donate">Donate Blood</Link></li>
              <li><Link className="transition-colors hover:text-primary" to="/requests">Blood Requests</Link></li>
              <li><Link className="transition-colors hover:text-primary" to="/blood-bank">Blood Bank Inventory</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" to="/hospitals">Hospitals</Link></li>
              <li><Link className="transition-colors hover:text-primary" to="/about">About &amp; Eligibility</Link></li>
              <li><Link className="transition-colors hover:text-primary" to="/dashboard">Donor Dashboard</Link></li>
              <li><Link className="transition-colors hover:text-primary" to="/auth">Login / Register</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-foreground">Contact</h3>
            <ul className="space-y-2.5 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="size-4 text-primary"/> 1910 (Toll free helpline)</li>
              <li className="flex items-center gap-2"><Mail className="size-4 text-primary"/> hello@lifelink.in</li>
              <li className="flex items-center gap-2"><MapPin className="size-4 text-primary"/> 2nd Floor, Health Hub, Mumbai 400001</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LifeLink — Blood Donation Management System (demo).</p>
          <p className="rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
            Contains sample / demo data — not a live medical service.
          </p>
        </div>
      </div>
    </footer>);
}
