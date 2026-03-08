import { Bell, Briefcase, House, Rss, UserCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type Item = { to: string; label: string; icon: typeof House };

export function MobileBottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const items: Item[] = user.role === "RECRUITER"
    ? [
        { to: "/recruiter/dashboard", label: "Home", icon: House },
        { to: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
        { to: "/recruiter/profile", label: "Profile", icon: UserCircle },
        { to: "/recruiter/experience-feed", label: "Community", icon: Rss },
        { to: "/recruiter/notifications", label: "Alerts", icon: Bell },
      ]
    : [
        { to: "/job-seeker/dashboard", label: "Home", icon: House },
        { to: "/job-seeker/jobs", label: "Jobs", icon: Briefcase },
        { to: "/job-seeker/profile", label: "Profile", icon: UserCircle },
        { to: "/job-seeker/experience-feed", label: "Community", icon: Rss },
        { to: "/job-seeker/notifications", label: "Alerts", icon: Bell },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(10,10,15,0.95)] backdrop-blur md:hidden" aria-label="Mobile navigation">
      <ul className="grid h-16 grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                "flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] transition " +
                (isActive ? "text-[#1A73E8]" : "text-text-muted hover:text-white")
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
