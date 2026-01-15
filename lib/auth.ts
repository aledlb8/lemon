import crypto from "crypto"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

import { dbConnect } from "@/lib/db"
import { SessionModel } from "@/models/Session"
import { UserModel, type User } from "@/models/User"

export const ROLE_BANNED = -1
export const ROLE_USER = 0
export const ROLE_ADMIN = 1

const SESSION_COOKIE = "lemon_session"
const SESSION_TTL_DAYS = 30

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex")
}

export async function hashPassword(password: string) {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function createUploadKey() {
  return generateToken(24)
}

export function hashUploadKey(key: string) {
  return hashToken(key)
}

export async function createSession(userId: string) {
  await dbConnect()

  const token = generateToken(32)
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await SessionModel.create({ userId, tokenHash, expiresAt })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })

  return token
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    cookieStore.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    })
    return
  }

  await dbConnect()
  const tokenHash = hashToken(token)
  await SessionModel.deleteOne({ tokenHash })

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) {
    return null
  }

  await dbConnect()
  const tokenHash = hashToken(token)
  const session = await SessionModel.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).lean()

  if (!session) {
    return null
  }

  const user = await UserModel.findById(session.userId).lean()
  return user ?? null
}

export function isAdmin(user: User | null) {
  return user?.role === ROLE_ADMIN
}

export function isBanned(user: User | null) {
  return user?.role === ROLE_BANNED
}
