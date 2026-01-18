"use client"

import { useEffect } from "react"
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface ImageModalProps {
  isOpen: boolean
  imageUrl: string
  imageName: string
  contentType: string
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export function ImageModal({
  isOpen,
  imageUrl,
  imageName,
  contentType,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: ImageModalProps) {
  const isVideo = contentType.startsWith("video/")
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
        {isVideo ? (
          <video
            src={imageUrl}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] object-contain"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />
        )}
        <div className="bg-background/90 w-full p-4 text-center backdrop-blur-sm mt-2 rounded-lg">
          <p className="text-sm font-medium truncate">{imageName}</p>
        </div>
      </div>
    </div>
  )
}
