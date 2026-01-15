"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadKey, setUploadKey] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, username, password, inviteCode }),
    })

    setLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error ?? "Unable to register.")
      return
    }

    const data = await response.json()
    setUploadKey(data.uploadKey ?? null)
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="text-muted-foreground text-sm">
            Invite code required for signup.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-sm"
        >
          <label className="text-sm">
            Email
            <input
              className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="text-sm">
            Username
            <input
              className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="text-sm">
            Password (10+ chars, letters & numbers)
            <input
              className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="text-sm">
            Invite code
            <input
              className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              required
            />
          </label>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        {uploadKey && (
          <div className="border-border bg-card rounded-2xl border p-6 text-sm shadow-sm">
            <div className="font-medium">Your ShareX upload key</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Save this now. You can regenerate it later, but you won&apos;t see
              this key again.
            </p>
            <code className="bg-muted text-foreground mt-3 block rounded-md px-3 py-2 text-xs">
              {uploadKey}
            </code>
            <div className="mt-4 flex gap-3">
              <button
                className="border-border hover:bg-muted rounded-md border px-3 py-2 text-xs"
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(uploadKey)
                }}
              >
                Copy key
              </button>
              <button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-xs"
                type="button"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link className="text-foreground underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
