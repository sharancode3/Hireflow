import type {
  Application,
  GeneratedResume,
  Job,
  JobSeeker,
  MockDb,
  MockUser,
  Notification,
  Recruiter,
  Resume,
  SavedJob,
  SkillProficiency,
  Trends,
} from "./types";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string, n: number) {
  return `${prefix}_${n.toString().padStart(4, "0")}`;
}

const skillsPool = [
  "React",
  "TypeScript",
  "Node.js",
  "Express",
  "SQL",
  "MongoDB",
  "Java",
  "Python",
  "Django",
  "Flask",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "Figma",
  "UI Design",
  "Data Analysis",
  "Power BI",
  "Excel",
  "Communication",
  "DSA",
  "Next.js",
  "Tailwind",
  "Testing",
];

const locations = ["Bengaluru", "Hyderabad", "Pune", "Chennai", "Delhi", "Mumbai", "Remote"];

const companyNames = [
  "BlueWave Labs",
  "NovaHire",
  "Nimbus Systems",
  "VertexWorks",
  "CoralTech",
  "AstraSoft",
  "BrightBridge",
  "SigmaStack",
  "Riverstone AI",
  "Orbit FinTech",
  "CloudCrest",
  "HarborWorks",
  "Zenith Digital",
  "LumenStack",
  "Evergreen Systems",
  "Pulseware",
  "Cobalt Analytics",
  "Skyline Software",
  "Ironwood Tech",
  "Keystone Studios",
  "Sequoia Labs",
  "Aurora Products",
  "Mosaic Ventures",
  "AnchorPoint",
  "DeltaByte",
];

const domains = ["Software", "Data", "Design", "Marketing", "Finance", "Operations", "HR"];

const jobTypes = ["FULL_TIME", "INTERNSHIP", "CONTRACT", "PART_TIME"] as const;

const RECRUITER_COUNT = 130; // prior 30 (+100)
const JOB_SEEKER_COUNT = 220; // prior 120 (+100)

const roleTitles = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "UI/UX Designer",
  "Product Analyst",
  "Marketing Associate",
  "HR Associate",
  "Operations Executive",
];

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length] as T;
}

function pickMany<T>(arr: readonly T[], count: number, seed: number) {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(arr[(seed + i * 7) % arr.length]);
  }
  return Array.from(new Set(out));
}

