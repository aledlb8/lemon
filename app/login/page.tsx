"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    })

    setLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error ?? "Unable to sign in.")
      return
    }

    router.push("/dashboard")
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to manage your uploads.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-sm"
        >
          <label className="text-sm">
            Email or username
            <input
              className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="text-sm">
            Password
            <input
              className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-muted-foreground text-center text-sm">
          New here?{" "}
          <Link className="text-foreground underline" href="/register">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
