-- CreateTable
CREATE TABLE "Ensemble" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "conductorId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "instrument" TEXT,
    "section" TEXT,
    "ensembleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_ensembleId_fkey" FOREIGN KEY ("ensembleId") REFERENCES "Ensemble" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "composer" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "audioUrl" TEXT,
    "ensembleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Score_ensembleId_fkey" FOREIGN KEY ("ensembleId") REFERENCES "Ensemble" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "scoreId" TEXT NOT NULL,
    "startTime" REAL,
    "endTime" REAL,
    CONSTRAINT "Measure_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL,
    "height" REAL,
    "page" INTEGER NOT NULL,
    "measureId" TEXT,
    "scoreId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "targetSection" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mark_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mark_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "measureId" TEXT NOT NULL,
    "targetSection" TEXT,
    "audioUrl" TEXT,
    "bpm" INTEGER,
    "timeSignature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cue_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "Measure" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rehearsal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ensembleId" TEXT NOT NULL,
    "scoreId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "recordingUrl" TEXT,
    CONSTRAINT "Rehearsal_ensembleId_fkey" FOREIGN KEY ("ensembleId") REFERENCES "Ensemble" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RehearsalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RehearsalEvent_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
