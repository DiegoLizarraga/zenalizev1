import { NextRequest, NextResponse } from "next/server"
import { EstadoAnimo, RegistroEstado } from "@/lib/types"

// Almacenamiento temporal en memoria (reemplazar con PostgreSQL)
let lastEstado: RegistroEstado | null = null

export async function GET() {
  try {
    if (!lastEstado) {
      // Estado por defecto
      lastEstado = {
        id: 1,
        estado: "bien",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // hace 2 horas
      }
    }

    return NextResponse.json(lastEstado)
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

    const nuevoEstado: RegistroEstado = {
      id: Date.now(),
      estado,
      timestamp: new Date().toISOString(),
    }

    lastEstado = nuevoEstado

    return NextResponse.json({ success: true, id: nuevoEstado.id })
  } catch (error) {
    console.error("Error al registrar estado:", error)
    return NextResponse.json(
      { error: "Error al registrar estado" },
      { status: 500 }
    )
  }
}
