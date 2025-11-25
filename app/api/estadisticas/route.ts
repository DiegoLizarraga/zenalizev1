import { NextRequest, NextResponse } from "next/server"
import { Estadisticas, ResumenDiario } from "@/lib/types"

// Genera datos mock de estadísticas
function generateMockStats(inicio: string, fin: string): {
  estadisticas: Estadisticas
  resumenDiario: ResumenDiario[]
} {
  const startDate = new Date(inicio)
  const endDate = new Date(fin)
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const resumenDiario: ResumenDiario[] = []
  const calidades: number[] = []

  for (let i = 0; i <= days; i++) {
    const fecha = new Date(startDate)
    fecha.setDate(fecha.getDate() + i)
    const fechaStr = fecha.toISOString().split("T")[0]

    const calidad = 60 + Math.random() * 35
    calidades.push(calidad)

    const estados = ["bien", "regular", "mal"] as const
    const estadoAleatorio = estados[Math.floor(Math.random() * estados.length)]

    resumenDiario.push({
      fecha: fechaStr,
      calidad: Math.round(calidad),
      temp_promedio: 20 + Math.random() * 3,
      humedad_promedio: 50 + Math.random() * 15,
      estado_animo: Math.random() > 0.2 ? estadoAleatorio : null,
    })
  }

  // Calcular estadísticas
  const promedio = calidades.reduce((a, b) => a + b, 0) / calidades.length
  const mejorIndex = calidades.indexOf(Math.max(...calidades))
  const peorIndex = calidades.indexOf(Math.min(...calidades))

  const estadisticas: Estadisticas = {
    promedio_calidad: Math.round(promedio),
    mejor_dia: {
      fecha: resumenDiario[mejorIndex].fecha,
      valor: resumenDiario[mejorIndex].calidad,
    },
    peor_dia: {
      fecha: resumenDiario[peorIndex].fecha,
      valor: resumenDiario[peorIndex].calidad,
    },
  }

  return { estadisticas, resumenDiario }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const inicio = searchParams.get("inicio")
    const fin = searchParams.get("fin")

    if (!inicio || !fin) {
      // Por defecto: últimos 30 días
      const hoy = new Date()
      const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

      const finDefault = hoy.toISOString().split("T")[0]
      const inicioDefault = hace30Dias.toISOString().split("T")[0]

      const data = generateMockStats(inicioDefault, finDefault)
      return NextResponse.json(data)
    }

    // Validar formato de fechas
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(inicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fin)
    ) {
      return NextResponse.json(
        { error: "Formato de fecha inválido. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    const data = generateMockStats(inicio, fin)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
