import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiJson, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User } from "../types";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { FloatingInput } from "../components/ui/FloatingInput";
import { AuthSplitLayout } from "../components/AuthLayout";

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

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [desiredRole, setDesiredRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !currentStatus.trim() || !desiredRole.trim()) {
      setError("Please complete all required profile details before creating your account.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const data = await apiJson<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: { email, password, fullName },
      });

      login({ token: data.token, user: data.user });
      navigate("/", { replace: true });
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
    <AuthSplitLayout
      pageClassName="text-text"
      leftPanel={
        <>
          <div className="login-left-orb" />
          <div className="auth-left-logo-wrap">
            <Logo />
          </div>
          <div className="auth-left-content relative z-10">
            <div className="space-y-3">
              <h1 className="text-5xl font-extrabold tracking-tight text-white">Start your journey.</h1>
              <p className="max-w-md text-base text-[#A6ACBA]">Your next opportunity starts here, with verified roles and better matching.</p>
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
        <div className="auth-form-card login-form-card w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Register</h2>
            <p className="text-sm text-text-secondary">Step {step} of 2 - create your account and add personal details.</p>
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

          <form onSubmit={onSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <FloatingInput
                  id="email"
                  className="h-12"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  label="Email address"
                />

                <FloatingInput
                  id="password"
                  className="h-12"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  label="Password (min 8 chars)"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-xs text-text-secondary hover:text-text"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />

                <Button type="button" variant="primary" className="w-full" onClick={goToStep2}>
                  Continue
                </Button>
              </>
            ) : (
              <>
                <FloatingInput
                  id="fullName"
                  className="h-12"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  label="Full name"
                />
                <FloatingInput
                  id="currentStatus"
                  className="h-12"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  required
                  label="Current status"
                />
                <FloatingInput
                  id="desiredRole"
                  className="h-12"
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  required
                  label="Desired role"
                />

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
            Already have an account? <Link to="/login" className="hover:text-text">Sign in</Link>
          </div>
        </div>
      }
    />
  );
}
