import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const jobSeekerNav = [
  { group: "MAIN", items: [
    { to: "/job-seeker/dashboard", label: "Dashboard" },
    { to: "/job-seeker/jobs", label: "Jobs" },
    { to: "/job-seeker/applied", label: "Applications" },
    { to: "/job-seeker/insights", label: "Talent Trends" },
  ] },
  { group: "WORKSPACE", items: [
    { to: "/job-seeker/profile", label: "Profile Builder" },
    { to: "/job-seeker/resume-builder", label: "Resume Builder" },
    { to: "/job-seeker/saved", label: "Saved Jobs" },
    { to: "/job-seeker/notifications", label: "Notifications" },
  ] },
  { group: "ACCOUNT", items: [
    { to: "/job-seeker/settings", label: "Settings" },
  ] },
];

const recruiterNav = [
  { group: "MAIN", items: [
    { to: "/recruiter/overview", label: "Dashboard" },
    { to: "/recruiter/jobs", label: "Jobs" },
    { to: "/recruiter/applicants", label: "Applicants" },
    { to: "/recruiter/insights", label: "Talent Trends" },
  ] },
  { group: "WORKSPACE", items: [
    { to: "/recruiter/post-job", label: "Post a Job" },
    { to: "/recruiter/interviews", label: "Interviews" },
    { to: "/recruiter/notifications", label: "Notifications" },
  ] },
  { group: "ACCOUNT", items: [
    { to: "/recruiter/profile", label: "Profile" },
    { to: "/recruiter/settings", label: "Settings" },
  ] },
];

export function AppSidebar({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void } = {}) {
  const { user } = useAuth();
  const groups = user?.role === "RECRUITER" ? recruiterNav : jobSeekerNav;

  const baseClass = mobile
    ? "flex flex-col gap-6"
    : "hidden lg:flex lg:w-[260px] lg:flex-col lg:gap-6 lg:border-r lg:border-border lg:bg-surface lg:px-4 lg:py-6";

  return (
    <aside className={baseClass}>
      {groups.map((group) => (
        <div key={group.group} className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.2em] text-text-muted">{group.group}</div>
          <nav className="flex flex-col gap-1">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    "flex items-center rounded-lg px-3 py-2 text-sm transition",
                    isActive
                      ? "border-l-2 border-l-[var(--accent)] bg-[var(--surface-raised)] text-[var(--text)] font-medium"
                      : "border-l-2 border-l-transparent text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]",
                  ].join(" ")
                }
              >
                <span className="ml-1">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
