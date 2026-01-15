"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui/form-input"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadKey, setUploadKey] = useState<string | null>(null)
  const { copyToClipboard, isCopied } = useCopyToClipboard()

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
          <FormInput
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <FormInput
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <FormInput
            label="Password (10+ chars, letters & numbers)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
          <FormInput
            label="Invite code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </Button>
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
              <Button
                type="button"
                onClick={() => copyToClipboard(uploadKey)}
              >
                {isCopied ? "Copied!" : "Copy key"}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </Button>
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
