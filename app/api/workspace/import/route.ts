import { NextResponse } from "next/server"
import { importDemoProducts } from "@/server/store"

export async function POST() {
  const importedCount = importDemoProducts()

  return NextResponse.json({
    status: "imported",
    importedCount,
    message: `Imported ${importedCount} electronics products into the workspace.`,
  })
}
