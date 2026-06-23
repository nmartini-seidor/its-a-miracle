import { getDb, transaction, type SqliteDatabase } from "./db.ts"
import { aggregators, demoSettings, products as seededProducts, schemas } from "../lib/fixtures.ts"
import { getFieldLabel, isExportableAttributeField } from "../lib/demo-contract.ts"
import { RESEARCH_RUNNER_IDS } from "../lib/research-contract.ts"
import { mergeRunnerRuns, type RunnerOutputForMerge } from "./research-merge.ts"
import { qualityScore } from "../lib/scoring.ts"
import type {
  AttributeFieldId,
  CandidateRecord,
  ContractFieldId,
  AggregatorDefinition,
  EvidenceRecord,
  ExportPreview,
  SettingsSnapshot,
  ProductRecord,
  ResearchJob,
  ResearchJobStatus,
  ReviewDecision,
  RunnerRun,
  SchemaDefinition,
} from "../lib/types.ts"

type ReviewDecisionRecord = {
  id: string
  candidateId: string
  decision: ReviewDecision
  reason?: string
  createdAt: string
}

type StoredResearchJob = ResearchJob

// A Runner Run as persisted in the runner_runs table. `validated` holds the trusted
// EvidenceRecord[] + CandidateRecord[] this run produced (the only thing the worker ingests),
// kept per-run until the Job is finalized and the runs are merged onto the product.
type StoredRunnerRun = RunnerRun & {
  validated?: { evidence: EvidenceRecord[]; candidates: CandidateRecord[] }
}

type DemoCatalogState = {
  products: ProductRecord[]
  researchRuns: StoredResearchJob[]
  reviewDecisions: ReviewDecisionRecord[]
  settings: SettingsSnapshot
  schemaOverrides: Record<string, SchemaDefinition>
  aggregatorOverrides: Record<string, AggregatorDefinition>
}

function readKv<T>(db: SqliteDatabase, key: string): T | null {
  const row = db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | undefined
  return row ? (JSON.parse(row.value) as T) : null
}

function writeKv(db: SqliteDatabase, key: string, value: unknown) {
  db.prepare("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(
    key,
    JSON.stringify(value),
  )
}

function now() {
  return new Date().toISOString()
}

function cloneDefaultSettings() {
  return structuredClone(demoSettings)
}

