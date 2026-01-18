import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { isSameOrigin } from "@/lib/security"
import { InviteModel } from "@/models/Invite"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || isBanned(user) || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const { id } = await params

  await dbConnect()

  const invite = await InviteModel.findById(id)
  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 })
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "Cannot delete a used invite." },
      { status: 400 }
    )
  }

  await InviteModel.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}
