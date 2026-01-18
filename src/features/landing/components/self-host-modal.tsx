"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconBrandGithub, IconServer, IconCopy } from "@tabler/icons-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export function SelfHostModal() {
  const [open, setOpen] = useState(false)
  const { copyToClipboard } = useCopyToClipboard()

  const commands = {
    clone: "git clone https://github.com/aledlb8/lemon.git\ncd lemon",
    install: "bun install",
    env: `MONGODB_URI="mongodb+srv://..."
BLOB_READ_WRITE_TOKEN="vercel_blob_token"
APP_ORIGIN="https://your-domain.com"`,
    dev: "bun dev",
    build: "bun run build\nbun start",
  }

  const CodeBlock = ({ code, label }: { code: string; label: string }) => (
    <div className="space-y-2">
      <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className="bg-muted/30 group/code relative rounded-lg border border-dashed p-3">
        <pre className="text-foreground overflow-x-auto text-xs">
          <code>{code}</code>
        </pre>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover/code:opacity-100"
          onClick={() => copyToClipboard(code)}
        >
          <IconCopy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={"outline"}>
          <IconServer className="h-4 w-4" />
          Self-host
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="max-h-[85vh] overflow-y-auto data-[size=default]:max-w-[92vw] data-[size=default]:sm:max-w-3xl data-[size=default]:lg:max-w-4xl"
        onEscapeKeyDown={() => setOpen(false)}
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <IconBrandGithub />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-semibold">
            Self-host Lemon
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deploy your own instance of Lemon with these simple steps.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-6">
          <Card className="border-2">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-base font-semibold">Repository</div>
                <a
                  href="https://github.com/aledlb8/lemon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2 text-sm font-medium hover:underline-offset-4 hover:decoration-2 hover:decoration-chart-3/80"
                >
                  <IconBrandGithub className="h-4 w-4" />
                  github.com/aledlb8/lemon
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="text-base font-semibold">Setup Instructions</div>

            <Card className="border-2">
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">1. Clone the repository</div>
                  <p className="text-muted-foreground text-xs">
                    Clone the project and navigate to the directory
                  </p>
                </div>
                <CodeBlock code={commands.clone} label="Terminal" />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">2. Install dependencies</div>
                  <p className="text-muted-foreground text-xs">
                    Install all required Node.js packages
                  </p>
                </div>
                <CodeBlock code={commands.install} label="Terminal" />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">3. Run the application</div>
                  <p className="text-muted-foreground text-xs">
                    Start in development mode or build for production
                  </p>
                </div>
                <CodeBlock code={commands.dev} label="Development" />
                <CodeBlock code={commands.build} label="Production" />
              </CardContent>
            </Card>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
