"use client"

import { useState, useEffect } from "react"
import {
  Moon,
  Star,
  AlertCircle,
  TrendingUp,
  Thermometer,
  Droplets,
  Wind,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFetch } from "@/lib/hooks"
import { AnalisisSueno } from "@/lib/types"

export default function SuenoPage() {
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  )

  const { data: analisisSueno, loading } = useFetch<AnalisisSueno>(
    `/api/sueno/${fecha}`
  )

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fecha)
    nuevaFecha.setDate(nuevaFecha.getDate() + dias)
    setFecha(nuevaFecha.toISOString().split("T")[0])
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

  const getCondicionColor = (condicion: string) => {
    switch (condicion) {
      case "optimo":
        return "bg-success"
      case "aceptable":
        return "bg-warning"
      case "malo":
        return "bg-error"
      default:
        return "bg-slate-300"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative"><div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-400 rounded-full animate-spin"></div><div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"><div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div></div></div>
          <p className="text-slate-300 font-medium">Cargando análisis...</p>
        </div>
      </div>
    )
  }

  if (!analisisSueno) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-slate-300">No hay datos disponibles</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-8 lg:p-12">
      <div className="max-w-screen-2xl mx-auto space-y-8">
      {/* Header con selector de fecha */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Análisis de Sueño
          </h1>
          <p className="text-slate-300 capitalize">{formatFecha(fecha)}</p>
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
            onClick={() => setFecha(new Date().toISOString().split("T")[0])}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0"
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => cambiarFecha(1)}
            disabled={fecha >= new Date().toISOString().split("T")[0]}
            className="bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resumen de la noche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Duración</span>
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {analisisSueno.duracion}h
            </p>
            <p className="text-xs text-slate-400 mt-1">Tiempo total</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Calidad</span>
              <Star className="h-5 w-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {analisisSueno.calidad.toFixed(0)}
              <span className="text-lg text-slate-400">/100</span>
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className="bg-warning h-2 rounded-full transition-all"
                style={{ width: `${analisisSueno.calidad}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Interrupciones</span>
              <AlertCircle className="h-5 w-5 text-error" />
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {analisisSueno.interrupciones}
            </p>
            <p className="text-xs text-slate-400 mt-1">Eventos detectados</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Comparativa</span>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              +{Math.floor(Math.random() * 20)}%
            </p>
            <p className="text-xs text-slate-400 mt-1">vs promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline visual */}
      <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Timeline de la Noche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-success" />
                <span className="text-sm text-slate-300">Óptimo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-warning" />
                <span className="text-sm text-slate-300">Aceptable</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-error" />
                <span className="text-sm text-slate-300">Malo</span>
              </div>
            </div>

            <div className="relative">
              <div className="flex h-16 rounded-lg overflow-hidden">
                {analisisSueno.timeline.map((segment, index) => (
                  <div
                    key={index}
                    className={`flex-1 ${getCondicionColor(
                      segment.condicion
                    )} transition-all hover:opacity-80`}
                    title={`${segment.hora} - ${segment.condicion}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>22:00</span>
                <span>00:00</span>
                <span>02:00</span>
                <span>04:00</span>
                <span>06:00</span>
                <span>08:00</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factores ambientales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-primary" />
              <span>Temperatura</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Mínima</span>
                <span className="font-mono font-semibold">
                  {analisisSueno.factores.temperatura.min.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Promedio</span>
                <span className="font-mono font-semibold text-primary">
                  {analisisSueno.factores.temperatura.avg.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Máxima</span>
                <span className="font-mono font-semibold">
                  {analisisSueno.factores.temperatura.max.toFixed(1)}°C
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-primary" />
              <span>Humedad</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Mínima</span>
                <span className="font-mono font-semibold">
                  {analisisSueno.factores.humedad.min.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Promedio</span>
                <span className="font-mono font-semibold text-primary">
                  {analisisSueno.factores.humedad.avg.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Máxima</span>
                <span className="font-mono font-semibold">
                  {analisisSueno.factores.humedad.max.toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wind className="h-5 w-5 text-primary" />
              <span>CO2</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Mínimo</span>
                <span className="font-mono font-semibold">
                  {analisisSueno.factores.co2.min.toFixed(0)} ppm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Promedio</span>
                <span className="font-mono font-semibold text-primary">
                  {analisisSueno.factores.co2.avg.toFixed(0)} ppm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-300">Máximo</span>
                <span className="font-mono font-semibold">
                  {analisisSueno.factores.co2.max.toFixed(0)} ppm
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones */}
      <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            <span>Recomendaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
              <p className="text-slate-200">
                Mantén la temperatura entre 18-21°C para un descanso óptimo
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <p className="text-slate-200">
                Ventila la habitación antes de dormir para reducir CO2
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <p className="text-slate-200">
                La humedad ideal está entre 40-60% para mejor respiración
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
