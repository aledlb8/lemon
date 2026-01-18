"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import Link from "next/link"
import { FormInput } from "@/components/ui/form-input"
import { Button } from "@/components/ui/button"

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
          <FormInput
            label="Email or username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
          <FormInput
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
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
