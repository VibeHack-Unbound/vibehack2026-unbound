CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY NOT NULL,
  team_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  demo_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at);
