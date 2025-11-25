// components/mandala-visualization.tsx
"use client"

import { useEffect, useRef } from "react"
import { SensorData } from "@/lib/types"

interface MandalaVisualizationProps {
  data: SensorData | undefined
}

export function MandalaVisualization({ data }: MandalaVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Configuración base
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) - 20

    // Función para obtener color según el estado
    const getColorByStatus = (value: number, ranges: { good: number[], warning: number[] }, colors: { good: string, warning: string, bad: string }) => {
      if (value >= ranges.good[0] && value <= ranges.good[1]) return colors.good
      if (value >= ranges.warning[0] && value <= ranges.warning[1]) return colors.warning
      return colors.bad
    }

    // Dibujar mandala basada en los datos
    const drawMandala = () => {
      // Capa 1: Temperatura (círculo central)
      const tempRadius = maxRadius * 0.3
      const tempColor = getColorByStatus(
        data.temperatura,
        { good: [20, 24], warning: [24, 26] },
        { good: "#10B981", warning: "#F59E0B", bad: "#EF4444" }
      )
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, tempRadius, 0, 2 * Math.PI)
      ctx.fillStyle = tempColor + "40" // Añadir transparencia
      ctx.fill()
      ctx.strokeStyle = tempColor
      ctx.lineWidth = 2
      ctx.stroke()

      // Capa 2: Humedad (anillo)
      const humidityRadius = maxRadius * 0.5
      const humidityColor = getColorByStatus(
        data.humedad,
        { good: [40, 60], warning: [60, 70] },
        { good: "#3B82F6", warning: "#F59E0B", bad: "#EF4444" }
      )
      
      // Dibujar anillos de humedad
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8
        const x1 = centerX + Math.cos(angle) * tempRadius
        const y1 = centerY + Math.sin(angle) * tempRadius
        const x2 = centerX + Math.cos(angle) * humidityRadius
        const y2 = centerY + Math.sin(angle) * humidityRadius
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = humidityColor
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Capa 3: Calidad del aire (pétalos)
      const airRadius = maxRadius * 0.7
      const airColor = getColorByStatus(
        data.co2,
        { good: [0, 800], warning: [800, 1200] },
        { good: "#8B5CF6", warning: "#F59E0B", bad: "#EF4444" }
      )
      
      // Dibujar pétalos
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12
        const petalWidth = Math.PI / 12
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, airRadius, angle - petalWidth/2, angle + petalWidth/2)
        ctx.arc(centerX, centerY, humidityRadius, angle + petalWidth/2, angle - petalWidth/2, true)
        ctx.closePath()
        ctx.fillStyle = airColor + "30" // Añadir transparencia
        ctx.fill()
        ctx.strokeStyle = airColor
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Capa 4: Luz (rayos exteriores)
      const lightRadius = maxRadius
      const isDay = data.luz >= 100
      const lightColor = isDay ? "#FCD34D" : "#1E293B"
      
      // Dibujar rayos de luz
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16
        const rayLength = 15
        const x1 = centerX + Math.cos(angle) * (lightRadius - rayLength)
        const y1 = centerY + Math.sin(angle) * (lightRadius - rayLength)
        const x2 = centerX + Math.cos(angle) * lightRadius
        const y2 = centerY + Math.sin(angle) * lightRadius
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = lightColor
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Añadir texto central
      ctx.font = "bold 16px sans-serif"
      ctx.fillStyle = "#1E293B"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("Ambiente", centerX, centerY)
    }

    drawMandala()
  }, [data])

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="border border-slate-200 rounded-lg shadow-md bg-white"
      />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Óptimo</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Advertencia</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Crítico</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span>Día</span>
        </div>
      </div>
    </div>
  )
}