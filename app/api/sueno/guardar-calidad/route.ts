// app/api/sueno/guardar-calidad/route.ts
import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fecha, calidad, notas } = body

    if (!fecha || calidad === null || calidad === undefined) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    if (calidad < 1 || calidad > 5) {
      return NextResponse.json(
        { error: "La calidad debe estar entre 1 y 5" },
        { status: 400 }
      )
    }

    // Obtener la sesión activa más reciente
    const sesionResult = await pool.query(`
      SELECT id FROM sesiones
      ORDER BY inicio DESC
      LIMIT 1
    `)

    let sesionId = 1 // Default a sesión 1 si no existe

    if (sesionResult.rows.length > 0) {
      sesionId = sesionResult.rows[0].id
    }

    // Convertir calificación 1-5 a nivel de estrés
    let estres: string
    if (calidad === 1) {
      estres = "alto" // Terrible = Alto estrés
    } else if (calidad === 2) {
      estres = "alto" // Malo = Alto estrés
    } else if (calidad === 3) {
      estres = "medio" // Regular = Estrés medio
    } else if (calidad === 4) {
      estres = "bajo" // Bueno = Bajo estrés
    } else {
      estres = "bajo" // Excelente = Bajo estrés
    }

    // Insertar en tabla encuesta con el registro de calidad
    // Guardamos en notas si las hay
    const insertResult = await pool.query(`
      INSERT INTO encuesta (sesion_id, estres, timestamp)
      VALUES ($1, $2, NOW())
      RETURNING id
    `, [sesionId, estres])

    return NextResponse.json({
      success: true,
      id: insertResult.rows[0].id,
      calidad,
      estres,
      mensaje: "Calidad de sueño registrada correctamente",
    })
  } catch (error) {
    console.error("Error al guardar calidad:", error)
    return NextResponse.json(
      { error: "Error al guardar registro" },
      { status: 500 }
    )
  }
}