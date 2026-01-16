"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"

import { formatDate, formatSize } from "@/lib/formatting"
import { AlertCard } from "@/components/ui/alert-card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  IconCalendar,
  IconCheck,
  IconEdit,
  IconEye,
  IconKey,
  IconLock,
  IconMail,
  IconRefresh,
  IconShieldCheck,
  IconUpload,
  IconUser,
  IconX,
} from "@tabler/icons-react"

type Visibility = "public" | "private"

type AccountModalUser = {
  id: string
  email: string
  username: string
  role: number
  defaultVisibility: Visibility
  createdAt: string
  updatedAt: string
  hasUploadKey: boolean
}

type AccountModalMediaItem = {
  id: string
  originalName: string
  contentType: string
  size: number
  visibility: Visibility
  createdAt: string
}

type AccountModalProps = {
  user: AccountModalUser
  media: AccountModalMediaItem[]
  onUserUpdate?: (nextUser: AccountModalUser) => void
}

export function AccountModal({ user, media, onUserUpdate }: AccountModalProps) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const [passwordStatus, setPasswordStatus] = useState<{
    variant: "error" | "success"
    message: string
  } | null>(null)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [usernameInput, setUsernameInput] = useState(user.username)
  const [usernameBusy, setUsernameBusy] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<{
    variant: "error" | "success"
    message: string
  } | null>(null)
  const [isEditingUsername, setIsEditingUsername] = useState(false)

  useEffect(() => {
    setUsernameInput(user.username)
    setIsEditingUsername(false)
  }, [user.username])

  const stats = useMemo(() => {
    const totalSize = media.reduce((sum, item) => sum + item.size, 0)
    const publicCount = media.filter((item) => item.visibility === "public").length
    const privateCount = media.length - publicCount
    const imageCount = media.filter((item) =>
      item.contentType.startsWith("image/")
    ).length
    const videoCount = media.filter((item) =>
      item.contentType.startsWith("video/")
    ).length
    const latestUpload = media.reduce((latest, item) => {
      const timestamp = new Date(item.createdAt).getTime()
      return timestamp > latest ? timestamp : latest
    }, 0)
    const lastUploadLabel = latestUpload
      ? formatDate(new Date(latestUpload))
      : "No uploads yet"

    return {
      totalSize,
      publicCount,
      privateCount,
      imageCount,
      videoCount,
      lastUploadLabel,
    }
  }, [media])

  const handleAccountOpenChange = (nextOpen: boolean) => {
    setAccountOpen(nextOpen)
    if (!nextOpen) {
      setPasswordForm({ current: "", next: "", confirm: "" })
      setPasswordStatus(null)
      setPasswordBusy(false)
      setUsernameStatus(null)
      setIsEditingUsername(false)
      setUsernameInput(user.username)
      setIsChangingPassword(false)
    }
  }

  const closeModal = () => {
    handleAccountOpenChange(false)
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordStatus(null)

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordStatus({
        variant: "error",
        message: "Please fill out all password fields.",
      })
      return
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordStatus({
        variant: "error",
        message: "New password and confirmation do not match.",
      })
      return
    }

    if (passwordForm.current === passwordForm.next) {
      setPasswordStatus({
        variant: "error",
        message: "New password must be different from the current password.",
      })
      return
    }

    setPasswordBusy(true)
    const response = await fetch("/api/user/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.current,
        nextPassword: passwordForm.next,
      }),
    })
    setPasswordBusy(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setPasswordStatus({
        variant: "error",
        message: data.error ?? "Unable to update password.",
      })
      return
    }

    setPasswordStatus({
      variant: "success",
      message: "Password updated successfully.",
    })
    setPasswordForm({ current: "", next: "", confirm: "" })
    setTimeout(() => {
      setIsChangingPassword(false)
      setPasswordStatus(null)
    }, 2000)
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setPasswordForm({ current: "", next: "", confirm: "" })
    setPasswordStatus(null)
  }

  const handleUsernameSubmit = async () => {
    setUsernameStatus(null)

    if (!usernameInput.trim()) {
      setUsernameStatus({
        variant: "error",
        message: "Username cannot be empty.",
      })
      return
    }

    if (usernameInput.trim().toLowerCase() === user.username.toLowerCase()) {
      setIsEditingUsername(false)
      setUsernameInput(user.username)
      return
    }

    setUsernameBusy(true)
    const response = await fetch("/api/user/username", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: usernameInput }),
    })
    setUsernameBusy(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setUsernameStatus({
        variant: "error",
        message: data.error ?? "Unable to update username.",
      })
      return
    }

    const data = await response.json().catch(() => ({}))
    const nextUsername = data.username ?? usernameInput.trim().toLowerCase()
    onUserUpdate?.({ ...user, username: nextUsername })
    setUsernameInput(nextUsername)
    setIsEditingUsername(false)
    setUsernameStatus({
      variant: "success",
      message: "Username updated successfully.",
    })
  }

  const handleCancelUsernameEdit = () => {
    setIsEditingUsername(false)
    setUsernameInput(user.username)
    setUsernameStatus(null)
  }

  return (
    <AlertDialog open={accountOpen} onOpenChange={handleAccountOpenChange}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground text-sm font-bold hover:underline hover:cursor-pointer hover:underline-offset-4 hover:decoration-2 hover:decoration-chart-3/80"
        >
          {user.email}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="max-h-[85vh] overflow-y-auto data-[size=default]:max-w-[92vw] data-[size=default]:sm:max-w-3xl data-[size=default]:lg:max-w-4xl"
        onEscapeKeyDown={closeModal}
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <IconUser />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-semibold">Account overview</AlertDialogTitle>
          <AlertDialogDescription>
            Manage your profile details, security settings, and review account statistics.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-6">
          <Card className="border-2">
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconMail className="h-3.5 w-3.5" />
                  Email
                </div>
                <div className="text-foreground font-medium">{user.email}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconUser className="h-3.5 w-3.5" />
                  Username
                </div>
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={usernameInput}
                      onChange={(event) => setUsernameInput(event.target.value)}
                      autoComplete="username"
                      disabled={usernameBusy}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUsernameSubmit()
                        } else if (e.key === "Escape") {
                          handleCancelUsernameEdit()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={handleUsernameSubmit}
                      disabled={usernameBusy}
                    >
                      <IconCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCancelUsernameEdit}
                      disabled={usernameBusy}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/username">
                    <div className="text-foreground font-medium">{user.username}</div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover/username:opacity-100 transition-opacity shrink-0"
                      onClick={() => setIsEditingUsername(true)}
                    >
                      <IconEdit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              {usernameStatus && (
                <div className="sm:col-span-2">
                  <AlertCard
                    message={usernameStatus.message}
                    variant={usernameStatus.variant}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconShieldCheck className="h-3.5 w-3.5" />
                  Role
                </div>
                <Badge variant={user.role === 1 ? "default" : "secondary"}>
                  {user.role === 1 ? "Administrator" : "Standard User"}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconEye className="h-3.5 w-3.5" />
                  Default visibility
                </div>
                <Badge variant="outline" className="capitalize">
                  {user.defaultVisibility}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconKey className="h-3.5 w-3.5" />
                  Upload key
                </div>
                <Badge variant={user.hasUploadKey ? "default" : "secondary"}>
                  {user.hasUploadKey ? "Configured" : "Not set"}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconCalendar className="h-3.5 w-3.5" />
                  Member since
                </div>
                <div className="text-foreground font-medium">
                  {formatDate(new Date(user.createdAt))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <IconRefresh className="h-3.5 w-3.5" />
                  Last updated
                </div>
                <div className="text-foreground font-medium">
                  {formatDate(new Date(user.updatedAt))}
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  User ID
                </div>
                <code className="text-foreground text-xs break-all">{user.id}</code>
              </div>
              <div className="sm:col-span-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors group/password-toggle"
                >
                  <IconLock className="h-4 w-4" />
                  {isChangingPassword ? "Cancel password change" : "Change password"}
                </button>
                {isChangingPassword && (
                  <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="account-current-password" className="text-xs">
                          Current password
                        </FieldLabel>
                        <Input
                          id="account-current-password"
                          type="password"
                          autoComplete="current-password"
                          value={passwordForm.current}
                          onChange={(event) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              current: event.target.value,
                            }))
                          }
                          required
                          className="h-9 text-sm"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="account-next-password" className="text-xs">
                          New password
                        </FieldLabel>
                        <Input
                          id="account-next-password"
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.next}
                          onChange={(event) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              next: event.target.value,
                            }))
                          }
                          required
                          className="h-9 text-sm"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="account-confirm-password" className="text-xs">
                          Confirm new password
                        </FieldLabel>
                        <Input
                          id="account-confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.confirm}
                          onChange={(event) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirm: event.target.value,
                            }))
                          }
                          required
                          className="h-9 text-sm"
                        />
                      </Field>
                    </FieldGroup>
                    {passwordStatus && (
                      <AlertCard
                        message={passwordStatus.message}
                        variant={passwordStatus.variant}
                      />
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelPasswordChange}
                        disabled={passwordBusy}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={passwordBusy}>
                        {passwordBusy ? "Updating..." : "Update password"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              <IconUpload className="h-5 w-5" />
              Account statistics
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-2">
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Total uploads
                  </p>
                  <p className="mt-2 text-2xl font-bold">{media.length}</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Storage used
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatSize(stats.totalSize)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Visibility split
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {stats.publicCount} public / {stats.privateCount} private
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Media types
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {stats.imageCount} images / {stats.videoCount} videos
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 sm:col-span-2">
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Last upload
                  </p>
                  <p className="mt-2 text-base font-semibold">{stats.lastUploadLabel}</p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
