"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SelfHostModal } from "@/components/self-host-modal"

export function LandingPageClient() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">Lemon</h1>
          <p className="text-muted-foreground text-lg">
            Simple and fast file sharing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="lg" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
        <div className="absolute bottom-8">
          <SelfHostModal />
        </div>
      </div>
    </main>
  )
}
