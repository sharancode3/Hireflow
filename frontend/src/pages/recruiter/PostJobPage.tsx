import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { Job, JobType } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

function splitSkills(input: string) {
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

const ROLE_PRESETS = [
  {
    label: "Frontend Engineer",
    role: "Frontend Developer",
    title: "Frontend Engineer",
    skills: "React, TypeScript, CSS, Testing",
  },
  {
    label: "Backend Engineer",
    role: "Backend Developer",
    title: "Backend Engineer",
    skills: "Node.js, Express, SQL, REST APIs",
  },
  {
    label: "Product Designer",
    role: "UI/UX Designer",
    title: "Product Designer",
    skills: "Figma, UX Research, Wireframing, Prototyping",
  },
] as const;

const DRAFT_KEY = "hireflow_recruiter_post_job_draft";

export function RecruiterPostJobPage() {
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [openToFreshers, setOpenToFreshers] = useState(false);
  const [jobType, setJobType] = useState<JobType>("FULL_TIME");
  const [minExperienceYears, setMinExperienceYears] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<{
        title: string;
        location: string;
        role: string;
        skills: string;
        description: string;
        openToFreshers: boolean;
        jobType: JobType;
        minExperienceYears: number;
      }>;
      setTitle(parsed.title ?? "");
      setLocation(parsed.location ?? "");
      setRole(parsed.role ?? "");
      setSkills(parsed.skills ?? "");
      setDescription(parsed.description ?? "");
      setOpenToFreshers(parsed.openToFreshers ?? false);
      setJobType(parsed.jobType ?? "FULL_TIME");
      setMinExperienceYears(parsed.minExperienceYears ?? 0);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const parsedSkills = useMemo(() => splitSkills(skills), [skills]);
  const checklist = useMemo(
    () => [
      { ok: title.trim().length >= 4, label: "Role title is specific" },
      { ok: location.trim().length >= 2, label: "Location added" },
      { ok: role.trim().length >= 2, label: "Role category selected" },
      { ok: parsedSkills.length >= 4, label: "At least 4 required skills" },
      { ok: description.trim().length >= 60, label: "Job description is detailed" },
    ],
    [description, location, parsedSkills.length, role, title],
  );

  const readyToPost = checklist.every((x) => x.ok);

  function saveDraft() {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title,
        location,
        role,
        skills,
        description,
        openToFreshers,
        jobType,
        minExperienceYears,
      }),
    );
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  function applyPreset(index: number) {
    const preset = ROLE_PRESETS[index];
    if (!preset) return;
    setTitle(preset.title);
    setRole(preset.role);
    setSkills(preset.skills);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setCreatedJob(null);
    try {
      const data = await apiJson<{ job: Job }>("/recruiter/jobs", {
        method: "POST",
        token,
        body: {
          title, location, role,
          requiredSkills: splitSkills(skills),
          jobType, minExperienceYears, description, openToFreshers,
        },
      });
      setCreatedJob(data.job);
      clearDraft();
      setTitle(""); setLocation(""); setRole(""); setSkills("");
      setDescription(""); setOpenToFreshers(false);
      setJobType("FULL_TIME"); setMinExperienceYears(0);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to post job");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors";
  const labelCls = "text-xs font-medium text-[var(--muted)] mb-1.5 block";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Post a Job</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Create an opening, save drafts, and publish when quality checks are met.</p>
      </div>

      <Card className="p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Role presets</div>
        <div className="flex flex-wrap gap-2">
          {ROLE_PRESETS.map((preset, idx) => (
            <button key={preset.label} type="button" className="btn" onClick={() => applyPreset(idx)}>
              Use {preset.label}
            </button>
          ))}
        </div>
      </Card>

      {error && <Card className="border-[var(--danger)]/30 p-4 text-sm text-[var(--danger)]">{error}</Card>}

      {createdJob && (
        <Card className="border-[var(--accent-teal)]/30 p-5 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Badge variant="teal">Posted</Badge>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{createdJob.title}</div>
              <div className="text-xs text-[var(--muted)]">{createdJob.companyName} &middot; {createdJob.location}</div>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={onSubmit}>
        <Card className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Job Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Senior Frontend Engineer" />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="San Francisco, CA" />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} required placeholder="Frontend Developer" />
            </div>
            <div>
              <label className={labelCls}>Required Skills</label>
              <input className={inputCls} value={skills} onChange={(e) => setSkills(e.target.value)} required placeholder="React, TypeScript, Node.js" />
              <div className="mt-1 text-[11px] text-[var(--muted)]">Tip: add comma-separated must-have skills.</div>
            </div>
            <div>
              <label className={labelCls}>Job Type</label>
              <select className={inputCls} value={jobType} onChange={(e) => setJobType(e.target.value as JobType)}>
                <option value="FULL_TIME">Full-time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="CONTRACT">Contract</option>
                <option value="PART_TIME">Part-time</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Min Experience (years)</label>
              <input className={inputCls} type="number" min={0} max={60} value={minExperienceYears} onChange={(e) => setMinExperienceYears(Number(e.target.value))} required />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors min-h-[120px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe the role, responsibilities, and what you're looking for..."
            />
            <div className="mt-1 text-[11px] text-[var(--muted)]">{description.trim().length} characters</div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input type="checkbox" checked={openToFreshers} onChange={(e) => setOpenToFreshers(e.target.checked)} className="accent-[var(--accent)]" />
            <span className="text-sm text-[var(--text-secondary)]">Open to Freshers</span>
          </label>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Publishing Checklist</div>
              <div className="grid gap-1">
                {checklist.map((item) => (
                  <div key={item.label} className="text-xs" style={{ color: item.ok ? "#22c55e" : "var(--text-secondary)" }}>
                    {item.ok ? "OK" : "TODO"} - {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" type="button" onClick={saveDraft}>Save Draft</Button>
              <Button variant="secondary" type="button" onClick={clearDraft}>Clear Draft</Button>
              <Button variant="primary" type="submit" loading={busy} disabled={!readyToPost && !busy}>
                {busy ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