function sanitizeSettings(settings: Partial<SettingsSnapshot> = {}): SettingsSnapshot {
  const allowedAggregatorIds = new Set(aggregators.map((aggregator) => aggregator.id))
  const enabledAggregatorIds = settings.enabledAggregatorIds?.filter((id) => allowedAggregatorIds.has(id))

  return {
    ...cloneDefaultSettings(),
    ...settings,
    environment: "demo",
    miraklBaseUrl: settings.miraklBaseUrl?.trim() || demoSettings.miraklBaseUrl,
    fakeResearchMode: typeof settings.fakeResearchMode === "boolean" ? settings.fakeResearchMode : demoSettings.fakeResearchMode,
    defaultResearchDelaySeconds: clampNumber(settings.defaultResearchDelaySeconds, 5, 300, demoSettings.defaultResearchDelaySeconds),
    maxEvidencePerProduct: clampNumber(settings.maxEvidencePerProduct, 1, 10, demoSettings.maxEvidencePerProduct),
    defaultCandidateConfidence: settings.defaultCandidateConfidence ?? demoSettings.defaultCandidateConfidence,
    autoAssignSchemaByCategory:
      typeof settings.autoAssignSchemaByCategory === "boolean" ? settings.autoAssignSchemaByCategory : demoSettings.autoAssignSchemaByCategory,
    enabledAggregatorIds: enabledAggregatorIds ?? cloneDefaultSettings().enabledAggregatorIds,
  }
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function cloneImportedProducts() {
  return structuredClone(seededProducts).map((product) => ({
    ...product,
    bestEvidenceByField: {},
    candidates: [],
    evidence: [],
  }))
}

function buildInitialState(
  settings: SettingsSnapshot = cloneDefaultSettings(),
  schemaOverrides: Record<string, SchemaDefinition> = {},
  aggregatorOverrides: Record<string, AggregatorDefinition> = {},
): DemoCatalogState {
  return {
    products: cloneImportedProducts(),
    researchRuns: [],
    reviewDecisions: [],
    settings,
    schemaOverrides,
    aggregatorOverrides,
  }
}

function buildEmptyState(
  settings: SettingsSnapshot = cloneDefaultSettings(),
  schemaOverrides: Record<string, SchemaDefinition> = {},
  aggregatorOverrides: Record<string, AggregatorDefinition> = {},
): DemoCatalogState {
  return {
    products: [],
    researchRuns: [],
    reviewDecisions: [],
    settings,
    schemaOverrides,
    aggregatorOverrides,
  }
}

// On the first-ever access of a fresh database, seed the full catalog — mirroring the old
// behaviour where the JSON file was created with buildInitialState() on demand. Keyed on the
// presence of the "settings" kv row so that an explicit resetDemoState() (which leaves an
// empty product set but a settings row) is never re-seeded behind the operator's back.
function ensureInitialized() {
  const db = getDb()
  const hasSettings = db.prepare("SELECT 1 FROM kv WHERE key = 'settings'").get()
  if (!hasSettings) writeState(buildInitialState())
}

function readState(): DemoCatalogState {
  ensureInitialized()
  const db = getDb()
  const productRows = db.prepare("SELECT data FROM products ORDER BY rowid").all() as { data: string }[]
  const jobRows = db.prepare("SELECT data FROM research_jobs ORDER BY rowid").all() as { data: string }[]
  const decisionRows = db.prepare("SELECT data FROM review_decisions ORDER BY rowid").all() as { data: string }[]
  return {
    products: productRows.map((row) => JSON.parse(row.data) as ProductRecord),
    researchRuns: jobRows.map((row) => JSON.parse(row.data) as StoredResearchJob),
    reviewDecisions: decisionRows.map((row) => JSON.parse(row.data) as ReviewDecisionRecord),
    settings: sanitizeSettings(readKv<SettingsSnapshot>(db, "settings") ?? undefined),
    schemaOverrides: readKv<Record<string, SchemaDefinition>>(db, "schemaOverrides") ?? {},
    aggregatorOverrides: readKv<Record<string, AggregatorDefinition>>(db, "aggregatorOverrides") ?? {},
  }
}

// Full-state mirror of the catalog into SQLite within a single IMMEDIATE transaction — the
// atomic equivalent of the old tmp-file rename, but corruption-safe across processes. Does
// NOT touch runner_runs: those are owned by the Worker's scoped ingestion path (Phase 3), so
// a server-side mutation here must never clobber runs written concurrently by the Worker.
function writeState(state: DemoCatalogState) {
  transaction((db) => {
    db.prepare("DELETE FROM products").run()
    const insertProduct = db.prepare("INSERT INTO products (id, data) VALUES (?, ?)")
    for (const product of state.products) insertProduct.run(product.id, JSON.stringify(product))

    db.prepare("DELETE FROM research_jobs").run()
    const insertJob = db.prepare("INSERT INTO research_jobs (id, product_id, status, created_at, data) VALUES (?, ?, ?, ?, ?)")
    for (const job of state.researchRuns) insertJob.run(job.id, job.productId, job.status, job.createdAt, JSON.stringify(job))

    db.prepare("DELETE FROM review_decisions").run()
    const insertDecision = db.prepare("INSERT INTO review_decisions (id, created_at, data) VALUES (?, ?, ?)")
    for (const decision of state.reviewDecisions) insertDecision.run(decision.id, decision.createdAt, JSON.stringify(decision))

    writeKv(db, "settings", state.settings)
    writeKv(db, "schemaOverrides", state.schemaOverrides)
    writeKv(db, "aggregatorOverrides", state.aggregatorOverrides)
  })
}

function clearRunnerRuns() {
  transaction((db) => db.prepare("DELETE FROM runner_runs").run())
}

export function resetDemoState() {
  const state = readState()
  writeState(buildEmptyState(state.settings, state.schemaOverrides, state.aggregatorOverrides))
  clearRunnerRuns()
}

export function importDemoProducts() {
  const currentState = readState()
  const state = buildInitialState(currentState.settings, currentState.schemaOverrides, currentState.aggregatorOverrides)
  writeState(state)
  clearRunnerRuns()
  return state.products.length
}

// Seed the catalog from an externally-built product set (e.g. a real Mirakl snapshot, Phase 6),
// keeping operator settings/overrides. Candidates/evidence start empty — research fills them.
export function importProducts(products: ProductRecord[]) {
  const currentState = readState()
  const state = buildEmptyState(currentState.settings, currentState.schemaOverrides, currentState.aggregatorOverrides)
  state.products = products.map((product) => ({ ...product, bestEvidenceByField: {}, candidates: [], evidence: [] }))
  writeState(state)
  clearRunnerRuns()
  return state.products.length
}

export function getStoredSettings() {
  return readState().settings
}

export function updateStoredSettings(nextSettings: Partial<SettingsSnapshot>) {
  const state = readState()
  state.settings = sanitizeSettings({ ...state.settings, ...nextSettings })
  writeState(state)
  return state.settings
}

export function listStoredSchemas(baseSchemas: SchemaDefinition[]) {
  const overrides = readState().schemaOverrides
  return baseSchemas.map((schema) => overrides[schema.slug] ?? schema)
}

export function updateStoredSchema(baseSchemas: SchemaDefinition[], slug: string, nextSchema: SchemaDefinition) {
  const existingSchema = baseSchemas.find((schema) => schema.slug === slug)
  if (!existingSchema) return null

  const state = readState()
  const updatedSchema = {
    ...existingSchema,
    ...nextSchema,
    id: existingSchema.id,
    slug: existingSchema.slug,
  }
  state.schemaOverrides[existingSchema.slug] = updatedSchema
  writeState(state)
  return updatedSchema
}

export function listStoredAggregators(baseAggregators: AggregatorDefinition[]) {
  const overrides = readState().aggregatorOverrides
  return baseAggregators.map((aggregator) => overrides[aggregator.id] ?? aggregator)
}

export function updateStoredAggregator(baseAggregators: AggregatorDefinition[], id: string, nextAggregator: AggregatorDefinition) {
  const existingAggregator = baseAggregators.find((aggregator) => aggregator.id === id)
  if (!existingAggregator) return null

  const state = readState()
  const updatedAggregator = {
    ...existingAggregator,
    ...nextAggregator,
    id: existingAggregator.id,
  }
  state.aggregatorOverrides[existingAggregator.id] = updatedAggregator
  state.settings.enabledAggregatorIds = updatedAggregator.enabled
    ? [...new Set([...state.settings.enabledAggregatorIds, updatedAggregator.id])]
    : state.settings.enabledAggregatorIds.filter((aggregatorId) => aggregatorId !== updatedAggregator.id)
  writeState(state)
  return updatedAggregator
}


function hasBaselineValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function getInitialStatus(score: number, warnings: readonly string[]) {
  return score >= 90 && warnings.length === 0 ? "READY_FOR_REVIEW" : "NEEDS_ENRICHMENT"
}

function schemaMissingWarnings(product: ProductRecord, schema: SchemaDefinition) {
  return schema.requiredAttributes
    .filter((field) => !hasBaselineValue(product.baselineAttributes[field]))
    .map((field) => `${field} missing for ${schema.name}`)
}

function recomputeProductForSchema(product: ProductRecord, schema: SchemaDefinition, preserveExportReady = true) {
  product.warnings = [
    ...product.warnings.filter((warning) => !/ missing for /.test(warning)),
    ...schemaMissingWarnings(product, schema),
  ]
  const scored = qualityScore(product, schema)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  if (product.listingStatus !== "RESEARCH_IN_PROGRESS" && (!preserveExportReady || product.listingStatus !== "EXPORT_READY")) {
    product.listingStatus = getInitialStatus(scored.score, product.warnings)
  }
  return product
}

function getStateProductSchema(state: DemoCatalogState, product: ProductRecord) {
  const schema = schemas.find((item) => item.id === product.schemaId)
  return schema ? state.schemaOverrides[schema.slug] ?? schema : null
}

export function listStoredProducts() {
  return readState().products
}

export function getStoredProduct(productId: string) {
  return readState().products.find((item) => item.id === productId) ?? null
}

export function updateStoredProductSchema(baseSchemas: SchemaDefinition[], productId: string, schemaId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  const schema = baseSchemas.map((item) => state.schemaOverrides[item.slug] ?? item).find((item) => item.id === schemaId)
  if (!product || !schema) return null

  product.schemaId = schema.id
  recomputeProductForSchema(product, schema)
  writeState(state)
  return product
}

function getLatestAcceptedCandidates(candidates: CandidateRecord[]) {
  const byField = new Map<ContractFieldId, CandidateRecord>()

  for (const candidate of candidates) {
    if (candidate.status !== "accepted") continue
    byField.set(candidate.fieldName, candidate)
  }

  return [...byField.values()]
}

function recomputeProductForAcceptedCandidates(product: ProductRecord, schema: SchemaDefinition) {
  const acceptedCandidates = getLatestAcceptedCandidates(product.candidates)
    .filter((candidate): candidate is CandidateRecord & { fieldName: AttributeFieldId } =>
      isExportableAttributeField(candidate.fieldName)
    )
  const projectedFields = new Set(acceptedCandidates.map((candidate) => candidate.fieldName))
  const projectedProduct: Pick<ProductRecord, "brand" | "baselineDescription" | "baselineAttributes" | "warnings" | "evidence"> = {
    brand: product.brand,
    baselineDescription: product.baselineDescription,
    baselineAttributes: { ...product.baselineAttributes },
    warnings: product.warnings.filter((warning) =>
      !warning.startsWith("Research completed;") && ![...projectedFields].some((field) => warningMatchesSyncedField(warning, field))
    ),
    evidence: product.evidence,
  }

  for (const candidate of acceptedCandidates) {
    projectedProduct.baselineAttributes[candidate.fieldName] = candidate.candidateValue
    if (candidate.fieldName === "description") projectedProduct.baselineDescription = candidate.candidateValue
    if (candidate.fieldName === "brand") projectedProduct.brand = candidate.candidateValue
  }

  const scored = qualityScore(projectedProduct, schema)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  return product
}

export function buildExportPreview(product: ProductRecord): ExportPreview {
  const rows = getLatestAcceptedCandidates(product.candidates).reduce<ExportPreview["rows"]>((acc, candidate) => {
    if (!isExportableAttributeField(candidate.fieldName)) return acc
    acc.push({
      field: candidate.fieldName,
      value: candidate.candidateValue,
      evidenceIds: candidate.sourceEvidenceIds,
    })
    return acc
  }, [])

  return {
    productId: product.id,
    miraklProductId: product.miraklProductId,
    status: "READY",
    rows,
    message: "Accepted values prepared for export.",
  }
}

export function applyReviewDecisionToProduct(product: ProductRecord, candidateId: string, decision: ReviewDecision, reason?: string) {
  const candidate = product.candidates.find((item) => item.id === candidateId)
  if (!candidate) return null

  if (decision === "APPROVE") {
    // Resolve the field: approving one value supersedes every other still-in-play candidate for
    // the same field — both previously-accepted values and the competing proposals from other
    // runners in a Conflict (ADR 0004). The reviewer has chosen the winning value.
    for (const sibling of product.candidates) {
      if (sibling.id !== candidateId && sibling.fieldName === candidate.fieldName && (sibling.status === "accepted" || sibling.status === "proposed")) {
        sibling.status = "rejected"
        sibling.reason = "Superseded by the accepted value for this field."
      }
    }
  }

  candidate.status = decision === "APPROVE" ? "accepted" : decision === "REJECT" ? "rejected" : "needs_evidence"
  if (reason) candidate.reason = reason

  product.listingStatus = product.candidates.some((item) => item.status === "accepted")
    ? "EXPORT_READY"
    : "READY_FOR_REVIEW"

  return candidate
}

// ---------------------------------------------------------------------------
// Real research lifecycle (replaces the simulated mock). A Research Job fans out to N Runner
// Runs (ADR 0004) executed by the local Worker (ADR 0001). This module owns the persisted
// Job/Run state and the consensus merge onto the product; the Worker spawns the CLIs and feeds
// validated output back via recordRunnerRunResult()/finalizeResearchJob(). Nothing is fabricated.
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES = new Set<ResearchJobStatus>(["SUCCEEDED", "FAILED", "TIMEOUT", "CANCELLED"])

function loadProductRow(db: SqliteDatabase, productId: string): ProductRecord | null {
  const row = db.prepare("SELECT data FROM products WHERE id = ?").get(productId) as { data: string } | undefined
  return row ? (JSON.parse(row.data) as ProductRecord) : null
}

function saveProductRow(db: SqliteDatabase, product: ProductRecord) {
  db.prepare("UPDATE products SET data = ? WHERE id = ?").run(JSON.stringify(product), product.id)
}

function rowToJob(row: { data: string }): StoredResearchJob {
  return JSON.parse(row.data) as StoredResearchJob
}

function loadJobRow(db: SqliteDatabase, jobId: string): StoredResearchJob | null {
  const row = db.prepare("SELECT data FROM research_jobs WHERE id = ?").get(jobId) as { data: string } | undefined
  return row ? rowToJob(row) : null
}

function saveJobRow(db: SqliteDatabase, job: StoredResearchJob) {
  db.prepare(
    "INSERT INTO research_jobs (id, product_id, status, created_at, data) VALUES (?, ?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET product_id = excluded.product_id, status = excluded.status, data = excluded.data",
  ).run(job.id, job.productId, job.status, job.createdAt, JSON.stringify(job))
}

function loadRunRow(db: SqliteDatabase, runId: string): StoredRunnerRun | null {
  const row = db.prepare("SELECT data FROM runner_runs WHERE id = ?").get(runId) as { data: string } | undefined
  return row ? (JSON.parse(row.data) as StoredRunnerRun) : null
}

function saveRunRow(db: SqliteDatabase, run: StoredRunnerRun) {
  db.prepare(
    "INSERT INTO runner_runs (id, job_id, product_id, runner, status, created_at, data) VALUES (?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET job_id = excluded.job_id, product_id = excluded.product_id, runner = excluded.runner, status = excluded.status, data = excluded.data",
  ).run(run.id, run.jobId, run.productId, run.runner, run.status, run.createdAt, JSON.stringify(run))
}

function loadRunsForJob(db: SqliteDatabase, jobId: string): StoredRunnerRun[] {
  const rows = db.prepare("SELECT data FROM runner_runs WHERE job_id = ? ORDER BY rowid").all(jobId) as { data: string }[]
  return rows.map((row) => JSON.parse(row.data) as StoredRunnerRun)
}

// Create a multi-runner Research Job (QUEUED) plus one QUEUED Runner Run per runner, and flag the
// product as in-progress. The Worker picks the job up; nothing runs synchronously here.
export function createResearchJob(productId: string): StoredResearchJob | null {
  return transaction((db) => {
    const product = loadProductRow(db, productId)
    if (!product) return null

    // Dedupe: reuse an existing not-yet-terminal job for this product.
    const existingRows = db.prepare("SELECT data FROM research_jobs WHERE product_id = ? ORDER BY rowid DESC").all(productId) as { data: string }[]
    const active = existingRows.map(rowToJob).find((job) => !TERMINAL_STATUSES.has(job.status))
    if (active) return active

    const sequence = (db.prepare("SELECT COUNT(*) AS c FROM research_jobs").get() as { c: number }).c + 1
    const timestamp = now()
    const jobId = `research-${productId}-${sequence}`
    const job: StoredResearchJob = {
      id: jobId,
      productId,
      status: "QUEUED",
      runner: "multi",
      createdAt: timestamp,
      updatedAt: timestamp,
      summary: "Research queued.",
      evidenceIds: [],
      candidateIds: [],
    }
    saveJobRow(db, job)
    for (const runner of RESEARCH_RUNNER_IDS) {
      const run: StoredRunnerRun = {
        id: `${jobId}-${runner}`,
        jobId,
        productId,
        runner,
        status: "QUEUED",
        createdAt: timestamp,
        updatedAt: timestamp,
        summary: "Queued.",
        evidenceIds: [],
        candidateIds: [],
      }
      saveRunRow(db, run)
    }

    product.listingStatus = "RESEARCH_IN_PROGRESS"
    saveProductRow(db, product)
    return job
  })
}

// Backward-compatible alias for existing route/UI/test call sites.
export const createMockResearchRun = createResearchJob

export function listResearchRuns(): ResearchJob[] {
  ensureInitialized()
  const rows = getDb().prepare("SELECT data FROM research_jobs ORDER BY rowid").all() as { data: string }[]
  return rows.map((row) => {
    const job = rowToJob(row)
    return {
      id: job.id,
      productId: job.productId,
      status: job.status,
      runner: job.runner,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      summary: job.summary,
      evidenceIds: [...job.evidenceIds],
      candidateIds: [...job.candidateIds],
    }
  })
}

// Read a Research Job's current state. Status is owned by the Worker (no time-based simulation).
// Extra call-site arguments (a legacy timestamp) are simply ignored.
export function getResearchRun(id: string): StoredResearchJob | null {
  ensureInitialized()
  return loadJobRow(getDb(), id)
}

// Per-run progress — the three lanes the UI renders for a Job.
export function listRunnerRuns(jobId: string): StoredRunnerRun[] {
  return loadRunsForJob(getDb(), jobId)
}

export function getResearchJobWithRuns(jobId: string): { job: StoredResearchJob; runs: StoredRunnerRun[] } | null {
  const db = getDb()
  const job = loadJobRow(db, jobId)
  if (!job) return null
  return { job, runs: loadRunsForJob(db, jobId) }
}

// --- Worker-facing lifecycle (scoped transactions; never full-state writes, so the Worker and
// the Next server never clobber each other) ---

// Atomically claim the oldest QUEUED job: flip it to RUNNING and return it with its runs.
export function claimNextResearchJob(): { job: StoredResearchJob; runs: StoredRunnerRun[] } | null {
  return transaction((db) => {
    const row = db.prepare("SELECT data FROM research_jobs WHERE status = 'QUEUED' ORDER BY rowid LIMIT 1").get() as { data: string } | undefined
    if (!row) return null
    const job = rowToJob(row)
    job.status = "RUNNING"
    job.updatedAt = now()
    job.summary = "Research running across runners."
    saveJobRow(db, job)
    return { job, runs: loadRunsForJob(db, job.id) }
  })
}

export function markRunnerRunStarted(runId: string) {
  transaction((db) => {
    const run = loadRunRow(db, runId)
    if (!run) return
    run.status = "RUNNING"
    run.startedAt = now()
    run.updatedAt = run.startedAt
    run.summary = "Investigating…"
    saveRunRow(db, run)
  })
}

// Record a run's terminal outcome. On SUCCEEDED, the validated output is stored on the run for the
// later consensus merge.
export function recordRunnerRunResult(
  runId: string,
  status: ResearchJobStatus,
  options: { validated?: { evidence: EvidenceRecord[]; candidates: CandidateRecord[] }; summary?: string; error?: string } = {},
) {
  transaction((db) => {
    const run = loadRunRow(db, runId)
    if (!run) return
    run.status = status
    run.finishedAt = now()
    run.updatedAt = run.finishedAt
    if (options.error) run.error = options.error
    if (options.validated) {
      run.validated = options.validated
      run.evidenceIds = options.validated.evidence.map((evidence) => evidence.id)
      run.candidateIds = options.validated.candidates.map((candidate) => candidate.id)
    }
    run.summary =
      options.summary ??
      (status === "SUCCEEDED"
        ? `Found ${run.candidateIds.length} candidate value(s).`
        : status === "TIMEOUT"
          ? "Timed out."
          : status === "CANCELLED"
            ? "Cancelled."
            : run.error ?? "Failed.")
    saveRunRow(db, run)
  })
}

// Once every run of a Job is terminal, merge their validated outputs by consensus/conflict and
// write the merged candidates+evidence onto the product. Accepted candidates are preserved.
export function finalizeResearchJob(jobId: string): StoredResearchJob | null {
  return transaction((db) => {
    const job = loadJobRow(db, jobId)
    if (!job) return null
    if (TERMINAL_STATUSES.has(job.status)) return job // already finalized — idempotent
    const runs = loadRunsForJob(db, jobId)
    if (runs.length === 0 || !runs.every((run) => TERMINAL_STATUSES.has(run.status))) return job

    const product = loadProductRow(db, job.productId)
    if (!product) return job

    const succeededRuns = runs.filter((run) => run.status === "SUCCEEDED" && run.validated)
    const merged = mergeRunnerRuns(
      succeededRuns.map((run): RunnerOutputForMerge => ({
        runner: run.runner,
        evidence: run.validated!.evidence,
        candidates: run.validated!.candidates,
      })),
      product.id,
    )

    // Preserve accepted candidates; replace previously-proposed candidates for refreshed fields.
    const acceptedFields = new Set(
      product.candidates.filter((candidate) => candidate.status === "accepted").map((candidate) => candidate.fieldName),
    )
    const incoming = merged.candidates.filter((candidate) => !acceptedFields.has(candidate.fieldName))
    const refreshedFields = new Set(incoming.map((candidate) => candidate.fieldName))

    product.candidates = product.candidates.filter((candidate) => {
      if (!refreshedFields.has(candidate.fieldName)) return true
      return candidate.status === "accepted"
    })
    const retainedEvidenceIds = new Set(product.candidates.flatMap((candidate) => candidate.sourceEvidenceIds))
    product.evidence = product.evidence.filter((record) => retainedEvidenceIds.has(record.id))
    product.evidence.push(...merged.evidence)
    product.candidates.push(...incoming)

    for (const candidate of incoming) {
      if (isExportableAttributeField(candidate.fieldName)) {
        product.bestEvidenceByField[candidate.fieldName] = candidate.candidateValue
      }
    }

    if (incoming.length > 0) {
      product.listingStatus = "READY_FOR_REVIEW"
      product.warnings = [
        ...product.warnings.filter((warning) => !warning.startsWith("Research completed;")),
        "Research completed; source-backed candidate values are ready for review",
      ]
    } else {
      product.listingStatus =
        product.qualityScore < 80 || product.warnings.some((warning) => /missing|required/i.test(warning))
          ? "NEEDS_ENRICHMENT"
          : "READY_FOR_REVIEW"
      product.warnings = [
        ...product.warnings.filter((warning) => !warning.startsWith("Research completed;")),
        "Research completed; no source-backed changes found",
      ]
    }
    saveProductRow(db, product)

    job.candidateIds = incoming.map((candidate) => candidate.id)
    job.evidenceIds = merged.evidence.map((evidence) => evidence.id)
    job.updatedAt = now()
    if (succeededRuns.length === 0) {
      job.status = runs.every((run) => run.status === "TIMEOUT") ? "TIMEOUT" : "FAILED"
      job.summary = "Research finished with no successful runs."
    } else {
      job.status = "SUCCEEDED"
      const consensusNote = succeededRuns.length > 1 ? ` across ${succeededRuns.length} runners` : ""
      job.summary =
        incoming.length > 0
          ? `Research completed${consensusNote}. ${incoming.length} candidate value(s) ready for review.`
          : "Research completed. No source-backed candidate values were created; missing attributes were not fabricated."
    }
    saveJobRow(db, job)
    return job
  })
}

// Convenience used by tests (and conceptually by the Worker): ingest a validated output for one
// run as if a runner produced it, then finalize the Job if all its runs are now terminal.
export function ingestRunnerOutput(
  runId: string,
  validated: { evidence: EvidenceRecord[]; candidates: CandidateRecord[] },
  status: ResearchJobStatus = "SUCCEEDED",
): void {
  recordRunnerRunResult(runId, status, { validated })
  const db = getDb()
  const run = loadRunRow(db, runId)
  if (!run) return
  const runs = loadRunsForJob(db, run.jobId)
  if (runs.every((item) => TERMINAL_STATUSES.has(item.status))) finalizeResearchJob(run.jobId)
}

export function findCandidate(candidateId: string) {
  const state = readState()
  for (const product of state.products) {
    const candidate = product.candidates.find((item) => item.id === candidateId)
    if (candidate) return { state, product, candidate }
  }
  return null
}

export function addReviewDecision(candidateId: string, decision: ReviewDecision, reason?: string) {
  const found = findCandidate(candidateId)
  if (!found) return null

  const updatedCandidate = applyReviewDecisionToProduct(found.product, candidateId, decision, reason)
  if (!updatedCandidate) return null
  const schema = getStateProductSchema(found.state, found.product)
  if (schema) recomputeProductForAcceptedCandidates(found.product, schema)

  const record: ReviewDecisionRecord = {
    id: `review-${found.state.reviewDecisions.length + 1}`,
    candidateId,
    decision,
    reason,
    createdAt: now(),
  }

  found.state.reviewDecisions.push(record)
  writeState(found.state)
  return record
}

function warningMatchesSyncedField(warning: string, field: AttributeFieldId) {
  const normalized = warning.toLowerCase()
  const label = getFieldLabel(field).toLowerCase()

  if (normalized.includes(field.toLowerCase()) || normalized.includes(label)) return true
  if (field === "description" && /storefront|promotional|noise|descripci[oó]n|promocional|ruido comercial|tienda/.test(normalized)) return true
  if (field === "ean" && normalized.includes("ean")) return true
  if (field === "brand" && normalized.includes("brand")) return true
  return false
}

export function syncProductWithMirakl(productId: string, allowedFields?: readonly AttributeFieldId[]) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  const schema = product ? state.schemaOverrides[schemas.find((item) => item.id === product.schemaId)?.slug ?? ""] ?? schemas.find((item) => item.id === product.schemaId) : null
  if (!product || !schema) return null

  const allowedFieldSet = allowedFields ? new Set(allowedFields) : null
  const acceptedCandidates = getLatestAcceptedCandidates(product.candidates)
    .filter((candidate): candidate is CandidateRecord & { fieldName: AttributeFieldId } =>
      isExportableAttributeField(candidate.fieldName) && (!allowedFieldSet || allowedFieldSet.has(candidate.fieldName))
    )

  if (acceptedCandidates.length === 0) return { product, syncedFields: [] }

  const syncedFields = new Set<AttributeFieldId>()
  for (const candidate of acceptedCandidates) {
    product.baselineAttributes[candidate.fieldName] = candidate.candidateValue
    product.bestEvidenceByField[candidate.fieldName] = candidate.candidateValue
    syncedFields.add(candidate.fieldName)

    if (candidate.fieldName === "description") product.baselineDescription = candidate.candidateValue
    if (candidate.fieldName === "brand") product.brand = candidate.candidateValue
    if (candidate.fieldName === "productName") product.title = candidate.candidateValue
  }

  product.candidates = product.candidates.filter((candidate) =>
    candidate.status !== "accepted" || !isExportableAttributeField(candidate.fieldName) || !syncedFields.has(candidate.fieldName)
  )
  product.warnings = product.warnings.filter((warning) =>
    !warning.startsWith("Research completed;") && ![...syncedFields].some((field) => warningMatchesSyncedField(warning, field))
  )
  recomputeProductForSchema(product, schema, false)
  writeState(state)

  return { product, syncedFields: [...syncedFields] }
}

export function exportPreview(productId: string) {
  const state = readState()
  const product = state.products.find((item) => item.id === productId)
  if (!product) return null
  return buildExportPreview(product)
}
