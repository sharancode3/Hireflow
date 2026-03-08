import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, apiJson } from "../api/client";
import { Logo } from "../components/Logo";
import { AuthSplitLayout } from "../components/AuthLayout";

function FeatureIcon({ color, path }: { color: string; path: string }) {
  return (
    <span className="recruiter-feature-icon" style={{ color, background: `${color}26` }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d={path} />
      </svg>
    </span>
  );
}

const recruiterFeatureCards = [
  {
    title: "Verified Candidates Only",
    description: "Every applicant profile is complete and reviewed.",
    color: "#22C55E",
    iconPath: "M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4zm-3 9l2 2 4-4",
  },
  {
    title: "Admin-Approved Postings",
    description: "Your listings go live only after Hireflow review.",
    color: "#1A73E8",
    iconPath: "M9 6h10v12H5V6h4zm0 0V4h6v2",
  },
  {
    title: "Full Hiring Dashboard",
    description: "Track applicants, manage listings and send updates.",
    color: "#A855F7",
    iconPath: "M5 19V9M12 19V5M19 19v-7",
  },
] as const;

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
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          phone: `${countryCode} ${phone}`,
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
    <AuthSplitLayout
      pageClassName="text-text recruiter-register-page"
      leftPanelClassName="recruiter-left-panel"
      rightPanelClassName="recruiter-right-panel"
      leftPanel={
        <>
          <div className="recruiter-left-orb" />
          <div className="recruiter-left-logo-wrap">
            <Logo />
          </div>
          <div className="recruiter-left-content">
            <div className="space-y-4">
              <h1 className="text-[40px] font-bold leading-tight text-white">Hire smarter with Hireflow.</h1>
              <p className="max-w-xl text-base leading-[1.6] text-[#888888]">
                Post verified jobs, reach the right candidates and manage your entire hiring pipeline in one place.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {recruiterFeatureCards.map((item, idx) => (
                <div
                  key={item.title}
                  className="recruiter-feature-card"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <FeatureIcon color={item.color} path={item.iconPath} />
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="recruiter-feature-desc text-[13px] text-[#777777]">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      }
      rightPanel={
        <div className="auth-form-card recruiter-form-card w-full">
          <h2 className="mb-[6px] text-2xl font-bold text-white">Create Recruiter Account</h2>
          <p className="mb-6 text-[13px] text-[#666666]">Fill in your details below. Your account will be reviewed before activation.</p>

          <div className="h-1.5 w-full rounded-full bg-[#1A1A26]">
            <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#1A73E8_0%,#1557B0_100%)]" />
          </div>

          {error ? <div className="mt-4 rounded-lg border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

          <form className="recruiter-form-fields mt-5" onSubmit={onSubmit}>
            <label className="field">
              <span className="label">Full Name</span>
              <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>

            <label className="field">
              <span className="label">Work Email Address</span>
              <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <label className="field">
              <span className="label">Password</span>
              <span className="flex h-11 items-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1A1A26] px-3 focus-within:border-[#1A73E8] focus-within:shadow-[0_0_0_3px_rgba(26,115,232,0.15)]">
                <input
                  className="h-full w-full border-0 bg-transparent px-0 text-sm text-white outline-none"
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-xs text-text-secondary hover:text-text">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
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
              <input className="input" required placeholder="HR Manager, Founder, Talent Lead" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            </label>

            <label className="field">
              <span className="label">Phone Number</span>
              <span className="flex h-11 items-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1A1A26] px-2 focus-within:border-[#1A73E8] focus-within:shadow-[0_0_0_3px_rgba(26,115,232,0.15)]">
                <select
                  className="h-9 w-[82px] rounded-md border border-[#2A2A3A] bg-[#131320] px-2 text-xs text-white outline-none"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  className="h-full w-full border-0 bg-transparent px-0 text-sm text-white outline-none"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </span>
            </label>

            <div className="recruiter-notice-box">
              Your account will be reviewed by the Hireflow admin team before you can post jobs. This typically takes 1 to 2 business days.
            </div>

            <button type="submit" disabled={busy} className="recruiter-submit-btn">
              {busy ? "Submitting..." : "Submit for Review"}
            </button>
          </form>

          <div className="mt-4 text-center text-[13px] text-[#555555]">
            Already have recruiter credentials? <Link className="text-[#1A73E8] hover:underline" to="/login">Back to login</Link>
          </div>
        </div>
      }
    />
  );
}
