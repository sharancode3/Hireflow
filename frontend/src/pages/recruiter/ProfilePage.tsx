import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { RecruiterProfile } from "../../types";

export function RecruiterProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

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
    try {
      const data = await apiJson<{ profile: RecruiterProfile }>("/recruiter/profile", {
        method: "PATCH",
        token,
        body: {
          companyName: profile.companyName,
          website: profile.website,
          location: profile.location,
          description: profile.description,
        },
      });
      setProfile(data.profile);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update company profile");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return <div className="card">Loading...</div>;

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Company Profile</h2>
        <p className="muted" style={{ margin: 0 }}>
          Keep your company information up to date.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      <form className="card grid" onSubmit={onSave}>
        <div className="grid grid-2">
          <div className="field">
            <label className="label">Company name</label>
            <input
              className="input"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="label">Website</label>
            <input
              className="input"
              value={profile.website ?? ""}
              onChange={(e) => setProfile({ ...profile, website: e.target.value || null })}
              placeholder="https://..."
            />
          </div>

          <div className="field">
            <label className="label">Location</label>
            <input
              className="input"
              value={profile.location ?? ""}
              onChange={(e) => setProfile({ ...profile, location: e.target.value || null })}
              placeholder="City, State"
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            value={profile.description ?? ""}
            onChange={(e) => setProfile({ ...profile, description: e.target.value || null })}
            placeholder="What your company does..."
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
