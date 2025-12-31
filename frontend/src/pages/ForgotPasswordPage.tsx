import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-shell" style={{ gridTemplateColumns: "1fr", maxWidth: 780 }}>
          <section className="auth-card" aria-label="Password reset">
            <Logo />
            <h2 style={{ marginTop: 12 }}>Reset password</h2>
            <p className="auth-subtitle">
              Enter your email and we’ll send a reset link. (Demo UI — reset is not wired to the backend.)
            </p>

            {sent ? (
              <div className="card" style={{ padding: 12, marginTop: 12 }}>
                <div style={{ fontWeight: 900 }}>Check your inbox</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  If an account exists for <span style={{ fontWeight: 700 }}>{email}</span>, a reset link would be sent.
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="grid" style={{ marginTop: 14 }}>
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

              <div className="auth-actions">
                <button className="btn btn-primary" type="submit">
                  Send reset link
                </button>
                <div className="muted">
                  <Link to="/login">Back to sign in</Link>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
