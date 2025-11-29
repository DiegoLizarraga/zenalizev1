import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { Estadisticas, ResumenDiario, EstadoAnimo } from "@/lib/types"

// Mapeo de estados de DB a estados de la UI
function mapEstadoFromDb(estresDb: string): EstadoAnimo {
  switch (estresDb) {
    case "bajo":
      return "bien"
    case "medio":
      return "regular"
    case "alto":
      return "mal"
    default:
      return "bien"
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let inicio = searchParams.get("inicio")
    let fin = searchParams.get("fin")

    if (!inicio || !fin) {
      // Por defecto: últimos 30 días
      const hoy = new Date()
      const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

      fin = hoy.toISOString().split("T")[0]
      inicio = hace30Dias.toISOString().split("T")[0]
    }

    // Validar formato de fechas
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(inicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fin)
    ) {
      return NextResponse.json(
        { error: "Formato de fecha inválido. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Obtener resumen diario desde la base de datos
    const lecturaResult = await pool.query(`
      SELECT
        DATE(timestamp) as fecha,
        AVG(CAST(calidad_calculada AS FLOAT)) as calidad,
        AVG(temperatura) as temp_promedio,
        AVG(humedad) as humedad_promedio
      FROM lecturas
      WHERE DATE(timestamp) BETWEEN $1::date AND $2::date
      GROUP BY DATE(timestamp)
      ORDER BY fecha ASC
    `, [inicio, fin])

    // Obtener estado de ánimo (encuestas)
    const encuestaResult = await pool.query(`
      SELECT DISTINCT ON (DATE(timestamp))
        DATE(timestamp) as fecha,
        estres
      FROM encuesta
      WHERE DATE(timestamp) BETWEEN $1::date AND $2::date
      ORDER BY DATE(timestamp) DESC, timestamp DESC
    `, [inicio, fin])

    // Mapear encuestas a un objeto para búsqueda rápida
    const encuestasMap = new Map()
    encuestaResult.rows.forEach((row: any) => {
      const fecha = row.fecha.toISOString().split("T")[0]
      encuestasMap.set(fecha, row.estres)
    })

    // Construir resumen diario
    const resumenDiario: ResumenDiario[] = lecturaResult.rows.map((row: any) => ({
      fecha: row.fecha.toISOString().split("T")[0],
      calidad: Math.round(row.calidad || 0),
      temp_promedio: parseFloat(row.temp_promedio || 0),
      humedad_promedio: parseFloat(row.humedad_promedio || 0),
      estado_animo: row.fecha && encuestasMap.has(row.fecha.toISOString().split("T")[0])
        ? mapEstadoFromDb(encuestasMap.get(row.fecha.toISOString().split("T")[0]))
        : null,
    }))

    // Calcular estadísticas
    if (resumenDiario.length === 0) {
      // Si no hay datos, retornar valores por defecto
      return NextResponse.json({
        estadisticas: {
          promedio_calidad: 0,
          mejor_dia: { fecha: inicio, valor: 0 },
          peor_dia: { fecha: inicio, valor: 0 },
        },
        resumenDiario: [],
      })
    }

    const calidades = resumenDiario.map(d => d.calidad)
    const promedio = calidades.reduce((a, b) => a + b, 0) / calidades.length
    const mejorIndex = calidades.indexOf(Math.max(...calidades))
    const peorIndex = calidades.indexOf(Math.min(...calidades))

    const estadisticas: Estadisticas = {
      promedio_calidad: Math.round(promedio),
      mejor_dia: {
        fecha: resumenDiario[mejorIndex].fecha,
        valor: resumenDiario[mejorIndex].calidad,
      },
      peor_dia: {
        fecha: resumenDiario[peorIndex].fecha,
        valor: resumenDiario[peorIndex].calidad,
      },
    }

    return NextResponse.json({ estadisticas, resumenDiario })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}