import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, hashPassword, isBanned, verifyPassword } from "@/lib/auth"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { isValidPassword } from "@/lib/validation"
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
  const rate = rateLimit(`password-change:${user._id.toString()}:${clientIp}`, {
    windowMs: 15 * 60 * 1000,
    limit: 5,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many password change attempts. Try again later." },
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

  const { currentPassword, nextPassword } = body as {
    currentPassword?: string
    nextPassword?: string
  }

  if (!currentPassword || !nextPassword) {
    return NextResponse.json(
      { error: "Current and new passwords are required." },
      { status: 400 }
    )
  }

  if (currentPassword.length > 1024 || nextPassword.length > 1024) {
    return NextResponse.json({ error: "Password is too long." }, { status: 400 })
  }

  if (currentPassword === nextPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password." },
      { status: 400 }
    )
  }

  if (!isValidPassword(nextPassword)) {
    return NextResponse.json(
      {
        error: "Password must be at least 10 characters and include letters and numbers.",
      },
      { status: 400 }
    )
  }

  await dbConnect()
  const existingUser = await UserModel.findById(user._id)
  if (!existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const isValid = await verifyPassword(currentPassword, existingUser.passwordHash)
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    )
  }

  existingUser.passwordHash = await hashPassword(nextPassword)
  await existingUser.save()

  const response = NextResponse.json({ ok: true })
  response.headers.set("cache-control", "no-store")
  return response
}
