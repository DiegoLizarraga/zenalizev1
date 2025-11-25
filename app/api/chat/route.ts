import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { SensorData, HistoricalData, RegistroEstado } from "@/lib/types";

interface ChatRequest {
  message: string;
  currentData?: SensorData;
  historicoData?: HistoricalData[];
  estadoActual?: RegistroEstado;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

// Función para construir el contexto del sistema
function buildSystemPrompt(
  currentData?: SensorData,
  historicoData?: HistoricalData[],
  estadoActual?: RegistroEstado
): string {
  let context = `Eres Zenalyze, un asistente ambiental inteligente y conversacional. Tu rol es:
1. Analizar datos ambientales del usuario (temperatura, humedad, CO2, luz)
2. Dar consejos prácticos y personalizados sobre cómo mejorar el ambiente
3. Ser empático con el estado de ánimo del usuario
4. Responder preguntas generales sobre bienestar y ambiente
5. Ser conversacional, amable y usar emojis ocasionalmente
6. Proporcionar recomendaciones basadas en los datos recopilados
7. SIEMPRE responder en español
8. Ser como un amigo que te aconseja, no un robot

## Datos Actuales del Usuario:`;

  if (currentData) {
    context += `
- Temperatura: ${currentData.temperatura.toFixed(1)}°C (Rango óptimo: 20-24°C)
- Humedad: ${currentData.humedad}% (Rango óptimo: 40-60%)
- CO2: ${currentData.co2.toFixed(0)} ppm (Buen nivel: <800 ppm, Moderado: 800-1200 ppm, Malo: >1200 ppm)
- Luz: ${currentData.luz.toFixed(0)} lux (Óptimo para trabajar: >500 lux, Suficiente: 300-500 lux, Insuficiente: <300 lux)
- Movimiento detectado: ${currentData.movimiento ? "Sí" : "No"}
- Ruido detectado: ${currentData.ruido ? "Sí" : "No"}`;

    // Agregar evaluación del estado actual
    const tempStatus = currentData.temperatura >= 20 && currentData.temperatura <= 24
      ? "✅ Óptima"
      : currentData.temperatura > 24 && currentData.temperatura <= 26
      ? "⚠️ Un poco alta"
      : currentData.temperatura > 26
      ? "🔴 Muy alta - Ventila!"
      : "❄️ Baja - Calienta";

    const humidityStatus = currentData.humedad >= 40 && currentData.humedad <= 60
      ? "✅ Óptima"
      : currentData.humedad > 60 && currentData.humedad <= 70
      ? "⚠️ Un poco alta"
      : currentData.humedad > 70
      ? "🔴 Muy alta - Usa deshumidificador"
      : "🏜️ Baja - Usa humidificador";

    const co2Status = currentData.co2 < 800
      ? "✅ Buena"
      : currentData.co2 < 1200
      ? "⚠️ Moderada - Ventila un poco"
      : "🔴 Mala - ¡Ventila urgentemente!";

    const lightStatus = currentData.luz > 500
      ? "✅ Excelente para trabajar"
      : currentData.luz > 300
      ? "⚠️ Buena, pero podría mejorar"
      : "🔴 Insuficiente - Enciende más luces";

    context += `

## Estado Actual del Ambiente:
- Temperatura: ${tempStatus}
- Humedad: ${humidityStatus}
- Calidad del aire: ${co2Status}
- Iluminación: ${lightStatus}`;
  }

  if (historicoData && historicoData.length > 0) {
    const temps = historicoData.map((d) => d.temperatura);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);

    const co2s = historicoData.map((d) => d.co2);
    const avgCo2 = co2s.reduce((a, b) => a + b, 0) / co2s.length;
    const maxCo2 = Math.max(...co2s);

    const humedades = historicoData.map((d) => d.humedad);
    const avgHumedad = humedades.reduce((a, b) => a + b, 0) / humedades.length;

    context += `

## Estadísticas del Día (últimas ${historicoData.length} lecturas):
- Temperatura: Promedio ${avgTemp.toFixed(1)}°C (Min: ${minTemp.toFixed(1)}°C, Max: ${maxTemp.toFixed(1)}°C)
- Humedad: Promedio ${avgHumedad.toFixed(0)}%
- CO2: Promedio ${avgCo2.toFixed(0)} ppm (Pico máximo: ${maxCo2.toFixed(0)} ppm)`;
  }

  if (estadoActual) {
    const estadoEmoji: { [key: string]: string } = {
      bien: "😊",
      regular: "😐",
      mal: "😞",
    };
    const estadoTexto: { [key: string]: string } = {
      bien: "Bien",
      regular: "Regular",
      mal: "Mal",
    };

    const lastUpdate = new Date(estadoActual.timestamp);
    const horasAtras = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60));

    context += `

## Estado de Ánimo del Usuario:
- Estado actual: ${estadoEmoji[estadoActual.estado]} ${estadoTexto[estadoActual.estado]}
- Reportado hace: ${horasAtras > 0 ? horasAtras + " horas" : "hace poco"}`;
  }

  context += `

## Instrucciones para responder:
- Si pregunta "qué puedes hacer" o similar, explica que puedes:
  • Analizar condiciones del ambiente
  • Dar consejos para mejorar clima/luz/aire
  • Hablar sobre su estado de ánimo
  • Explicar cómo el ambiente afecta el bienestar
  • Responder preguntas sobre salud ambiental
  
- Si el ambiente tiene problemas, sugiere soluciones específicas:
  • Temperatura alta → abrir ventanas, aire acondicionado, tomar agua
  • Temperatura baja → cerrar ventanas, calefacción, ropa abrigada
  • CO2 alto → ventilar (abrir ventanas 5-10 min)
  • Humedad baja → humidificador, plantas, agua
  • Humedad alta → deshumidificador, abrir ventanas
  • Luz baja → encender luces, acercarse a ventanas, lámpara LED
  
- Sé empático con el estado de ánimo del usuario
- Usa datos específicos en tus recomendaciones
- Mantén respuestas concisas (2-3 párrafos máximo)
- Usa emojis para hacer conversación más amigable
- Sé conversacional y natural, como hablando con un amigo
- Si no tienes datos, ofrece ayuda de forma general
- NO inventes datos, ni alucines. si no sabes un dato, di que no lo sabes.`;

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      console.error("❌ NO HAY API KEY");
      return NextResponse.json(
        { 
          error: "API Key no configurada",
          message: "Por favor, agrega NEXT_PUBLIC_GROQ_API_KEY a .env.local"
        },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const {
      message,
      currentData,
      historicoData,
      estadoActual,
      conversationHistory = [],
    } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Mensaje vacío" },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

    const systemPrompt = buildSystemPrompt(currentData, historicoData, estadoActual);

    const messages = [
      ...conversationHistory,
      {
        role: "user" as const,
        content: message,
      },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const reply = response.choices[0]?.message?.content || "No recibí respuesta";

    return NextResponse.json({
      success: true,
      message: reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);

    return NextResponse.json(
      {
        error: "Error procesando mensaje",
        details: error.message,
      },
      { status: 500 }
    );
  }
}