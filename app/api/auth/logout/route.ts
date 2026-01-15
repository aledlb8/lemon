import { NextResponse } from "next/server"

import { clearSession } from "@/lib/auth"
import { isSameOrigin } from "@/lib/security"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  await clearSession()
  const response = NextResponse.json({ ok: true })
  response.headers.set("cache-control", "no-store")
  return response
}
