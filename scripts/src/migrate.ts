import crypto from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const apply = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.resolve(here, "../../lib/db/migrations");
const files = (await readdir(migrationDir)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
const client = new pg.Client({ connectionString: databaseUrl });

await client.connect();
try {
  await client.query("SELECT pg_advisory_lock($1)", [92817431]);
  const tableExists = await client.query<{ exists: boolean }>(
    "SELECT to_regclass('public.directory_schema_migrations') IS NOT NULL AS exists",
  );
  const recorded = new Map<string, string>();
  if (tableExists.rows[0]?.exists) {
    const rows = await client.query<{ filename: string; sha256: string }>("SELECT filename, sha256 FROM directory_schema_migrations ORDER BY filename");
    for (const row of rows.rows) recorded.set(row.filename, row.sha256);
  }

  const pending: Array<{ filename: string; sql: string; sha256: string }> = [];
  for (const filename of files) {
    const sql = await readFile(path.join(migrationDir, filename), "utf8");
    const sha256 = crypto.createHash("sha256").update(sql).digest("hex");
    const previous = recorded.get(filename);
    if (previous && previous !== sha256) throw new Error(`Applied migration changed: ${filename}`);
    if (!previous) pending.push({ filename, sql, sha256 });
  }

  if (!apply) {
    console.log(JSON.stringify({ mode: "check", applied: recorded.size, pending: pending.map((item) => item.filename) }, null, 2));
    if (pending.length) process.exitCode = 2;
  } else {
    await client.query(`CREATE TABLE IF NOT EXISTS directory_schema_migrations (
      filename text PRIMARY KEY,
      sha256 text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    for (const migration of pending) {
      await client.query(migration.sql);
      await client.query("INSERT INTO directory_schema_migrations (filename, sha256) VALUES ($1, $2)", [migration.filename, migration.sha256]);
      console.log(`applied ${migration.filename}`);
    }
    console.log(JSON.stringify({ mode: "apply", appliedNow: pending.length, total: recorded.size + pending.length }, null, 2));
  }
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [92817431]).catch(() => undefined);
  await client.end();
}
