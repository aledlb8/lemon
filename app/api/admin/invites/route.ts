import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { generateInviteCode } from "@/lib/invites"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { InviteModel } from "@/models/Invite"

export async function GET() {
  const user = await getSessionUser()
  if (!user || isBanned(user) || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  await dbConnect()
  const invites = await InviteModel.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  const response = NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite._id.toString(),
      code: invite.code,
      createdAt: invite.createdAt,
      usedAt: invite.usedAt,
      usedBy: invite.usedBy?.toString() ?? null,
    })),
  })
  response.headers.set("cache-control", "no-store")
  return response
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user) || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const clientIp = getClientIp(request)
  const rate = rateLimit(`admin-invite:${user._id.toString()}:${clientIp}`, {
    windowMs: 60 * 60 * 1000,
    limit: 10,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many invites created. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  await dbConnect()

  let code = generateInviteCode()
  let existing = await InviteModel.findOne({ code })

  while (existing) {
    code = generateInviteCode()
    existing = await InviteModel.findOne({ code })
  }

  const invite = await InviteModel.create({ code, createdBy: user._id })

  const response = NextResponse.json({
    invite: {
      id: invite._id.toString(),
      code: invite.code,
      createdAt: invite.createdAt,
    },
  })
  response.headers.set("cache-control", "no-store")
  return response
}
