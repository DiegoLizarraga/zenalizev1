// app/api/sueno/registrar-calidad/route.ts
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

    // Obtener la sesión activa
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

    // Insertar/actualizar registro de calidad de sueño
    const insertResult = await pool.query(`
      INSERT INTO estadisticas_diarias (
        sesion_id,
        fecha,
        calidad_sueno,
        notas,
        timestamp
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (sesion_id, fecha) DO UPDATE SET
        calidad_sueno = $3,
        notas = $4,
        timestamp = NOW()
      RETURNING id, calidad_sueno
    `, [sesionId, fecha, calidad, notas || null])

    return NextResponse.json({
      success: true,
      id: insertResult.rows[0].id,
      calidad: insertResult.rows[0].calidad_sueno,
    })
  } catch (error) {
    console.error("Error al registrar calidad:", error)
    return NextResponse.json(
      { error: "Error al registrar" },
      { status: 500 }
    )
  }
}