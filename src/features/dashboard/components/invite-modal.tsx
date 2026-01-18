"use client"

import { useState } from "react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconCircleCheck,
  IconCopy,
  IconGift,
  IconSparkles,
} from "@tabler/icons-react"

type InviteItem = {
  id: string
  code: string
  createdAt: string
}

type InviteModalProps = {
  invites: InviteItem[]
}

export function InviteModal({ invites }: InviteModalProps) {
  const [open, setOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  const handleCopy = async (inviteId: string, code: string) => {
    await copyToClipboard(code)
    setCopiedId(inviteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (invites.length === 0) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {/* <Button variant="default" className="gap-2">
          <IconSparkles className="h-4 w-4" />
          You have {invites.length} invite{invites.length > 1 ? "s" : ""}
        </Button> */}
        <button
          type="button"
          className="text-muted-foreground text-sm font-bold hover:underline hover:cursor-pointer hover:underline-offset-4 hover:decoration-2 hover:decoration-chart-3/80"
        >
          You have {invites.length} invite{invites.length > 1 ? "s" : ""}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="data-[size=default]:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary/10 text-primary">
            <IconGift />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg">
            Your invite codes
          </AlertDialogTitle>
          <AlertDialogDescription>
            Share these codes with friends to invite them to the platform.
            Each code can only be used once.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between gap-3 bg-muted/50 rounded-lg p-3 border"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Badge variant="default" className="shrink-0">
                  <IconGift className="h-3 w-3" />
                </Badge>
                <code className="font-mono text-sm truncate">
                  {invite.code}
                </code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleCopy(invite.id, invite.code)}
              >
                {copiedId === invite.id ? (
                  <IconCircleCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <IconCopy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
