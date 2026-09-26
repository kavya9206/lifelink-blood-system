import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppProvider } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
// Vly toolbar is optional — inlined no-op stub so `vite build` never fails
// when `../vly-toolbar-readonly.jsx` is absent (e.g. fresh GitHub clones / CI).
// The real toolbar file can still be present at the repo root for Vly previews
// but is NOT required for the build to succeed.
const VlyToolbar = () => null;
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router";
import "./index.css";
// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.jsx"));
const AuthPage = lazy(() => import("./pages/Auth.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const FindBlood = lazy(() => import("./pages/FindBlood.jsx"));
const DonateBlood = lazy(() => import("./pages/DonateBlood.jsx"));
const BloodRequests = lazy(() => import("./pages/BloodRequests.jsx"));
const BloodBank = lazy(() => import("./pages/BloodBank.jsx"));
const Hospitals = lazy(() => import("./pages/Hospitals.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
// Simple loading fallback for route transitions
function RouteLoading() {
    return (<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>);
}
/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
    }
    render() {
        return this.state.hasError ? null : this.props.children;
    }
}
/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component {
    state = { hasError: false, message: "", stack: "" };
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            message: error.message || "Unknown runtime error",
            stack: error.stack || "",
        };
    }
    componentDidCatch(err) {
        console.error("[WebContainer preview] Root crash:", err);
    }
    render() {
        if (this.state.hasError) {
            return (<div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (<pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>)}
          </div>
        </div>);
        }
        return this.props.children;
    }
}
/** LifeLink app shell — clay navbar + routed page + footer on every route. */
function Layout() {
    return (<div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>);
}
function RouteSyncer() {
    const location = useLocation();
    useEffect(() => {
        window.parent.postMessage({ type: "iframe-route-change", path: location.pathname }, "*");
    }, [location.pathname]);
    useEffect(() => {
        function handleMessage(event) {
            if (event.data?.type === "navigate") {
                if (event.data.direction === "back")
                    window.history.back();
                if (event.data.direction === "forward")
                    window.history.forward();
            }
        }
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);
    return null;
}
createRoot(document.getElementById("root")).render(<StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Landing />}/>
                <Route path="/find-blood" element={<FindBlood />}/>
                <Route path="/donate" element={<DonateBlood />}/>
                <Route path="/requests" element={<BloodRequests />}/>
                <Route path="/blood-bank" element={<BloodBank />}/>
                <Route path="/hospitals" element={<Hospitals />}/>
                <Route path="/about" element={<About />}/>
                <Route path="/dashboard" element={<RequireAuth>
                      <Dashboard />
                    </RequireAuth>}/>
                <Route path="/admin" element={<RequireAuth roles={["admin", "hospital"]}>
                      <AdminDashboard />
                    </RequireAuth>}/>
                <Route path="*" element={<NotFound />}/>
              </Route>
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard"/>}/>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AppProvider>
    </RootErrorBoundary>
  </StrictMode>);
