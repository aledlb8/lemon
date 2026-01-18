import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createUploadKey, getSessionUser, hashUploadKey, isBanned } from "@/lib/auth"
import { getBaseUrl } from "@/lib/http"
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security"
import { UserModel } from "@/models/User"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 })
  }

  const clientIp = getClientIp(request)
  const rate = rateLimit(`sharex-config:${user._id.toString()}:${clientIp}`, {
    windowMs: 15 * 60 * 1000,
    limit: 3,
  })
  if (!rate.allowed) {
    const retryAfter = Math.ceil((rate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
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

  const origin = getBaseUrl(request)
  const config = {
    Version: "15.0.0",
    Name: "Lemon",
    DestinationType: "ImageUploader, FileUploader",
    RequestMethod: "POST",
    RequestType: "POST",
    RequestURL: `${origin}/api/upload?format=text`,
    Body: "MultipartFormData",
    FileFormName: "file",
    Headers: {
      "X-Upload-Key": uploadKey,
    },
    ResponseType: "Text",
    URL: "{response}",
  }

  const content = JSON.stringify(config, null, 2)

  return new Response(content, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": 'attachment; filename="lemon.sxcu"',
      "cache-control": "no-store",
    },
  })
}
