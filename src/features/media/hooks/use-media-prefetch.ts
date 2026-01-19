"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type MediaPrefetchItem = {
  id: string
  contentType: string
}

type MediaPrefetchOptions = {
  maxConcurrent?: number
  maxItems?: number
}

type MediaPrefetchResult = {
  prefetchedUrls: Record<string, string>
  prefetchedIds: Set<string>
}

const DEFAULT_MAX_CONCURRENT = 3
const DEFAULT_MAX_ITEMS = 12

export function useMediaPrefetch(
  items: MediaPrefetchItem[],
  options: MediaPrefetchOptions = {}
): MediaPrefetchResult {
  const maxConcurrent = options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS
  const objectUrlsRef = useRef<Map<string, string>>(new Map())
  const [prefetchedUrls, setPrefetchedUrls] = useState<Record<string, string>>({})

  const targetKey = useMemo(() => {
    const ids = items
      .filter(
        (item) =>
          item.contentType.startsWith("image/") ||
          item.contentType.startsWith("video/")
      )
      .map((item) => item.id)
      .slice(0, maxItems)
    return ids.join("|")
  }, [items, maxItems])

  const prefetchedIds = useMemo(
    () => new Set(targetKey ? targetKey.split("|") : []),
    [targetKey]
  )

  useEffect(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current.clear()
    setPrefetchedUrls({})

    const targetIds = targetKey ? targetKey.split("|") : []
    if (targetIds.length === 0) {
      return
    }

    let cancelled = false
    const controllers: AbortController[] = []
    let active = 0
    let index = 0

    const startNext = () => {
      while (active < maxConcurrent && index < targetIds.length) {
        const id = targetIds[index++]
        active += 1
        const controller = new AbortController()
        controllers.push(controller)

        fetch(`/api/media/${id}/download`, { signal: controller.signal })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to preload media.")
            }
            return response.blob()
          })
          .then((blob) => {
            if (cancelled || controller.signal.aborted) return
            const objectUrl = URL.createObjectURL(blob)
            objectUrlsRef.current.set(id, objectUrl)
            setPrefetchedUrls((prev) => ({ ...prev, [id]: objectUrl }))
          })
          .catch((error) => {
            if (controller.signal.aborted) return
            console.error("Failed to preload media:", error)
          })
          .finally(() => {
            active -= 1
            if (!cancelled) {
              startNext()
            }
          })
      }
    }

    startNext()

    return () => {
      cancelled = true
      controllers.forEach((controller) => controller.abort())
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current.clear()
    }
  }, [targetKey, maxConcurrent])

  return { prefetchedUrls, prefetchedIds }
}
