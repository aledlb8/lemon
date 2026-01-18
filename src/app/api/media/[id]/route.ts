import { NextResponse, type NextRequest } from "next/server"
import { del } from "@vercel/blob"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { getClientIp, isSameOrigin, isValidObjectId, rateLimit } from "@/lib/security"
import { MediaModel } from "@/models/Media"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 })
  }

  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const clientIp = getClientIp(request)
  const rate = rateLimit(`update-media:${user._id.toString()}:${clientIp}`, {
    windowMs: 60 * 1000,
    limit: 30,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many update requests. Try again later." },
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

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const { visibility } = body
  if (visibility && visibility !== "public" && visibility !== "private") {
    return NextResponse.json({ error: "Invalid visibility value." }, { status: 400 })
  }

  if (visibility) {
    media.visibility = visibility
    await media.save()
  }

  const response = NextResponse.json({ ok: true, visibility: media.visibility })
  response.headers.set("cache-control", "no-store")
  return response
}

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
