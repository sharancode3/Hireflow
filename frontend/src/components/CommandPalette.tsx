import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/* ─── route manifests ─── */
const SEEKER_ROUTES = [
  { path: "/job-seeker/dashboard", label: "Dashboard", group: "Navigate", keywords: "home" },
  { path: "/job-seeker/jobs", label: "Browse Jobs & Internships", group: "Navigate", keywords: "search find" },
  { path: "/job-seeker/applied", label: "My Applications", group: "Navigate", keywords: "applications tracker" },
  { path: "/job-seeker/profile", label: "Profile Builder", group: "Navigate", keywords: "edit" },
  { path: "/job-seeker/resume-builder", label: "Resume Builder", group: "Navigate", keywords: "cv document pdf" },
  { path: "/job-seeker/interview-prep", label: "Interview Prep", group: "Navigate", keywords: "practice questions mock session" },
  { path: "/job-seeker/saved", label: "Saved Jobs", group: "Navigate", keywords: "bookmarks" },
  { path: "/job-seeker/experience-feed", label: "Experience Feed", group: "Navigate", keywords: "community posts" },
  { path: "/job-seeker/complaints", label: "Complaints & Opinions", group: "Navigate", keywords: "feedback reports" },
  { path: "/job-seeker/settings", label: "Settings", group: "Navigate", keywords: "preferences theme" },
];

const RECRUITER_ROUTES = [
  { path: "/recruiter/overview", label: "Dashboard", group: "Navigate", keywords: "home overview" },
  { path: "/recruiter/post-job", label: "Post a Job", group: "Actions", keywords: "create new" },
  { path: "/recruiter/jobs", label: "Manage Jobs", group: "Navigate", keywords: "edit delete" },
  { path: "/recruiter/applicants", label: "Applicants", group: "Navigate", keywords: "candidates" },
  { path: "/recruiter/shortlisted", label: "Shortlisted", group: "Navigate", keywords: "favorites" },
  { path: "/recruiter/interviews", label: "Interview Schedule", group: "Navigate", keywords: "calendar" },
  { path: "/recruiter/profile", label: "Company Profile", group: "Navigate", keywords: "edit" },
  { path: "/recruiter/experience-feed", label: "Experience Feed", group: "Navigate", keywords: "community posts" },
  { path: "/recruiter/complaints", label: "Complaints & Opinions", group: "Navigate", keywords: "feedback reports" },
  { path: "/recruiter/community-moderation", label: "Community Moderation", group: "Navigate", keywords: "admin complaints review" },
  { path: "/recruiter/settings", label: "Settings", group: "Navigate", keywords: "preferences theme" },
];

function IconSearch() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>;
}
function IconArrow() {
  return <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path d="M2 6h8M7 3l3 3-3 3"/></svg>;
}

export function CommandPalette() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const routes = useMemo(() => {
    const base = user?.role === "RECRUITER" ? RECRUITER_ROUTES : SEEKER_ROUTES;
    const actions = [
      { path: "__logout", label: "Log out", group: "Actions", keywords: "sign out exit" },
    ];
    return [...base, ...actions];
  }, [user]);

  const filtered = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.keywords.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q),
    );
  }, [query, routes]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return map;
  }, [filtered]);

  const flatList = useMemo(() => filtered, [filtered]);

  const execute = useCallback(
    (item: (typeof routes)[0]) => {
      setOpen(false);
      setQuery("");
      if (item.path === "__logout") {
        logout();
      } else {
        navigate(item.path);
      }
    },
    [navigate, logout],
  );

  // Keyboard shortcut to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keyboard navigation inside palette
  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatList[active]) execute(flatList[active]);
    }
  }

  // Scroll active into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label="Close command palette"
      />

      {/* Palette */}
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lift overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <IconSearch />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">No results for "{query}"</div>
          ) : (
            Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                  {group}
                </div>
                {items.map((item) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={item.path}
                      data-idx={idx}
                      type="button"
                      onClick={() => execute(item)}
                      onMouseEnter={() => setActive(idx)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        idx === active
                          ? "bg-[var(--accent)]/8 text-[var(--text)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
                      }`}
                    >
                      <span>{item.label}</span>
                      {idx === active && (
                        <span className="text-[var(--accent)]"><IconArrow /></span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
          <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="text-[10px] text-[var(--muted)]">
            <kbd className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-1 py-0.5">Ctrl</kbd>
            +
            <kbd className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-1 py-0.5">K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
