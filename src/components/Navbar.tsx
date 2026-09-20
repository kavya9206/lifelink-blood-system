import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useApp } from "@/lib/store";
import { LifeLinkLogo, btnPrimary, btnSoft } from "@/components/clay";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HeartPulse, LayoutDashboard, LogOut, Menu, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/find-blood", label: "Find Blood" },
  { to: "/donate", label: "Donate Blood" },
  { to: "/requests", label: "Blood Requests" },
  { to: "/blood-bank", label: "Blood Banks" },
  { to: "/hospitals", label: "Hospitals" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardLabel =
    user?.role === "admin" || user?.role === "hospital" ? "Admin Dashboard" : "My Dashboard";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="clay-card mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full px-4 sm:px-6">
        <Link to="/" aria-label="LifeLink home">
          <LifeLinkLogo />
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-2xl px-3.5 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full bg-secondary py-1.5 pl-1.5 pr-3 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-28 truncate sm:inline">{user.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="clay-card w-56 border-0 p-2">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user.email} · <span className="capitalize">{user.role}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(user.role === "admin" || user.role === "hospital") && (
                  <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/admin")}>
                    <ShieldCheck /> {dashboardLabel}
                  </DropdownMenuItem>
                )}
                {user.role !== "admin" && user.role !== "hospital" && (
                  <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard /> {dashboardLabel}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/requests")}>
                  <HeartPulse /> Blood Requests
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl text-destructive"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="secondary" className={cn(btnSoft, "px-5 font-bold")}>
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild className={cn(btnPrimary, "px-5 font-bold")}>
                <Link to="/auth?mode=register">Register</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="clay-card w-72 border-0 p-5">
              <SheetTitle asChild>
                <div>
                  <LifeLinkLogo />
                </div>
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-2xl px-4 py-2.5 text-sm font-semibold",
                        isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary/60",
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              {!user && (
                <div className="mt-6 grid gap-2">
                  <Button asChild variant="secondary" className={cn(btnSoft, "font-bold")}>
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild className={cn(btnPrimary, "font-bold")}>
                    <Link to="/auth?mode=register" onClick={() => setOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
              {user && (
                <Button
                  variant="secondary"
                  className={cn(btnSoft, "mt-6 font-bold text-destructive")}
                  onClick={() => {
                    setOpen(false);
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut /> Sign out
                </Button>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
