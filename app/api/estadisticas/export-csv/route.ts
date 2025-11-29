import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

// Función para escapar comillas en CSV
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return ""
  const stringValue = String(value)
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

// Función para convertir array de objetos a CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ""

  // Headers
  const headers = Object.keys(data[0])
  const csvHeaders = headers.map(h => escapeCsvValue(h)).join(",")

  // Rows
  const csvRows = data.map(row =>
    headers.map(header => escapeCsvValue(row[header])).join(",")
  )

  return [csvHeaders, ...csvRows].join("\n")
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 10000) // Max 10000
    const offset = parseInt(searchParams.get("offset") || "0")

    // Obtener datos de lecturas (últimos registros)
    const result = await pool.query(
      `
      SELECT
        id,
        temperatura,
        humedad,
        luz,
        co2_estimado,
        movimiento,
        ruido,
        calidad_calculada,
        timestamp
      FROM lecturas
      ORDER BY timestamp DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay datos disponibles para exportar" },
        { status: 404 }
      )
    }

    // Invertir el orden para que sea del más antiguo al más reciente
    const sortedRows = result.rows.reverse()

    // Obtener también datos de encuestas (estado de ánimo)
    const encuestasResult = await pool.query(
      `
      SELECT
        DATE(timestamp) as fecha,
        estres
      FROM encuesta
      ORDER BY timestamp DESC
      LIMIT 1000
      `
    )

    const encuestasMap = new Map()
    encuestasResult.rows.forEach((row: any) => {
      encuestasMap.set(row.fecha.toISOString().split("T")[0], row.estres)
    })

    // Agregar estado de ánimo a cada registro
    const enrichedData = sortedRows.map((row: any) => {
      const fecha = new Date(row.timestamp).toISOString().split("T")[0]
      const estres = encuestasMap.get(fecha)

      return {
        ID: row.id,
        "Timestamp": new Date(row.timestamp).toLocaleString("es-ES"),
        "Fecha": fecha,
        "Temperatura (°C)": row.temperatura ? row.temperatura.toFixed(2) : "",
        "Humedad (%)": row.humedad ? row.humedad.toFixed(1) : "",
        "Luz (lux)": row.luz ? Math.round(row.luz) : "",
        "CO2 (ppm)": row.co2_estimado ? Math.round(row.co2_estimado) : "",
        "Movimiento": row.movimiento ? "Sí" : "No",
        "Ruido": row.ruido ? "Sí" : "No",
        "Calidad": row.calidad_calculada ? row.calidad_calculada : "",
        "Estado Ánimo": estres ? estres.toUpperCase() : "N/A",
      }
    })

    // Convertir a CSV
    const csv = convertToCSV(enrichedData)

    // Crear nombre de archivo con fecha
    const now = new Date()
    const filename = `zenalyze-export-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.csv`

    // Retornar como descarga
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar CSV:", error)
    return NextResponse.json(
      { error: "Error al exportar datos" },
      { status: 500 }
    )
  }
}