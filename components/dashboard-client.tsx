"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconKey,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconTrash,
  IconDownload,
  IconCopy,
  IconLogout,
  IconUpload,
  IconShieldCheck,
  IconPhoto,
  IconFileText,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function DashboardClient({ user, media }: DashboardClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(media)
  const [visibility, setVisibility] = useState<Visibility>(user.defaultVisibility)
  const [uploadKey, setUploadKey] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back, <Link href={`/u/${user.username}`} className="hover:underline font-bold text-primary">{user.username}</Link></h1>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === 1 ? "default" : "secondary"}>
                {user.role === 1 ? "Administrator" : "Standard User"}
              </Badge>
              <span className="text-muted-foreground text-sm">{user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 1 && (
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

        {message && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-sm">{message}</p>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
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
              {uploadKey ? (
                <div className="bg-muted/50 border-border relative rounded-lg border p-4">
                  <code className="text-foreground text-sm break-all">
                    {uploadKey}
                  </code>
                </div>
              ) : (
                <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                  Generate a new key to reveal it here
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={regenerateUploadKey} size="sm">
                <IconKey />
                Regenerate key
              </Button>
              <Button variant="outline" onClick={downloadShareXConfig} size="sm">
                <IconDownload />
                Download config
              </Button>
              {uploadKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(uploadKey)
                  }}
                >
                  <IconCopy />
                  Copy key
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
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
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <IconUpload className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground mb-2 text-lg font-medium">
                  No uploads yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Send something from ShareX to get started
                </p>
              </CardContent>
            </Card>
          )}
          {items.map((item) => {
            const isImage = item.contentType.startsWith("image/")
            const downloadUrl = `/api/media/${item.id}/download`
            return (
              <Card key={item.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
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
                    <Link href={`/file/${item.id}`} className="hover:underline font-bold text-primary">{item.originalName}</Link>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{formatSize(item.size)}</span>
                    <span>·</span>
                    <Badge variant={item.visibility === "public" ? "default" : "secondary"} className="h-5 text-xs">
                      {item.visibility === "public" ? (
                        <IconEye className="h-3 w-3" />
                      ) : (
                        <IconEyeOff className="h-3 w-3" />
                      )}
                      {item.visibility}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2 pt-0">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/file/${item.id}`}>
                      <IconEye />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={busyId === item.id}
                  >
                    <IconTrash />
                    {busyId === item.id ? "Deleting..." : "Delete"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </section>
      </div>
    </main>
  )
}
