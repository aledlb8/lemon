"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconDownload } from "@tabler/icons-react"

type SecureDownloadButtonProps = {
  id: string
  fileName: string
}

export function SecureDownloadButton({ id, fileName }: SecureDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/media/${id}/download`)
      if (!response.ok) {
        throw new Error("Download failed.")
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      console.error("Failed to download file:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading}>
      <IconDownload />
      {isDownloading ? "Downloading..." : "Download"}
    </Button>
  )
}
