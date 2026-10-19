PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event TEXT NOT NULL,
  experiment_id TEXT NOT NULL,
  offer_version TEXT,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT NOT NULL,
  content TEXT NOT NULL,
  country TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (session_id, event, experiment_id)
);
CREATE INDEX IF NOT EXISTS events_report ON events(experiment_id, received_at);
CREATE INDEX IF NOT EXISTS events_retention ON events(received_at);

-- No email address, IP address, user agent or URL is stored here.
-- member_hash is a Mailchimp identifier and is still personal data.
CREATE TABLE IF NOT EXISTS leads (
  token_hash TEXT PRIMARY KEY,
  member_hash TEXT NOT NULL UNIQUE,
  experiment_id TEXT NOT NULL,
  session_id TEXT,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT NOT NULL,
  content TEXT NOT NULL,
  country TEXT NOT NULL,
  can_verify INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  intent TEXT CHECK (intent IN ('yes', 'maybe', 'no')),
  offer_version TEXT,
  price_cents INTEGER,
  intent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS leads_report ON leads(experiment_id, created_at);
CREATE INDEX IF NOT EXISTS leads_retention ON leads(created_at);

CREATE TABLE IF NOT EXISTS surveys (
  session_id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS surveys_retention ON surveys(submitted_at);
