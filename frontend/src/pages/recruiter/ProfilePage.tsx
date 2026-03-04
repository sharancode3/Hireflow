import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { RecruiterProfile } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageSkeleton } from "../../components/ui/PageSkeleton";

export function RecruiterProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const data = await apiJson<{ profile: RecruiterProfile }>("/recruiter/profile", { token });
        setProfile(data.profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load company profile");
      }
    })();
  }, [token]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !profile) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const data = await apiJson<{ profile: RecruiterProfile }>("/recruiter/profile", {
        method: "PATCH", token,
        body: {
          companyName: profile.companyName,
          website: profile.website,
          location: profile.location,
          description: profile.description,
        },
      });
      setProfile(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update company profile");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors";
  const labelCls = "text-xs font-medium text-[var(--muted)] mb-1.5 block";

  if (!profile && !error) return <PageSkeleton rows={2} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Company Profile</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Keep your company information up to date.</p>
        </div>
        {saved && <Badge variant="teal" className="animate-fade-in-up">Saved</Badge>}
      </div>

      {error && <Card className="border-[var(--danger)]/30 p-4 text-sm text-[var(--danger)]">{error}</Card>}

      {profile && (
        <form onSubmit={onSave}>
          <Card className="p-6 space-y-5">
            {/* Company avatar */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-teal)]/10 flex items-center justify-center text-xl font-bold text-[var(--accent)]">
                {profile.companyName?.[0]?.toUpperCase() ?? "C"}
              </div>
              <div>
                <div className="text-base font-semibold text-[var(--text)]">{profile.companyName || "Company Name"}</div>
                <div className="text-xs text-[var(--muted)]">{profile.location || "Location not set"}</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Company Name</label>
                <input className={inputCls} value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input className={inputCls} value={profile.website ?? ""} onChange={(e) => setProfile({ ...profile, website: e.target.value || null })} placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Location</label>
                <input className={inputCls} value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value || null })} placeholder="San Francisco, CA" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] min-h-[120px] resize-y"
                value={profile.description ?? ""}
                onChange={(e) => setProfile({ ...profile, description: e.target.value || null })}
                placeholder="What your company does, your mission, and work culture..."
              />
            </div>

            <Button variant="primary" type="submit" loading={busy}>
              {busy ? "Saving..." : "Save Profile"}
            </Button>
          </Card>
        </form>
      )}
    </div>
  );
}
