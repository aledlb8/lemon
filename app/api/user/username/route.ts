import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isBanned } from "@/lib/auth"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { isValidUsername, normalizeUsername } from "@/lib/validation"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const clientIp = getClientIp(request)
  const rate = rateLimit(`username-change:${user._id.toString()}:${clientIp}`, {
    windowMs: 15 * 60 * 1000,
    limit: 5,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many username change attempts. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { username } = body as { username?: string }
  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 })
  }

  if (username.length > 200) {
    return NextResponse.json({ error: "Username is too long." }, { status: 400 })
  }

  const normalized = normalizeUsername(username)
  if (!isValidUsername(normalized)) {
    return NextResponse.json(
      { error: "Username must be 3-20 chars: letters, numbers, dashes, underscores." },
      { status: 400 }
    )
  }

  if (normalized === user.username) {
    return NextResponse.json(
      { error: "Choose a new username to update." },
      { status: 400 }
    )
  }

  await dbConnect()
  const existing = await UserModel.findOne({
    username: normalized,
    _id: { $ne: user._id },
  })
  if (existing) {
    return NextResponse.json({ error: "Username is already taken." }, { status: 409 })
  }

  await UserModel.updateOne(
    { _id: user._id },
    { username: normalized }
  )

  const response = NextResponse.json({ ok: true, username: normalized })
  response.headers.set("cache-control", "no-store")
  return response
}
