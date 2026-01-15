import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createUploadKey, getSessionUser, hashUploadKey, isBanned } from "@/lib/auth"
import { getBaseUrl } from "@/lib/http"
import { UserModel } from "@/models/User"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
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
    },
  })
}
