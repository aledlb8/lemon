"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconPhoto, IconFileText, IconEye, IconEyeOff, IconDotsVertical, IconCopy, IconTrash } from "@tabler/icons-react"
import { formatSize } from "@/lib/formatting"

interface MediaCardProps {
  id: string
  originalName: string
  contentType: string
  size: number
  visibility?: "public" | "private"
  showVisibility?: boolean
  onDelete?: (id: string) => void
  onVisibilityChange?: (id: string, visibility: "public" | "private") => void
  onCopyLink?: (id: string) => void
  isDeleting?: boolean
}

export function MediaCard({
  id,
  originalName,
  contentType,
  size,
  visibility,
  showVisibility = true,
  onDelete,
  onVisibilityChange,
  onCopyLink,
  isDeleting,
}: MediaCardProps) {
  const isImage = contentType.startsWith("image/")
  const downloadUrl = `/api/media/${id}/download`
  const fileExtension = originalName.split(".").pop() ?? "file"

  const handleVisibilityToggle = () => {
    if (onVisibilityChange && visibility) {
      const newVisibility = visibility === "public" ? "private" : "public"
      onVisibilityChange(id, newVisibility)
    }
  }

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink(id)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id)
    }
  }

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50">
      <div className="bg-muted/50 relative flex aspect-video items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={downloadUrl}
            alt={originalName}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IconFileText className="text-muted-foreground h-12 w-12" />
            <Badge variant="outline" className="uppercase">
              {fileExtension}
            </Badge>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 backdrop-blur-sm">
                <IconDotsVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onVisibilityChange && visibility && (
                <>
                  <DropdownMenuItem onClick={handleVisibilityToggle}>
                    {visibility === "public" ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                    Make {visibility === "public" ? "private" : "public"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onCopyLink && (
                <DropdownMenuItem onClick={handleCopyLink}>
                  <IconCopy className="h-4 w-4" />
                  Copy link
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} variant="destructive" disabled={isDeleting}>
                    <IconTrash className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 text-base">
          <Link href={`/file/${id}`} className="hover:underline font-bold text-primary">
            {originalName}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>{formatSize(size)}</span>
          {showVisibility && visibility && (
            <>
              <span>·</span>
              <Badge variant={visibility === "public" ? "default" : "secondary"} className="h-5 text-xs">
                {visibility === "public" ? (
                  <IconEye className="h-3 w-3" />
                ) : (
                  <IconEyeOff className="h-3 w-3" />
                )}
                {visibility}
              </Badge>
            </>
          )}
          {isImage && (
            <>
              <span>·</span>
              <Badge variant="secondary" className="h-5 text-xs gap-1">
                <IconPhoto className="h-3 w-3" />
                Image
              </Badge>
            </>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
