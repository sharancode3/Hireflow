import { Link } from "react-router-dom";

export function RecruiterPendingPage() {
  return (
    <div className="auth-split-page text-text">
      <div className="auth-split-layout">
        <aside className="auth-left-panel">
          <div className="login-left-orb" />
          <div className="space-y-5">
            <h1 className="text-4xl font-bold leading-tight text-white">Recruiter Verification</h1>
            <p className="max-w-md text-sm text-text-secondary">
              Your Hireflow recruiter profile is now in the review queue.
            </p>
          </div>
        </aside>

        <section className="auth-right-panel">
          <div className="auth-form-card text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E] recruiter-checkmark">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Application Submitted</h1>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We have received your recruiter application. Our team will verify your details and notify you at your registered email.
              You cannot post jobs until your account is approved.
            </p>
            <Link to="/login" className="mt-8 inline-block text-sm text-[#8AB4F8] hover:text-white">
              Back to Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
