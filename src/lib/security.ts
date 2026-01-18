import mongoose from "mongoose"

import { getBaseUrl } from "@/lib/http"

type RateLimitOptions = {
  windowMs: number
  limit: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL_MS = 60 * 1000
let lastCleanup = 0

function cleanupExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  for (const [key, entry] of RATE_LIMIT_STORE.entries()) {
    if (entry.resetAt <= now) {
      RATE_LIMIT_STORE.delete(key)
    }
  }
  lastCleanup = now
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  cleanupExpired(now)

  const current = RATE_LIMIT_STORE.get(key)
  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt }
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  RATE_LIMIT_STORE.set(key, current)
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - current.count),
    resetAt: current.resetAt,
  }
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown"
  }
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try {
    return new URL(origin).origin === getBaseUrl(request)
  } catch {
    return false
  }
}

export function isValidObjectId(value: string) {
  if (!value) return false
  if (!/^[a-f0-9]{24}$/i.test(value)) return false
  return mongoose.Types.ObjectId.isValid(value)
}

export function safeHeaderFilename(value: string) {
  const sanitized = value
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/]/g, "_")
    .trim()
  return sanitized.slice(0, 150) || "download"
}
