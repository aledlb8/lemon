import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { formatSize, formatDate } from "@/lib/formatting"
import { dbConnect } from "@/lib/db"
import { getSessionUser, isAdmin } from "@/lib/auth"
import { isValidObjectId } from "@/lib/security"
import { MediaModel } from "@/models/Media"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconDownload,
  IconEye,
  IconEyeOff,
  IconArrowLeft,
  IconFile,
  IconCalendar,
  IconFileText,
  IconPhoto,
} from "@tabler/icons-react"

type RouteContext = { params: Promise<{ id: string }> }

export default async function FilePage({ params }: RouteContext) {
  const { id } = await params
  if (!isValidObjectId(id)) {
    notFound()
  }
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 lg:py-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <IconArrowLeft />
              Back
            </Link>
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  {isImage ? (
                    <IconPhoto className="h-6 w-6" />
                  ) : (
                    <IconFileText className="h-6 w-6" />
                  )}
                  {media.originalName}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <Badge variant={media.visibility === "public" ? "default" : "secondary"}>
                    {media.visibility === "public" ? (
                      <IconEye className="h-3 w-3" />
                    ) : (
                      <IconEyeOff className="h-3 w-3" />
                    )}
                    {media.visibility}
                  </Badge>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <IconFile className="h-3.5 w-3.5" />
                    {formatSize(media.size)}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <IconCalendar className="h-3.5 w-3.5" />
                    {formatDate(media.createdAt)}
                  </span>
                </CardDescription>
              </div>
              <Button asChild>
                <Link href={downloadUrl}>
                  <IconDownload />
                  Download
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isImage ? (
              <div className="bg-muted/30 overflow-hidden rounded-lg border">
                <img
                  src={downloadUrl}
                  alt={media.originalName}
                  className="h-auto w-full"
                />
              </div>
            ) : (
              <div className="bg-muted/30 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
                <IconFileText className="text-muted-foreground h-16 w-16" />
                <div className="space-y-2">
                  <p className="text-muted-foreground font-medium">
                    This file is not an image
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Use the download button to open it
                  </p>
                </div>
                <Badge variant="outline" className="uppercase">
                  {media.originalName.split(".").pop() ?? "file"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
