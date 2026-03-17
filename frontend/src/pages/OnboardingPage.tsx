import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboardPath = useMemo(() => {
    if (user?.role === "RECRUITER") return "/recruiter/dashboard";
    return "/job-seeker/dashboard";
  }, [user?.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-3xl font-bold text-text">You are all set! Welcome to Hireflow.</h1>
        <p className="mt-3 text-sm text-text-secondary">Your account is ready. Open your dashboard to continue.</p>
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(dashboardPath, { replace: true })}
            className="btn-base h-11 rounded-lg px-6 font-semibold text-[var(--color-sidebar-active-text)]"
            style={{ background: "linear-gradient(120deg, var(--color-accent), var(--color-accent-hover))" }}
          >
            Open Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