export function createSeedDb(): MockDb {
  const users: MockUser[] = [];
  const recruiters: Recruiter[] = [];
  const jobSeekers: JobSeeker[] = [];
  const jobs: Job[] = [];
  const applications: Application[] = [];
  const savedJobs: SavedJob[] = [];
  const resumes: Resume[] = [];
  const generatedResumes: GeneratedResume[] = [];
  const notifications: Notification[] = [];

  // Recruiters
  for (let i = 1; i <= RECRUITER_COUNT; i++) {
    const userId = id("usr_r", i);
    const recruiterId = id("rec", i);
    const companyName = companyNames[i - 1] ?? `Hireflow Partner ${i}`;
    const location = pick(locations, i * 3);

    users.push({
      id: userId,
      email: `recruiter${i}@hireflow.demo`,
      password: "Password123!",
      role: "RECRUITER",
      recruiterApprovalStatus: "APPROVED",
      createdAt: nowIso(),
    });

    recruiters.push({
      id: recruiterId,
      userId,
      companyName,
      website: `https://${companyName.toLowerCase().replace(/\s+/g, "")}.example`,
      location,
      description: `${companyName} hires early-career talent and experienced professionals across ${pick(domains, i)} roles.`,
    });
  }

  // Job seekers
  for (let i = 1; i <= JOB_SEEKER_COUNT; i++) {
    const userId = id("usr_s", i);
    const seekerId = id("js", i);
    const location = pick(locations, i);
    const baseSkills = pickMany(skillsPool, 6, i * 11);

    const fullName = `Student ${i}`;
    const experienceYears = i % 6 === 0 ? 2 : i % 4 === 0 ? 1 : 0;
    const isFresher = experienceYears === 0;
    const desiredRole = pick(roleTitles, i * 3);

    users.push({
      id: userId,
      email: `seeker${i}@hireflow.demo`,
      password: "Password123!",
      role: "JOB_SEEKER",
      createdAt: nowIso(),
    });

    jobSeekers.push({
      id: seekerId,
      userId,
      photoDataUrl: null,
      fullName,
      phone: i % 5 === 0 ? `+91 98${(10000000 + i).toString().slice(0, 8)}` : null,
      location: location === "Remote" ? "Remote" : location,
      experienceYears,
      desiredRole,
      skills: baseSkills,
      skillLevels: Object.fromEntries(baseSkills.map((s, idx) => [s, ((idx % 5) + 1) as SkillProficiency])),
      headline: isFresher ? `Aspiring ${desiredRole}` : `${desiredRole} • ${experienceYears}+ yrs`,
      about:
        isFresher
          ? "Motivated candidate building strong fundamentals and real projects. Open to internships and entry-level roles."
          : "Results-driven professional with experience shipping features, collaborating cross-functionally, and learning fast.",
      interests: ["Open-source", "Startups", "Productivity"],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      achievements: [],
      languages: [{ id: id("lng", i), name: "English", proficiency: "ADVANCED" }],
      isFresher,
      visibility: i % 7 === 0 ? "PRIVATE" : "PUBLIC",
      activeGeneratedResumeId: null,
    });

    if (i % 6 === 0) {
      resumes.push({
        id: id("res", resumes.length + 1),
        userId,
        originalName: `Resume_Student_${i}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 120_000 + (i % 10) * 15_000,
        createdAt: nowIso(),
      });
    }
  }

  // Jobs (multiple domains) — about 100
  let jobIdCounter = 1;
  for (let r = 1; r <= recruiters.length; r++) {
    const recruiter = recruiters[r - 1];
    const jobsForRecruiter = 4;

    for (let j = 0; j < jobsForRecruiter; j++) {
      const title = pick(roleTitles, r * 5 + j);
      const domain = pick(domains, r + j);
      const location = pick(locations, r * 2 + j);
      const openToFreshers = (r + j) % 2 === 0;
      const requiredSkills = pickMany(skillsPool, openToFreshers ? 5 : 7, r * 9 + j);
      const jobType = pick(jobTypes, r * 11 + j);
      const minExperienceYears = openToFreshers ? 0 : ((r + j) % 4) + 1;

      jobs.push({
        id: id("job", jobIdCounter++),
        recruiterId: recruiter.id,
        companyName: recruiter.companyName,
        title,
        role: title,
        location,
        requiredSkills,
        jobType,
        minExperienceYears,
        description:
          `We’re hiring for ${title} in ${domain}. You will collaborate with cross-functional teams, learn fast, and ship high-quality work. Strong fundamentals and clear communication are valued.`,
        openToFreshers,
        createdAt: nowIso(),
      });
    }
  }

  // Applications (~520) + notifications
  let appCounter = 1;
  const statuses: Application["status"][] = ["APPLIED", "SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED"];

  for (let i = 0; i < 520; i++) {
    const seeker = jobSeekers[(i * 13) % jobSeekers.length];
    const job = jobs[(i * 7) % jobs.length];

    const status = statuses[i % statuses.length];
    const application: Application = {
      id: id("app", appCounter++),
      jobId: job.id,
      jobSeekerId: seeker.id,
      status,
      createdAt: nowIso(),
      interviewAt: status === "INTERVIEW_SCHEDULED" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
    };

    applications.push(application);

    // seeker notifications
    notifications.push({
      id: id("ntf", notifications.length + 1),
      userId: seeker.userId,
      type: status === "INTERVIEW_SCHEDULED" ? "INTERVIEW" : "STATUS",
      message:
        status === "APPLIED"
          ? `Application submitted for ${job.title} at ${job.companyName}.`
          : status === "SHORTLISTED"
            ? `You were shortlisted for ${job.title} at ${job.companyName}.`
            : status === "REJECTED"
              ? `Update: ${job.companyName} decided to proceed with other candidates for ${job.title}.`
              : `Interview scheduled for ${job.title} at ${job.companyName}.`,
      createdAt: nowIso(),
      isRead: i % 3 === 0,
    });
  }

  // Saved jobs (~420)
  let savedCounter = 1;
  for (let i = 0; i < 420; i++) {
    const seeker = jobSeekers[(i * 17) % jobSeekers.length];
    const job = jobs[(i * 19) % jobs.length];
    savedJobs.push({ id: id("sav", savedCounter++), jobId: job.id, jobSeekerId: seeker.id, savedAt: nowIso() });
  }

  const trends: Trends = {
    topRoles: [
      { label: "Frontend Developer", value: 38 },
      { label: "Software Engineer", value: 34 },
      { label: "Data Analyst", value: 26 },
      { label: "UI/UX Designer", value: 18 },
      { label: "Backend Developer", value: 22 },
    ],
    industryHiring: [
      { label: "IT Services", value: 42 },
      { label: "FinTech", value: 18 },
      { label: "EdTech", value: 14 },
      { label: "Healthcare", value: 10 },
      { label: "Retail", value: 16 },
    ],
    trendingSkills: [
      { label: "React", value: 44 },
      { label: "TypeScript", value: 36 },
      { label: "SQL", value: 28 },
      { label: "AWS", value: 22 },
      { label: "Figma", value: 18 },
    ],
    topCompanies: companyNames.slice(0, 6).map((c, idx) => ({ label: c, value: 40 - idx * 4 })),
    growth: [
      { label: "Jan", value: 12 },
      { label: "Feb", value: 14 },
      { label: "Mar", value: 18 },
      { label: "Apr", value: 20 },
      { label: "May", value: 24 },
      { label: "Jun", value: 28 },
    ],
  };

  return {
    users,
    recruiters,
    jobSeekers,
    jobs,
    applications,
    savedJobs,
    resumes,
    generatedResumes,
    notifications,
    trends,
  };
}
