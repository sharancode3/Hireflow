import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "../types";
import { useAuth } from "./AuthContext";

export function RequireAuth({ role }: { role?: UserRole }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter"} replace />;
  }

  return <Outlet />;
}
