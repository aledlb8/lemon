import { NextResponse, type NextRequest } from "next/server"
import { del } from "@vercel/blob"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { MediaModel } from "@/models/Media"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  await dbConnect()
  const media = await MediaModel.findById(id)
  if (!media) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  if (!isAdmin(user) && media.userId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  await del(media.blobPathname)
  await MediaModel.deleteOne({ _id: media._id })

  return NextResponse.json({ ok: true })
}
