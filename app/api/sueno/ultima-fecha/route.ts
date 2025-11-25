import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    // Obtener la fecha más reciente con datos de sueño
    // Para análisis de sueño, necesitamos datos del día que tiene suficientes lecturas
    const result = await pool.query(`
      SELECT MAX(DATE(timestamp)) as ultima_fecha
      FROM lecturas
      WHERE timestamp IS NOT NULL
    `)

    if (result.rows.length === 0 || !result.rows[0].ultima_fecha) {
      return NextResponse.json(
        { error: "No hay datos de sueño disponibles" },
        { status: 404 }
      )
    }

    const fecha = result.rows[0].ultima_fecha.toISOString().split("T")[0]

    return NextResponse.json({ fecha })
  } catch (error) {
    console.error("Error al obtener última fecha:", error)
    return NextResponse.json(
      { error: "Error al obtener última fecha" },
      { status: 500 }
    )
  }
}
