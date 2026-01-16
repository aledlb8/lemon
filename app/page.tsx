import { redirect } from "next/navigation"

import { getSessionUser } from "@/lib/auth"
import { LandingPageClient } from "@/components/landing-page-client"

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) {
    redirect("/dashboard")
  }

  return <LandingPageClient />
}
