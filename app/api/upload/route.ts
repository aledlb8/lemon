import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import crypto from "crypto"

import { dbConnect } from "@/lib/db"
import { getBaseUrl } from "@/lib/http"
import { hashUploadKey, isBanned } from "@/lib/auth"
import { getClientIp, rateLimit } from "@/lib/security"
import { MediaModel } from "@/models/Media"
import { UserModel } from "@/models/User"

const MAX_FILE_SIZE = 4.5 * 1024 * 1024

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function extractUploadKey(request: Request, formData: FormData | null) {
  const headerKey = request.headers.get("x-upload-key")
  if (headerKey) return headerKey.trim()

  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim()
  }

  const queryKey = new URL(request.url).searchParams.get("key")
  if (queryKey) return queryKey.trim()

  const formKey = formData?.get("key")
  if (typeof formKey === "string") return formKey.trim()

  return null
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 })
  }

  const uploadKey = extractUploadKey(request, formData)
  if (!uploadKey) {
    return NextResponse.json({ error: "Missing upload key." }, { status: 401 })
  }

  const clientIp = getClientIp(request)
  const ipRate = rateLimit(`upload:${clientIp}`, {
    windowMs: 60 * 1000,
    limit: 15,
  })
  if (!ipRate.allowed) {
    const retryAfter = Math.ceil((ipRate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 4.5MB limit." }, { status: 413 })
  }

  await dbConnect()

  const uploadKeyHash = hashUploadKey(uploadKey)
  const user = await UserModel.findOne({ uploadKeyHash })
  if (!user || isBanned(user)) {
    return NextResponse.json({ error: "Invalid upload key." }, { status: 401 })
  }

  const userRate = rateLimit(`upload:${user._id.toString()}`, {
    windowMs: 60 * 1000,
    limit: 20,
  })
  if (!userRate.allowed) {
    const retryAfter = Math.ceil((userRate.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Upload limit reached. Try again later." },
      {
        status: 429,
        headers: { "retry-after": retryAfter.toString() },
      }
    )
  }

  const safeName = sanitizeFilename(file.name || "upload").slice(0, 120)
  const extension = safeName.includes(".")
    ? safeName.split(".").pop()?.toLowerCase()
    : "bin"
  const safeExtension = extension && extension.length > 0 ? extension : "bin"
  const uniqueName = `${crypto.randomUUID()}.${safeExtension}`
  const pathname = `${user._id.toString()}/${uniqueName}`
  const visibility = user.settings?.defaultVisibility ?? "public"

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set." },
      { status: 500 }
    )
  }

  let blob
  try {
    blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
      token,
    })
  } catch (error) {
    console.error("Upload failed", error)
    return NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }

  const media = await MediaModel.create({
    userId: user._id,
    visibility,
    originalName: safeName,
    contentType: file.type || "application/octet-stream",
    size: file.size,
    blobUrl: blob.url,
    blobPathname: blob.pathname,
  })

  const origin = getBaseUrl(request)
  const fileUrl = `${origin}/file/${media._id.toString()}`

  const responseFormat = new URL(request.url).searchParams.get("format")
  if (responseFormat === "text") {
    return new Response(fileUrl, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  const response = NextResponse.json({
    id: media._id.toString(),
    url: fileUrl,
    visibility,
    name: safeName,
    size: file.size,
  })
  response.headers.set("cache-control", "no-store")
  return response
}
