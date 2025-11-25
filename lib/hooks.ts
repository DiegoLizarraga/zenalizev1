"use client"

import { useState, useEffect } from "react"

export function useFetch<T>(url: string, interval?: number) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Error al obtener datos")
        const result = await response.json()
        setData(result)
        setError(undefined)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Polling si se especifica intervalo
    if (interval) {
      const intervalId = setInterval(fetchData, interval)
      return () => clearInterval(intervalId)
    }
  }, [url, interval])

  return { data, loading, error }
}

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

      if (diffSec < 60) {
        setTimeAgo("hace " + diffSec + " seg")
      } else if (diffMin < 60) {
        setTimeAgo("hace " + diffMin + " min")
      } else if (diffHour < 24) {
        setTimeAgo("hace " + diffHour + " hora" + (diffHour > 1 ? "s" : ""))
      } else {
        const diffDays = Math.floor(diffHour / 24)
        setTimeAgo("hace " + diffDays + " día" + (diffDays > 1 ? "s" : ""))
      }
    }

    updateTimeAgo()
    const intervalId = setInterval(updateTimeAgo, 10000) // Actualizar cada 10 seg

    return () => clearInterval(intervalId)
  }, [timestamp])

  return timeAgo
}
