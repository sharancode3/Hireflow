import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireGuest() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">Loading...</div>
      </div>
    );
  }

  if (user) {
    if (user.isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={user.role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter"} replace />;
  }

  return <Outlet />;
}
