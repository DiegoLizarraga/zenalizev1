"use client"

import { useState, useEffect } from "react"
import {
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "recharts"
import { useFetchRealtime } from "@/lib/hooks-realtime"
import { Estadisticas, ResumenDiario } from "@/lib/types"

type Metrica = "temperatura" | "humedad" | "calidad"

export default function HistorialPage() {
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<Metrica>("calidad")
  const [paginaActual, setPaginaActual] = useState(1)
  const [exportando, setExportando] = useState(false)
  const [mensajeExporto, setMensajeExporto] = useState("")
  const itemsPorPagina = 10

  // Calcular rango de fechas (últimos 30 días)
  const hoy = new Date()
  const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
  const inicio = hace30Dias.toISOString().split("T")[0]
  const fin = hoy.toISOString().split("T")[0]

  const { data, loading } = useFetchRealtime<{
    estadisticas: Estadisticas
    resumenDiario: ResumenDiario[]
  }>(`/api/estadisticas?inicio=${inicio}&fin=${fin}`)

  const estadoEmoji = {
    bien: "😊",
    regular: "😐",
    mal: "😞",
  }

  // Función mejorada para exportar CSV con 1000 registros
  const exportarCSVCompleto = async () => {
    setExportando(true)
    setMensajeExporto("Preparando exportación...")

    try {
      // Llamar al endpoint que descarga directamente
      const response = await fetch(`/api/estadisticas/export-csv?limit=1000&offset=0`)

      if (!response.ok) {
        throw new Error("Error en la exportación")
      }

      // Obtener el blob
      const blob = await response.blob()

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      // Obtener nombre del archivo del header
      const contentDisposition = response.headers.get("content-disposition")
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/)
      const filename = filenameMatch ? filenameMatch[1] : "zenalyze-export.csv"

      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setMensajeExporto(`✅ Descargado: ${filename}`)
      setTimeout(() => setMensajeExporto(""), 3000)
    } catch (error) {
      console.error("Error al exportar:", error)
      setMensajeExporto("❌ Error en la exportación")
      setTimeout(() => setMensajeExporto(""), 3000)
    } finally {
      setExportando(false)
    }
  }

  const getMetricaData = () => {
    if (!data) return []

    return data.resumenDiario.map((dia) => ({
      fecha: new Date(dia.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      }),
      valor:
        metricaSeleccionada === "temperatura"
          ? dia.temp_promedio
          : metricaSeleccionada === "humedad"
          ? dia.humedad_promedio
          : dia.calidad,
      fechaCompleta: dia.fecha,
    }))
  }

  const getMetricaConfig = () => {
    switch (metricaSeleccionada) {
      case "temperatura":
        return {
          nombre: "Temperatura",
          unidad: "°C",
          color: "#06B6D4",
          tipo: "linea" as const,
        }
      case "humedad":
        return {
          nombre: "Humedad",
          unidad: "%",
          color: "#3B82F6",
          tipo: "linea" as const,
        }
      case "calidad":
        return {
          nombre: "Calidad del Sueño",
          unidad: "/100",
          color: "#F59E0B",
          tipo: "barra" as const,
        }
    }
  }

  const metricaConfig = getMetricaConfig()
  const metricaData = getMetricaData()

  // Paginación
  const totalPaginas = data
    ? Math.ceil(data.resumenDiario.length / itemsPorPagina)
    : 0
  const datosPaginados = data
    ? data.resumenDiario.slice(
        (paginaActual - 1) * itemsPorPagina,
        paginaActual * itemsPorPagina
      )
    : []

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
          <p className="text-slate-300 font-medium">Cargando historial...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-slate-300">No hay datos disponibles</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Historial</h1>
            <p className="text-slate-300">
              Datos del {inicio} al {fin}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              onClick={exportarCSVCompleto}
              disabled={exportando}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 w-full sm:w-auto"
            >
              {exportando ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Exportar 1000 Registros</span>
                </>
              )}
            </Button>
            {mensajeExporto && (
              <p className={`text-xs text-center ${mensajeExporto.includes("✅") ? "text-green-400" : "text-red-400"}`}>
                {mensajeExporto}
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Promedio del periodo</span>
                <Calendar className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white font-mono">
                {data.estadisticas.promedio_calidad}
                <span className="text-lg text-slate-400">/100</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Calidad ambiental</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Mejor día</span>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white font-mono">
                {data.estadisticas.mejor_dia.valor}
                <span className="text-lg text-slate-400">/100</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(data.estadisticas.mejor_dia.fecha).toLocaleDateString(
                  "es-ES",
                  { day: "numeric", month: "long" }
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Peor día</span>
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-white font-mono">
                {data.estadisticas.peor_dia.valor}
                <span className="text-lg text-slate-400">/100</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(data.estadisticas.peor_dia.fecha).toLocaleDateString(
                  "es-ES",
                  { day: "numeric", month: "long" }
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-white">Evolución Histórica</CardTitle>
              <div className="flex flex-wrap gap-2">
                {(["calidad", "temperatura", "humedad"] as Metrica[]).map(
                  (metrica) => (
                    <button
                      key={metrica}
                      onClick={() => setMetricaSeleccionada(metrica)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          metricaSeleccionada === metrica
                            ? "bg-gradient-to-r from-green-500 to-blue-500 text-white"
                            : "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700"
                        }
                      `}
                    >
                      {metrica === "calidad"
                        ? "Calidad"
                        : metrica === "temperatura"
                        ? "Temperatura"
                        : "Humedad"}
                    </button>
                  )
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              {metricaConfig.tipo === "barra" ? (
                <BarChart data={metricaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="fecha"
                    stroke="#64748B"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#64748B" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  />
                  <Bar
                    dataKey="valor"
                    fill={metricaConfig.color}
                    name={`${metricaConfig.nombre} (${metricaConfig.unidad})`}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              ) : (
                <RechartsLineChart data={metricaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="fecha"
                    stroke="#64748B"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#64748B" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke={metricaConfig.color}
                    strokeWidth={2}
                    dot={{ fill: metricaConfig.color, r: 4 }}
                    name={`${metricaConfig.nombre} (${metricaConfig.unidad})`}
                  />
                </RechartsLineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabla de resumen */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Resumen Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Fecha
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Calidad
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Temp. Prom.
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Hum. Prom.
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Estado Ánimo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosPaginados.map((dia, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-200">
                        {new Date(dia.fecha).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-white">
                            {dia.calidad}
                          </span>
                          <div className="w-16 bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full"
                              style={{ width: `${dia.calidad}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-200">
                        {dia.temp_promedio.toFixed(1)}°C
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-200">
                        {dia.humedad_promedio.toFixed(0)}%
                      </td>
                      <td className="py-3 px-4">
                        {dia.estado_animo ? (
                          <span className="text-2xl" title={dia.estado_animo}>
                            {estadoEmoji[dia.estado_animo]}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
                <div className="text-sm text-slate-300">
                  Página {paginaActual} de {totalPaginas}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaActual === totalPaginas}
                    className="bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}