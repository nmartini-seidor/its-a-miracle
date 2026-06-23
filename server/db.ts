import { mkdirSync } from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"

// SQLite-backed local state (ADR 0003): a single portable file with ACID multi-process
// safety, so the long-lived Worker (ADR 0001) and the Next server can both read/write
// state without the corruption a shared JSON file suffers. Deliberately NOT the Supabase
// migration, which stays unwired until the hosted multi-user product.

export type SqliteDatabase = Database.Database

function resolveDbPath() {
  if (process.env.DEMO_DB_PATH) return process.env.DEMO_DB_PATH
  // Per-process isolation for the test runner so test files can run concurrently
  // (retiring the old --test-concurrency=1 constraint) without sharing one db file.
  if (process.env.DEMO_DB_ISOLATE) {
    return path.join(process.cwd(), "data", ".test-dbs", `demo-${process.pid}.sqlite`)
  }
  return path.join(process.cwd(), "data", "demo.sqlite")
}

let dbInstance: SqliteDatabase | null = null

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS research_jobs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runner_runs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  runner TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS review_decisions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_research_jobs_product ON research_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_runner_runs_job ON runner_runs(job_id);
CREATE INDEX IF NOT EXISTS idx_runner_runs_product ON runner_runs(product_id);
`

export function getDb(): SqliteDatabase {
  if (dbInstance) return dbInstance
  const dbPath = resolveDbPath()
  mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  // WAL gives concurrent readers + a single writer across processes; the busy timeout
  // makes a writer wait for the lock instead of throwing SQLITE_BUSY immediately.
  db.pragma("journal_mode = WAL")
  db.pragma("busy_timeout = 5000")
  db.pragma("foreign_keys = ON")
  db.exec(SCHEMA)
  dbInstance = db
  return db
}

// Wrap a read-modify-write in an IMMEDIATE transaction so concurrent writers serialize
// on the write lock at BEGIN rather than mid-mutation (avoids lost updates within scope).
export function transaction<T>(fn: (db: SqliteDatabase) => T): T {
  const db = getDb()
  const run = db.transaction(fn as (db: SqliteDatabase) => T)
  return run.immediate(db)
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
