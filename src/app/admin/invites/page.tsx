import { redirect } from "next/navigation"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { InviteModel } from "@/models/Invite"
import { AdminInvitesClient } from "@/features/admin"

export default async function AdminInvitesPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  if (!isAdmin(user)) {
    redirect("/dashboard")
  }

  await dbConnect()
  const invites = await InviteModel.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return (
    <AdminInvitesClient
      invites={invites.map((invite) => ({
        id: invite._id.toString(),
        code: invite.code,
        createdAt: invite.createdAt.toISOString(),
        usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        usedBy: invite.usedBy?.toString() ?? null,
      }))}
    />
  )
}
