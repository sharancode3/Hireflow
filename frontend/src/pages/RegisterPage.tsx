import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiJson, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User, UserRole } from "../types";
import { Logo } from "../components/Logo";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <aside className="auth-aside">
            <Logo />
              <h1>Create your Talvion account</h1>
              <p className="muted">Where talent meets vision.</p>

            <p style={{ marginTop: 10 }}>
              Small progress every day adds up — your next opportunity starts here.
            </p>

            <div className="auth-points">
              <div className="auth-point">
                 <div className="title">About Talvion</div>
                <div className="desc">Build a credible profile, generate a resume, and track applications end-to-end.</div>
              </div>
              <div className="auth-point">
                <div className="title">Strict role separation</div>
                <div className="desc">Role controls routing, dashboards, and allowed actions.</div>
              </div>
              <div className="auth-point">
                <div className="title">Theme-ready</div>
                <div className="desc">Light, soft dark, and high contrast themes are one click away.</div>
              </div>
            </div>
          </aside>

          <section className="auth-card" aria-label="Registration form">
            <h2>Register</h2>
            <p className="auth-subtitle">Choose your role and create your credentials.</p>

            {error ? (
              <div className="card" style={{ padding: 12, marginTop: 12 }}>
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="grid" style={{ marginTop: 14 }}>
              <div className="field">
                <div className="label">Role</div>
                <div className="role-toggle" role="radiogroup" aria-label="Select role">
                  <button
                    type="button"
                    className="role-option"
                    role="radio"
                    aria-checked={role === "JOB_SEEKER"}
                    onClick={() => setRole("JOB_SEEKER")}
                  >
                    <div className="role-title">Job Seeker</div>
                    <div className="role-desc">Create a profile, generate a resume, apply with confidence.</div>
                  </button>

                  <button
                    type="button"
                    className="role-option"
                    role="radio"
                    aria-checked={role === "RECRUITER"}
                    onClick={() => setRole("RECRUITER")}
                  >
                    <div className="role-title">Recruiter</div>
                    <div className="role-desc">Post jobs, manage applicants, and schedule interviews.</div>
                  </button>
                </div>
              </div>

              {role === "JOB_SEEKER" ? (
                <div className="field">
                  <label className="label" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="field">
                  <label className="label" htmlFor="companyName">
                    Company name
                  </label>
                  <input
                    id="companyName"
                    className="input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="field">
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <div className="muted" style={{ fontSize: 13 }}>
                  Minimum 8 characters.
                </div>
              </div>

              <div className="auth-actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Creating..." : "Create account"}
                </button>
                <div className="muted">
                  Already have an account? <Link to={`/login?role=${role}`}>Sign in</Link>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
