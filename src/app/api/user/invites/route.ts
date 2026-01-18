import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isBanned } from "@/lib/auth"
import { InviteModel } from "@/models/Invite"

export async function GET() {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  await dbConnect()

  // Get invites owned by this user that are not yet used
  const invites = await InviteModel.find({
    ownedBy: user._id,
    usedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean()

  const response = NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite._id.toString(),
      code: invite.code,
      createdAt: invite.createdAt,
    })),
  })
  response.headers.set("cache-control", "no-store")
  return response
}
