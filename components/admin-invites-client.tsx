"use client"

import { useState } from "react"
import Link from "next/link"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertCard } from "@/components/ui/alert-card"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconCopy,
  IconKey,
  IconPlus,
  IconShieldCheck,
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  const handleCopy = async (inviteId: string, code: string) => {
    await copyToClipboard(code)
    setCopiedId(inviteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
    }
  }

  const unusedCount = items.filter((invite) => !invite.usedAt).length
  const usedCount = items.length - unusedCount
  const messageIsError = message?.toLowerCase().includes("fail") ?? false

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Admin invites</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                <IconShieldCheck />
                Admin tools
              </Badge>
              <span className="text-muted-foreground text-sm">
                Generate invite codes for new users.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <IconArrowLeft />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </header>

        {message && <AlertCard message={message} variant={messageIsError ? "error" : "info"} />}

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPlus className="h-5 w-5" />
                Create invite
              </CardTitle>
              <CardDescription>
                Issue a fresh code for onboarding new users. Each code is single-use.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Button onClick={createInvite} disabled={loading} size="lg" className="font-semibold">
                  <IconPlus />
                  {loading ? "Creating..." : "New invite"}
                </Button>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <IconKey className="h-4 w-4" />
                  <span className="text-sm font-medium">{unusedCount} available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                Stats
              </CardTitle>
              <CardDescription>Track usage at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-muted-foreground text-sm font-medium">Total</span>
                <span className="text-3xl font-bold">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Available</span>
                <Badge variant="default" className="text-base px-3 py-1.5">{unusedCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Used</span>
                <Badge variant="secondary" className="text-base px-3 py-1.5">{usedCount}</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <IconKey className="h-6 w-6" />
              Recent invites
            </h2>
            <p className="text-muted-foreground text-sm">
              {items.length} invite{items.length === 1 ? "" : "s"} issued
            </p>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && (
            <EmptyState
              icon={IconKey}
              title="No invites yet"
              description="Create a code to onboard your first user"
            />
          )}
          {items.map((invite) => (
            <Card
              key={invite.id}
              className={`group transition-all duration-200 hover:shadow-lg border-2 ${invite.usedAt ? "opacity-75" : "hover:border-primary/50"
                }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={invite.usedAt ? "secondary" : "default"}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {invite.usedAt ? (
                      <IconCircleCheck className="h-3.5 w-3.5" />
                    ) : (
                      <IconCircleCheck className="h-3.5 w-3.5" />
                    )}
                    {invite.usedAt ? "Used" : "Available"}
                  </Badge>
                  {invite.usedAt && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconCircleCheck className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        Redeemed {new Date(invite.usedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <IconClock className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    Created {new Date(invite.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-2">Invite code</p>
                  <div className="bg-muted/70 border rounded-lg p-3 transition-colors hover:bg-muted flex items-start justify-between gap-2">
                    <code className="font-mono text-sm break-all select-all flex-1">
                      {invite.code}
                    </code>
                    <Button
                      onClick={() => handleCopy(invite.id, invite.code)}
                      aria-label="Copy invite code"
                    >
                      {copiedId === invite.id ? (
                        <IconCircleCheck className="h-4 w-4" />
                      ) : (
                        <IconCopy />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}