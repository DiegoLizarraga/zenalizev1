import { NextResponse } from "next/server"
import { Evento } from "@/lib/types"

// Genera eventos mock
function generateMockEvents(): Evento[] {
  const eventos: Evento[] = []
  const now = new Date()

  const eventosTemplates = [
    { tipo: "movement" as const, desc: "Movimiento detectado en habitación" },
    { tipo: "noise" as const, desc: "Nivel de ruido elevado" },
    { tipo: "threshold" as const, desc: "CO2 superó umbral recomendado" },
    { tipo: "threshold" as const, desc: "Temperatura fuera de rango óptimo" },
    { tipo: "movement" as const, desc: "Actividad registrada" },
  ]

  for (let i = 0; i < 10; i++) {
    const template = eventosTemplates[i % eventosTemplates.length]
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000) // Cada 30 min

    eventos.push({
      id: i + 1,
      timestamp: timestamp.toISOString(),
      tipo: template.tipo,
      descripcion: template.desc,
    })
  }

  return eventos
}

export async function GET() {
  try {
    const eventos = generateMockEvents()

    return NextResponse.json({ eventos })
  } catch (error) {
    console.error("Error al obtener eventos:", error)
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    )
  }
}
