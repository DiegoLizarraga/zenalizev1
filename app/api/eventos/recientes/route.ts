import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { Evento } from "@/lib/types"

// Mapeo de tipos de eventos de DB a tipos de la UI
function mapTipoEvento(tipoDb: string): "movement" | "noise" | "threshold" {
  switch (tipoDb) {
    case "movimiento":
      return "movement"
    case "ruido":
      return "noise"
    case "temperatura":
    case "humedad":
    case "co2":
    case "luz":
      return "threshold"
    default:
      return "threshold"
  }
}

export async function GET() {
  try {
    // Obtener los últimos 10 eventos de la tabla eventos
    const result = await pool.query(`
      SELECT
        id,
        timestamp,
        tipo,
        descripcion
      FROM eventos
      ORDER BY timestamp DESC
      LIMIT 10
    `)

    const eventos: Evento[] = result.rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      tipo: mapTipoEvento(row.tipo),
      descripcion: row.descripcion || `Evento de ${row.tipo}`,
    }))

    return NextResponse.json({ eventos })
  } catch (error) {
    console.error("Error al obtener eventos:", error)
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    )
  }
}
