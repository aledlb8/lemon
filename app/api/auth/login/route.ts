import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createSession, isBanned, verifyPassword } from "@/lib/auth"
import { normalizeEmail, normalizeUsername } from "@/lib/validation"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { identifier, password } = body as {
    identifier?: string
    password?: string
  }

  if (!identifier || !password) {
    return NextResponse.json({ error: "Missing credentials." }, { status: 400 })
  }
  if (identifier.length > 200 || password.length > 1024) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 })
  }

  const normalizedIdentifier = identifier.includes("@")
    ? normalizeEmail(identifier)
    : normalizeUsername(identifier)

  const clientIp = getClientIp(request)
  const rate = rateLimit(`login:${clientIp}:${normalizedIdentifier}`, {
    windowMs: 5 * 60 * 1000,
    limit: 8,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  await dbConnect()
  const user = await UserModel.findOne({
    $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
  })

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  if (isBanned(user)) {
    return NextResponse.json({ error: "Account disabled." }, { status: 403 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  await createSession(user._id.toString())

  const response = NextResponse.json(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        defaultVisibility: user.settings?.defaultVisibility ?? "public",
      },
    },
    { status: 200 }
  )
  response.headers.set("cache-control", "no-store")
  return response
}
