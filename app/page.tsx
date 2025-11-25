"use client"

import { useState, useEffect, useRef } from "react"
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Moon,
  Activity,
  Volume2,
  Clock,
  Loader,
} from "lucide-react"
import { MetricCard } from "@/components/metric-card"
import { StatCard } from "@/components/stat-card"
import { LineChart } from "@/components/line-chart"
import { EstadoModal } from "@/components/estado-modal"
import { EventBadge } from "@/components/event-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFetch, useTimeAgo } from "@/lib/hooks"
import { SensorData, HistoricalData, RegistroEstado, Evento, EstadoAnimo } from "@/lib/types"

// =================================================================
// LÓGICA Y COMPONENTE DEL CHATBOT MEJORADO CON GROQ
// =================================================================
interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

function ChatbotImproved({
  currentData,
  historicoData,
  estadoActual,
}: {
  currentData?: SensorData
  historicoData?: HistoricalData[]
  estadoActual?: RegistroEstado
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! 👋 Soy Zenalyze, tu asistente ambiental. Puedo ayudarte con consejos sobre tu ambiente, analizar tus datos y charlar sobre cómo mejorar tu bienestar. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setLoading(true)

    try {
      // Filtrar el historial para enviar solo los últimos 6 mensajes
      const recentHistory = messages
        .slice(-6)
        .map((msg) => ({
          role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.text,
        }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          currentData,
          historicoData: historicoData?.slice(-24),
          estadoActual,
          conversationHistory: recentHistory,
        }),
      })

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor")
      }

      const data = await response.json()
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || "Disculpa, no pude procesar tu mensaje.",
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lo siento, tuve un problema. ¿Podrías intentar de nuevo? 😅",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col shadow-2xl border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 border-b border-slate-700/50">
        <div>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            🌍 Zenalyze
          </CardTitle>
          <p className="text-xs text-slate-400">Asistente Ambiental IA</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed break-words ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-br-none shadow-md"
                    : "bg-slate-700/80 text-slate-100 rounded-bl-none shadow-md border border-slate-600/30"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-slate-700/80 text-slate-100 p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSendMessage()
                }
              }}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 p-2.5 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transition-all"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || inputValue.trim() === ""}
              size="icon"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <span>📤</span>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Presiona Enter o haz clic en enviar
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// =================================================================
// COMPONENTE DE MANDALA INTERACTIVO
// =================================================================
function MandalaVisualizer({
  temperatura,
  humedad,
  co2,
  luz,
}: {
  temperatura: number
  humedad: number
  co2: number
  luz: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)

  const normalizeValue = (value: number, min: number, max: number) => {
    return Math.min(Math.max((value - min) / (max - min), 0), 1)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const tempNorm = normalizeValue(temperatura, 10, 35)
      const hue = (1 - tempNorm) * 240
      const luzNorm = normalizeValue(luz, 0, 1000)
      const scale = 0.8 + luzNorm * 0.4
      const spacing = 15 + luzNorm * 20
      const humedadNorm = normalizeValue(humedad, 0, 100)
      const ringCount = Math.floor(3 + humedadNorm * 7)
      const co2Norm = normalizeValue(co2, 400, 2000)
      const pointCount = Math.floor(20 + (1 - co2Norm) * 80)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotationRef.current)
      ctx.scale(scale, scale)

      for (let i = 0; i < ringCount; i++) {
        ctx.beginPath()
        ctx.arc(0, 0, spacing * (i + 1), 0, 2 * Math.PI)
        ctx.strokeStyle = `hsla(${hue}, 70%, ${60 - i * 3}%, ${0.7 - i * 0.05})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2
        const radius = spacing * (1 + (i % ringCount))
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, 2 * Math.PI)
        ctx.fillStyle = `hsla(${(hue + 30) % 360}, 80%, 60%, 0.8)`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(0, 0, 5, 0, 2 * Math.PI)
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 10)
      gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, 1)`)
      gradient.addColorStop(1, `hsla(${hue}, 90%, 50%, 0.5)`)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.restore()

      rotationRef.current += 0.002
      requestAnimationFrame(animate)
    }

    animate()
  }, [temperatura, humedad, co2, luz])

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 mb-4">
        Mandala Ambiental
      </h3>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="border border-slate-600/50 rounded-xl shadow-2xl bg-slate-900/50 backdrop-blur-sm"
      />
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-green-400"></div>
          <span>Anillos: Humedad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
          <span>Puntos: Calidad del Aire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-yellow-400"></div>
          <span>Color: Temperatura</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400"></div>
          <span>Tamaño: Luz</span>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// COMPONENTE PRINCIPAL DEL DASHBOARD
