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

    // Primero verificar si hay datos recientes
    const checkRecent = await pool.query(`
      SELECT MAX(timestamp) as ultima_lectura
      FROM lecturas
    `)

    const ultimaLectura = checkRecent.rows[0]?.ultima_lectura
    if (!ultimaLectura) {
      return NextResponse.json({ datos: [] })
    }

    // Calcular timestamp de inicio desde la última lectura
    const ultimaLecturaDate = new Date(ultimaLectura)
    const startTime = new Date(ultimaLecturaDate.getTime() - hours * 60 * 60 * 1000)

    // Determinar el intervalo de agrupación según el período
    let intervalo = 'minute' // Para 6h
    let maxPuntos = 360 // 6h * 60min

    if (hours >= 24 && hours < 168) {
      intervalo = 'hour' // Para 24h (1 punto por hora)
      maxPuntos = 24
    } else if (hours >= 168 && hours < 720) {
      intervalo = 'hour' // Para 7d (1 punto cada 2 horas)
      maxPuntos = 84
    } else if (hours >= 720) {
      intervalo = 'day' // Para 30d (1 punto por día)
      maxPuntos = 30
    }

    // Obtener datos agregados para mejorar rendimiento
    const result = await pool.query(`
      SELECT
        date_trunc($1, timestamp) as timestamp,
        AVG(temperatura) as temperatura,
        AVG(humedad) as humedad,
        AVG(luz) as luz,
        AVG(co2_estimado) as co2_estimado
      FROM lecturas
      WHERE timestamp >= $2
      GROUP BY date_trunc($1, timestamp)
      ORDER BY timestamp ASC
      LIMIT $3
    `, [intervalo, startTime, maxPuntos])

    // Convertir los datos de la base de datos
    const datos: HistoricalData[] = result.rows.map((row) => ({
      timestamp: row.timestamp,
      temperatura: parseFloat(row.temperatura),
      humedad: parseFloat(row.humedad),
      co2: Math.round(row.co2_estimado) || 0,
      luz: Math.round(row.luz) || 0,
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
