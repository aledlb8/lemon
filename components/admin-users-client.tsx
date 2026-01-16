"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/formatting"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertCard } from "@/components/ui/alert-card"
import {
  IconArrowLeft,
  IconBan,
  IconCircleCheck,
  IconCircleX,
  IconDotsVertical,
  IconExternalLink,
  IconShieldCheck,
  IconUser,
  IconUsers,
  IconShield,
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

type UserItem = {
  id: string
  email: string
  username: string
  role: number
  createdAt: string
  updatedAt: string
  invitedBy: string | null
  inviteCode: string | null
}

type AdminUsersClientProps = {
  users: UserItem[]
}

export default function AdminUsersClient({ users }: AdminUsersClientProps) {
  const [items, setItems] = useState(users)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleBanUser = async (userId: string, currentRole: number) => {
    setBusyId(userId)
    setMessage(null)

    const response = await fetch(`/api/admin/users/${userId}/ban`, {
      method: "POST",
    })

    setBusyId(null)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setMessage(data.error ?? "Failed to update user status.")
      return
    }

    const data = await response.json()
    setMessage(data.message)

    setItems((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: data.role } : user
      )
    )

    setTimeout(() => setMessage(null), 3000)
  }

  const stats = {
    total: items.length,
    admins: items.filter((u) => u.role === 1).length,
    users: items.filter((u) => u.role === 0).length,
    banned: items.filter((u) => u.role === -1).length,
  }

  const getRoleBadge = (role: number) => {
    if (role === 1) {
      return (
        <Badge variant="default" className="gap-1">
          <IconShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      )
    }
    if (role === -1) {
      return (
        <Badge variant="destructive" className="gap-1">
          <IconBan className="h-3 w-3" />
          Banned
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <IconUser className="h-3 w-3" />
        User
      </Badge>
    )
  }

  const messageIsError = message?.toLowerCase().includes("fail") ?? false

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">User management</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                <IconShieldCheck />
                Admin tools
              </Badge>
              <span className="text-muted-foreground text-sm">
                Manage all registered users and their permissions.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/invites">
                <IconShield />
                Invites
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
          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Total users
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <IconUsers className="text-muted-foreground h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Admins
                  </p>
                  <p className="text-3xl font-bold">{stats.admins}</p>
                </div>
                <IconShieldCheck className="text-primary h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Active users
                  </p>
                  <p className="text-3xl font-bold">{stats.users}</p>
                </div>
                <IconUser className="text-chart-3 h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Banned
                  </p>
                  <p className="text-3xl font-bold">{stats.banned}</p>
                </div>
                <IconBan className="text-destructive h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>All users</CardTitle>
            <CardDescription>
              {items.length} registered user{items.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState
                icon={IconUsers}
                title="No users yet"
                description="Users will appear here once they register"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      User
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Email
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Role
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Invited by
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Member since
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Last updated
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-xs font-medium uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium">{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.invitedBy ? (
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/u/${user.invitedBy}`}
                              className="text-primary hover:underline text-sm font-medium hover:underline-offset-2"
                            >
                              {user.invitedBy}
                            </Link>
                            {user.inviteCode && (
                              <Badge variant="outline" className="text-xs">
                                {user.inviteCode}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Direct signup
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(new Date(user.createdAt))}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(new Date(user.updatedAt))}
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
                              <DropdownMenuItem asChild>
                                <Link target="_blank" href={`/u/${user.username}`}>
                                  <IconExternalLink className="h-4 w-4" />
                                  View profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant={user.role === -1 ? "default" : "destructive"}
                                onClick={() => handleBanUser(user.id, user.role)}
                                disabled={busyId === user.id}
                              >
                                <IconBan className="h-4 w-4" />
                                {busyId === user.id
                                  ? "Processing..."
                                  : user.role === -1
                                    ? "Unban user"
                                    : "Ban user"}
                              </DropdownMenuItem>
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
