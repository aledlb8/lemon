import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { UserModel } from "@/models/User"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    await dbConnect()

    const targetUser = await UserModel.findById(userId)
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUser._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "Cannot ban yourself" },
        { status: 400 }
      )
    }

    const newRole = targetUser.role === -1 ? 0 : -1
    targetUser.role = newRole
    await targetUser.save()

    return NextResponse.json({
      success: true,
      role: newRole,
      message:
        newRole === -1
          ? "User has been banned"
          : "User has been unbanned",
    })
  } catch (error) {
    console.error("Error banning user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
