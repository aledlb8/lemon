"use client"

import { useState } from "react"
import Link from "next/link"
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

        {message && (
          <Card className={messageIsError ? "border-destructive/50 bg-destructive/10" : "bg-muted/40"}>
            <CardContent>
              <p className="text-sm">{message}</p>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPlus className="h-5 w-5" />
                Create invite
              </CardTitle>
              <CardDescription>
                Issue a fresh code for onboarding new users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-muted-foreground text-sm">
                Share the invite code securely. Each code is single-use.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={createInvite} disabled={loading}>
                  <IconPlus />
                  {loading ? "Creating..." : "New invite"}
                </Button>
                <Badge variant="secondary">
                  <IconKey />
                  {unusedCount} available
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                Invite stats
              </CardTitle>
              <CardDescription>Track usage at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total invites</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Unused</span>
                <Badge variant="default">{unusedCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Used</span>
                <Badge variant="secondary">{usedCount}</Badge>
              </div>
              {items[0] && (
                <div className="text-muted-foreground text-xs">
                  Latest created {new Date(items[0].createdAt).toLocaleString()}
                </div>
              )}
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
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <IconKey className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground mb-2 text-lg font-medium">
                  No invites yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Create a code to onboard your first user
                </p>
              </CardContent>
            </Card>
          )}
          {items.map((invite) => (
            <Card key={invite.id} className="group transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconKey className="h-5 w-5" />
                  Invite code
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <IconClock className="h-4 w-4" />
                  {new Date(invite.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 border-border rounded-lg border p-3 font-mono text-xs break-all">
                  {invite.code}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={invite.usedAt ? "secondary" : "default"}>
                    {invite.usedAt ? <IconCircleCheck /> : <IconCircleX />}
                    {invite.usedAt ? "Used" : "Unused"}
                  </Badge>
                  {invite.usedAt ? (
                    <span className="text-muted-foreground text-xs">Redeemed</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Available</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 pt-2">
                <div className="text-muted-foreground text-xs">
                  {invite.usedAt
                    ? `Used ${new Date(invite.usedAt).toLocaleString()}`
                    : "Not used yet"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(invite.code)
                  }}
                >
                  <IconCopy />
                  Copy
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
