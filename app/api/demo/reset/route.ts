import { NextResponse } from "next/server"
import { listProducts } from "@/server/data"
import { resetDemoState } from "@/server/store"

export async function POST() {
  resetDemoState()
  const products = await listProducts()

  return NextResponse.json({
    ok: true,
    message: "Demo state reset to seeded fixtures.",
    products: products.length,
    heroProductStatus: products.find((product) => product.id === "freeclip-2")?.listingStatus ?? null,
  })
}
