import { NextResponse, type NextRequest } from "next/server"
import { del } from "@vercel/blob"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { getClientIp, isSameOrigin, isValidObjectId, rateLimit } from "@/lib/security"
import { MediaModel } from "@/models/Media"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 })
  }

  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(_request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const clientIp = getClientIp(_request)
  const rate = rateLimit(`delete-media:${user._id.toString()}:${clientIp}`, {
    windowMs: 60 * 1000,
    limit: 20,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many delete requests. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  await dbConnect()
  const media = await MediaModel.findById(id)
  if (!media) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  if (!isAdmin(user) && media.userId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  try {
    await del(media.blobPathname)
  } catch (error) {
    console.error("Failed to delete blob", error)
    return NextResponse.json({ error: "Failed to delete blob." }, { status: 502 })
  }

  await MediaModel.deleteOne({ _id: media._id })

  const response = NextResponse.json({ ok: true })
  response.headers.set("cache-control", "no-store")
  return response
}
