// Seed the catalog from a real Mirakl snapshot (ADR 0005). Produce a snapshot first with the
// gated read:  pnpm sync:mirakl --live-read-approved   (requires MIRAKL_OPERATOR_API_KEY).
// Usage: pnpm import:snapshot [path/to/snapshot.json]
import { importProducts } from "../server/store.ts"
import { loadSnapshotProducts, readLatestSnapshot, readSnapshotFile } from "../server/mirakl-snapshot.ts"

const explicitPath = process.argv[2]
const source = explicitPath
  ? { snapshot: readSnapshotFile(explicitPath), filePath: explicitPath }
  : readLatestSnapshot()

if (!source) {
  console.error("No Mirakl snapshot found in data/mirakl/snapshots/.")
  console.error("Capture one first:  pnpm sync:mirakl --live-read-approved   (needs MIRAKL_OPERATOR_API_KEY)")
  process.exit(1)
}

const products = loadSnapshotProducts(source.snapshot)
if (products.length === 0) {
  console.error(`Snapshot ${source.filePath} produced no products (no recognisable SKU/title columns).`)
  process.exit(1)
}

const count = importProducts(products)
console.log(`Imported ${count} products from Mirakl snapshot ${source.snapshot.capturedAt ?? source.filePath}`)
