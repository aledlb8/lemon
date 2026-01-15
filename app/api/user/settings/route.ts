import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isBanned } from "@/lib/auth"
import { UserModel } from "@/models/User"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      defaultVisibility: user.settings?.defaultVisibility ?? "public",
      hasUploadKey: Boolean(user.uploadKeyHash),
    },
  })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { defaultVisibility } = body as { defaultVisibility?: string }
  if (!defaultVisibility || !["public", "private"].includes(defaultVisibility)) {
    return NextResponse.json({ error: "Invalid visibility." }, { status: 400 })
  }

  await dbConnect()
  await UserModel.updateOne(
    { _id: user._id },
    { "settings.defaultVisibility": defaultVisibility }
  )

  return NextResponse.json({ ok: true })
}
