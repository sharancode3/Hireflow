import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "../types";
import { useAuth } from "./AuthContext";
import { hasCompletedOnboarding } from "./onboarding";

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

  if (user.role === "RECRUITER" && user.recruiterApprovalStatus === "PENDING" && location.pathname !== "/recruiter/pending") {
    return <Navigate to="/recruiter/pending" replace />;
  }

  // TODO: Implement auth guard middleware that checks recruiter approval status on every route - redirect unapproved recruiters to /recruiter/pending.

  if (user.role === "RECRUITER" && user.recruiterApprovalStatus === "REJECTED" && location.pathname !== "/recruiter/login") {
    return <Navigate to="/recruiter/login" replace />;
  }

  if (user.role === "RECRUITER" && user.recruiterApprovalStatus === "APPROVED" && location.pathname === "/recruiter/pending") {
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  if (user.role === "RECRUITER" && user.recruiterApprovalStatus === "PENDING" && location.pathname === "/recruiter/pending") {
    return <Outlet />;
  }

  const isOnboardingRoute = location.pathname === "/onboarding";
  const isDone = hasCompletedOnboarding(user.id);
  if (!isDone && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }
  if (isDone && isOnboardingRoute) {
    return <Navigate to={user.role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter/dashboard"} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter/dashboard"} replace />;
  }

  return <Outlet />;
}
