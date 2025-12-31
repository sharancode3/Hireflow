import { useEffect, useMemo, useRef, useState } from "react";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { GeneratedResume, JobSeekerProfile, ResumeSettings, ResumeTemplate } from "../../types";
import { downloadResumePdfFromElement } from "../../utils/resumePdf";
import { ResumePreview } from "../../resume/ResumePreview";
import { defaultResumeSettings, templateCatalog } from "../../resume/catalog";

export function ResumeBuilderPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [versions, setVersions] = useState<GeneratedResume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>("MODERN");
  const [title, setTitle] = useState<string>("");
  const [settings, setSettings] = useState<ResumeSettings>(defaultResumeSettings());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    if (!token) return;
    const [p, g] = await Promise.all([
      apiJson<{ profile: JobSeekerProfile }>("/job-seeker/profile", { token }),
      apiJson<{ generatedResumes: GeneratedResume[] }>("/job-seeker/generated-resumes", { token }),
    ]);
    setProfile(p.profile);
    setVersions(g.generatedResumes);

    const newest = g.generatedResumes[0] ?? null;
    if (newest) {
      setActiveId(newest.id);
      setTemplate(newest.template);
      setTitle(newest.title ?? "");
      setSettings(newest.settings ?? defaultResumeSettings());
    }
  }

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load resume builder");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const activeVersion = useMemo(() => versions.find((v) => v.id === activeId) ?? null, [versions, activeId]);

  const effectiveSnapshot = useMemo(() => {
    // Single source of truth: always build resumes from profile data.
    // Versions store template/settings, but content is always derived from current profile.
    return profile;
  }, [profile]);

  async function createVersion() {
    if (!token || !profile) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        template,
        title: title.trim() || `Resume ${new Date().toLocaleDateString()}`,
        snapshot: {
          photoDataUrl: profile.photoDataUrl ?? null,
          fullName: profile.fullName,
          phone: profile.phone,
          location: profile.location,
          headline: profile.headline ?? null,
          about: profile.about ?? null,
          experienceYears: profile.experienceYears,
          desiredRole: profile.desiredRole,
          skills: profile.skills,
          skillLevels: profile.skillLevels ?? {},
          interests: profile.interests ?? [],
          education: profile.education ?? [],
          experience: profile.experience ?? [],
          projects: profile.projects ?? [],
          certifications: profile.certifications ?? [],
          achievements: profile.achievements ?? [],
          languages: profile.languages ?? [],
          isFresher: profile.isFresher,
          visibility: profile.visibility,
        },
        settings,
      };

      await apiJson("/job-seeker/generated-resumes", { method: "POST", token, body: payload });
      await load();
      setBusy(false);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to create resume version");
    }
  }

  async function downloadPdf() {
    if (!previewRef.current) {
      setError("Preview not ready yet.");
      return;
    }
    const safeTitle = (title.trim() || activeVersion?.title || "resume").replace(/[^a-z0-9\- _]/gi, "").trim() || "resume";
    await downloadResumePdfFromElement(previewRef.current, `${safeTitle}.pdf`);
  }

  const templateMeta = templateCatalog.find((t) => t.id === template) ?? templateCatalog[0]!;

  return (
    <div className="grid">
      <div className="card" style={{ marginBottom: 0 }}>
        <h2 style={{ marginTop: 0 }}>Resume Builder</h2>
        <p className="muted" style={{ margin: 0 }}>
          Fully data-driven: resumes are generated from your profile (no re-entry).
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "380px 1fr", gap: 14, alignItems: "start" }}>
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Versions</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Multiple versions can use different templates + settings.
              </div>
            </div>
            <button type="button" className="btn" onClick={() => void createVersion()} disabled={busy || !profile}>
              {busy ? "Saving..." : "Save new version"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {versions.length ? (
              versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="btn"
                  style={{ justifyContent: "space-between" }}
                  onClick={() => {
                    setActiveId(v.id);
                    setTemplate(v.template);
                    setTitle(v.title ?? "");
                    setSettings(v.settings ?? defaultResumeSettings());
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{v.title || "Resume"}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {v.template}
                  </span>
                </button>
              ))
            ) : (
              <div className="muted">No generated versions yet. Choose a template + settings, then “Save new version”.</div>
            )}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--border)" }} />

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="label">Template</div>
              <select className="select" value={template} onChange={(e) => setTemplate(e.target.value as ResumeTemplate)}>
                {templateCatalog.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {templateMeta.description}
              </div>
            </div>

            <div>
              <div className="label">Version title</div>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SWE — ATS" />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Resume Settings</div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                These settings affect output only — profile data stays unchanged.
              </div>

              <div className="grid" style={{ gap: 10 }}>
                <div>
                  <div className="label">Density</div>
                  <select
                    className="select"
                    value={settings.density}
                    onChange={(e) => setSettings({ ...settings, density: e.target.value as any })}
                  >
                    <option value="COMPACT">Compact</option>
                    <option value="NORMAL">Normal</option>
                    <option value="SPACIOUS">Spacious</option>
                  </select>
                </div>

                <div>
                  <div className="label">Accent</div>
                  <select
                    className="select"
                    value={settings.accent}
                    onChange={(e) => setSettings({ ...settings, accent: e.target.value as any })}
                  >
                    <option value="ACCENT">Accent</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="MUTED">Muted</option>
                  </select>
                </div>

                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={settings.showSkillBars}
                    onChange={(e) => setSettings({ ...settings, showSkillBars: e.target.checked })}
                  />
                  <span>Enable skill bars</span>
                </label>

                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={settings.showCharts}
                    onChange={(e) => setSettings({ ...settings, showCharts: e.target.checked })}
                  />
                  <span>Enable charts</span>
                </label>

                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={settings.showTimeline}
                    onChange={(e) => setSettings({ ...settings, showTimeline: e.target.checked })}
                  />
                  <span>Enable timelines</span>
                </label>

                <button type="button" className="btn" onClick={() => void downloadPdf()} disabled={!profile}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            Live preview (A4)
          </div>
          <div ref={previewRef}>
            {effectiveSnapshot ? (
              <ResumePreview profile={effectiveSnapshot} template={template} settings={settings} />
            ) : (
              <div className="muted">Loading profile…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
