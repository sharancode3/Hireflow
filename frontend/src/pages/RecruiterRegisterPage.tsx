import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, apiJson } from "../api/client";
import { Logo } from "../components/Logo";

export function RecruiterRegisterPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await apiJson<{ ok: true }>("/auth/recruiter/register", {
        method: "POST",
        body: {
          fullName,
          email,
          password,
          companyName,
          companyWebsite,
          designation,
          phone,
        },
      });
      navigate("/recruiter/pending", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Unable to submit recruiter registration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-split-page text-text">
      <div className="auth-split-layout">
        <aside className="auth-left-panel">
          <div className="login-left-orb" />
          <div className="space-y-5">
            <Logo />
            <h1 className="text-4xl font-bold leading-tight text-white">Join as a Recruiter</h1>
            <p className="max-w-md text-sm text-text-secondary">Post jobs, find candidates, build your team.</p>
          </div>
          <div className="text-xs text-text-muted">Your recruiter profile is reviewed by Hireflow admins before posting access is granted.</div>
        </aside>

        <section className="auth-right-panel">
          <div className="auth-form-card w-full max-w-xl">
            <h2 className="mb-6 text-2xl font-semibold text-white">Create Recruiter Account</h2>

            {error ? <div className="mb-4 rounded-lg border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="field">
                <span className="label">Full Name</span>
                <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Work Email address</span>
                <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Password</span>
                <input className="input" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Company Name</span>
                <input className="input" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Company Website</span>
                <input className="input" required type="url" placeholder="https://example.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Your Role or Designation</span>
                <input className="input" required placeholder="HR Manager / Founder" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Phone Number</span>
                <input className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>

              <div className="rounded-lg border border-border bg-surface-raised/70 px-4 py-3 text-xs text-text-secondary">
                Your account will be reviewed by the Hireflow admin team before you can post jobs. This usually takes 1 to 2 business days.
              </div>

              <button type="submit" disabled={busy} className="btn-primary h-11 w-full rounded-lg font-semibold text-white">
                {busy ? "Submitting..." : "Submit for Review"}
              </button>
            </form>

            <div className="mt-5 text-sm text-text-secondary">
              Already have recruiter credentials? <Link className="hover:text-white" to="/login">Back to login</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
