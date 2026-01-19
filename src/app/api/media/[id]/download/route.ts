import { NextResponse, type NextRequest } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin, isBanned } from "@/lib/auth"
import { isValidObjectId, safeHeaderFilename } from "@/lib/security"
import { MediaModel } from "@/models/Media"

type RouteContext = { params: Promise<{ id: string }> }

export const runtime = "nodejs"

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 })
  }

  await dbConnect()
  const media = await MediaModel.findById(id).lean()
  if (!media) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const user = await getSessionUser()
  const isOwner =
    Boolean(user) &&
    !isBanned(user) &&
    (isAdmin(user) || media.userId.toString() === user?._id.toString())

  if (media.visibility === "private" && !isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (media.visibility === "private" && !token) {
    return NextResponse.json({ error: "Missing blob token." }, { status: 500 })
  }

  const response = await fetch(media.blobUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Failed to fetch file." }, { status: 502 })
  }

  const headers = new Headers()
  headers.set("content-type", response.headers.get("content-type") ?? media.contentType)
  headers.set(
    "content-disposition",
    `attachment; filename="${safeHeaderFilename(media.originalName)}"`
  )
  headers.set("cache-control", "no-store")

  return new Response(response.body, { headers })
}
