import Link from "next/link"
import { notFound } from "next/navigation"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { normalizeUsername } from "@/lib/validation"
import { MediaModel } from "@/models/Media"
import { UserModel } from "@/models/User"

type RouteContext = { params: Promise<{ username: string }> }

export default async function UserGalleryPage({ params }: RouteContext) {
  const { username: rawUsername } = await params
  await dbConnect()

  const username = normalizeUsername(rawUsername)
  const owner = await UserModel.findOne({ username }).lean()
  if (!owner) {
    notFound()
  }

  const viewer = await getSessionUser()
  const canSeePrivate =
    Boolean(viewer) &&
    (isAdmin(viewer) || owner._id.toString() === viewer?._id.toString())

  const query = canSeePrivate
    ? { userId: owner._id }
    : { userId: owner._id, visibility: "public" }

  const uploads = await MediaModel.find(query).sort({ createdAt: -1 }).lean()

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">@{owner.username}</h1>
          <p className="text-muted-foreground text-sm">
            {uploads.length} upload{uploads.length === 1 ? "" : "s"}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploads.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No public uploads yet.
            </div>
          )}
          {uploads.map((item) => {
            const isImage = item.contentType.startsWith("image/")
            const downloadUrl = `/api/media/${item._id.toString()}/download`
            return (
              <Link
                key={item._id.toString()}
                href={`/file/${item._id.toString()}`}
                className="border-border bg-card flex h-full flex-col gap-3 rounded-2xl border p-4 shadow-sm transition hover:border-primary/40"
              >
                <div className="bg-muted/30 flex h-40 items-center justify-center overflow-hidden rounded-xl">
                  {isImage ? (
                    <img
                      src={downloadUrl}
                      alt={item.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs uppercase">
                      {item.originalName.split(".").pop() ?? "file"}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium">{item.originalName}</div>
              </Link>
            )
          })}
        </section>
      </div>
    </main>
  )
}
