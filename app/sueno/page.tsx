"use client"

import { useState, useEffect } from "react"
import {
  Moon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wind,
  Droplets,
  Thermometer,
  Sun,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { useFetch } from "@/lib/hooks"

interface SleepData {
  fecha: string
  temperatura_promedio: number
  temperatura_min: number
  temperatura_max: number
  humedad_promedio: number
  humedad_min: number
  humedad_max: number
  co2_promedio: number
  datos: Array<{
    hora: string
    temperatura: number
    humedad: number
    co2: number
  }>
}

interface HistorialCalidad {
  fecha: string
  calidad: number
}

export default function SuenoPage() {
  const [fecha, setFecha] = useState<string | null>(null)
  const [calificacionSueno, setCalificacionSueno] = useState<number | null>(null)
  const [notas, setNotas] = useState("")
  const [registrando, setRegistrando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  // Obtener la última fecha con datos
  const { data: ultimaFechaData } = useFetch<{ fecha: string }>(
    "/api/sueno/ultima-fecha"
  )

  useEffect(() => {
    if (ultimaFechaData && !fecha) {
      setFecha(ultimaFechaData.fecha)
    }
  }, [ultimaFechaData, fecha])

  // Obtener datos de sueño para la fecha seleccionada
  const { data: sleepData, loading } = useFetch<SleepData>(
    fecha ? `/api/sueno/datos-noche?fecha=${fecha}` : ""
  )

  // Obtener historial de calidades
  const { data: historicoCalidad } = useFetch<{ registros: HistorialCalidad[] }>(
    "/api/sueno/historial-calidad"
  )

  const cambiarFecha = (dias: number) => {
    if (!fecha) return
    const nuevaFecha = new Date(fecha)
    nuevaFecha.setDate(nuevaFecha.getDate() + dias)
    setFecha(nuevaFecha.toISOString().split("T")[0])
  }

  const registrarCalidad = async () => {
    if (calificacionSueno === null) {
      alert("Por favor selecciona una calificación")
      return
    }

    setRegistrando(true)
    try {
      const response = await fetch("/api/sueno/guardar-calidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          calidad: calificacionSueno,
          notas,
        }),
      })

      if (response.ok) {
        setGuardado(true)
        setTimeout(() => setGuardado(false), 3000)
        setCalificacionSueno(null)
        setNotas("")
      }
    } catch (error) {
      console.error("Error al registrar:", error)
    } finally {
      setRegistrando(false)
    }
  }

  const formatFecha = (fechaStr: string) => {
    const date = new Date(fechaStr + "T00:00:00")
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Cargando análisis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        {/* Header con selector de fecha */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Moon className="h-8 w-8 text-blue-400" />
              Análisis de Sueño
            </h1>
            {fecha && (
              <p className="text-slate-300 capitalize text-lg">
                {formatFecha(fecha)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => cambiarFecha(-1)}
              className="bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                ultimaFechaData && setFecha(ultimaFechaData.fecha)
              }
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => cambiarFecha(1)}
              disabled={
                !ultimaFechaData ||
                !fecha ||
                fecha >= ultimaFechaData.fecha
              }
              className="bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resumen de la noche */}
        {sleepData && sleepData.temperatura_promedio !== undefined ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Temp Prom</span>
                    <Thermometer className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-3xl font-bold text-white font-mono">
                    {(sleepData.temperatura_promedio || 0).toFixed(1)}°C
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(sleepData.temperatura_min || 0).toFixed(1)}° a{" "}
                    {(sleepData.temperatura_max || 0).toFixed(1)}°
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Humedad Prom</span>
                    <Droplets className="h-5 w-5 text-cyan-400" />
                  </div>
                  <p className="text-3xl font-bold text-white font-mono">
                    {(sleepData.humedad_promedio || 0).toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(sleepData.humedad_min || 0).toFixed(0)}% a{" "}
                    {(sleepData.humedad_max || 0).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">CO2 Prom</span>
                    <Wind className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white font-mono">
                    {Math.round(sleepData.co2_promedio || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">ppm</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Período</span>
                    <Sun className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white font-mono">
                    10 PM
                  </p>
                  <p className="text-xs text-slate-400 mt-1">a 6 AM</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfica de condiciones ambientales */}
            {sleepData.datos && sleepData.datos.length > 0 && (
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-400" />
                    Condiciones Ambientales (10 PM - 6 AM)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={sleepData.datos}>
                      <defs>
                        <linearGradient
                          id="colorTemp"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorHum"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#06b6d4"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06b6d4"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis
                        dataKey="hora"
                        stroke="#94a3b8"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Area
                        type="monotone"
                        dataKey="temperatura"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorTemp)"
                        name="Temperatura (°C)"
                      />
                      <Area
                        type="monotone"
                        dataKey="humedad"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#colorHum)"
                        name="Humedad (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Encuesta de sueño */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Moon className="h-5 w-5 text-purple-400" />
                  ¿Cómo dormiste anoche?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calificación de sueño */}
                <div>
                  <p className="text-slate-300 font-medium mb-4">
                    Califica tu sueño:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <button
                        key={valor}
                        onClick={() => setCalificacionSueno(valor)}
                        className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                          calificacionSueno === valor
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                        }`}
                      >
                        <div className="text-2xl mb-2">
                          {valor === 1
                            ? "😴"
                            : valor === 2
                            ? "😕"
                            : valor === 3
                            ? "😐"
                            : valor === 4
                            ? "😊"
                            : "😴✨"}
                        </div>
                        <p className="text-sm text-slate-300">{valor}</p>
                        <p className="text-xs text-slate-400">
                          {valor === 1
                            ? "Terrible"
                            : valor === 2
                            ? "Malo"
                            : valor === 3
                            ? "Regular"
                            : valor === 4
                            ? "Bueno"
                            : "Excelente"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas opcionales */}
                <div>
                  <label className="text-slate-300 font-medium mb-2 block">
                    Notas adicionales (opcional):
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="¿Qué tal fue tu sueño? ¿Algo te molestó? ¿Cómo te sientes?"
                    className="w-full p-3 bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Botón de guardar */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={registrarCalidad}
                    disabled={registrando || calificacionSueno === null}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {registrando
                      ? "Guardando..."
                      : guardado
                      ? "¡Guardado!"
                      : "Guardar Registro"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Historial de conformidad */}
            {historicoCalidad && historicoCalidad.registros.length > 0 && (
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Historial de Sueño (Últimos 30 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={historicoCalidad.registros}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis
                        dataKey="fecha"
                        stroke="#94a3b8"
                        style={{ fontSize: "12px" }}
                        tick={{ dy: 5 }}
                      />
                      <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                        labelStyle={{ color: "#e2e8f0" }}
                        formatter={(value) => [
                          `${value}/5`,
                          "Calidad",
                        ]}
                      />
                      <Bar
                        dataKey="calidad"
                        fill="url(#colorGradient)"
                        radius={[8, 8, 0, 0]}
                        name="Calidad del Sueño"
                      />
                      <defs>
                        <linearGradient
                          id="colorGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06b6d4"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 border rounded-lg p-8 text-center">
            <Moon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">
              No hay datos de sensores para esta noche
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Los datos se recopilan entre las 10 PM y 6 AM
            </p>
          </div>
        )}
      </div>
    </div>
  )
}