import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { generateInviteCode } from "@/lib/invites"
import { getSessionUser, isAdmin, isBanned, ROLE_BANNED } from "@/lib/auth"
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
  const { count = 1 } = body as { count?: number }

  const inviteCount = Math.min(Math.max(1, count), 5)

  await dbConnect()

  // Get all non-banned users except the admin sending the wave
  const users = await UserModel.find({
    role: { $ne: ROLE_BANNED },
    _id: { $ne: user._id },
  })
    .select("_id username")
    .lean()

  if (users.length === 0) {
    return NextResponse.json({ error: "No users found." }, { status: 404 })
  }

  let totalCreated = 0

  for (const targetUser of users) {
    for (let i = 0; i < inviteCount; i++) {
      let code = generateInviteCode()
      let existing = await InviteModel.findOne({ code })

      while (existing) {
        code = generateInviteCode()
        existing = await InviteModel.findOne({ code })
      }

      await InviteModel.create({
        code,
        createdBy: user._id,
        ownedBy: targetUser._id,
      })

      totalCreated++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Gifted ${inviteCount} invite${inviteCount > 1 ? "s" : ""} to ${users.length} user${users.length > 1 ? "s" : ""} (${totalCreated} total).`,
    totalUsers: users.length,
    invitesPerUser: inviteCount,
    totalCreated,
  })
}
