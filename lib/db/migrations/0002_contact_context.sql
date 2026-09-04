-- Additive context fields for corrections, rights, accessibility, and privacy
-- requests. Existing generic contact records remain valid.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS message text;
