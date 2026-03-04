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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-bg text-text">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* ═══ LEFT PANEL ═══ */}
        <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between" style={{ background: "#060913" }}>
          <div className="p-12 space-y-8">
            {/* Logo — forced white */}
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white">T</span>
              <span className="text-base font-semibold tracking-tight text-white">Talvion</span>
            </div>

            {/* Badge */}
            <span className="inline-block rounded-full bg-[#22D3EE]/15 px-4 py-1.5 text-xs font-semibold text-[#22D3EE]">
              where Talent meets Vision
            </span>

            {/* Heading */}
            <h1 className="text-[38px] font-extrabold leading-tight tracking-tight text-white" style={{ fontFamily: "'Sora', 'Inter', system-ui, sans-serif" }}>
              Your career,<br />at your pace.
            </h1>

            {/* Subtext */}
            <p className="text-[15px] leading-relaxed" style={{ color: "#94A3B8" }}>
              Build a profile you're proud of. Match with roles that fit. Apply fast.
            </p>

            {/* Feature list */}
            <div className="space-y-3 pt-2">
              {[
                { icon: "🎯", text: "Role-separated workspaces" },
                { icon: "📄", text: "ATS-ready resume builder" },
                { icon: "📊", text: "Live talent trends" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-sm text-white/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom mock card */}
          <div className="px-12 pb-12">
            <div className="rounded-xl border border-white/8 p-5" style={{ background: "#0F1728", maxWidth: 280 }}>
              <div className="space-y-3">
                {[
                  { dot: "#4F8EF7", label: "Applied", detail: "Product Analyst at Zenith" },
                  { dot: "#F59E0B", label: "Interview", detail: "UI/UX Designer at BlueWave" },
                  { dot: "#22C55E", label: "Offer", detail: "Frontend Dev at Nexora" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: row.dot }} />
                      <span className="text-xs font-medium text-white/70">{row.label}</span>
                    </div>
                    <span className="text-[11px] text-white/40 text-right">{row.detail}</span>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "65%", background: "linear-gradient(90deg, #22D3EE, #4F8EF7)" }} />
              </div>
            </div>
            <p className="mt-3 text-xs" style={{ color: "#64748B" }}>Track every application in one place.</p>
          </div>
        </aside>

        {/* ═══ RIGHT PANEL ═══ */}
        <section className="flex items-center justify-center px-4 py-10 lg:px-10">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-surface p-8 shadow-soft">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="text-sm text-text-secondary">Select your role, then enter your credentials.</p>
            </div>

            {error ? (
              <div className="rounded-xl border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger animate-shake">
                {error}
              </div>
            ) : null}

            {/* Role selector — accent-styled */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Role</span>
              <div className="flex gap-3">
                {(["JOB_SEEKER", "RECRUITER"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150"
                    style={role === r
                      ? { background: "rgba(34,211,238,0.1)", border: "1.5px solid #22D3EE", color: "#22D3EE" }
                      : { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }
                    }
                  >
                    {r === "JOB_SEEKER" ? "Job Seeker" : "Recruiter"}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="relative block">
                <input
                  id="email"
                  className="peer h-12 w-full rounded-lg border px-3 pt-4 pb-1.5 text-sm outline-none transition"
                  style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#111827" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#22D3EE"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34,211,238,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder=" "
                />
                <span className="pointer-events-none absolute left-3 top-3 text-sm text-[#94a3b8] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                  Email address
                </span>
              </label>

              <label className="relative block">
                <input
                  id="password"
                  className="peer h-12 w-full rounded-lg border px-3 pt-4 pb-1.5 pr-12 text-sm outline-none transition"
                  style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#111827" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#22D3EE"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34,211,238,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder=" "
                />
                <span className="pointer-events-none absolute left-3 top-3 text-sm text-[#94a3b8] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
                  Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-xs text-text-secondary"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </label>

              {/* Cyan accent Sign In button */}
              <button
                type="submit"
                disabled={busy}
                className="btn-base w-full relative overflow-hidden font-semibold shadow-soft hover:shadow-lift transition-all duration-200"
                style={{ background: "#22D3EE", color: "#060913", borderRadius: "0.75rem" }}
              >
                {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#060913]/30 border-t-[#060913]" /> : "Sign in"}
              </button>
            </form>

            <div className="grid gap-3">
              {/* Google button with icon */}
              <button
                type="button"
                className="btn-base w-full flex items-center justify-center gap-2 border border-border bg-transparent text-text hover:bg-surface-raised transition"
                style={{ borderRadius: "0.75rem" }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <Link to={`/register?role=${role}`} className="hover:text-text">
                  New here? Create account
                </Link>
                <Link to="/forgot-password" className="hover:text-text">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
