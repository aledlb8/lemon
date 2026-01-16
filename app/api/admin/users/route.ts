import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { UserModel } from "@/models/User"
import { InviteModel } from "@/models/Invite"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const users = await UserModel.find().sort({ createdAt: -1 }).lean()
    const invites = await InviteModel.find({ usedBy: { $ne: null } }).lean()

    const inviteMap = new Map()
    for (const invite of invites) {
      if (invite.usedBy) {
        inviteMap.set(invite.usedBy.toString(), {
          invitedBy: invite.createdBy.toString(),
          inviteCode: invite.code,
        })
      }
    }

    const usersWithInviteInfo = await Promise.all(
      users.map(async (u) => {
        const inviteInfo = inviteMap.get(u._id.toString())
        let invitedByUsername = null

        if (inviteInfo) {
          const inviter = await UserModel.findById(inviteInfo.invitedBy).lean()
          invitedByUsername = inviter?.username ?? null
        }

        return {
          id: u._id.toString(),
          email: u.email,
          username: u.username,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
          invitedBy: invitedByUsername,
          inviteCode: inviteInfo?.inviteCode ?? null,
        }
      })
    )

    return NextResponse.json({ users: usersWithInviteInfo })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
