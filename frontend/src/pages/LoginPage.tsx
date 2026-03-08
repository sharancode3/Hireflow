import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User } from "../types";
import { Logo } from "../components/Logo";
import { AuthSplitLayout } from "../components/AuthLayout";

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="M3 5l5 4 5-4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5.5 7V5.5a2.5 2.5 0 115 0V7" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.03 24.03 0 000 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 6h6M7 4l2 2-2 2" />
    </svg>
  );
}

function FeatureIcon({ color, path }: { color: string; path: string }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color, background: `${color}1A` }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d={path} />
      </svg>
    </span>
  );
}

const featureCards = [
  {
    title: "Verified Opportunities",
    description: "Every job listing is reviewed before going live.",
    color: "#22C55E",
    iconPath: "M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4zm-3 9l2 2 4-4",
  },
  {
    title: "AI-Powered Matching",
    description: "Your profile gets matched to roles that actually fit.",
    color: "#1A73E8",
    iconPath: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  },
  {
    title: "Track Everything",
    description: "Applications, interviews and offers in one place.",
    color: "#A855F7",
    iconPath: "M12 7v5l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();

  const next = params.get("next") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const data = await apiJson<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      login({ token: data.token, user: data.user });
      navigate(next || "/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthSplitLayout
      pageClassName="text-text"
      leftPanel={
        <>
          <div className="login-left-orb" />
          <div className="auth-left-logo-wrap">
            <Logo />
          </div>
          <div className="auth-left-content relative z-10">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-[#1A73E8]/40 bg-[#1A73E8]/10 px-4 py-1.5 text-xs font-semibold text-[#8AB4F8]">
                Smart hiring, flowing smoothly
              </span>
              <h1 className="text-5xl font-extrabold tracking-tight text-white">Connect talent to opportunity.</h1>
              <p className="max-w-md text-base text-[#A6ACBA]">
                Hireflow helps candidates and hiring teams move faster, with cleaner workflows and better decisions.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {featureCards.map((item, idx) => (
                <div
                  key={item.title}
                  className="login-feature-card"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <FeatureIcon color={item.color} path={item.iconPath} />
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-[#9AA3B5]">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      }
      rightPanel={
        <div className="auth-form-card login-form-card">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-text-secondary">Sign in to continue to Hireflow</p>
          </div>

          {error ? <div className="mb-4 rounded-lg border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Email address</span>
              <span className="flex h-11 items-center gap-2 rounded-lg border border-border bg-[#1A1A26] px-3 focus-within:border-[#1A73E8] focus-within:shadow-[0_0_0_3px_rgba(26,115,232,0.15)]">
                <span className="text-text-muted"><IconMail /></span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full w-full border-0 bg-transparent text-sm text-text outline-none"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Password</span>
              <span className="flex h-11 items-center gap-2 rounded-lg border border-border bg-[#1A1A26] px-3 focus-within:border-[#1A73E8] focus-within:shadow-[0_0_0_3px_rgba(26,115,232,0.15)]">
                <span className="text-text-muted"><IconLock /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full w-full border-0 bg-transparent text-sm text-text outline-none"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-xs text-text-secondary hover:text-text">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            <button type="submit" disabled={busy} className="btn-primary h-11 w-full rounded-lg font-semibold text-white">
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
            <div className="h-px flex-1 bg-border" />
            <span>OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            className="btn-base h-11 w-full justify-center gap-2 rounded-lg border border-border bg-[#1A1A26] text-sm text-white hover:border-[#1A73E8]"
          >
            <IconGoogle />
            Continue with Google
          </button>

          <div className="mt-6 flex items-center justify-between text-sm text-text-secondary">
            <Link to="/register" className="hover:text-white">New to Hireflow? Create an account</Link>
            <Link to="/forgot-password" className="hover:text-white">Forgot password?</Link>
          </div>
        </div>
      }
      bottomBar={
        <div className="auth-bottom-bar-inner">
          <span className="auth-bottom-copy">Are you a recruiter or company looking to hire?</span>
          <Link to="/recruiter/register" className="auth-bottom-cta">
            Join as Recruiter
            <ArrowRightIcon />
          </Link>
        </div>
      }
    />
  );
}
