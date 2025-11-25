import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    // Simple query para verificar conexión
    await pool.query('SELECT 1')

    return NextResponse.json({
      connected: true,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error al verificar conexión DB:', error.message)
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
