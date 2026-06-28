import { NextResponse } from "next/server"
import { submitMiraklAttributeSync } from "@/server/mirakl-live-sync"
import { getStoredProduct, syncProductWithMirakl } from "@/server/store"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = getStoredProduct(id)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  let miraklImport
  try {
    miraklImport = await submitMiraklAttributeSync(product)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mirakl sync failed" },
      { status: 424 },
    )
  }

  const result = syncProductWithMirakl(id, miraklImport.draft.syncedFields)
  if (!result) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({
    syncedFields: result.syncedFields,
    // Accepted fields with no known Mirakl attribute code were excluded from the import rather than
    // shipped under a fake code (ADR 0007); surface them so the drop is never silent.
    unmappedFields: miraklImport.unmappedFields,
    qualityScore: result.product.qualityScore,
    listingStatus: result.product.listingStatus,
    miraklImportId: miraklImport.importId,
    miraklImportStatus: miraklImport.importStatus,
  })
}
