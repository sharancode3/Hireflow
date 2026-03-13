import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RootRedirect() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "RECRUITER" && (user.recruiterApprovalStatus === "PENDING" || user.recruiterApprovalStatus === "REJECTED")) {
    return <Navigate to="/recruiter/pending" replace />;
  }

  return <Navigate to={user.role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter/dashboard"} replace />;
}
