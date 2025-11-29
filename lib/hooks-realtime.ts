"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Hook mejorado con polling más inteligente
 * Actualiza más frecuente cuando hay cambios
 */
export function useFetchRealtime<T>(
  url: string,
  options?: {
    interval?: number // ms entre polls (default: 30000)
    enablePoll?: boolean
    onError?: (error: Error) => void
    onSuccess?: (data: T) => void
  }
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const defaultInterval = options?.interval ?? 30000 // 30 segundos por defecto
  const enablePoll = options?.enablePoll !== false

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(url, {
        cache: "no-store", // No cachear
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (!response.ok) throw new Error(`Error ${response.status}`)

      const result = (await response.json()) as T
      setData(result)
      setError(undefined)
      setLastUpdate(new Date())

      options?.onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [url, options])

  useEffect(() => {
    // Fetch inicial
    fetchData()

    // Solo configurar polling si está habilitado
    if (!enablePoll) return

    // Polling automático
    const intervalId = setInterval(fetchData, defaultInterval)

    return () => clearInterval(intervalId)
  }, [fetchData, enablePoll, defaultInterval])

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  return { data, loading, error, lastUpdate, refresh }
}

/**
 * Hook para usar múltiples endpoints con sincronización
 */
export function useFetchMultiple<T extends Record<string, any>>(
  endpoints: Record<string, string>,
  interval?: number
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, Error>>({})

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          Object.entries(endpoints).map(([key, url]) =>
            fetch(url)
              .then((res) => res.json())
              .then((value) => [key, value])
              .catch((err) => [key, null, err])
          )
        )

        const newData: Record<string, any> = {}
        const newErrors: Record<string, Error> = {}

        results.forEach(([key, value, err]) => {
          if (err) {
            newErrors[key as string] = err as Error
          } else {
            newData[key as string] = value
          }
        })

        setData(newData as T)
        setErrors(newErrors)
      } catch (err) {
        console.error("Error fetching multiple endpoints:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()

    if (interval) {
      const intervalId = setInterval(fetchAll, interval)
      return () => clearInterval(intervalId)
    }
  }, [endpoints, interval])

  return { data, loading, errors }
}

/**
 * Hook para WebSocket (para actualizaciones reales futuras)
 */
export function useWebSocket<T>(url: string) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    // Nota: Implementar WebSocket requiere backend con soporte
    // Por ahora, mantener como placeholder para futuro

    console.log("[WebSocket] Connection to", url, "would be established here")

    // Si quieres implementar ahora:
    // const ws = new WebSocket(url)
    // ws.onopen = () => setConnected(true)
    // ws.onmessage = (e) => setData(JSON.parse(e.data))
    // ws.onerror = (e) => setError(new Error("WebSocket error"))
    // ws.onclose = () => setConnected(false)
    // return () => ws.close()
  }, [url])

  return { data, connected, error }
}

/**
 * Hook para obtener tiempo transcurrido
 */
export function useTimeAgo(timestamp: string) {
  const [timeAgo, setTimeAgo] = useState("")

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date()
      const past = new Date(timestamp)
      const diffMs = now.getTime() - past.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)
      const diffDays = Math.floor(diffHour / 24)

      if (diffSec < 60) {
        setTimeAgo(`hace ${diffSec}s`)
      } else if (diffMin < 60) {
        setTimeAgo(`hace ${diffMin}m`)
      } else if (diffHour < 24) {
        setTimeAgo(`hace ${diffHour}h`)
      } else {
        setTimeAgo(`hace ${diffDays}d`)
      }
    }

    updateTimeAgo()
    const intervalId = setInterval(updateTimeAgo, 10000)

    return () => clearInterval(intervalId)
  }, [timestamp])

  return timeAgo
}