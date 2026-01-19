"use client"

import { useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { MediaCard } from "@/features/media"
import { ImageModal } from "@/components/ui/image-modal"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { IconUpload } from "@tabler/icons-react"

type MediaItem = {
  id: string
  originalName: string
  contentType: string
  size: number
  visibility: "public" | "private"
}

type UserGalleryClientProps = {
  uploads: MediaItem[]
  canSeePrivate: boolean
}

export default function UserGalleryClient({ uploads, canSeePrivate }: UserGalleryClientProps) {
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  const mediaItems = uploads.filter((item) =>
    item.contentType.startsWith("image/") || item.contentType.startsWith("video/")
  )

  const handleImageClick = (id: string) => {
    const index = mediaItems.findIndex((item) => item.id === id)
    if (index !== -1) {
      setModalImageIndex(index)
    }
  }

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/file/${id}`
    copyToClipboard(link)
  }

  const handleModalClose = () => {
    setModalImageIndex(null)
  }

  const handleModalPrevious = () => {
    setModalImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
  }

  const handleModalNext = () => {
    setModalImageIndex((prev) =>
      prev !== null && prev < mediaItems.length - 1 ? prev + 1 : prev
    )
  }

  return (
    <>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {uploads.length === 0 && (
          <EmptyState
            icon={IconUpload}
            title="No public uploads yet"
            description="This user hasn't shared any files publicly"
          />
        )}
        {uploads.map((item) => (
          <MediaCard
            key={item.id}
            id={item.id}
            originalName={item.originalName}
            contentType={item.contentType}
            size={item.size}
            visibility={item.visibility}
            showVisibility={canSeePrivate}
            onCopyLink={handleCopyLink}
            onImageClick={handleImageClick}
          />
        ))}
      </section>

      {modalImageIndex !== null && mediaItems[modalImageIndex] && (
        <ImageModal
          isOpen={true}
          imageUrl={`/api/media/${mediaItems[modalImageIndex].id}/download`}
          imageName={mediaItems[modalImageIndex].originalName}
          contentType={mediaItems[modalImageIndex].contentType}
          onClose={handleModalClose}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
          hasPrevious={modalImageIndex > 0}
          hasNext={modalImageIndex < mediaItems.length - 1}
        />
      )}
    </>
  )
}
