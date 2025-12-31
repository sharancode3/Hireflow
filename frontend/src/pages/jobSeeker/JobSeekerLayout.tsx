import { NavLink, Outlet } from "react-router-dom";

export function JobSeekerLayout() {
  return (
    <div className="container">
      <div className="layout">
        <aside className="sidebar" aria-label="Job seeker navigation">
          <NavLink to="/job-seeker/dashboard" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/job-seeker/profile" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Profile
          </NavLink>
          <NavLink to="/job-seeker/resume-builder" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Resume Builder
          </NavLink>
          <NavLink to="/job-seeker/jobs" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Jobs
          </NavLink>
          <NavLink to="/job-seeker/freshers" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Freshers
          </NavLink>
          <NavLink to="/job-seeker/applied" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Applied Jobs
          </NavLink>
          <NavLink to="/job-seeker/saved" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Saved Jobs
          </NavLink>
          <NavLink
            to="/job-seeker/notifications"
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            Notifications
          </NavLink>

          <NavLink to="/job-seeker/insights" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Talent Trends
          </NavLink>
          <NavLink to="/job-seeker/settings" className={({ isActive }) => (isActive ? "active" : undefined)}>
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
