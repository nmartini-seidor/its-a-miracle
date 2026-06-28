import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

// The real Mirakl attribute codes live in the committed category-config exports under
// data/mirakl/catalog-config/* (ADR 0007). This module parses them so the write-back path can map
// to codes that actually exist — and the dry-run can prove a draft's headers are a subset of them
// — instead of the invented codes the demo shipped before.

const CONFIG_DIR = path.join(process.cwd(), "data", "mirakl", "catalog-config")
// Attribute-import CSVs start with this header; hierarchy/brand-value CSVs have a different shape
// and are skipped (they carry no attribute codes).
const ATTRIBUTE_HEADER_PREFIX = "code;label;type;hierarchy-code"

// { hierarchy-code (category) -> Set<attribute code> } parsed from the committed config CSVs.
export function loadCategoryAttributeCodes(): Map<string, Set<string>> {
  const byCategory = new Map<string, Set<string>>()
  let entries: string[]
  try {
    entries = readdirSync(CONFIG_DIR)
  } catch {
    return byCategory
  }
  for (const entry of entries) {
    if (!entry.endsWith(".csv")) continue
    let text: string
    try {
      text = readFileSync(path.join(CONFIG_DIR, entry), "utf8")
    } catch {
      continue
    }
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length === 0 || !lines[0].startsWith(ATTRIBUTE_HEADER_PREFIX)) continue
    for (const line of lines.slice(1)) {
      const [code, , , hierarchyCode] = line.split(";")
      const trimmedCode = code?.trim()
      if (!trimmedCode) continue
      const category = (hierarchyCode ?? "").trim() || "__uncategorized__"
      if (!byCategory.has(category)) byCategory.set(category, new Set())
      byCategory.get(category)!.add(trimmedCode)
    }
  }
  return byCategory
}

// Real attribute codes for one category, or — when no category is given — the union across every
// committed category. Used to validate that a write-back draft uses only codes Mirakl will accept.
export function getKnownAttributeCodes(categoryCode?: string | null): Set<string> {
  const byCategory = loadCategoryAttributeCodes()
  if (categoryCode) return byCategory.get(categoryCode) ?? new Set<string>()
  const all = new Set<string>()
  for (const codes of byCategory.values()) for (const code of codes) all.add(code)
  return all
}
