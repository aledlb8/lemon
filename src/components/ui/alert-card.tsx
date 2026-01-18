import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  message: string
  variant?: "error" | "info" | "success"
  icon?: React.ComponentType<{ className?: string }>
}

export function AlertCard({ message, variant = "info", icon: Icon }: AlertCardProps) {
  const variantStyles = {
    error: "border-destructive/50 bg-destructive/10",
    info: "bg-muted/40",
    success: "border-green-500/50 bg-green-500/10",
  }

  return (
    <Card className={cn("border-2", variantStyles[variant])}>
      <CardContent className={cn("pt-6", Icon && "flex items-center gap-3")}>
        {Icon && <Icon className="text-muted-foreground h-5 w-5 shrink-0" />}
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  )
}
