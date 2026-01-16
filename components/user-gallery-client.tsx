"use client"

import { useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { MediaCard } from "@/components/media-card"
import { ImageModal } from "@/components/ui/image-modal"
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

  const imageItems = uploads.filter((item) => item.contentType.startsWith("image/"))

  const handleImageClick = (id: string) => {
    const index = imageItems.findIndex((item) => item.id === id)
    if (index !== -1) {
      setModalImageIndex(index)
    }
  }

  const handleModalClose = () => {
    setModalImageIndex(null)
  }

  const handleModalPrevious = () => {
    setModalImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
  }

  const handleModalNext = () => {
    setModalImageIndex((prev) =>
      prev !== null && prev < imageItems.length - 1 ? prev + 1 : prev
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
            onImageClick={handleImageClick}
          />
        ))}
      </section>

      {modalImageIndex !== null && imageItems[modalImageIndex] && (
        <ImageModal
          isOpen={true}
          imageUrl={`/api/media/${imageItems[modalImageIndex].id}/download`}
          imageName={imageItems[modalImageIndex].originalName}
          onClose={handleModalClose}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
          hasPrevious={modalImageIndex > 0}
          hasNext={modalImageIndex < imageItems.length - 1}
        />
      )}
    </>
  )
}
