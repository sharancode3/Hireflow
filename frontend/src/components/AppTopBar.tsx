import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "./Logo";

export function AppTopBar() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const dashboardPath = role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter";
  const profilePath = role === "JOB_SEEKER" ? "/job-seeker/profile" : "/recruiter/profile";
  const notificationsPath = role === "JOB_SEEKER" ? "/job-seeker/notifications" : "/recruiter/notifications";
  const insightsPath = role === "JOB_SEEKER" ? "/job-seeker/insights" : "/recruiter/insights";
  const settingsPath = role === "JOB_SEEKER" ? "/job-seeker/settings" : "/recruiter/settings";

  const primaryLinks =
    role === "RECRUITER"
      ? [
          { to: "/recruiter", label: "Dashboard", end: true },
          { to: "/recruiter/jobs", label: "Jobs" },
          { to: "/recruiter/applicants", label: "Applicants" },
          { to: insightsPath, label: "Talent Trends" },
        ]
      : [
          { to: "/job-seeker", label: "Dashboard", end: true },
          { to: "/job-seeker/jobs", label: "Jobs" },
          { to: "/job-seeker/applied", label: "Applications" },
          { to: insightsPath, label: "Talent Trends" },
        ];

  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />

        <nav className="nav" aria-label="App">
          {primaryLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              end={Boolean(l.end)}
            >
              {l.label}
            </NavLink>
          ))}

          <details className="account-menu">
            <summary className="btn">
              {user?.email ?? "Account"}
            </summary>
            <div className="card account-popover">
              <div style={{ fontWeight: 900 }}>{user?.email}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Role: {user?.role}
              </div>
              <div className="account-actions">
                <NavLink to={dashboardPath} className="btn">
                  Dashboard
                </NavLink>
                <NavLink to={profilePath} className="btn">
                  Profile
                </NavLink>
                <NavLink to={notificationsPath} className="btn">
                  Notifications
                </NavLink>
                <NavLink to={settingsPath} className="btn">
                  Settings
                </NavLink>
                <button className="btn btn-primary" onClick={logout} type="button">
                  Logout
                </button>
              </div>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
