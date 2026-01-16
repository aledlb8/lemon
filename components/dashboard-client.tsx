"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { MediaCard } from "@/components/media-card"
import { AlertCard } from "@/components/ui/alert-card"
import { ImageModal } from "@/components/ui/image-modal"
import { AccountModal } from "@/components/account-modal"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  IconKey,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconDownload,
  IconCopy,
  IconLogout,
  IconUpload,
  IconShieldCheck,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Visibility = "public" | "private"

type DashboardUser = {
  id: string
  email: string
  username: string
  role: number
  defaultVisibility: Visibility
  createdAt: string
  updatedAt: string
  hasUploadKey: boolean
}

type MediaItem = {
  id: string
  originalName: string
  contentType: string
  size: number
  visibility: Visibility
  createdAt: string
}

type DashboardClientProps = {
  user: DashboardUser
  media: MediaItem[]
}

export default function DashboardClient({ user, media }: DashboardClientProps) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(user)
  const [items, setItems] = useState(media)
  const [visibility, setVisibility] = useState<Visibility>(
    user.defaultVisibility
  )
  const [uploadKey, setUploadKey] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  const mediaItems = items.filter((item) =>
    item.contentType.startsWith("image/") || item.contentType.startsWith("video/")
  )

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const refreshMedia = async () => {
    const response = await fetch("/api/media?limit=200")
    if (!response.ok) return
    const data = await response.json()
    setItems(data.media ?? [])
  }

  const updateVisibility = async (next: Visibility) => {
    setVisibility(next)
    await fetch("/api/user/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ defaultVisibility: next }),
    })
  }

  const regenerateUploadKey = async () => {
    const response = await fetch("/api/user/upload-key", { method: "POST" })
    if (!response.ok) {
      setMessage("Failed to regenerate key.")
      return
    }
    const data = await response.json()
    setUploadKey(data.uploadKey ?? null)
  }

  const downloadShareXConfig = () => {
    window.location.href = "/api/sharex-config"
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    const response = await fetch(`/api/media/${id}`, { method: "DELETE" })
    setBusyId(null)
    if (!response.ok) {
      setMessage("Failed to delete upload.")
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleMediaVisibilityChange = async (id: string, newVisibility: Visibility) => {
    setBusyId(id)
    const response = await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility: newVisibility }),
    })
    setBusyId(null)
    if (!response.ok) {
      setMessage("Failed to update visibility.")
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visibility: newVisibility } : item
      )
    )
  }

  const handleCopyLink = (id: string) => {
    const link = `${origin}/file/${id}`
    copyToClipboard(link)
  }

  const handleImageClick = (id: string) => {
    const index = mediaItems.findIndex((item) => item.id === id)
    if (index !== -1) {
      setModalImageIndex(index)
    }
  }

  const handleModalClose = () => {
    setModalImageIndex(null)
  }

  const handleModalPrevious = () => {
    setModalImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
  }

  const handleModalNext = () => {
    setModalImageIndex((prev) =>
      prev !== null && prev < mediaItems.length - 1 ? prev + 1 : prev
    )
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back, <Link href={`/u/${currentUser.username}`} className="hover:underline font-bold text-primary hover:underline-offset-4 hover:decoration-2 hover:decoration-chart-3/80">{currentUser.username}</Link></h1>
            <div className="flex items-center gap-2">
              <AccountModal
                user={currentUser}
                media={items}
                onUserUpdate={setCurrentUser}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser.role === 1 && (
              <Button variant="outline" asChild>
                <Link href="/admin/invites">
                  <IconShieldCheck />
                  Admin invites
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <IconLogout />
              Sign out
            </Button>
          </div>
        </header>

        {message && <AlertCard message={message} variant="error" />}

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                ShareX Upload Key
              </CardTitle>
              <CardDescription>
                Send screenshots to <code className="text-xs">/api/upload</code> with your upload key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={regenerateUploadKey} className="flex-1">
                  <IconKey />
                  Regenerate key
                </Button>
                <Button variant="outline" onClick={downloadShareXConfig} className="flex-1">
                  <IconDownload />
                  Download config
                </Button>
              </div>
              {uploadKey ? (
                <div className="bg-muted/30 text-muted-foreground space-y-2 rounded-lg border border-dashed p-4 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="font-medium shrink-0">Upload Key:</span>
                      <code className="text-foreground break-all">{uploadKey}</code>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(uploadKey)}
                      className="hover:bg-primary/80"
                      aria-label="Copy upload key"
                    >
                      <IconCopy />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                  Generate a new key to reveal it here
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {visibility === "public" ? (
                  <IconEye className="h-5 w-5" />
                ) : (
                  <IconEyeOff className="h-5 w-5" />
                )}
                Default Visibility
              </CardTitle>
              <CardDescription>
                New uploads will be {visibility} by default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(["public", "private"] as Visibility[]).map((value) => (
                  <Button
                    key={value}
                    variant={visibility === value ? "default" : "outline"}
                    onClick={() => updateVisibility(value)}
                    className="flex-1 capitalize"
                  >
                    {value === "public" ? <IconEye /> : <IconEyeOff />}
                    {value}
                  </Button>
                ))}
              </div>
              {origin && (
                <div className="bg-muted/30 text-muted-foreground space-y-2 rounded-lg border border-dashed p-4 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Endpoint:</span>
                    <code className="text-foreground">{origin}/api/upload</code>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Header:</span>
                    <code className="text-foreground">X-Upload-Key</code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <IconUpload className="h-6 w-6" />
              Your Uploads
            </h2>
            <p className="text-muted-foreground text-sm">
              {items.length} item{items.length === 1 ? "" : "s"} stored
            </p>
          </div>
          <Button variant="outline" onClick={refreshMedia} size="sm">
            <IconRefresh />
            Refresh
          </Button>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && (
            <EmptyState
              icon={IconUpload}
              title="No uploads yet"
              description="Send something from ShareX to get started"
            />
          )}
          {items.map((item) => (
            <MediaCard
              key={item.id}
              id={item.id}
              originalName={item.originalName}
              contentType={item.contentType}
              size={item.size}
              visibility={item.visibility}
              onDelete={handleDelete}
              onVisibilityChange={handleMediaVisibilityChange}
              onCopyLink={handleCopyLink}
              onImageClick={handleImageClick}
              isDeleting={busyId === item.id}
            />
          ))}
        </section>
      </div>

      {modalImageIndex !== null && mediaItems[modalImageIndex] && (
        <ImageModal
          isOpen={true}
          imageUrl={`/api/media/${mediaItems[modalImageIndex].id}/download`}
          imageName={mediaItems[modalImageIndex].originalName}
          contentType={mediaItems[modalImageIndex].contentType}
          onClose={handleModalClose}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
          hasPrevious={modalImageIndex > 0}
          hasNext={modalImageIndex < mediaItems.length - 1}
        />
      )}
    </main>
  )
}
