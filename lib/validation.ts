export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase()
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_-]{3,20}$/.test(value)
}

export function isValidPassword(value: string) {
  return value.length >= 8
}
