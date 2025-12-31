import { useEffect, useMemo, useState } from "react";
import { apiJson, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { JobSeekerProfile, RecruiterProfile } from "../types";
import { loadUserSettings, saveUserSettings, type UserSettings } from "../data/settings";
import { useTheme } from "../theme/ThemeContext";

export function SettingsPage() {
  const { token, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [jsProfile, setJsProfile] = useState<JobSeekerProfile | null>(null);
  const [recProfile, setRecProfile] = useState<RecruiterProfile | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isJobSeeker = user?.role === "JOB_SEEKER";
  const isRecruiter = user?.role === "RECRUITER";

  useEffect(() => {
    if (!user) return;
    setSettings(loadUserSettings(user.id));
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!token || !user) return;
      try {
        setError(null);
        if (user.role === "JOB_SEEKER") {
          const p = await apiJson<{ profile: JobSeekerProfile }>("/job-seeker/profile", { token });
          setJsProfile(p.profile);
        }
        if (user.role === "RECRUITER") {
          const p = await apiJson<{ profile: RecruiterProfile }>("/recruiter/profile", { token });
          setRecProfile(p.profile);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load settings");
      }
    })();
  }, [token, user]);

  const visibility = useMemo(() => {
    if (isJobSeeker) return jsProfile?.visibility ?? "PUBLIC";
    return "PUBLIC";
  }, [isJobSeeker, jsProfile]);

  async function saveVisibility(next: "PUBLIC" | "PRIVATE") {
    if (!token || !user || user.role !== "JOB_SEEKER") return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiJson<{ profile: JobSeekerProfile }>("/job-seeker/profile", {
        method: "PATCH",
        token,
        body: { visibility: next },
      });
      setJsProfile(updated.profile);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update visibility");
    } finally {
      setBusy(false);
    }
  }

  function updateSettings(mutator: (s: UserSettings) => UserSettings) {
    if (!user || !settings) return;
    const next = mutator(settings);
    setSettings(next);
    saveUserSettings(user.id, next);
  }

  if (!user || !settings) {
    return <div className="card">Loading settings...</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Settings</h2>
        <p className="muted" style={{ margin: 0 }}>
          Keep it simple — changes apply instantly and persist.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      <div className="card grid" style={{ gap: 16 }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Appearance</h3>
          <div className="muted" style={{ margin: 0 }}>
            Choose a theme that feels comfortable.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label className="badge badge-accent">
            <input
              type="radio"
              name="theme"
              checked={theme === "light"}
              onChange={() => {
                setTheme("light");
                updateSettings((s) => ({ ...s, theme: "light" }));
              }}
            />
            Light
          </label>
          <label className="badge badge-accent">
            <input
              type="radio"
              name="theme"
              checked={theme === "soft-dark"}
              onChange={() => {
                setTheme("soft-dark");
                updateSettings((s) => ({ ...s, theme: "soft-dark" }));
              }}
            />
            Soft dark
          </label>
          <label className="badge badge-accent">
            <input
              type="radio"
              name="theme"
              checked={theme === "high-contrast"}
              onChange={() => {
                setTheme("high-contrast");
                updateSettings((s) => ({ ...s, theme: "high-contrast" }));
              }}
            />
            High contrast
          </label>
        </div>
      </div>

      <div className="card grid" style={{ gap: 16 }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Preferences</h3>
          <div className="muted" style={{ margin: 0 }}>
            Keep your experience focused and predictable.
          </div>
        </div>

        {isJobSeeker ? (
          <div className="grid" style={{ gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Profile visibility</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Public profiles can be discovered by recruiters. Private profiles are hidden from browsing.
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className={visibility === "PUBLIC" ? "btn btn-primary" : "btn"}
                disabled={busy}
                onClick={() => void saveVisibility("PUBLIC")}
              >
                Public
              </button>
              <button
                type="button"
                className={visibility === "PRIVATE" ? "btn btn-primary" : "btn"}
                disabled={busy}
                onClick={() => void saveVisibility("PRIVATE")}
              >
                Private
              </button>
            </div>
          </div>
        ) : isRecruiter ? (
          <div className="muted">Recruiter profiles are always public in this demo.</div>
        ) : null}

        <div className="grid" style={{ gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Notifications</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <label className="badge badge-accent" style={{ width: "fit-content" }}>
              <input
                type="checkbox"
                checked={settings.notifications.applicationUpdates}
                onChange={(e) =>
                  updateSettings((s) => ({
                    ...s,
                    notifications: { ...s.notifications, applicationUpdates: e.target.checked },
                  }))
                }
              />
              Application updates
            </label>
            <label className="badge badge-accent" style={{ width: "fit-content" }}>
              <input
                type="checkbox"
                checked={settings.notifications.productUpdates}
                onChange={(e) =>
                  updateSettings((s) => ({
                    ...s,
                    notifications: { ...s.notifications, productUpdates: e.target.checked },
                  }))
                }
              />
              Product updates
            </label>
          </div>
        </div>

        <div className="grid" style={{ gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Resume</div>
          <div className="field">
            <label className="label">Default template</label>
            <select
              className="select"
              value={settings.resume.defaultTemplate}
              onChange={(e) =>
                updateSettings((s) => ({
                  ...s,
                  resume: { ...s.resume, defaultTemplate: e.target.value as any },
                }))
              }
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>

        <label className="badge badge-accent" style={{ width: "fit-content" }}>
          <input
            type="checkbox"
            checked={settings.account.rememberFilters}
            onChange={(e) =>
              updateSettings((s) => ({
                ...s,
                account: { ...s.account, rememberFilters: e.target.checked },
              }))
            }
          />
          Remember filters
        </label>
      </div>

      <div className="card grid" style={{ gap: 12 }}>
        <h3 style={{ marginTop: 0 }}>Account</h3>
        <div className="card card-ghost" style={{ padding: 12 }}>
          <div style={{ fontWeight: 900 }}>{user.email}</div>
          <div className="muted">Role: {user.role}</div>
          {isRecruiter && recProfile ? <div className="muted">Company: {recProfile.companyName}</div> : null}
          {isJobSeeker && jsProfile ? <div className="muted">Name: {jsProfile.fullName}</div> : null}
        </div>

        <button type="button" className="btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
