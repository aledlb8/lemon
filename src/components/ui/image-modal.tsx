"use client"

import { useEffect, useState } from "react"
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface ImageModalProps {
  isOpen: boolean
  mediaId: string
  imageName: string
  contentType: string
  prefetchedUrl?: string | null
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export function ImageModal({
  isOpen,
  mediaId,
  imageName,
  contentType,
  prefetchedUrl,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: ImageModalProps) {
  const isVideo = contentType.startsWith("video/")
  const [mediaUrl, setMediaUrl] = useState<string | null>(prefetchedUrl ?? null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (prefetchedUrl) {
      setMediaUrl(prefetchedUrl)
      setHasError(false)
      return
    }
    setMediaUrl(null)
    setHasError(false)
    const controller = new AbortController()
    let objectUrl: string | null = null

    const loadMedia = async () => {
      try {
        const response = await fetch(`/api/media/${mediaId}/download`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error("Failed to load media.")
        }
        const blob = await response.blob()
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setMediaUrl(objectUrl)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Failed to load media:", error)
        setHasError(true)
      }
    }

    loadMedia()

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [isOpen, mediaId, prefetchedUrl])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious()
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        onNext()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-4 top-4 z-50 h-10 w-10"
        onClick={onClose}
      >
        <IconX className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </Button>

      {/* Previous button */}
      {hasPrevious && onPrevious && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2"
          onClick={(e) => {
            e.stopPropagation()
            onPrevious()
          }}
        >
          <IconChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous image</span>
        </Button>
      )}

      {/* Next button */}
      {hasNext && onNext && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
        >
          <IconChevronRight className="h-6 w-6" />
          <span className="sr-only">Next image</span>
        </Button>
      )}

      {/* Media content */}
      <div
        className="relative flex flex-col items-center max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaUrl ? (
          isVideo ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[85vh] max-w-[90vw] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt={imageName}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
          )
        ) : (
          <div className="bg-background/20 flex min-h-[240px] min-w-[240px] items-center justify-center rounded-lg border border-white/10">
            <p className="text-muted-foreground text-sm">
              {hasError ? "Preview unavailable" : "Loading preview..."}
            </p>
          </div>
        )}
        <div className="bg-background/90 w-full p-4 text-center backdrop-blur-sm mt-2 rounded-lg">
          <p className="text-sm font-medium truncate">{imageName}</p>
        </div>
      </div>
    </div>
  )
}
