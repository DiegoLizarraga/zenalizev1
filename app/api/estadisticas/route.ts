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

    // Obtener resumen diario desde la base de datos (optimizado)
    const result = await pool.query(`
      WITH daily_stats AS (
        SELECT
          DATE(l.timestamp) as fecha,
          AVG(l.calidad_calculada) as calidad,
          AVG(l.temperatura) as temp_promedio,
          AVG(l.humedad) as humedad_promedio
        FROM lecturas l
        WHERE l.timestamp::date BETWEEN $1::date AND $2::date
        GROUP BY DATE(l.timestamp)
      ),
      daily_mood AS (
        SELECT DISTINCT ON (DATE(e.timestamp))
          DATE(e.timestamp) as fecha,
          e.estres
        FROM encuesta e
        WHERE e.timestamp::date BETWEEN $1::date AND $2::date
        ORDER BY DATE(e.timestamp), e.timestamp DESC
      )
      SELECT
        ds.fecha,
        COALESCE(ds.calidad, 0) as calidad,
        COALESCE(ds.temp_promedio, 0) as temp_promedio,
        COALESCE(ds.humedad_promedio, 0) as humedad_promedio,
        dm.estres as estado_animo
      FROM daily_stats ds
      LEFT JOIN daily_mood dm ON ds.fecha = dm.fecha
      ORDER BY ds.fecha ASC
      LIMIT 90
    `, [inicio, fin])

    const resumenDiario: ResumenDiario[] = result.rows.map((row) => ({
      fecha: row.fecha.toISOString().split("T")[0],
      calidad: Math.round(row.calidad),
      temp_promedio: parseFloat(row.temp_promedio),
      humedad_promedio: parseFloat(row.humedad_promedio),
      estado_animo: row.estado_animo ? mapEstadoFromDb(row.estado_animo) : null,
    }))

    // Calcular estadísticas
    if (resumenDiario.length === 0) {
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
