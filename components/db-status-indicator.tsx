"use client"

import { useEffect, useState } from "react"
import { Database } from "lucide-react"
import { cn } from "@/lib/utils"

interface DbStatusIndicatorProps {
  className?: string
}

export function DbStatusIndicator({ className }: DbStatusIndicatorProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  const checkDbStatus = async () => {
    try {
      const response = await fetch('/api/db-status')
      const data = await response.json()
      setIsConnected(data.connected)
    } catch (error) {
      console.error('Error al verificar estado de DB:', error)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    // Verificar inmediatamente
    checkDbStatus()

    // Verificar cada 30 segundos
    const interval = setInterval(checkDbStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Database className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-400">Verificando...</span>
      </div>
    )
  }

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      title={isConnected ? "Base de datos conectada" : "Base de datos desconectada"}
    >
      <Database className={cn("h-4 w-4", isConnected ? "text-green-500" : "text-red-500")} />
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          )}
        />
        <span className="text-xs hidden sm:inline">
          DB {isConnected ? "Conectada" : "Desconectada"}
        </span>
      </div>
    </div>
  )
}
