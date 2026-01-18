"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/formatting"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertCard } from "@/components/ui/alert-card"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCopy,
  IconDotsVertical,
  IconExternalLink,
  IconKey,
  IconPlus,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type InviteItem = {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  usedByUsername: string | null
}

type AdminInvitesClientProps = {
  invites: InviteItem[]
}

export default function AdminInvitesClient({ invites }: AdminInvitesClientProps) {
  const [items, setItems] = useState(invites)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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
    setMessage(null)
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
          usedByUsername: null,
        },
        ...prev,
      ])
    }
  }

  const deleteInvite = async (inviteId: string) => {
    setDeletingId(inviteId)
    setMessage(null)

    const response = await fetch(`/api/admin/invites/${inviteId}`, {
      method: "DELETE",
    })

    setDeletingId(null)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setMessage(data.error ?? "Failed to delete invite.")
      return
    }

    setItems((prev) => prev.filter((invite) => invite.id !== inviteId))
    setMessage("Invite deleted successfully.")
    setTimeout(() => setMessage(null), 3000)
  }

  const unusedCount = items.filter((invite) => !invite.usedAt).length
  const usedCount = items.length - unusedCount
  const messageIsError = message?.toLowerCase().includes("fail") ?? false

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:py-12">
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
              <Link href="/admin/users">
                <IconShieldCheck />
                Users
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <IconArrowLeft />
                Dashboard
              </Link>
            </Button>
          </div>
        </header>

        {message && (
          <AlertCard
            message={message}
            variant={messageIsError ? "error" : "success"}
          />
        )}

        <section className="grid gap-6 md:grid-cols-4">
          <Card className="border-2 md:col-span-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Create invite
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Issue a fresh code for onboarding new users
                  </p>
                </div>
                <Button onClick={createInvite} disabled={loading} size="lg" className="font-semibold">
                  <IconPlus />
                  {loading ? "Creating..." : "New invite"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Available
                  </p>
                  <p className="text-3xl font-bold">{unusedCount}</p>
                </div>
                <IconKey className="text-primary h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Used
                  </p>
                  <p className="text-3xl font-bold">{usedCount}</p>
                </div>
                <IconCircleCheck className="text-chart-3 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>All invites</CardTitle>
            <CardDescription>
              {items.length} invite{items.length === 1 ? "" : "s"} issued
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState
                icon={IconKey}
                title="No invites yet"
                description="Create a code to onboard your first user"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Invite code
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Used by
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Created
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Used at
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-xs font-medium uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                            {invite.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(invite.id, invite.code)}
                          >
                            {copiedId === invite.id ? (
                              <IconCircleCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <IconCopy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={invite.usedAt ? "secondary" : "default"}>
                          {invite.usedAt ? "Used" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invite.usedByUsername ? (
                          <Link
                            href={`/u/${invite.usedByUsername}`}
                            className="text-primary hover:underline text-sm font-medium hover:underline-offset-2"
                          >
                            {invite.usedByUsername}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(new Date(invite.createdAt))}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {invite.usedAt
                          ? formatDate(new Date(invite.usedAt))
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDotsVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCopy(invite.id, invite.code)}
                              >
                                <IconCopy className="h-4 w-4" />
                                Copy code
                              </DropdownMenuItem>
                              {invite.usedByUsername && (
                                <DropdownMenuItem asChild>
                                  <Link target="_blank" href={`/u/${invite.usedByUsername}`}>
                                    <IconExternalLink className="h-4 w-4" />
                                    View user profile
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {!invite.usedAt && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => deleteInvite(invite.id)}
                                    disabled={deletingId === invite.id}
                                  >
                                    <IconTrash className="h-4 w-4" />
                                    {deletingId === invite.id ? "Deleting..." : "Delete invite"}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
