export function getBaseUrl(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") ?? "http"
  const host = request.headers.get("host")
  if (!host) {
    return "http://localhost:3000"
  }
  return `${proto}://${host}`
}
