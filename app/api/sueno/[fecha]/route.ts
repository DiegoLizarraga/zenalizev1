import { NextRequest, NextResponse } from "next/server"
import { AnalisisSueno, TimelineSegment } from "@/lib/types"

// Genera datos mock de análisis de sueño
function generateMockSleepData(fecha: string): AnalisisSueno {
  // Generar timeline (22:00 a 08:00)
  const timeline: TimelineSegment[] = []
  for (let h = 22; h <= 32; h++) {
    const hour = h > 23 ? h - 24 : h
    const hourStr = `${hour.toString().padStart(2, "0")}:00`

    // Patrón: mayormente óptimo, algunas interrupciones
    const rand = Math.random()
    let condicion: "optimo" | "aceptable" | "malo"
    if (rand > 0.85) {
      condicion = "malo" // 15% malo
    } else if (rand > 0.7) {
      condicion = "aceptable" // 15% aceptable
    } else {
      condicion = "optimo" // 70% óptimo
    }

    timeline.push({ hora: hourStr, condicion })
  }

  const data: AnalisisSueno = {
    fecha,
    duracion: 7.5,
    calidad: 75 + Math.random() * 15, // 75-90
    interrupciones: Math.floor(Math.random() * 5) + 1,
    factores: {
      temperatura: {
        min: 19 + Math.random() * 2,
        max: 21 + Math.random() * 2,
        avg: 20 + Math.random() * 1.5,
      },
      humedad: {
        min: 50 + Math.random() * 5,
        max: 60 + Math.random() * 5,
        avg: 55 + Math.random() * 5,
      },
      co2: {
        min: 400 + Math.random() * 50,
        max: 600 + Math.random() * 100,
        avg: 500 + Math.random() * 80,
      },
    },
    timeline,
  }

  return data
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fecha: string }> }
) {
  try {
    const { fecha } = await params

    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json(
        { error: "Formato de fecha inválido. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    const data = generateMockSleepData(fecha)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener datos de sueño:", error)
    return NextResponse.json(
      { error: "Error al obtener datos de sueño" },
      { status: 500 }
    )
  }
}
