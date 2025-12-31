import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiJson, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User, UserRole } from "../types";
import { Logo } from "../components/Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();

  const preRole = (params.get("role") as UserRole | null) ?? null;
  const next = params.get("next") ?? "";

  const [role, setRole] = useState<UserRole>(preRole ?? "JOB_SEEKER");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const destination = useMemo(() => {
    if (next) return next;
    return role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter";
  }, [next, role]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const data = await apiJson<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password, role },
      });
      login({ token: data.token, user: data.user });
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Login failed");
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
            <h1>
              Talvion — <span className="tagline">where Talent meets Vision</span>
            </h1>
            <p>
              Talvion is a calm, role-based workspace for job search and hiring.
              Choose your role and pick up right where you left off.
            </p>

            <p style={{ marginTop: 10 }}>
              Build a profile you’re proud of. Apply with confidence. Keep momentum.
            </p>

            <div className="auth-points">
              <div className="auth-point">
                <div className="title">About Talvion</div>
                <div className="desc">Job Seekers build profiles + resumes. Recruiters post roles and manage applicants.</div>
              </div>
              <div className="auth-point">
                <div className="title">Role-separated</div>
                <div className="desc">Job Seeker and Recruiter spaces stay strictly isolated.</div>
              </div>
              <div className="auth-point">
                <div className="title">Instant continuity</div>
                <div className="desc">Session persists securely via mock local storage for this demo.</div>
              </div>
            </div>
          </aside>

          <section className="auth-card" aria-label="Login form">
            <h2>Sign in</h2>
            <p className="auth-subtitle">Select your role — then enter your credentials.</p>

            {error ? <div className="card" style={{ padding: 12, marginTop: 12 }}>{error}</div> : null}

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
                    <div className="role-desc">Build your profile, match jobs, apply fast.</div>
                  </button>

                  <button
                    type="button"
                    className="role-option"
                    role="radio"
                    aria-checked={role === "RECRUITER"}
                    onClick={() => setRole("RECRUITER")}
                  >
                    <div className="role-title">Recruiter</div>
                    <div className="role-desc">Post roles, review applicants, schedule interviews.</div>
                  </button>
                </div>
              </div>

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
                  autoComplete="current-password"
                />
              </div>

              <div className="auth-actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Signing in..." : "Sign in"}
                </button>
                <div className="muted">
                  New here? <Link to={`/register?role=${role}`}>Create an account</Link>
                </div>
                <div className="muted">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
