import { redirect } from "next/navigation"

import { dbConnect } from "@/lib/db"
import { getSessionUser, ROLE_BANNED } from "@/lib/auth"
import { MediaModel } from "@/models/Media"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role === ROLE_BANNED) {
    redirect("/login")
  }

  await dbConnect()
  const media = await MediaModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  return (
    <DashboardClient
      user={{
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        defaultVisibility: user.settings?.defaultVisibility ?? "public",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        hasUploadKey: Boolean(user.uploadKeyHash),
      }}
      media={media.map((item) => ({
        id: item._id.toString(),
        originalName: item.originalName,
        contentType: item.contentType,
        size: item.size,
        visibility: item.visibility as "public" | "private",
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  )
}
