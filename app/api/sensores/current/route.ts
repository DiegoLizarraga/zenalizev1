import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { SensorData } from "@/lib/types"

export async function GET() {
  try {
    // Obtener el registro más reciente de sensor_temp
    const result = await pool.query(`
      SELECT
        temperature,
        humidity,
        recorded_at as timestamp
      FROM sensor_temp
      ORDER BY recorded_at DESC
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay datos disponibles" },
        { status: 404 }
      )
    }

    const latestData = result.rows[0]

    // Datos mock para sensores no implementados aún
    // Puedes agregar estas columnas a la tabla cuando tengas los sensores
    const data: SensorData = {
      temperatura: latestData.temperature,
      humedad: latestData.humidity,
      co2: 420 + Math.random() * 50 - 25, // Mock hasta implementar sensor
      luz: 340 + Math.random() * 100 - 50, // Mock hasta implementar sensor
      movimiento: Math.random() > 0.7, // Mock hasta implementar sensor
      ruido: Math.random() > 0.8, // Mock hasta implementar sensor
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
