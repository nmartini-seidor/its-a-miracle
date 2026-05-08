import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  return NextResponse.json(
    { error: "Description generation is disabled until a real imported source description is available." },
    { status: 409 },
  )
}
