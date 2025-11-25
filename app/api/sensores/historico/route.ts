import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { HistoricalData } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodo = searchParams.get("periodo") || "24h"

    let hours = 24
    switch (periodo) {
      case "6h":
        hours = 6
        break
      case "24h":
        hours = 24
        break
      case "7d":
        hours = 24 * 7
        break
      case "30d":
        hours = 24 * 30
        break
    }

    // Calcular timestamp de inicio
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Obtener datos reales de la base de datos
    const result = await pool.query(`
      SELECT
        temperature as temperatura,
        humidity as humedad,
        recorded_at as timestamp
      FROM sensor_temp
      WHERE recorded_at >= $1
      ORDER BY recorded_at ASC
    `, [startTime])

    // Agregar datos mock para sensores no implementados
    const datos: HistoricalData[] = result.rows.map((row) => ({
      timestamp: row.timestamp,
      temperatura: row.temperatura,
      humedad: row.humedad,
      co2: 420 + Math.random() * 50 - 25, // Mock
      luz: 340 + Math.random() * 100 - 50, // Mock
    }))

    return NextResponse.json({ datos })
  } catch (error) {
    console.error("Error al obtener datos históricos:", error)
    return NextResponse.json(
      { error: "Error al obtener datos históricos" },
      { status: 500 }
    )
  }
}
