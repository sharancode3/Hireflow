import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { completeOnboarding } from "../auth/onboarding";

const statusOptions = ["Student", "Fresher / Entry Level", "Working Professional", "Career Transition", "Other"];
const lookingFor = ["Full-time job", "Part-time job", "Internship", "Freelance", "Remote only"];
const availability = ["Immediately", "Within 2 weeks", "Within a month", "Not actively looking"];

function addTag(list: string[], value: string) {
  const clean = value.trim();
  if (!clean) return list;
  if (list.includes(clean)) return list;
  return [...list, clean];
}

export function OnboardingPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [dob, setDob] = useState("");

  const [desiredRole, setDesiredRole] = useState("");
  const [status, setStatus] = useState(statusOptions[0]);
  const [experienceYears, setExperienceYears] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [preferences, setPreferences] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [currency, setCurrency] = useState("INR");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [availabilityValue, setAvailabilityValue] = useState(availability[0]);

  const progress = useMemo(() => Math.round((step / 3) * 100), [step]);

  function onSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      setSkills((prev) => addTag(prev, skillInput));
      setSkillInput("");
    }
  }

  function onLocationKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      setPreferredLocations((prev) => addTag(prev, locationInput));
      setLocationInput("");
    }
  }

  async function finish() {
    if (!user) return;
    if (user.role === "JOB_SEEKER" && token) {
      const payload = {
        fullName: fullName || user.email.split("@")[0],
        phone,
        location: `${city}${region ? `, ${region}` : ""}`,
        desiredRole,
        experienceYears,
        skills,
      };
      await apiJson("/job-seeker/profile", { method: "PATCH", token, body: payload });
    }

    completeOnboarding(user.id);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="text-3xl font-bold text-white">You are all set! Welcome to Hireflow.</h1>
          <button
            type="button"
            onClick={() => navigate(user?.role === "JOB_SEEKER" ? "/job-seeker" : "/recruiter")}
            className="btn-base mt-6 h-11 rounded-lg px-6 font-semibold text-white"
            style={{ background: "linear-gradient(120deg, #1A73E8, #0D47A1)" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-4 text-text sm:p-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-3 h-2 w-full rounded-full bg-[#1A1A1A]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1A73E8] to-[#0D47A1]" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Step {step} of 3</div>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Personal details</h2>
            <input className="input" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="text-xs text-text-muted">Looks better with a photo! (Photo upload will be added in next milestone.)</div>
            <input className="input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input" placeholder="State / Region" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Career profile</h2>
            <input className="input" placeholder="Desired job role" value={desiredRole} onChange={(e) => setDesiredRole(e.target.value)} />
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Math.max(0, Number(e.target.value)))}
              placeholder="Years of experience"
            />
            <div>
              <input
                className="input"
                placeholder="Primary skills (press Enter)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={onSkillKeyDown}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="rounded-full bg-[rgba(26,115,232,0.2)] px-3 py-1 text-xs text-[#8AB4F8]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Placement / opportunity preferences</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {lookingFor.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={preferences.includes(item)}
                    onChange={(e) =>
                      setPreferences((prev) =>
                        e.target.checked ? [...prev, item] : prev.filter((x) => x !== item),
                      )
                    }
                  />
                  {item}
                </label>
              ))}
            </div>
            <div>
              <input
                className="input"
                placeholder="Preferred locations (press Enter)"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={onLocationKeyDown}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {preferredLocations.map((s) => (
                  <span key={s} className="rounded-full bg-[rgba(92,107,192,0.2)] px-3 py-1 text-xs text-[#B1B8ED]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
              <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
              <input className="input" type="number" placeholder="Min" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
              <input className="input" type="number" placeholder="Max" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </div>
            <select className="select" value={availabilityValue} onChange={(e) => setAvailabilityValue(e.target.value)}>
              {availability.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-base rounded-lg border border-border px-4 text-text-secondary disabled:opacity-50"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="btn-base rounded-lg px-5 font-semibold text-white"
              style={{ background: "linear-gradient(120deg, #1A73E8, #0D47A1)" }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void finish()}
              className="btn-base rounded-lg px-5 font-semibold text-white"
              style={{ background: "linear-gradient(120deg, #1A73E8, #0D47A1)" }}
            >
              Finish setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
