import { NextResponse } from "next/server"

import { dbConnect } from "@/lib/db"
import { createUploadKey, getSessionUser, hashUploadKey, isBanned } from "@/lib/auth"
import { UserModel } from "@/models/User"

export async function POST() {
  const user = await getSessionUser()
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const uploadKey = createUploadKey()
  const uploadKeyHash = hashUploadKey(uploadKey)

  await dbConnect()
  await UserModel.updateOne({ _id: user._id }, { uploadKeyHash })

  return NextResponse.json({ uploadKey })
}
