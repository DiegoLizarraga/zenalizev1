import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  isOnline: boolean
  lastUpdate?: string
  className?: string
}

export function StatusIndicator({
  isOnline,
  lastUpdate,
  className,
}: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center space-x-1.5">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            isOnline ? "bg-success animate-pulse" : "bg-error"
          )}
        />
        <span className="text-sm font-medium">
          {isOnline ? "En línea" : "Desconectado"}
        </span>
      </div>
      {lastUpdate && (
        <>
          <span className="text-slate-400">•</span>
          <span className="text-sm text-slate-600">
            Actualizado {lastUpdate}
          </span>
        </>
      )}
    </div>
  )
}
