import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    // Probar conexión
    const testConnection = await pool.query('SELECT NOW()')
    console.log('✅ Conexión exitosa:', testConnection.rows[0])

    // Ver todas las tablas
    const tablesQuery = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    // Ver estructura de sensor_temp
    const structureQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sensor_temp'
      ORDER BY ordinal_position
    `)

    // Primero obtener los nombres de columnas
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sensor_temp'
      ORDER BY ordinal_position
    `)

    const columns = columnsResult.rows.map(r => r.column_name)

    // Obtener últimos 10 registros ordenando por la primera columna
    const dataQuery = await pool.query(`
      SELECT * FROM sensor_temp
      ORDER BY ${columns[0]} DESC
      LIMIT 10
    `)

    // Contar total de registros
    const countQuery = await pool.query('SELECT COUNT(*) FROM sensor_temp')

    return NextResponse.json({
      success: true,
      serverTime: testConnection.rows[0],
      availableTables: tablesQuery.rows,
      tableStructure: structureQuery.rows,
      sampleData: dataQuery.rows,
      totalRecords: parseInt(countQuery.rows[0].count),
    })
  } catch (error: any) {
    console.error('❌ Error en DB:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
