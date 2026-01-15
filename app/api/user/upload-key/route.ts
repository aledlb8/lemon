import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createUploadKey, getSessionUser, hashUploadKey, isBanned } from "@/lib/auth"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { UserModel } from "@/models/User"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const clientIp = getClientIp(request)
  const rate = rateLimit(`upload-key:${user._id.toString()}:${clientIp}`, {
    windowMs: 15 * 60 * 1000,
    limit: 5,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many key rotations. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  const uploadKey = createUploadKey()
  const uploadKeyHash = hashUploadKey(uploadKey)

  await dbConnect()
  await UserModel.updateOne({ _id: user._id }, { uploadKeyHash })

  const response = NextResponse.json({ uploadKey })
  response.headers.set("cache-control", "no-store")
  return response
}
