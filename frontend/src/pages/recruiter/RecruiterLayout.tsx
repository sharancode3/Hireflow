import { NavLink, Outlet } from "react-router-dom";

export function RecruiterLayout() {
  return (
    <div className="container">
      <div className="layout">
        <aside className="sidebar" aria-label="Recruiter navigation">
          <NavLink to="/recruiter" className={({ isActive }) => (isActive ? "active" : undefined)} end>
            Dashboard
          </NavLink>
          <NavLink to="/recruiter/overview" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Overview
          </NavLink>
          <NavLink to="/recruiter/post-job" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Post Job
          </NavLink>
          <NavLink to="/recruiter/jobs" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Manage Jobs
          </NavLink>
          <NavLink to="/recruiter/applicants" className={({ isActive }) => (isActive ? "active" : undefined)}>
            View Applicants
          </NavLink>
          <NavLink to="/recruiter/shortlisted" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Shortlisted
          </NavLink>
          <NavLink to="/recruiter/interviews" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Interview Schedule
          </NavLink>
          <NavLink to="/recruiter/profile" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Company Profile
          </NavLink>
          <NavLink
            to="/recruiter/notifications"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Notifications
          </NavLink>

          <NavLink to="/recruiter/insights" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Talent Trends
          </NavLink>
          <NavLink to="/recruiter/settings" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Settings
          </NavLink>
        </aside>

        <section style={{ minWidth: 0 }}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
