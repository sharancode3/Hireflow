-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobSeekerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "skillsCsv" TEXT NOT NULL DEFAULT '',
    "desiredRole" TEXT,
    "isFresher" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobSeekerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JobSeekerProfile" ("createdAt", "desiredRole", "fullName", "id", "isFresher", "location", "phone", "skillsCsv", "updatedAt", "userId", "visibility") SELECT "createdAt", "desiredRole", "fullName", "id", "isFresher", "location", "phone", "skillsCsv", "updatedAt", "userId", "visibility" FROM "JobSeekerProfile";
DROP TABLE "JobSeekerProfile";
ALTER TABLE "new_JobSeekerProfile" RENAME TO "JobSeekerProfile";
CREATE UNIQUE INDEX "JobSeekerProfile_userId_key" ON "JobSeekerProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
