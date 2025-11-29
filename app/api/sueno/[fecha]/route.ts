import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { AnalisisSueno, TimelineSegment } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fecha: string }> }
) {
  try {
    const { fecha } = await params

    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json(
        { error: "Formato de fecha inválido. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Calcular rango de tiempo de sueño (22:00 del día anterior a 08:00 del día solicitado)
    // Usar PostgreSQL para manejar las fechas correctamente
    const result = await pool.query(`
      SELECT
        temperatura,
        humedad,
        co2_estimado,
        luz,
        movimiento,
        ruido,
        calidad_calculada,
        timestamp
      FROM lecturas
      WHERE timestamp >= ($1::date - INTERVAL '1 day' + TIME '22:00:00')
        AND timestamp <= ($1::date + TIME '08:00:00')
      ORDER BY timestamp ASC
    `, [fecha])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay datos disponibles para esta fecha" },
        { status: 404 }
      )
    }

    const lecturas = result.rows

    // Calcular estadísticas
    const temperaturas = lecturas.map(l => parseFloat(l.temperatura))
    const humedades = lecturas.map(l => parseFloat(l.humedad))
    const co2s = lecturas.map(l => l.co2_estimado || 0)
    const calidades = lecturas.filter(l => l.calidad_calculada).map(l => l.calidad_calculada)

    const interrupciones = lecturas.filter(l => l.movimiento || l.ruido).length

    // Calcular duración en horas (de 22:00 a 08:00 = 10 horas)
    const duracion = 10

    // Calcular calidad promedio
    const calidadPromedio = calidades.length > 0
      ? calidades.reduce((a, b) => a + b, 0) / calidades.length
      : 0

    // Generar timeline por hora
    const timeline: TimelineSegment[] = []
    const fechaBase = new Date(fecha + "T00:00:00")

    for (let h = 22; h <= 32; h++) {
      const hour = h > 23 ? h - 24 : h
      const hourStr = `${hour.toString().padStart(2, "0")}:00`

      // Buscar lecturas en esa hora usando comparación de horas
      const lecturasHora = lecturas.filter(l => {
        const timestamp = new Date(l.timestamp)
        const tsHour = timestamp.getHours()

        // Si es 22:00 o 23:00, es del día anterior
        if (h === 22 || h === 23) {
          return tsHour === h
        }
        // Si es 0-7 (madrugada del día solicitado)
        return tsHour === hour && hour < 8
      })

      let condicion: "optimo" | "aceptable" | "malo" = "optimo"

      if (lecturasHora.length > 0) {
        const calidadHora = lecturasHora
          .filter(l => l.calidad_calculada)
          .map(l => l.calidad_calculada)

        if (calidadHora.length > 0) {
          const avgCalidad = calidadHora.reduce((a, b) => a + b, 0) / calidadHora.length

          if (avgCalidad >= 80) {
            condicion = "optimo"
          } else if (avgCalidad >= 60) {
            condicion = "aceptable"
          } else {
            condicion = "malo"
          }
        }
      }

      timeline.push({ hora: hourStr, condicion })
    }

    const data: AnalisisSueno = {
      fecha,
      duracion: Math.round(duracion * 10) / 10,
      calidad: Math.round(calidadPromedio),
      interrupciones,
      factores: {
        temperatura: {
          min: Math.min(...temperaturas),
          max: Math.max(...temperaturas),
          avg: temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length,
        },
        humedad: {
          min: Math.min(...humedades),
          max: Math.max(...humedades),
          avg: humedades.reduce((a, b) => a + b, 0) / humedades.length,
        },
        co2: {
          min: Math.min(...co2s),
          max: Math.max(...co2s),
          avg: co2s.reduce((a, b) => a + b, 0) / co2s.length,
        },
      },
      timeline,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener datos de sueño:", error)
    return NextResponse.json(
      { error: "Error al obtener datos de sueño" },
      { status: 500 }
    )
  }
}