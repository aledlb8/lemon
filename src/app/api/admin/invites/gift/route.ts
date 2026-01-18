import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { generateInviteCode } from "@/lib/invites"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { isSameOrigin } from "@/lib/security"
import { InviteModel } from "@/models/Invite"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user) || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { username, count = 1 } = body as { username?: string; count?: number }

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 400 }
    )
  }

  const inviteCount = Math.min(Math.max(1, count), 10)

  await dbConnect()

  const targetUser = await UserModel.findOne({
    username: { $regex: new RegExp(`^${username}$`, "i") },
  })

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const invites = []
  for (let i = 0; i < inviteCount; i++) {
    let code = generateInviteCode()
    let existing = await InviteModel.findOne({ code })

    while (existing) {
      code = generateInviteCode()
      existing = await InviteModel.findOne({ code })
    }

    const invite = await InviteModel.create({
      code,
      createdBy: user._id,
      ownedBy: targetUser._id,
    })

    invites.push({
      id: invite._id.toString(),
      code: invite.code,
      createdAt: invite.createdAt,
    })
  }

  return NextResponse.json({
    success: true,
    invites,
    message: `Gifted ${inviteCount} invite${inviteCount > 1 ? "s" : ""} to ${targetUser.username}.`,
  })
}
