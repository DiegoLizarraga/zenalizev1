import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { EstadoAnimo, RegistroEstado } from "@/lib/types"

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

// Mapeo de estados de UI a estados de DB
function mapEstadoToDb(estadoUi: EstadoAnimo): string {
  switch (estadoUi) {
    case "bien":
      return "bajo"
    case "regular":
      return "medio"
    case "mal":
      return "alto"
  }
}

export async function GET() {
  try {
    // Obtener la última encuesta de estrés
    const result = await pool.query(`
      SELECT
        id,
        estres,
        timestamp
      FROM encuesta
      ORDER BY timestamp DESC
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      // Estado por defecto si no hay datos
      return NextResponse.json({
        id: 0,
        estado: "bien",
        timestamp: new Date().toISOString(),
      })
    }

    const row = result.rows[0]
    const estado: RegistroEstado = {
      id: row.id,
      estado: mapEstadoFromDb(row.estres),
      timestamp: row.timestamp,
    }

    return NextResponse.json(estado)
  } catch (error) {
    console.error("Error al obtener estado:", error)
    return NextResponse.json(
      { error: "Error al obtener estado" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { estado } = body as { estado: EstadoAnimo }

    if (!["bien", "regular", "mal"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    // Obtener la sesión activa más reciente
    const sesionResult = await pool.query(`
      SELECT id FROM sesiones
      ORDER BY inicio DESC
      LIMIT 1
    `)

    if (sesionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay sesiones activas" },
        { status: 400 }
      )
    }

    const sesionId = sesionResult.rows[0].id

    // Insertar el nuevo registro de estado en la tabla encuesta
    const insertResult = await pool.query(`
      INSERT INTO encuesta (sesion_id, estres, timestamp)
      VALUES ($1, $2, NOW())
      RETURNING id
    `, [sesionId, mapEstadoToDb(estado)])

    return NextResponse.json({
      success: true,
      id: insertResult.rows[0].id
    })
  } catch (error) {
    console.error("Error al registrar estado:", error)
    return NextResponse.json(
      { error: "Error al registrar estado" },
      { status: 500 }
    )
  }
}
