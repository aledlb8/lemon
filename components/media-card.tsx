import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconPhoto, IconFileText, IconEye, IconEyeOff } from "@tabler/icons-react"
import { formatSize } from "@/lib/formatting"

interface MediaCardProps {
  id: string
  originalName: string
  contentType: string
  size: number
  visibility?: "public" | "private"
  showVisibility?: boolean
  actions?: React.ReactNode
}

export function MediaCard({
  id,
  originalName,
  contentType,
  size,
  visibility,
  showVisibility = true,
  actions,
}: MediaCardProps) {
  const isImage = contentType.startsWith("image/")
  const downloadUrl = `/api/media/${id}/download`
  const fileExtension = originalName.split(".").pop() ?? "file"

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50">
      <div className="bg-muted/50 relative flex aspect-video items-center justify-center overflow-hidden">
        {isImage ? (
          <>
            <img
              src={downloadUrl}
              alt={originalName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="bg-background/80 absolute right-2 top-2 backdrop-blur-sm">
              <Badge variant="secondary" className="gap-1">
                <IconPhoto className="h-3 w-3" />
                Image
              </Badge>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IconFileText className="text-muted-foreground h-12 w-12" />
            <Badge variant="outline" className="uppercase">
              {fileExtension}
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 text-base">
          <Link href={`/file/${id}`} className="hover:underline font-bold text-primary">
            {originalName}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>{formatSize(size)}</span>
          {showVisibility && visibility && (
            <>
              <span>·</span>
              <Badge variant={visibility === "public" ? "default" : "secondary"} className="h-5 text-xs">
                {visibility === "public" ? (
                  <IconEye className="h-3 w-3" />
                ) : (
                  <IconEyeOff className="h-3 w-3" />
                )}
                {visibility}
              </Badge>
            </>
          )}
        </CardDescription>
      </CardHeader>
      {actions && <CardFooter className="flex gap-2 pt-0">{actions}</CardFooter>}
    </Card>
  )
}
