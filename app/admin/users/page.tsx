import { redirect } from "next/navigation"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { UserModel } from "@/models/User"
import { InviteModel } from "@/models/Invite"
import AdminUsersClient from "@/components/admin-users-client"

export default async function AdminUsersPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  if (!isAdmin(user)) {
    redirect("/dashboard")
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

  return <AdminUsersClient users={usersWithInviteInfo} />
}
