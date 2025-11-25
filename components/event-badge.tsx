import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Activity, Volume2, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type EventType = "movement" | "noise" | "threshold"

interface EventBadgeProps {
  type: EventType
  text: string
  className?: string
}

const eventConfig: Record<
  EventType,
  { icon: LucideIcon; variant: "default" | "warning" | "error"; label: string }
> = {
  movement: {
    icon: Activity,
    variant: "default",
    label: "Movimiento",
  },
  noise: {
    icon: Volume2,
    variant: "warning",
    label: "Ruido",
  },
  threshold: {
    icon: AlertTriangle,
    variant: "error",
    label: "Alerta",
  },
}

export function EventBadge({ type, text, className }: EventBadgeProps) {
  const config = eventConfig[type]
  const Icon = config.icon

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  )
}
