import { redirect } from "next/navigation"

import { getSessionUser } from "@/lib/auth"
import { LandingPageClient } from "@/features/landing"

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) {
    redirect("/dashboard")
  }

  return <LandingPageClient />
}
