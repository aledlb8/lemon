"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Welcome back, {user.username}</h1>
            <p className="text-muted-foreground text-sm">
              {user.role === 1 ? "Administrator" : "Standar User"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user.role === 1 && (
              <Link
                href="/admin/invites"
                className="border-border hover:bg-muted rounded-md border px-3 py-1.5 transition"
              >
                Admin invites
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="border-border hover:bg-muted rounded-md border px-3 py-1.5 transition"
            >
              Sign out
            </button>
          </div>
        </header>

        {message && (
          <div className="border-border bg-card text-sm rounded-md border px-4 py-3">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <div className="text-sm font-medium">ShareX upload key</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Send screenshots to <code className="text-xs">/api/upload</code>{" "}
              with your upload key.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {uploadKey ? (
                <code className="bg-muted text-foreground rounded-md px-3 py-2 text-xs">
                  {uploadKey}
                </code>
              ) : (
                <div className="text-muted-foreground text-xs">
                  Generate a new key to reveal it here.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs transition"
                  type="button"
                  onClick={regenerateUploadKey}
                >
                  Regenerate key
                </button>
                <button
                  className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition"
                  type="button"
                  onClick={downloadShareXConfig}
                >
                  Download ShareX config
                </button>
                {uploadKey && (
                  <button
                    className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition"
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(uploadKey)
                    }}
                  >
                    Copy key
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <div className="text-sm font-medium">Default visibility</div>
            <p className="text-muted-foreground mt-1 text-xs">
              New uploads will be {visibility}.
            </p>
            <div className="mt-4 flex gap-3 text-xs">
              {(["public", "private"] as Visibility[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateVisibility(value)}
                  className={`rounded-md px-3 py-1.5 transition ${visibility === value
                    ? "bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted border"
                    }`}
                >
                  {value}
                </button>
              ))}
            </div>
            {origin && (
              <div className="text-muted-foreground mt-4 text-xs space-y-1">
                <div>
                  Upload endpoint:{" "}
                  <code className="text-xs">{origin}/api/upload</code>
                </div>
                <div>
                  Header: <code className="text-xs">X-Upload-Key</code>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Uploads</h2>
            <p className="text-muted-foreground text-xs">
              {items.length} item{items.length === 1 ? "" : "s"} stored
            </p>
          </div>
          <button
            onClick={refreshMedia}
            className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition"
          >
            Refresh
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No uploads yet. Send something from ShareX to get started.
            </div>
          )}
          {items.map((item) => {
            const isImage = item.contentType.startsWith("image/")
            const downloadUrl = `/api/media/${item.id}/download`
            return (
              <div
                key={item.id}
                className="border-border bg-card flex h-full flex-col gap-3 rounded-2xl border p-4 shadow-sm"
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
                <div className="flex flex-1 flex-col gap-1">
                  <div className="text-sm font-medium">{item.originalName}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatSize(item.size)} · {item.visibility}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Link
                    href={`/file/${item.id}`}
                    className="text-foreground underline"
                  >
                    View
                  </Link>
                  <button
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => handleDelete(item.id)}
                    disabled={busyId === item.id}
                  >
                    {busyId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
