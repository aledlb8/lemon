import Link from "next/link"

export default function HomePage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="bg-primary/20 text-primary grid size-12 place-items-center rounded-2xl text-xl font-bold">
          L
        </div>
        <h1 className="text-4xl font-semibold">Lemon</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link
            className="border-border hover:bg-muted rounded-md border px-4 py-2 transition"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition"
            href="/register"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  )
}
