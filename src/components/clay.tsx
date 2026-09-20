import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ---------------- Logo ---------------- */

export function DropMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-7", className)} aria-hidden>
      <path
        d="M12 2.4c3.2 4.2 6.6 8 6.6 12.1A6.6 6.6 0 0 1 12 21.6a6.6 6.6 0 0 1-6.6-7.1C5.4 10.4 8.8 6.6 12 2.4Z"
        fill="currentColor"
      />
      <ellipse cx="9.6" cy="13.4" rx="1.7" ry="2.3" fill="rgba(255,255,255,.55)" transform="rotate(-18 9.6 13.4)" />
    </svg>
  );
}

export function LifeLinkLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_20px_-8px_rgba(163,40,40,.6),inset_0_2px_3px_rgba(255,255,255,.45),inset_0_-5px_9px_rgba(0,0,0,.16)]">
        <DropMark className="size-6 animate-heartbeat" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Life<span className="text-primary">Link</span>
      </span>
    </span>
  );
}

/* ---------------- Layout helpers ---------------- */

export function PageWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8", className)}>{children}</main>;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal className={cn("mb-10 max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </Reveal>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Data display ---------------- */

const badgeTones: Record<string, string> = {
  green: "bg-emerald-100/90 text-emerald-800",
  amber: "bg-amber-100/90 text-amber-800",
  red: "bg-red-100/90 text-red-700",
  orange: "bg-orange-100/90 text-orange-800",
  gray: "bg-muted text-muted-foreground",
  redsolid: "bg-primary text-primary-foreground",
};

export function Pill({
  tone = "gray",
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_PILL: Record<string, { tone: keyof typeof badgeTones; label: string }> = {
  available: { tone: "green", label: "Available" },
  low: { tone: "amber", label: "Low Stock" },
  critical: { tone: "red", label: "Critical" },
  pending: { tone: "amber", label: "Pending" },
  approved: { tone: "orange", label: "Approved" },
  fulfilled: { tone: "green", label: "Fulfilled" },
  rejected: { tone: "red", label: "Rejected" },
  normal: { tone: "green", label: "Normal" },
  urgent: { tone: "orange", label: "Urgent" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? { tone: "gray" as const, label: status };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function StatCard({
  icon,
  value,
  label,
  sub,
  className,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("clay-tile group p-5 transition-transform duration-200 hover:-translate-y-1", className)}>
      <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-secondary text-primary">{icon}</div>
      <p className="text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground/80">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="clay-tile flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-secondary text-primary">{icon}</div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="clay-card border-0">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="clay-btn-soft rounded-2xl border-0 bg-muted">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="clay-btn rounded-2xl bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Form helpers ---------------- */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputCls =
  "clay-inset h-11 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
export const selectCls = cn(inputCls, "appearance-none pr-10 [&>span]:line-clamp-1");

export const btnPrimary = "clay-btn rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90";
export const btnSoft =
  "clay-btn-soft rounded-2xl border-0 bg-card text-foreground hover:bg-secondary";
