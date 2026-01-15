export function getBaseUrl(request: Request) {
  const configured =
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall through to header-based origin.
    }
  }

  const proto = request.headers.get("x-forwarded-proto") ?? "http"
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000"
  return `${proto}://${host}`
}
