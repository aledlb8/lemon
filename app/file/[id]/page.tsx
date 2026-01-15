import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { MediaModel } from "@/models/Media"

type RouteContext = { params: Promise<{ id: string }> }

export default async function FilePage({ params }: RouteContext) {
  const { id } = await params
  await dbConnect()
  const media = await MediaModel.findById(id).lean()
  if (!media) {
    notFound()
  }

  const user = await getSessionUser()
  const isOwner =
    Boolean(user) &&
    (isAdmin(user) || media.userId.toString() === user?._id.toString())

  if (media.visibility === "private" && !isOwner) {
    if (!user) {
      redirect("/login")
    }
    notFound()
  }

  const isImage = media.contentType.startsWith("image/")
  const downloadUrl = `/api/media/${media._id.toString()}/download`

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{media.originalName}</h1>
            <p className="text-muted-foreground text-xs">
              {media.visibility} · {(media.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Link
            href={downloadUrl}
            className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition"
          >
            Download
          </Link>
        </header>

        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          {isImage ? (
            <img
              src={downloadUrl}
              alt={media.originalName}
              className="h-auto w-full rounded-xl"
            />
          ) : (
            <div className="text-muted-foreground text-sm">
              This file is not an image. Use the download button to open it.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
