import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createSession, isBanned, verifyPassword } from "@/lib/auth"
import { normalizeEmail, normalizeUsername } from "@/lib/validation"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
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

  const normalizedIdentifier = identifier.includes("@")
    ? normalizeEmail(identifier)
    : normalizeUsername(identifier)

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

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      defaultVisibility: user.settings?.defaultVisibility ?? "public",
    },
  })
}
