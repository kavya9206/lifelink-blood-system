import { Navigate, useLocation } from "react-router";
import { useApp } from "@/lib/store";
/**
 * Auth guard for LifeLink demo accounts (persisted in localStorage).
 * Pass `roles` to restrict the route to specific account roles.
 */
export function RequireAuth({ children, roles, }) {
    const { user } = useApp();
    const location = useLocation();
    if (!user || (roles && !roles.includes(user.role))) {
        const returnTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace/>;
    }
    return children;
}
