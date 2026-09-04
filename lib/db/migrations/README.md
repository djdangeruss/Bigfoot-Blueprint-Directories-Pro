# Database migrations

Migrations are append-only production changes. Apply them in filename order to
a verified backup or staging restore before production. Never edit a migration
that has already been recorded by the migration runner.

The owner-session migration intentionally invalidates prototype owner sessions
when upgrading the original plaintext-token table. Owner passwords and claims
are preserved.
