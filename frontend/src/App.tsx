import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import React, { Suspense, lazy } from "react";

import { AuthLayout } from "./components/AuthLayout";
import { AppLayout } from "./components/AppLayout";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireGuest } from "./auth/RequireGuest";

import { RootRedirect } from "./pages/RootRedirect";
import { RoleRedirect } from "./pages/RoleRedirect";
const HireTrendsPageLazy = lazy(async () => {
  const m = await import("./pages/HireTrendsPage");
  return { default: m.HireTrendsPage };
});
const ResumeBuilderPageLazy = lazy(async () => {
  const m = await import("./pages/jobSeeker/ResumeBuilderPage");
  return { default: m.ResumeBuilderPage };
});
const InterviewPrepPageLazy = lazy(async () => {
  const m = await import("./pages/jobSeeker/InterviewPrepPage");
  return { default: m.InterviewPrepPage };
});
const SkillGapPageLazy = lazy(async () => {
  const m = await import("./pages/jobSeeker/SkillGapPage");
  return { default: m.SkillGapPage };
});
const CommunityFeedPageLazy = lazy(async () => {
  const m = await import("./pages/CommunityFeedPage");
  return { default: m.CommunityFeedPage };
});
const ComplaintsOpinionsPageLazy = lazy(async () => {
  const m = await import("./pages/ComplaintsOpinionsPage");
  return { default: m.ComplaintsOpinionsPage };
});
const RecruiterCommunityModerationPageLazy = lazy(async () => {
  const m = await import("./pages/recruiter/CommunityModerationPage");
  return { default: m.RecruiterCommunityModerationPage };
});
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ThemePage } from "./pages/ThemePage";
import { SettingsPage } from "./pages/SettingsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { RecruiterRegisterPage } from "./pages/RecruiterRegisterPage";
import { RecruiterPendingPage } from "./pages/RecruiterPendingPage";
import { PageTitleSync } from "./components/PageTitleSync";
import { AdminJobReviewPage } from "./pages/admin/JobReviewPage";

import { JobSeekerLayout } from "./pages/jobSeeker/JobSeekerLayout";
import { JobSeekerDashboardPage } from "./pages/jobSeeker/DashboardPage";
import { JobSeekerProfilePage } from "./pages/jobSeeker/ProfilePage";
import { JobSeekerJobsPage } from "./pages/jobSeeker/JobsPage";
import { JobDetailsPage } from "./pages/jobSeeker/JobDetailsPage";
import { AppliedJobsPage } from "./pages/jobSeeker/AppliedJobsPage";
import { SavedJobsPage } from "./pages/jobSeeker/SavedJobsPage";
import { JobSeekerNotificationsPage } from "./pages/jobSeeker/NotificationsPage";

import { RecruiterLayout } from "./pages/recruiter/RecruiterLayout";
import { RecruiterOverviewPage } from "./pages/recruiter/OverviewPage";
import { RecruiterPostJobPage } from "./pages/recruiter/PostJobPage";
import { RecruiterManageJobsPage } from "./pages/recruiter/ManageJobsPage";
import { RecruiterApplicantsPage } from "./pages/recruiter/ApplicantsPage";
import { RecruiterShortlistedPage } from "./pages/recruiter/ShortlistedPage";
import { RecruiterInterviewSchedulePage } from "./pages/recruiter/InterviewSchedulePage";
import { RecruiterProfilePage } from "./pages/recruiter/ProfilePage";
import { RecruiterNotificationsPage } from "./pages/recruiter/NotificationsPage";

class InsightsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return <div className="card">Insights crashed: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <>
      <PageTitleSync />
      <Routes>
        <Route path="/" element={<RootRedirect />} />

      <Route element={<AuthLayout />}>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route path="/recruiter/pending" element={<RecruiterPendingPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/trends" element={<Navigate to="/talent-trends" replace />} />
          <Route path="/hire-trends" element={<Navigate to="/talent-trends" replace />} />
          <Route
            path="/talent-trends"
            element={<RoleRedirect jobSeekerTo="/job-seeker/insights" recruiterTo="/recruiter/insights" />}
          />
          <Route
            path="/theme"
            element={<RoleRedirect jobSeekerTo="/job-seeker/theme" recruiterTo="/recruiter/theme" />}
          />
          <Route
            path="/settings"
            element={<RoleRedirect jobSeekerTo="/job-seeker/settings" recruiterTo="/recruiter/settings" />}
          />

          <Route path="/admin/job-review" element={<AdminJobReviewPage />} />

          <Route element={<RequireAuth role="JOB_SEEKER" />}>
            <Route path="/job-seeker" element={<JobSeekerLayout />}>
              <Route index element={<Navigate to="/job-seeker/dashboard" replace />} />
              <Route path="dashboard" element={<JobSeekerDashboardPage />} />
              <Route path="profile" element={<JobSeekerProfilePage />} />
              <Route
                path="resume-builder"
                element={
                  <Suspense fallback={<div className="card">Loading resume builder…</div>}>
                    <ResumeBuilderPageLazy />
                  </Suspense>
                }
              />
              <Route path="jobs" element={<JobSeekerJobsPage />} />
              <Route path="jobs/:jobId" element={<JobDetailsPage />} />
              <Route path="freshers" element={<JobSeekerJobsPage freshersOnly />} />
              <Route path="applied" element={<AppliedJobsPage />} />
              <Route path="saved" element={<SavedJobsPage />} />
              <Route path="notifications" element={<JobSeekerNotificationsPage />} />
              <Route
                path="experience-feed"
                element={
                  <Suspense fallback={<div className="card">Loading community feed…</div>}>
                    <CommunityFeedPageLazy />
                  </Suspense>
                }
              />
              <Route
                path="complaints"
                element={
                  <Suspense fallback={<div className="card">Loading complaints…</div>}>
                    <ComplaintsOpinionsPageLazy />
                  </Suspense>
                }
              />
              <Route
                path="interview-prep"
                element={
                  <Suspense fallback={<div className="card">Loading interview prep…</div>}>
                    <InterviewPrepPageLazy />
                  </Suspense>
                }
              />
              <Route
                path="skill-gap"
                element={
                  <Suspense fallback={<div className="card">Loading skill gap analyzer…</div>}>
                    <SkillGapPageLazy />
                  </Suspense>
                }
              />

              <Route
                path="insights"
                element={
                  <Suspense fallback={<div className="card">Loading insights…</div>}>
                    <InsightsErrorBoundary>
                      <HireTrendsPageLazy />
                    </InsightsErrorBoundary>
                  </Suspense>
                }
              />
              <Route path="theme" element={<ThemePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth role="RECRUITER" />}>
            <Route path="/recruiter" element={<RecruiterLayout />}>
              <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
              <Route path="dashboard" element={<RecruiterOverviewPage />} />
              <Route path="overview" element={<RecruiterOverviewPage />} />
              <Route path="post-job" element={<RecruiterPostJobPage />} />
              <Route path="jobs" element={<RecruiterManageJobsPage />} />
              <Route path="applicants" element={<RecruiterApplicantsPage />} />
              <Route path="shortlisted" element={<RecruiterShortlistedPage />} />
              <Route path="interviews" element={<RecruiterInterviewSchedulePage />} />
              <Route path="profile" element={<RecruiterProfilePage />} />
              <Route path="notifications" element={<RecruiterNotificationsPage />} />
              <Route
                path="experience-feed"
                element={
                  <Suspense fallback={<div className="card">Loading community feed…</div>}>
                    <CommunityFeedPageLazy />
                  </Suspense>
                }
              />
              <Route
                path="complaints"
                element={
                  <Suspense fallback={<div className="card">Loading complaints…</div>}>
                    <ComplaintsOpinionsPageLazy />
                  </Suspense>
                }
              />
              <Route
                path="community-moderation"
                element={
                  <Suspense fallback={<div className="card">Loading moderation…</div>}>
                    <RecruiterCommunityModerationPageLazy />
                  </Suspense>
                }
              />

              <Route
                path="insights"
                element={
                  <Suspense fallback={<div className="card">Loading insights…</div>}>
                    <InsightsErrorBoundary>
                      <HireTrendsPageLazy />
                    </InsightsErrorBoundary>
                  </Suspense>
                }
              />
              <Route path="theme" element={<ThemePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
