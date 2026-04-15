import { NextResponse } from "next/server"
import { listProducts } from "@/server/data"

export async function GET() {
  return NextResponse.json({ products: await listProducts() })
}
