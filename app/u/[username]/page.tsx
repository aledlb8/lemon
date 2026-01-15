import { notFound } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { MediaCard } from "@/components/media-card"
import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { normalizeUsername } from "@/lib/validation"
import { MediaModel } from "@/models/Media"
import { UserModel } from "@/models/User"
import {
  IconUser,
  IconUpload,
} from "@tabler/icons-react"

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:py-12">
        <header className="space-y-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
              <IconUser className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">@{owner.username}</h1>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <IconUpload className="h-4 w-4" />
                {uploads.length} upload{uploads.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {uploads.length === 0 && (
            <EmptyState
              icon={IconUpload}
              title="No public uploads yet"
              description="This user hasn't shared any files publicly"
            />
          )}
          {uploads.map((item) => (
            <MediaCard
              key={item._id.toString()}
              id={item._id.toString()}
              originalName={item.originalName}
              contentType={item.contentType}
              size={item.size}
              visibility={item.visibility}
              showVisibility={canSeePrivate}
            />
          ))}
        </section>
      </div>
    </main>
  )
}
