BEGIN;

CREATE TABLE IF NOT EXISTS owners (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE owners ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE owners ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS owners_email_lower_unique ON owners (lower(email));

CREATE TABLE IF NOT EXISTS owner_sessions (
  id serial PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  owner_id integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'owner_sessions' AND column_name = 'token'
  ) THEN
    TRUNCATE TABLE owner_sessions;
    ALTER TABLE owner_sessions DROP CONSTRAINT IF EXISTS owner_sessions_pkey;
    ALTER TABLE owner_sessions RENAME COLUMN token TO token_hash;
    ALTER TABLE owner_sessions ADD COLUMN IF NOT EXISTS id serial;
    ALTER TABLE owner_sessions ADD PRIMARY KEY (id);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS owner_sessions_token_hash_unique ON owner_sessions (token_hash);
CREATE INDEX IF NOT EXISTS owner_sessions_owner_idx ON owner_sessions (owner_id);
CREATE INDEX IF NOT EXISTS owner_sessions_expires_idx ON owner_sessions (expires_at);

CREATE TABLE IF NOT EXISTS claims (
  id serial PRIMARY KEY,
  entry_id integer NOT NULL,
  owner_id integer NOT NULL,
  business_email text NOT NULL,
  phone text,
  message text,
  method text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by integer,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS claims_entry_idx ON claims (entry_id);
CREATE INDEX IF NOT EXISTS claims_owner_idx ON claims (owner_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims (status);
CREATE UNIQUE INDEX IF NOT EXISTS claims_one_pending_per_owner_entry ON claims (entry_id, owner_id) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS claims_one_approved_owner_per_entry ON claims (entry_id) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id serial PRIMARY KEY,
  entry_id integer NOT NULL,
  owner_id integer NOT NULL,
  requested_tier text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by integer,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE upgrade_requests ADD COLUMN IF NOT EXISTS reviewed_by integer;
ALTER TABLE upgrade_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE upgrade_requests ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE upgrade_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS upgrade_requests_entry_idx ON upgrade_requests (entry_id);
CREATE INDEX IF NOT EXISTS upgrade_requests_status_idx ON upgrade_requests (status);
CREATE UNIQUE INDEX IF NOT EXISTS upgrade_one_pending_per_owner_entry ON upgrade_requests (entry_id, owner_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS owner_audit_events (
  id serial PRIMARY KEY,
  owner_id integer,
  entry_id integer,
  actor_type text NOT NULL,
  actor_id integer,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS owner_audit_owner_idx ON owner_audit_events (owner_id);
CREATE INDEX IF NOT EXISTS owner_audit_entry_idx ON owner_audit_events (entry_id);
CREATE INDEX IF NOT EXISTS owner_audit_created_idx ON owner_audit_events (created_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'owner_sessions_owner_fk') THEN
    ALTER TABLE owner_sessions ADD CONSTRAINT owner_sessions_owner_fk FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'claims_entry_fk') THEN
    ALTER TABLE claims ADD CONSTRAINT claims_entry_fk FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'claims_owner_fk') THEN
    ALTER TABLE claims ADD CONSTRAINT claims_owner_fk FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'upgrade_requests_entry_fk') THEN
    ALTER TABLE upgrade_requests ADD CONSTRAINT upgrade_requests_entry_fk FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'upgrade_requests_owner_fk') THEN
    ALTER TABLE upgrade_requests ADD CONSTRAINT upgrade_requests_owner_fk FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'owner_audit_events_owner_fk') THEN
    ALTER TABLE owner_audit_events ADD CONSTRAINT owner_audit_events_owner_fk FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'owner_audit_events_entry_fk') THEN
    ALTER TABLE owner_audit_events ADD CONSTRAINT owner_audit_events_entry_fk FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
