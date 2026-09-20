import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useApp, DEMO_PASSWORD } from "@/lib/store";
import { Field, LifeLinkLogo, btnPrimary, btnSoft, inputCls } from "@/components/clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  Droplet,
  Eye,
  EyeOff,
  HeartHandshake,
  KeyRound,
  LogIn,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "register";
type Role = "donor" | "recipient" | "hospital";

const DEMO_ACCOUNTS = [
  { email: "admin@lifelink.in", label: "Admin", role: "admin" },
  { email: "donor@lifelink.in", label: "Donor", role: "donor" },
  { email: "recipient@lifelink.in", label: "Recipient", role: "recipient" },
  { email: "hospital@lifelink.in", label: "Hospital", role: "hospital" },
];

export default function AuthPage({ redirectAfterAuth }: { redirectAfterAuth?: string }) {
  const { login, register } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: true });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    role: "donor" as Role,
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const go = (role: string) => {
    const returnTo = params.get("returnTo");
    navigate(returnTo ?? redirectAfterAuth ?? defaultRoute(role), { replace: true });
  };

  const submitLogin = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(loginForm.email.trim())) errs.email = "Enter a valid email.";
    if (loginForm.password.length < 6) errs.password = "Password must be at least 6 characters.";
    setLoginErrors(errs);
    if (Object.keys(errs).length) return;
    const err = login(loginForm.email, loginForm.password, loginForm.remember);
    if (err) {
      toast.error(err);
      return;
    }
    const role = loginForm.email.trim().toLowerCase().startsWith("admin")
      ? "admin"
      : loginForm.email.trim().toLowerCase().startsWith("hospital")
        ? "hospital"
        : loginForm.email.trim().toLowerCase().startsWith("recipient")
          ? "recipient"
          : "donor";
    toast.success("Welcome back to LifeLink!");
    go(role);
  };

  const submitRegister = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (regForm.name.trim().length < 3) errs.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(regForm.email.trim())) errs.email = "Enter a valid email.";
    if (!/^[+]?[\d\s-]{10,15}$/.test(regForm.phone.trim())) errs.phone = "Enter a valid phone number.";
    if (regForm.password.length < 6) errs.password = "At least 6 characters.";
    if (regForm.confirm !== regForm.password) errs.confirm = "Passwords do not match.";
    setRegErrors(errs);
    if (Object.keys(errs).length) return;
    const err = register({
      name: regForm.name,
      email: regForm.email,
      phone: regForm.phone,
      password: regForm.password,
      role: regForm.role,
    });
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(`Account created — welcome, ${regForm.name.split(" ")[0]}!`);
    go(regForm.role);
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-2 lg:pt-24">
      {/* Brand panel */}
      <div className="hidden lg:block">
        <LifeLinkLogo />
        <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-foreground">
          One account.
          <br />
          <span className="text-gradient-red">Three ways to save lives.</span>
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Donors manage eligibility and donation history. Recipients raise and track blood
          requests. Hospitals manage inventory and approve requests — all from one dashboard.
        </p>
        <div className="mt-8 grid max-w-md gap-3">
          {[
            { icon: <Droplet className="size-4" />, text: "Donor dashboard with 90-day eligibility reminders" },
            { icon: <HeartHandshake className="size-4" />, text: "Live request board connecting patients and donors" },
            { icon: <Building2 className="size-4" />, text: "Admin console for inventory, hospitals and requests" },
          ].map((f) => (
            <div key={f.text} className="clay-tile flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary text-primary">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="clay-card mx-auto w-full max-w-md p-7 sm:p-9">
        <div className="mb-6 flex justify-center lg:hidden">
          <LifeLinkLogo />
        </div>

        {/* Mode switch */}
        <div className="clay-inset mb-7 grid grid-cols-2 gap-1 rounded-2xl p-1.5">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-xl py-2 text-sm font-bold capitalize transition-all",
                mode === m ? "bg-primary text-primary-foreground shadow-[0_6px_12px_-4px_rgba(163,40,40,.5)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <form className="grid gap-4" onSubmit={submitLogin} noValidate>
            <Field label="Email" error={loginErrors.email}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input className={cn(inputCls, "pl-10")} type="email" placeholder="you@example.in" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
              </div>
            </Field>
            <Field label="Password" error={loginErrors.password}>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={cn(inputCls, "pl-10 pr-11")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-[#e5484d]"
                  checked={loginForm.remember}
                  onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                />
                Remember me
              </label>
              <button
                type="button"
                className="font-bold text-primary hover:underline"
                onClick={() => toast.info("This is a demo — use any listed demo account (password: demo1234).")}
              >
                Forgot password?
              </button>
            </div>
            <Button size="lg" className={btnPrimary}>
              <LogIn className="size-5" /> Login
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to LifeLink?{" "}
              <button type="button" className="font-bold text-primary hover:underline" onClick={() => setMode("register")}>
                Create an account
              </button>
            </p>

            {/* Demo accounts */}
            <div className="clay-tile mt-2 p-4">
              <p className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Demo accounts (password: {DEMO_PASSWORD})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, email: a.email, password: DEMO_PASSWORD })}
                    className="rounded-xl bg-muted px-3 py-2 text-left text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                  >
                    {a.label}
                    <span className="block truncate text-[10px] font-medium text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={submitRegister} noValidate>
            <Field label="Full name" error={regErrors.name}>
              <input className={inputCls} placeholder="e.g. Meera Krishnan" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
            </Field>
            <Field label="Email" error={regErrors.email}>
              <input className={inputCls} type="email" placeholder="you@example.in" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
            </Field>
            <Field label="Phone" error={regErrors.phone}>
              <input className={inputCls} inputMode="tel" placeholder="+91 98XXX XXXXX" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" error={regErrors.password}>
                <input className={inputCls} type="password" placeholder="••••••••" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
              </Field>
              <Field label="Confirm" error={regErrors.confirm}>
                <input className={inputCls} type="password" placeholder="Repeat" value={regForm.confirm} onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })} />
              </Field>
            </div>
            <Field label="I am joining as">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "donor", label: "Donor", icon: <Droplet className="size-4" /> },
                  { v: "recipient", label: "Recipient", icon: <UserRound className="size-4" /> },
                  { v: "hospital", label: "Hospital", icon: <Building2 className="size-4" /> },
                ] as { v: Role; label: string; icon: ReactNode }[]).map((o) => (
                  <button
                    type="button"
                    key={o.v}
                    onClick={() => setRegForm({ ...regForm, role: o.v })}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs font-bold transition-all",
                      regForm.role === o.v
                        ? "bg-primary text-primary-foreground shadow-[0_8px_16px_-6px_rgba(163,40,40,.55)]"
                        : "clay-inset text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Button size="lg" className={btnPrimary}>
              <UserPlus className="size-5" /> Create account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <button type="button" className="font-bold text-primary hover:underline" onClick={() => setMode("login")}>
                Login instead
              </button>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              By registering you agree to the demo terms. Donor accounts also appear on the{" "}
              <Link to="/donate" className="font-semibold text-primary hover:underline">donor registration</Link> page.
            </p>
          </form>
        )}

        <Button asChild variant="ghost" className={cn(btnSoft, "mt-4 w-full border-0 bg-transparent text-xs text-muted-foreground")}>
          <Link to="/">← Back to home</Link>
        </Button>
      </div>
    </main>
  );
}

function defaultRoute(role: string) {
  if (role === "admin" || role === "hospital") return "/admin";
  if (role === "recipient") return "/requests";
  return "/dashboard";
}
