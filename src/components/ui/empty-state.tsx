import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground mb-2 text-lg font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  )
}
