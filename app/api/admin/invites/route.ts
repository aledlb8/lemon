import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { generateInviteCode } from "@/lib/invites"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { InviteModel } from "@/models/Invite"

export async function GET() {
  const user = await getSessionUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  await dbConnect()
  const invites = await InviteModel.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite._id.toString(),
      code: invite.code,
      createdAt: invite.createdAt,
      usedAt: invite.usedAt,
      usedBy: invite.usedBy?.toString() ?? null,
    })),
  })
}

export async function POST() {
  const user = await getSessionUser()
  // if (!user || !isAdmin(user)) {
  //   return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  // }

  await dbConnect()

  let code = generateInviteCode()
  let existing = await InviteModel.findOne({ code })

  while (existing) {
    code = generateInviteCode()
    existing = await InviteModel.findOne({ code })
  }

  const invite = await InviteModel.create({ code, createdBy: '9f3c7a1b4e8d2c6f0a9e1d7b' })

  return NextResponse.json({
    invite: {
      id: invite._id.toString(),
      code: invite.code,
      createdAt: invite.createdAt,
    },
  })
}
