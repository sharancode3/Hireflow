import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "./Logo";

export function AppTopBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const dashboardPath = role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter";
  const profilePath = role === "JOB_SEEKER" ? "/job-seeker/profile" : "/recruiter/profile";
  const notificationsPath = role === "JOB_SEEKER" ? "/job-seeker/notifications" : "/recruiter/notifications";
  const settingsPath = role === "JOB_SEEKER" ? "/job-seeker/settings" : "/recruiter/settings";

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "TV";
  const ringClass = role === "RECRUITER" ? "ring-accent" : "ring-accent-teal";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 lg:px-8">
        {/* Left: hamburger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-raised hover:text-text lg:hidden"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5h12M3 9h12M3 13h12"/></svg>
          </button>
          <Logo />
        </div>

        {/* Center: Search trigger — opens Command Palette */}
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:border-border-active hover:text-text sm:flex"
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <span>Search…</span>
          <kbd className="ml-1 rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] leading-none text-text-muted">Ctrl K</kbd>
        </button>

        {/* Right: Avatar dropdown */}
        <div className="flex items-center gap-3">
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-3">
              <div className={"flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold ring-2 " + ringClass}>
                {initials}
              </div>
            </summary>
            <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface-raised p-4 shadow-lift sm:w-64">
              <div className="text-sm font-semibold text-text">{user?.email}</div>
              <div className="text-xs text-text-muted">Role: {user?.role}</div>
              <div className="mt-4 flex flex-col gap-2">
                <NavLink to={dashboardPath} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-border-active hover:bg-surface">
                  Dashboard
                </NavLink>
                <NavLink to={profilePath} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-border-active hover:bg-surface">
                  Profile
                </NavLink>
                <NavLink to={notificationsPath} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-border-active hover:bg-surface">
                  Notifications
                </NavLink>
                <NavLink to={settingsPath} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-border-active hover:bg-surface">
                  Settings
                </NavLink>
                <button
                  className="rounded-lg bg-gradient-to-r from-[#4F8EF7] to-[#6366F1] px-3 py-2 text-sm font-medium text-white"
                  onClick={logout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