// =================================================================
export default function Dashboard() {
  const [periodo, setPeriodo] = useState("24h")
  const { data: currentData, loading: loadingCurrent } = useFetch<SensorData>(
    "/api/sensores/current",
    30000
  )
  const { data: historicoData, loading: loadingHistorico } = useFetch<{
    datos: HistoricalData[]
  }>(`/api/sensores/historico?periodo=${periodo}`)
  const { data: estadoActual, loading: loadingEstado } =
    useFetch<RegistroEstado>("/api/estado")
  const { data: eventosData, loading: loadingEventos } = useFetch<{
    eventos: Evento[]
  }>("/api/eventos/recientes")
  const timeAgo = useTimeAgo(
    estadoActual?.timestamp || new Date().toISOString()
  )

  const getTemperaturaStatus = (temp: number) => {
    if (temp >= 20 && temp <= 24) return { status: "success" as const, text: "Óptima" }
    if (temp > 24 && temp <= 26) return { status: "warning" as const, text: "Alta" }
    return { status: "error" as const, text: "Fuera de rango" }
  }
  const getHumedadStatus = (hum: number) => {
    if (hum >= 40 && hum <= 60) return { status: "success" as const, text: "Óptima" }
    if (hum > 60 && hum <= 70) return { status: "warning" as const, text: "Alta" }
    return { status: "error" as const, text: "Fuera de rango" }
  }
  const getCO2Status = (co2: number) => {
    if (co2 < 800) return { status: "success" as const, text: "Buena" }
    if (co2 < 1200) return { status: "warning" as const, text: "Moderada" }
    return { status: "error" as const, text: "Mala" }
  }
  const getLuzStatus = (luz: number) => {
    if (luz < 100) return { status: undefined, text: "Noche" }
    return { status: "success" as const, text: "Día" }
  }
  const handleEstadoSubmit = async (estado: EstadoAnimo) => {
    await fetch("/api/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    })
    window.location.reload()
  }
  const estadoEmoji = { bien: "😊", regular: "😐", mal: "😞" }
  const estadoTexto = { bien: "Bien", regular: "Regular", mal: "Mal" }
  const sparklineData =
    historicoData?.datos.slice(-6).map((d) => d.temperatura) || []

  if (loadingCurrent || loadingHistorico || loadingEstado || loadingEventos) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-8 lg:p-12">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-screen-2xl mx-auto">
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MetricCard
              title="Temperatura"
              value={currentData?.temperatura.toFixed(1) || "0"}
              unit="°C"
              icon={Thermometer}
              status={
                getTemperaturaStatus(currentData?.temperatura || 0).status
              }
              statusText={
                getTemperaturaStatus(currentData?.temperatura || 0).text
              }
              sparklineData={sparklineData}
            />
            <MetricCard
              title="Humedad"
              value={currentData?.humedad.toFixed(0) || "0"}
              unit="%"
              icon={Droplets}
              status={getHumedadStatus(currentData?.humedad || 0).status}
              statusText={getHumedadStatus(currentData?.humedad || 0).text}
              sparklineData={
                historicoData?.datos.slice(-6).map((d) => d.humedad) || []
              }
            />
            <MetricCard
              title="Calidad del Aire"
              value={currentData?.co2.toFixed(0) || "0"}
              unit="ppm"
              icon={Wind}
              status={getCO2Status(currentData?.co2 || 0).status}
              statusText={getCO2Status(currentData?.co2 || 0).text}
              sparklineData={
                historicoData?.datos.slice(-6).map((d) => d.co2) || []
              }
            />
            <MetricCard
              title="Luz"
              value={currentData?.luz.toFixed(0) || "0"}
              unit="lux"
              icon={
                currentData && currentData.luz < 100 ? Moon : Sun
              }
              status={getLuzStatus(currentData?.luz || 0).status}
              statusText={getLuzStatus(currentData?.luz || 0).text}
              sparklineData={
                historicoData?.datos.slice(-6).map((d) => d.luz) || []
              }
            />
          </div>
          <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-md">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <span className="relative text-7xl filter drop-shadow-lg">
                      {estadoActual ? estadoEmoji[estadoActual.estado] : "😊"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">
                      ¿Cómo te sientes?
                    </h3>
                    <p className="text-slate-300 text-lg mt-1">
                      Último registro:{" "}
                      <span className="font-bold text-cyan-400">
                        {estadoActual
                          ? estadoTexto[estadoActual.estado]
                          : "Bien"}
                      </span>
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Reportado {timeAgo}
                    </p>
                  </div>
                </div>
                <EstadoModal onSubmit={handleEstadoSubmit} />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Movimientos detectados hoy"
              value="47"
              icon={Activity}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              label="Eventos de ruido"
              value="8"
              icon={Volume2}
              description="Últimas 24 horas"
            />
            <StatCard
              label="Tiempo en condiciones óptimas"
              value="6.5h"
              icon={Clock}
              description="De 24 horas totales"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="inline-flex rounded-xl bg-slate-800/50 backdrop-blur-sm shadow-lg p-1.5 gap-1 border border-slate-700/50">
                {["6h", "24h", "7d", "30d"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      periodo === p
                        ? "bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-700/50">
              <LineChart
                title="Evolución de condiciones ambientales"
                data={historicoData?.datos || []}
                xKey="timestamp"
                lines={[
                  {
                    name: "Temperatura (°C)",
                    dataKey: "temperatura",
                    color: "#10B981",
                  },
                  {
                    name: "Humedad (%)",
                    dataKey: "humedad",
                    color: "#3B82F6",
                  },
                  {
                    name: "CO2 (ppm / 10)",
                    dataKey: "co2",
                    color: "#8B5CF6",
                  },
                ]}
                height={350}
              />
            </div>
          </div>
          <Card className="overflow-hidden border border-slate-700/50 shadow-xl bg-slate-800/30 backdrop-blur-sm">
            <CardHeader className="bg-slate-900/50 border-b border-slate-700/50">
              <CardTitle className="text-2xl font-bold text-white">
                Eventos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {eventosData?.eventos.map((evento, index) => (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between py-4 px-4 rounded-lg transition-all duration-300 hover:bg-slate-700/50 border border-transparent hover:border-slate-600 group"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </div>
                      <span className="text-sm font-semibold text-slate-400 w-20">
                        {new Date(evento.timestamp).toLocaleTimeString(
                          "es-ES",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                      <EventBadge type={evento.tipo} text={evento.descripcion} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral con el mandala y el chatbot agrupados */}
        <div className="xl:col-span-1">
          <div className="sticky top-8 space-y-6">
            <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500">
                  Análisis Ambiental
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <MandalaVisualizer
                  temperatura={currentData?.temperatura || 0}
                  humedad={currentData?.humedad || 0}
                  co2={currentData?.co2 || 0}
                  luz={currentData?.luz || 0}
                />
              </CardContent>
            </Card>
            <ChatbotImproved
              currentData={currentData}
              historicoData={historicoData?.datos}
              estadoActual={estadoActual}
            />
          </div>
        </div>
      </div>
    </div>
  )
}