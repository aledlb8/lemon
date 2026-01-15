"use client"

import { useState } from "react"
import Link from "next/link"

type InviteItem = {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  usedBy: string | null
}

type AdminInvitesClientProps = {
  invites: InviteItem[]
}

export default function AdminInvitesClient({ invites }: AdminInvitesClientProps) {
  const [items, setItems] = useState(invites)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const createInvite = async () => {
    setLoading(true)
    const response = await fetch("/api/admin/invites", { method: "POST" })
    setLoading(false)

    if (!response.ok) {
      setMessage("Failed to create invite.")
      return
    }

    const data = await response.json()
    const invite = data.invite
    if (invite) {
      setItems((prev) => [
        {
          id: invite.id,
          code: invite.code,
          createdAt: invite.createdAt,
          usedAt: null,
          usedBy: null,
        },
        ...prev,
      ])
      setMessage("Invite created.")
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Admin invites</h1>
            <Link
              href="/dashboard"
              className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition"
            >
              Back to dashboard
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">
            Generate invite codes for new users.
          </p>
        </header>

        <div className="flex items-center gap-3">
          <button
            onClick={createInvite}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-xs transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "New invite"}
          </button>
          {message && <span className="text-muted-foreground text-xs">{message}</span>}
        </div>

        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Recent invites
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {items.length === 0 && (
              <div className="text-muted-foreground text-sm">No invites yet.</div>
            )}
            {items.map((invite) => (
              <div
                key={invite.id}
                className="border-border flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <code className="bg-muted rounded-md px-2 py-1 text-xs">
                    {invite.code}
                  </code>
                  <button
                    className="border-border hover:bg-muted rounded-md border px-2 py-1 text-[10px]"
                    onClick={async () => {
                      await navigator.clipboard.writeText(invite.code)
                    }}
                  >
                    Copy
                  </button>
                </div>
                <div className="text-muted-foreground text-xs">
                  Created {new Date(invite.createdAt).toLocaleString()}
                </div>
                {invite.usedAt ? (
                  <div className="text-muted-foreground text-xs">
                    Used {new Date(invite.usedAt).toLocaleString()}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">Unused</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
