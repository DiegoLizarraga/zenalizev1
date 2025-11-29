// app/api/sueno/datos-noche/route.ts
import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fecha = searchParams.get("fecha")

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json(
        {
          fecha: fecha || "",
          temperatura_promedio: 0,
          temperatura_min: 0,
          temperatura_max: 0,
          humedad_promedio: 0,
          humedad_min: 0,
          humedad_max: 0,
          co2_promedio: 0,
          co2_min: 0,
          co2_max: 0,
          datos: [],
        }
      )
    }

    try {
      // Intentar obtener datos
      const result = await pool.query(`
        SELECT
          temperatura,
          humedad,
          co2_estimado,
          TO_CHAR(timestamp, 'HH24:MI') as hora,
          DATE(timestamp) as fecha
        FROM lecturas
        WHERE (
          -- 10 PM del día anterior
          (DATE(timestamp) = ($1::date - INTERVAL '1 day') AND EXTRACT(HOUR FROM timestamp) >= 22)
          OR
          -- 12 AM - 6 AM del día actual
          (DATE(timestamp) = $1::date AND EXTRACT(HOUR FROM timestamp) < 6)
        )
        ORDER BY timestamp ASC
      `, [fecha])

      // Agrupar por hora
      const datosPorHora: { [key: string]: any } = {}

      result.rows.forEach(row => {
        const hora = row.hora
        if (!datosPorHora[hora]) {
          datosPorHora[hora] = {
            hora,
            temperaturas: [],
            humedades: [],
            co2s: [],
          }
        }
        if (row.temperatura) datosPorHora[hora].temperaturas.push(row.temperatura)
        if (row.humedad) datosPorHora[hora].humedades.push(row.humedad)
        if (row.co2_estimado) datosPorHora[hora].co2s.push(row.co2_estimado)
      })

      const datos = Object.values(datosPorHora).map((d: any) => ({
        hora: d.hora,
        temperatura:
          d.temperaturas.length > 0
            ? d.temperaturas.reduce((a: number, b: number) => a + b) /
              d.temperaturas.length
            : 0,
        humedad:
          d.humedades.length > 0
            ? d.humedades.reduce((a: number, b: number) => a + b) /
              d.humedades.length
            : 0,
        co2:
          d.co2s.length > 0
            ? Math.round(
                d.co2s.reduce((a: number, b: number) => a + b) / d.co2s.length
              )
            : 0,
      }))

      // Calcular promedios generales
      const allTemperaturas = result.rows
        .map(r => r.temperatura)
        .filter(Boolean)
      const allHumedades = result.rows.map(r => r.humedad).filter(Boolean)
      const allCo2 = result.rows
        .map(r => r.co2_estimado)
        .filter(Boolean)

      const sleepData = {
        fecha,
        temperatura_promedio:
          allTemperaturas.length > 0
            ? allTemperaturas.reduce((a, b) => a + b) / allTemperaturas.length
            : 0,
        temperatura_min:
          allTemperaturas.length > 0 ? Math.min(...allTemperaturas) : 0,
        temperatura_max:
          allTemperaturas.length > 0 ? Math.max(...allTemperaturas) : 0,
        humedad_promedio:
          allHumedades.length > 0
            ? allHumedades.reduce((a, b) => a + b) / allHumedades.length
            : 0,
        humedad_min:
          allHumedades.length > 0 ? Math.min(...allHumedades) : 0,
        humedad_max:
          allHumedades.length > 0 ? Math.max(...allHumedades) : 0,
        co2_promedio:
          allCo2.length > 0 ? allCo2.reduce((a, b) => a + b) / allCo2.length : 0,
        co2_min: allCo2.length > 0 ? Math.min(...allCo2) : 0,
        co2_max: allCo2.length > 0 ? Math.max(...allCo2) : 0,
        datos,
      }

      return NextResponse.json(sleepData)
    } catch (dbError) {
      console.error("Error en consulta DB:", dbError)
      // Retornar datos vacíos en lugar de error
      return NextResponse.json({
        fecha,
        temperatura_promedio: 0,
        temperatura_min: 0,
        temperatura_max: 0,
        humedad_promedio: 0,
        humedad_min: 0,
        humedad_max: 0,
        co2_promedio: 0,
        co2_min: 0,
        co2_max: 0,
        datos: [],
      })
    }
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        fecha: "",
        temperatura_promedio: 0,
        temperatura_min: 0,
        temperatura_max: 0,
        humedad_promedio: 0,
        humedad_min: 0,
        humedad_max: 0,
        co2_promedio: 0,
        co2_min: 0,
        co2_max: 0,
        datos: [],
      }
    )
  }
}