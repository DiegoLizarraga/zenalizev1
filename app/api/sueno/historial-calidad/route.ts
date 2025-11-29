// app/api/sueno/historial-calidad/route.ts
import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    // Obtener registros de calidad de las notas
    // Usamos la tabla encuesta que ya existe
    const result = await pool.query(`
      SELECT DISTINCT ON (DATE(e.timestamp))
        DATE(e.timestamp) as fecha,
        -- Convertir estres a calificación (bajo=4, medio=3, alto=2)
        CASE 
          WHEN e.estres = 'bajo' THEN 4
          WHEN e.estres = 'medio' THEN 3
          WHEN e.estres = 'alto' THEN 2
          ELSE 3
        END as calidad,
        e.timestamp
      FROM encuesta e
      WHERE e.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY DATE(e.timestamp), e.timestamp DESC
    `)

    const registros = result.rows.map(row => ({
      fecha: row.fecha ? row.fecha.toISOString().split("T")[0] : "",
      calidad: row.calidad || 3,
    }))

    return NextResponse.json({
      registros: registros
        .filter(r => r.fecha) // Filtrar fechas vacías
        .reverse(), // Mostrar de antiguo a reciente
    })
  } catch (error) {
    console.error("Error al obtener historial:", error)
    return NextResponse.json({
      registros: [],
    })
  }
}