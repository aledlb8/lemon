"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { IconFileText } from "@tabler/icons-react"

type SecureMediaPreviewProps = {
  id: string
  originalName: string
  contentType: string
}

export function SecureMediaPreview({
  id,
  originalName,
  contentType,
}: SecureMediaPreviewProps) {
  const isImage = contentType.startsWith("image/")
  const isVideo = contentType.startsWith("video/")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!isImage && !isVideo) return
    setPreviewUrl(null)
    setHasError(false)
    const controller = new AbortController()
    let objectUrl: string | null = null

    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/media/${id}/download`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error("Failed to load preview.")
        }
        const blob = await response.blob()
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Failed to load preview:", error)
        setHasError(true)
      }
    }

    loadPreview()

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [id, isImage, isVideo])

  if (!isImage && !isVideo) {
    return (
      <div className="bg-muted/30 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
        <IconFileText className="text-muted-foreground h-16 w-16" />
        <div className="space-y-2">
          <p className="text-muted-foreground font-medium">
            This file cannot be previewed
          </p>
          <p className="text-muted-foreground text-sm">
            Use the download button to open it
          </p>
        </div>
        <Badge variant="outline" className="uppercase">
          {originalName.split(".").pop() ?? "file"}
        </Badge>
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="bg-muted/30 flex min-h-[240px] items-center justify-center rounded-lg border">
        <p className="text-muted-foreground text-sm">
          {hasError ? "Preview unavailable" : "Loading preview..."}
        </p>
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className="bg-muted/30 overflow-hidden rounded-lg border">
        <video src={previewUrl} controls className="h-auto w-full">
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 overflow-hidden rounded-lg border">
      <img src={previewUrl} alt={originalName} className="h-auto w-full" />
    </div>
  )
}
