import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { SensorData } from "@/lib/types"

export async function GET() {
  try {
    // Obtener el registro más reciente de la tabla lecturas
    const result = await pool.query(`
      SELECT
        temperatura,
        humedad,
        luz,
        co2_estimado,
        movimiento,
        ruido,
        timestamp
      FROM lecturas
      ORDER BY timestamp DESC
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay datos disponibles" },
        { status: 404 }
      )
    }

    const latestData = result.rows[0]

    const data: SensorData = {
      temperatura: parseFloat(latestData.temperatura),
      humedad: parseFloat(latestData.humedad),
      co2: latestData.co2_estimado || 0,
      luz: latestData.luz || 0,
      movimiento: latestData.movimiento,
      ruido: latestData.ruido,
      timestamp: latestData.timestamp,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener datos actuales:", error)
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    )
  }
}
