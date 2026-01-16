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
import { IconPhoto, IconFileText, IconEye, IconEyeOff, IconDotsVertical, IconCopy, IconTrash, IconVideo } from "@tabler/icons-react"
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
  onImageClick?: (id: string) => void
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
  onImageClick,
  isDeleting,
}: MediaCardProps) {
  const isImage = contentType.startsWith("image/")
  const isVideo = contentType.startsWith("video/")
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
            className="h-full w-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
            loading="lazy"
            onClick={() => onImageClick?.(id)}
          />
        ) : isVideo ? (
          <div
            className="relative h-full w-full cursor-pointer group/video"
            onClick={() => onImageClick?.(id)}
          >
            <video
              src={downloadUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent">
              <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 transition-transform group-hover/video:scale-110 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-foreground"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IconFileText className="text-muted-foreground h-12 w-12" />
            <Badge variant="outline" className="uppercase">
              {fileExtension}
            </Badge>
          </div>
        )}
        <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
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
          {isVideo && (
            <>
              <span>·</span>
              <Badge variant="secondary" className="h-5 text-xs gap-1">
                <IconVideo className="h-3 w-3" />
                Video
              </Badge>
            </>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
