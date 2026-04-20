CREATE TABLE Ensemble (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conductorId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Member (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  instrument TEXT,
  section TEXT,
  ensembleId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ensembleId) REFERENCES Ensemble(id) ON DELETE CASCADE
);

CREATE TABLE Score (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  composer TEXT,
  fileUrl TEXT NOT NULL,
  fileType TEXT NOT NULL,
  audioUrl TEXT,
  ensembleId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ensembleId) REFERENCES Ensemble(id) ON DELETE CASCADE
);

CREATE TABLE Measure (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  scoreId TEXT NOT NULL,
  startTime REAL,
  endTime REAL,
  FOREIGN KEY (scoreId) REFERENCES Score(id) ON DELETE CASCADE
);

CREATE TABLE Mark (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL,
  height REAL,
  page INTEGER NOT NULL,
  measureId TEXT,
  scoreId TEXT NOT NULL,
  creatorId TEXT NOT NULL,
  targetSection TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scoreId) REFERENCES Score(id) ON DELETE CASCADE,
  FOREIGN KEY (creatorId) REFERENCES Member(id)
);

CREATE TABLE Cue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  measureId TEXT NOT NULL,
  targetSection TEXT,
  audioUrl TEXT,
  bpm INTEGER,
  timeSignature TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (measureId) REFERENCES Measure(id) ON DELETE CASCADE
);

CREATE TABLE Rehearsal (
  id TEXT PRIMARY KEY,
  ensembleId TEXT NOT NULL,
  scoreId TEXT,
  startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  endedAt DATETIME,
  recordingUrl TEXT,
  FOREIGN KEY (ensembleId) REFERENCES Ensemble(id) ON DELETE CASCADE,
  FOREIGN KEY (scoreId) REFERENCES Score(id)
);

CREATE TABLE RehearsalEvent (
  id TEXT PRIMARY KEY,
  rehearsalId TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rehearsalId) REFERENCES Rehearsal(id) ON DELETE CASCADE
);

CREATE INDEX idx_member_ensemble ON Member(ensembleId);
CREATE INDEX idx_score_ensemble ON Score(ensembleId);
CREATE INDEX idx_measure_score ON Measure(scoreId);
CREATE INDEX idx_mark_score ON Mark(scoreId);
CREATE INDEX idx_rehearsal_ensemble ON Rehearsal(ensembleId);
