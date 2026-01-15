import crypto from "crypto"

export function generateInviteCode() {
  const raw = crypto.randomBytes(5).toString("hex").toUpperCase()
  return `LEMON-${raw}`
}
