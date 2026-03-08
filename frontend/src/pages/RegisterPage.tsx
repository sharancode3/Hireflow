import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiJson, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User } from "../types";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { FloatingInput } from "../components/ui/FloatingInput";

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
    <div className="auth-split-page text-text">
      <div className="auth-split-layout">
        <aside className="auth-left-panel">
          <div className="login-left-orb" />
          <div className="space-y-6">
            <Logo />
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight">Create your Hireflow account</h1>
              <p className="text-sm text-text-secondary">Small progress every day adds up — your next opportunity starts here.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Multi-step onboarding",
                "Profile-ready setup",
                "Profile-ready resume",
              ].map((pill) => (
                <span key={pill} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm text-text-secondary">
            <div>Fast sign-up with guided onboarding.</div>
            <div>Theme ready: light, soft dark, and high contrast.</div>
            <div>Resume generator included from day one.</div>
          </div>
        </aside>

        <section className="auth-right-panel">
          <div className="auth-form-card w-full max-w-md space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Register</h2>
              <p className="text-sm text-text-secondary">Step {step} of 2 — create your account and add personal details.</p>
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
                    label="Current status"
                  />
                  <FloatingInput
                    id="desiredRole"
                    className="h-12"
                    value={desiredRole}
                    onChange={(e) => setDesiredRole(e.target.value)}
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
        </section>
      </div>
    </div>
  );
}
