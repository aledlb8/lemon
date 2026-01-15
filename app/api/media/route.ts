import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isBanned } from "@/lib/auth"
import { MediaModel } from "@/models/Media"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const url = new URL(request.url)
  const rawLimit = Number(url.searchParams.get("limit") ?? 50)
  const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 200) : 50

  await dbConnect()
  const media = await MediaModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return NextResponse.json({
    media: media.map((item) => ({
      id: item._id.toString(),
      originalName: item.originalName,
      contentType: item.contentType,
      size: item.size,
      visibility: item.visibility,
      createdAt: item.createdAt,
    })),
  })
}
