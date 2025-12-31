import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RoleRedirect(props: { jobSeekerTo: string; recruiterTo: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "JOB_SEEKER" ? props.jobSeekerTo : props.recruiterTo} replace />;
}
