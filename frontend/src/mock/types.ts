export type Id = string;

export type UserRole = "JOB_SEEKER" | "RECRUITER";

export type ApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "REJECTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "HIRED";

export type Visibility = "PUBLIC" | "PRIVATE";

export type JobType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT";

export type EducationItem = {
  id: Id;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number | null;
  grade: string | null;
};

export type ExperienceItem = {
  id: Id;
  company: string;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  summary: string;
};

export type ProjectItem = {
  id: Id;
  name: string;
  link: string | null;
  summary: string;
  skills: string[];
};

export type CertificationItem = {
  id: Id;
  name: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string | null;
  credentialUrl: string | null;
};

export type AchievementItem = {
  id: Id;
  title: string;
  description: string;
  date: string | null;
};

export type LanguageItem = {
  id: Id;
  name: string;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
};

export type SkillProficiency = 1 | 2 | 3 | 4 | 5;

export type ResumeDensity = "COMPACT" | "NORMAL" | "SPACIOUS";

export type ResumeAccent = "ACCENT" | "NEUTRAL" | "MUTED";

export type ResumeSettings = {
  sectionOrder: Array<
    "SUMMARY" | "SKILLS" | "EXPERIENCE" | "PROJECTS" | "EDUCATION" | "CERTIFICATIONS" | "ACHIEVEMENTS" | "LANGUAGES"
  >;
  hiddenSections: Partial<Record<ResumeSettings["sectionOrder"][number], boolean>>;

  density: ResumeDensity;
  accent: ResumeAccent;
  showSkillBars: boolean;
  showCharts: boolean;
  showTimeline: boolean;
};

export type MockUser = {
  id: Id;
  email: string;
  password: string;
  role: UserRole;
  recruiterApprovalStatus?: "PENDING" | "APPROVED";
  createdAt: string;
};

export type Recruiter = {
  id: Id;
  userId: Id;
  companyName: string;
  website?: string;
  location?: string;
  description?: string;
};

export type JobSeeker = {
  id: Id;
  userId: Id;
  photoDataUrl?: string | null;
  fullName: string;
  phone: string | null;
  location: string | null;
  experienceYears: number;
  desiredRole: string | null;
  skills: string[];
  skillLevels?: Record<string, SkillProficiency>;
  headline?: string | null;
  about?: string | null;
  interests?: string[];
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  achievements?: AchievementItem[];
  languages?: LanguageItem[];
  isFresher: boolean;
  visibility: Visibility;
  activeGeneratedResumeId?: Id | null;
};

export type Job = {
  id: Id;
  recruiterId?: Id;
  title: string;
  companyName: string;
  location: string;
  role: string;
  requiredSkills: string[];
  jobType: JobType;
  minExperienceYears: number;
  description: string;
  openToFreshers: boolean;
  createdAt: string;
};

export type Application = {
  id: Id;
  jobId: Id;
  jobSeekerId: Id;
  status: ApplicationStatus;
  createdAt: string;
  interviewAt: string | null;
};

export type SavedJob = {
  id: Id;
  jobId: Id;
  jobSeekerId: Id;
  savedAt: string;
};

export type Resume = {
  id: Id;
  userId: Id;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ResumeTemplate =
  | "ATS_PLAIN"
  | "TECH_FOCUSED"
  | "EXECUTIVE"
  | "STARTUP"
  | "ACADEMIC"
  | "MODERN"
  | "CLASSIC"
  | "MINIMAL";

export type ResumeSnapshot = {
  photoDataUrl?: string | null;
  fullName: string;
  phone: string | null;
  location: string | null;
  headline?: string | null;
  about?: string | null;
  experienceYears: number;
  desiredRole: string | null;
  skills: string[];
  skillLevels?: Record<string, SkillProficiency>;
  interests?: string[];
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  achievements?: AchievementItem[];
  languages?: LanguageItem[];
  isFresher: boolean;
  visibility: Visibility;
};

export type GeneratedResume = {
  id: Id;
  userId: Id;
  template: ResumeTemplate;
  title: string;
  createdAt: string;
  snapshot: ResumeSnapshot;
  settings?: ResumeSettings;
  tags?: string[];
  performance?: {
    views: number;
    callbacks: number;
    lastViewedAt?: string | null;
  };
};

export type Notification = {
  id: Id;
  userId: Id;
  type: "APPLICATION" | "STATUS" | "INTERVIEW" | "SYSTEM";
  message: string;
  createdAt: string;
  isRead: boolean;
};

export type Trends = {
  topRoles: Array<{ label: string; value: number }>;
  industryHiring: Array<{ label: string; value: number }>;
  trendingSkills: Array<{ label: string; value: number }>;
  topCompanies: Array<{ label: string; value: number }>;
  growth: Array<{ label: string; value: number }>;
};

export type MockDb = {
  users: MockUser[];
  recruiters: Recruiter[];
  jobSeekers: JobSeeker[];
  jobs: Job[];
  applications: Application[];
  savedJobs: SavedJob[];
  resumes: Resume[];
  generatedResumes: GeneratedResume[];
  notifications: Notification[];
  trends: Trends;
};
