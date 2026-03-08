-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "requiredSkillsCsv" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "openToFreshers" BOOLEAN NOT NULL DEFAULT false,
    "jobType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "minExperienceYears" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "adminFeedback" TEXT,
    "reviewedAt" DATETIME,
    "applicationDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "RecruiterProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("companyName", "createdAt", "description", "id", "location", "openToFreshers", "recruiterId", "requiredSkillsCsv", "role", "title", "updatedAt") SELECT "companyName", "createdAt", "description", "id", "location", "openToFreshers", "recruiterId", "requiredSkillsCsv", "role", "title", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
