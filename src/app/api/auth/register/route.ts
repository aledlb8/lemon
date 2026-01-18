import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createSession, createUploadKey, hashPassword, hashUploadKey } from "@/lib/auth"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { normalizeEmail, normalizeInviteCode, normalizeUsername, isValidEmail, isValidPassword, isValidUsername } from "@/lib/validation"
import { InviteModel } from "@/models/Invite"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { email, username, password, inviteCode } = body as {
    email?: string
    username?: string
    password?: string
    inviteCode?: string
  }

  if (!email || !username || !password || !inviteCode) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }
  if (
    email.length > 200 ||
    username.length > 50 ||
    password.length > 1024 ||
    inviteCode.length > 100
  ) {
    return NextResponse.json({ error: "Invalid registration data." }, { status: 400 })
  }

  const normalizedEmail = normalizeEmail(email)
  const normalizedUsername = normalizeUsername(username)
  const normalizedInvite = normalizeInviteCode(inviteCode)

  if (!isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
  }

  if (!isValidUsername(normalizedUsername)) {
    return NextResponse.json({ error: "Invalid username." }, { status: 400 })
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password must be at least 10 characters and include letters and numbers." },
      { status: 400 }
    )
  }

  const clientIp = getClientIp(request)
  const rate = rateLimit(`register:${clientIp}`, {
    windowMs: 60 * 60 * 1000,
    limit: 5,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  await dbConnect()

  const invite = await InviteModel.findOne({ code: normalizedInvite, usedBy: null })
  if (!invite) {
    return NextResponse.json({ error: "Invite code is invalid or used." }, { status: 400 })
  }

  const existingUser = await UserModel.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  })
  if (existingUser) {
    return NextResponse.json({ error: "Email or username already in use." }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const uploadKey = createUploadKey()
  const uploadKeyHash = hashUploadKey(uploadKey)

  const user = await UserModel.create({
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash,
    uploadKeyHash,
    role: 0,
  })

  await InviteModel.updateOne(
    { _id: invite._id },
    { usedBy: user._id, usedAt: new Date() }
  )

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
      uploadKey,
    },
    { status: 200 }
  )
  response.headers.set("cache-control", "no-store")
  return response
}
