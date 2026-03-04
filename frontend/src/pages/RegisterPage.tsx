import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiJson, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User, UserRole } from "../types";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";

export function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();

  const preRole = (params.get("role") as UserRole | null) ?? null;

  const [role, setRole] = useState<UserRole>(preRole ?? "JOB_SEEKER");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [companySize, setCompanySize] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [desiredRole, setDesiredRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);

  const destination = useMemo(() => (role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter"), [role]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const body: any = { email, password, role };
      if (role === "JOB_SEEKER") body.jobSeeker = { fullName };
      if (role === "RECRUITER") body.recruiter = { companyName };

      const data = await apiJson<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body,
      });

      login({ token: data.token, user: data.user });
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Registration failed");
    } finally {
      setBusy(false);
    }
  }

  function goToStep2() {
    if (!email || password.length < 8) {
      setError("Enter a valid email and password (min 8 chars).");
      return;
    }
    setError(null);
    setStep(2);
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <aside className="relative hidden overflow-hidden border-r border-border bg-gradient-to-br from-[#0D0F14] to-[#1A1E28] p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <Logo />
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight">Create your Talvion account</h1>
              <p className="text-sm text-text-secondary">Small progress every day adds up — your next opportunity starts here.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Multi-step onboarding",
                "Role-specific fields",
                "Profile-ready resume",
              ].map((pill) => (
                <span key={pill} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm text-text-secondary">
            <div>Strict role separation for routing + permissions.</div>
            <div>Theme ready: light, soft dark, and high contrast.</div>
            <div>Resume generator included from day one.</div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-4 py-10 lg:px-10">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-surface p-8 shadow-soft">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Register</h2>
              <p className="text-sm text-text-secondary">Step {step} of 2 — set your credentials and profile basics.</p>
            </div>

            {error ? (
              <div className="rounded-xl border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger animate-shake">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className={
                    "h-2 flex-1 rounded-full " +
                    (step >= n ? "bg-accent" : "bg-border")
                  }
                />
              ))}
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Role</span>
              <div className="relative flex h-12 rounded-full border border-border bg-surface-raised p-1">
                <span
                  className={
                    "absolute top-1 h-10 w-1/2 rounded-full bg-surface shadow-soft transition-transform duration-200 " +
                    (role === "JOB_SEEKER" ? "translate-x-0" : "translate-x-full")
                  }
                />
                <button
                  type="button"
                  className="relative z-10 flex-1 text-sm font-medium"
                  onClick={() => setRole("JOB_SEEKER")}
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  className="relative z-10 flex-1 text-sm font-medium"
                  onClick={() => setRole("RECRUITER")}
                >
                  Recruiter
                </button>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <label className="relative block">
                    <input
                      id="email"
                      className="input-base peer h-12"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder=" "
                    />
                    <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                      Email address
                    </span>
                  </label>

                  <label className="relative block">
                    <input
                      id="password"
                      className="input-base peer h-12 pr-12"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder=" "
                    />
                    <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                      Password (min 8 chars)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-3 text-xs text-text-secondary"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </label>

                  <Button type="button" variant="primary" className="w-full" onClick={goToStep2}>
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  {role === "JOB_SEEKER" ? (
                    <>
                      <label className="relative block">
                        <input
                          id="fullName"
                          className="input-base peer h-12"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          placeholder=" "
                        />
                        <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                          Full name
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          id="currentStatus"
                          className="input-base peer h-12"
                          value={currentStatus}
                          onChange={(e) => setCurrentStatus(e.target.value)}
                          placeholder=" "
                        />
                        <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                          Current status (Student/Working/Fresher)
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          id="desiredRole"
                          className="input-base peer h-12"
                          value={desiredRole}
                          onChange={(e) => setDesiredRole(e.target.value)}
                          placeholder=" "
                        />
                        <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                          Desired role
                        </span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="relative block">
                        <input
                          id="companyName"
                          className="input-base peer h-12"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          placeholder=" "
                        />
                        <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                          Company name
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          id="companySize"
                          className="input-base peer h-12"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          placeholder=" "
                        />
                        <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                          Company size
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          id="industry"
                          className="input-base peer h-12"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder=" "
                        />
                        <span className="pointer-events-none absolute left-3 top-3 text-sm text-text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                          Industry
                        </span>
                      </label>
                    </>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" variant="primary" loading={busy}>
                      Create account
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="text-sm text-text-secondary">
              Already have an account? <Link to={`/login?role=${role}`} className="hover:text-text">Sign in</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
