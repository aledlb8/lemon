"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDate } from "@/lib/formatting"
import { EmptyState } from "@/components/ui/empty-state"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCopy,
  IconDotsVertical,
  IconExternalLink,
  IconGift,
  IconKey,
  IconPlus,
  IconShieldCheck,
  IconTrash,
  IconUsers,
  IconUser,
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type InviteItem = {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  usedByUsername: string | null
  ownedByUsername: string | null
}

type AdminInvitesClientProps = {
  invites: InviteItem[]
}

type GiftMode = "user" | "wave" | null

export default function AdminInvitesClient({ invites }: AdminInvitesClientProps) {
  const [items, setItems] = useState(invites)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  // Gift modal state
  const [giftMode, setGiftMode] = useState<GiftMode>(null)
  const [giftUsername, setGiftUsername] = useState("")
  const [giftCount, setGiftCount] = useState(1)
  const [giftLoading, setGiftLoading] = useState(false)

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
      toast.error("Failed to create invite.")
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
          ownedByUsername: null,
        },
        ...prev,
      ])
    }
  }

  const deleteInvite = async (inviteId: string) => {
    setDeletingId(inviteId)

    const response = await fetch(`/api/admin/invites/${inviteId}`, {
      method: "DELETE",
    })

    setDeletingId(null)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to delete invite.")
      return
    }

    setItems((prev) => prev.filter((invite) => invite.id !== inviteId))
    toast.success("Invite deleted successfully.")
  }

  const handleGiftSubmit = async () => {
    if (giftMode === "user" && !giftUsername.trim()) {
      toast.error("Please enter a username.")
      return
    }

    setGiftLoading(true)

    const endpoint = giftMode === "wave" ? "/api/admin/invites/wave" : "/api/admin/invites/gift"
    const body = giftMode === "wave"
      ? { count: giftCount }
      : { username: giftUsername.trim(), count: giftCount }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })

    setGiftLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to gift invites.")
      return
    }

    const data = await response.json()
    toast.success(data.message)
    setGiftMode(null)
    setGiftUsername("")
    setGiftCount(1)

    // For single user gift, add the new invites to the list
    if (giftMode === "user" && data.invites) {
      const newInvites = data.invites.map((inv: { id: string; code: string; createdAt: string }) => ({
        id: inv.id,
        code: inv.code,
        createdAt: inv.createdAt,
        usedAt: null,
        usedByUsername: null,
        ownedByUsername: giftUsername.trim().toLowerCase(),
      }))
      setItems((prev) => [...newInvites, ...prev])
    }

    // For wave, we'd need to refresh the page to see all new invites
    if (giftMode === "wave") {
      // Refresh the page to get all new invites
      window.location.reload()
    }
  }

  const closeGiftModal = () => {
    setGiftMode(null)
    setGiftUsername("")
    setGiftCount(1)
  }

  const unusedCount = items.filter((invite) => !invite.usedAt).length
  const usedCount = items.length - unusedCount
  const giftedCount = items.filter((invite) => invite.ownedByUsername).length

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
                Generate and gift invite codes for users.
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

        <section className="grid gap-6 md:grid-cols-5">
          <Card className="border-2 md:col-span-2">
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Create invite
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Issue codes for onboarding
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button onClick={createInvite} disabled={loading}>
                    <IconPlus />
                    {loading ? "..." : "Normal"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <IconGift />
                        Gift
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setGiftMode("user")}>
                        <IconUser className="h-4 w-4" />
                        Gift to user
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setGiftMode("wave")}>
                        <IconUsers className="h-4 w-4" />
                        Wave (all users)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Gifted
                  </p>
                  <p className="text-3xl font-bold">{giftedCount}</p>
                </div>
                <IconGift className="text-chart-4 h-8 w-8" />
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
                      Owner
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Used by
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Created
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
                        {invite.ownedByUsername ? (
                          <div className="flex items-center gap-1.5">
                            <IconGift className="h-3.5 w-3.5 text-muted-foreground" />
                            <Link
                              href={`/u/${invite.ownedByUsername}`}
                              className="text-primary hover:underline text-sm font-medium hover:underline-offset-2"
                            >
                              {invite.ownedByUsername}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Admin</span>
                        )}
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
                              {(invite.usedByUsername || invite.ownedByUsername) && (
                                <DropdownMenuItem asChild>
                                  <Link target="_blank" href={`/u/${invite.usedByUsername || invite.ownedByUsername}`}>
                                    <IconExternalLink className="h-4 w-4" />
                                    View {invite.usedByUsername ? "user" : "owner"} profile
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

      {/* Gift Modal */}
      <AlertDialog open={giftMode !== null} onOpenChange={(open) => !open && closeGiftModal()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {giftMode === "wave" ? <IconUsers /> : <IconGift />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {giftMode === "wave" ? "Gift invites to all users" : "Gift invite to user"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {giftMode === "wave"
                ? "This will give invite codes to every non-banned user."
                : "Enter the username of the user you want to gift an invite to."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <FieldGroup>
            {giftMode === "user" && (
              <Field>
                <FieldLabel htmlFor="gift-username">Username</FieldLabel>
                <Input
                  id="gift-username"
                  placeholder="Enter username"
                  value={giftUsername}
                  onChange={(e) => setGiftUsername(e.target.value)}
                  autoFocus
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="gift-count">
                Number of invites {giftMode === "wave" ? "(per user)" : ""}
              </FieldLabel>
              <Input
                id="gift-count"
                type="number"
                min={1}
                max={giftMode === "wave" ? 5 : 10}
                value={giftCount}
                onChange={(e) => setGiftCount(Math.max(1, Math.min(giftMode === "wave" ? 5 : 10, parseInt(e.target.value) || 1)))}
              />
              <p className="text-muted-foreground text-xs mt-1">
                {giftMode === "wave" ? "Max 5 per user" : "Max 10"}
              </p>
            </Field>
          </FieldGroup>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={giftLoading}>Cancel</AlertDialogCancel>
            <Button onClick={handleGiftSubmit} disabled={giftLoading}>
              {giftLoading ? "Gifting..." : giftMode === "wave" ? "Send wave" : "Gift invite"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
