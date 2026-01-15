import Link from "next/link"
import { notFound } from "next/navigation"

import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { normalizeUsername } from "@/lib/validation"
import { MediaModel } from "@/models/Media"
import { UserModel } from "@/models/User"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  IconUser,
  IconPhoto,
  IconFileText,
  IconEye,
  IconEyeOff,
  IconUpload,
} from "@tabler/icons-react"

type RouteContext = { params: Promise<{ username: string }> }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

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
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <IconUpload className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground mb-2 text-lg font-medium">
                  No public uploads yet
                </p>
                <p className="text-muted-foreground text-sm">
                  This user hasn&apos;t shared any files publicly
                </p>
              </CardContent>
            </Card>
          )}
          {uploads.map((item) => {
            const isImage = item.contentType.startsWith("image/")
            const downloadUrl = `/api/media/${item._id.toString()}/download`
            return (
              <Link
                key={item._id.toString()}
                href={`/file/${item._id.toString()}`}
              >
                <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="bg-muted/50 relative flex aspect-video items-center justify-center overflow-hidden">
                    {isImage ? (
                      <>
                        <img
                          src={downloadUrl}
                          alt={item.originalName}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="bg-background/80 absolute right-2 top-2 backdrop-blur-sm">
                          <Badge variant="secondary" className="gap-1">
                            <IconPhoto className="h-3 w-3" />
                            Image
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <IconFileText className="text-muted-foreground h-12 w-12" />
                        <Badge variant="outline" className="uppercase">
                          {item.originalName.split(".").pop() ?? "file"}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-1 text-base">
                      <span className="hover:underline font-bold text-primary">{item.originalName}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{formatSize(item.size)}</span>
                      {canSeePrivate && (
                        <>
                          <span>·</span>
                          <Badge variant={item.visibility === "public" ? "default" : "secondary"} className="h-5 text-xs">
                            {item.visibility === "public" ? (
                              <IconEye className="h-3 w-3" />
                            ) : (
                              <IconEyeOff className="h-3 w-3" />
                            )}
                            {item.visibility}
                          </Badge>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </section>
      </div>
    </main>
  )
}
