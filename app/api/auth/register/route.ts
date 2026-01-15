import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createSession, createUploadKey, hashPassword, hashUploadKey } from "@/lib/auth"
import { normalizeEmail, normalizeInviteCode, normalizeUsername, isValidEmail, isValidPassword, isValidUsername } from "@/lib/validation"
import { InviteModel } from "@/models/Invite"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
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
      { error: "Password must be at least 8 characters." },
      { status: 400 }
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

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      defaultVisibility: user.settings?.defaultVisibility ?? "public",
    },
    uploadKey,
  })
}
