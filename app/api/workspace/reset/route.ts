import { NextResponse } from "next/server"
import { resetDemoState } from "@/server/store"

export async function POST() {
  resetDemoState()
  return NextResponse.json({
    status: "reset",
    message: "Workspace cleared. Import the electronics catalog to start the review flow.",
  })
}
