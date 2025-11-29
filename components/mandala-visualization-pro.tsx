"use client"

import { useEffect, useRef } from "react"

interface MandalaProProps {
  temperatura: number
  humedad: number
  co2: number
  luz: number
}

export function MandalaProVisualization({
  temperatura,
  humedad,
  co2,
  luz,
}: MandalaProProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) - 10

    // Normalizar valores
    const tempNorm = Math.max(0, Math.min(1, (temperatura - 10) / 35))
    const humidNorm = Math.max(0, Math.min(1, (humedad) / 100))
    const co2Norm = Math.max(0, Math.min(1, (co2 - 400) / 1600))
    const luzNorm = Math.max(0, Math.min(1, luz / 1000))

    // Funciones auxiliares para dibujar formas
    const drawTriangle = (x: number, y: number, size: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(-size, size)
      ctx.lineTo(size, size)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()
    }

    const drawSquare = (x: number, y: number, size: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillStyle = color
      ctx.fillRect(-size / 2, -size / 2, size, size)
      ctx.restore()
    }

    const drawDiamond = (x: number, y: number, size: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size, 0)
      ctx.lineTo(0, size)
      ctx.lineTo(-size, 0)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()
    }

    const drawHexagon = (x: number, y: number, size: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const px = Math.cos(angle) * size
        const py = Math.sin(angle) * size
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()
    }

    const animate = () => {
      const time = timeRef.current

      // Limpiar canvas con gradiente de fondo relajante
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
      bgGradient.addColorStop(0, "rgba(15, 23, 42, 0.4)")
      bgGradient.addColorStop(0.5, "rgba(30, 41, 59, 0.2)")
      bgGradient.addColorStop(1, "rgba(15, 23, 42, 0)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ========== CAPA 1: TRIÁNGULOS RELAJANTES (Interior) ==========
      const tempRadius = maxRadius * 0.2
      const tempHue = (1 - tempNorm) * 240
      const tempColor = `hsl(${tempHue}, 100%, 50%)`

      const triangleCount = 12
      for (let i = 0; i < triangleCount; i++) {
        const angle = (Math.PI * 2 * i) / triangleCount + time * 0.002
        const x = centerX + Math.cos(angle) * tempRadius
        const y = centerY + Math.sin(angle) * tempRadius
        const rotation = angle + time * 0.005
        const size = 4 + Math.sin(time * 0.008 + i) * 2
        const opacity = 0.4 + Math.sin(time * 0.006 + i) * 0.4

        drawTriangle(
          x,
          y,
          size,
          rotation,
          `hsla(${tempHue}, 100%, 50%, ${opacity})`
        )
      }

      // ========== CAPA 2: CUADRADOS FLOTANTES (Segunda capa) ==========
      const secondRadius = maxRadius * 0.35
      const squareCount = 8
      const humidColor = `hsl(210, 100%, ${50 + humidNorm * 30}%)`

      for (let i = 0; i < squareCount; i++) {
        const angle = (Math.PI * 2 * i) / squareCount + time * 0.003
        const x = centerX + Math.cos(angle) * secondRadius
        const y = centerY + Math.sin(angle) * secondRadius
        const rotation = time * 0.01 + i * (Math.PI / 4)
        const size = 6 + Math.sin(time * 0.007 + i * 1.5) * 3
        const opacity = 0.3 + Math.sin(time * 0.005 + i * 0.8) * 0.3

        drawSquare(
          x,
          y,
          size,
          rotation,
          `hsla(210, 100%, 60%, ${opacity})`
        )
      }

      // ========== CAPA 3: DIAMANTES Y HEXÁGONOS (Tercera capa) ==========
      const thirdRadius = maxRadius * 0.5
      const diamondCount = 6
      const co2Hue = (1 - co2Norm) * 120
      const co2Color = `hsl(${co2Hue}, 100%, 50%)`

      for (let i = 0; i < diamondCount; i++) {
        const angle = (Math.PI * 2 * i) / diamondCount + time * 0.004
        const x = centerX + Math.cos(angle) * thirdRadius
        const y = centerY + Math.sin(angle) * thirdRadius

        // Diamantes
        const diamondRotation = time * 0.015 + i * (Math.PI / 3)
        const diamondSize = 5 + Math.sin(time * 0.009 + i) * 2
        const diamondOpacity = 0.35 + Math.sin(time * 0.007 + i) * 0.35

        drawDiamond(
          x,
          y,
          diamondSize,
          diamondRotation,
          `hsla(${co2Hue}, 100%, 50%, ${diamondOpacity})`
        )
      }

      // ========== CAPA 4: HEXÁGONOS (Exterior) ==========
      const hexRadius = maxRadius * 0.68
      const hexCount = 8
      const isDay = luz > 100
      const lightHue = isDay ? 45 : 260

      for (let i = 0; i < hexCount; i++) {
        const angle = (Math.PI * 2 * i) / hexCount + time * 0.002
        const x = centerX + Math.cos(angle) * hexRadius
        const y = centerY + Math.sin(angle) * hexRadius
        const rotation = time * 0.008 + i * (Math.PI / 4)
        const size = 4 + luzNorm * 3 + Math.sin(time * 0.006 + i) * 1.5
        const opacity = 0.25 + luzNorm * 0.25 + Math.sin(time * 0.005 + i) * 0.25

        drawHexagon(
          x,
          y,
          size,
          rotation,
          `hsla(${lightHue}, 100%, ${isDay ? 60 : 40}%, ${opacity})`
        )
      }

      // ========== CAPA 5: ONDAS SUAVES DE FONDO ==========
      const waveRadius = maxRadius * 0.55
      const waveCount = 3

      for (let wave = 0; wave < waveCount; wave++) {
        const waveTime = time * 0.001 - wave * 0.3
        ctx.beginPath()
        for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
          const waveAmplitude = 6 * humidNorm
          const wobble = Math.sin(angle * 3 + waveTime) * waveAmplitude
          const radius = waveRadius + wobble
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          if (angle === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = `hsla(210, 70%, 50%, ${0.15 - wave * 0.05})`
        ctx.lineWidth = 1 + wave * 0.5
        ctx.stroke()
      }

      // ========== NÚCLEO CENTRAL MEDITATIVO ==========
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20)
      coreGradient.addColorStop(0, `hsl(${tempHue}, 100%, 70%)`)
      coreGradient.addColorStop(0.6, `hsl(${tempHue}, 100%, 50%)`)
      coreGradient.addColorStop(1, `hsl(${tempHue}, 100%, 25%)`)

      ctx.beginPath()
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2)
      ctx.fillStyle = coreGradient
      ctx.fill()

      // Pequeños triángulos en el núcleo
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + time * 0.02
        const x = centerX + Math.cos(angle) * 8
        const y = centerY + Math.sin(angle) * 8
        drawTriangle(x, y, 2, angle, `hsla(${tempHue}, 100%, 80%, 0.7)`)
      }

      // Brillo central pulsante
      const pulseSize = 5 + Math.sin(time * 0.008) * 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${tempHue}, 100%, 85%, 0.9)`
      ctx.fill()

      // ========== INFORMACIÓN EN EL BORDE ==========
      ctx.font = "bold 11px Inter"
      ctx.fillStyle = "rgba(241, 245, 249, 0.7)"
      ctx.textAlign = "center"
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
      ctx.shadowBlur = 3

      ctx.fillText("🌡️ TEMP", centerX, maxRadius + 32)
      ctx.fillText("💧 HUME", centerX - maxRadius * 0.7, centerY + 12)
      ctx.fillText("💨 AIRE", centerX + maxRadius * 0.7, centerY + 12)
      ctx.fillText("☀️ LUZ", centerX, centerY - maxRadius - 22)

      ctx.shadowBlur = 0

      timeRef.current += 1

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [temperatura, humedad, co2, luz])

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500">
        🌍 Mandala Meditativo Pro
      </h3>
      <canvas
        ref={canvasRef}
        width={350}
        height={350}
        className="border-2 border-slate-600/30 rounded-full shadow-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm transition-all hover:shadow-cyan-500/20 hover:shadow-lg"
        style={{
          filter: "drop-shadow(0 0 25px rgba(6, 182, 212, 0.25))",
        }}
      />
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse" />
          <span>Temperatura</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
          <span>Humedad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
          <span>Aire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" />
          <span>Luz</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center max-w-xs">
        ✨ Mandala que responde en tiempo real a tus datos ambientales
      </p>
    </div>
  )
}