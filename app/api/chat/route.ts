import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

interface ChatRequest {
  message: string;
  currentData?: any;
  historicoData?: any;
  estadoActual?: any;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    console.log("=== INICIO DE PETICIÓN ===");
    console.log("API Key disponible:", !!apiKey);
    console.log("API Key length:", apiKey?.length);

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
    const { message } = body;

    console.log("📨 Mensaje:", message);

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Mensaje vacío" },
        { status: 400 }
      );
    }

    console.log("🔗 Conectando a Groq...");

    const groq = new Groq({
      apiKey: apiKey,
    });

    console.log("📤 Enviando a Groq con modelo: llama-3.3-70b-versatile");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Eres Zenalyze, un asistente ambiental amigable. Responde en español de forma conversacional. 
El usuario te pregunta sobre su ambiente, clima o bienestar. Sé empático y útil.
Usa emojis ocasionalmente. Responde de forma natural, como hablando con un amigo.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const reply = response.choices[0]?.message?.content || "No recibí respuesta";

    console.log("✅ Respuesta exitosa:", reply.substring(0, 100));
    console.log("=== FIN DE PETICIÓN ===\n");

    return NextResponse.json({
      success: true,
      message: reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("=== ERROR EN PETICIÓN ===");
    console.error("Tipo de error:", error.constructor.name);
    console.error("Mensaje:", error.message);
    console.error("Status:", error.status);
    console.error("Error completo:", JSON.stringify(error, null, 2));
    console.error("=== FIN ERROR ===\n");

    return NextResponse.json(
      {
        error: "Error procesando mensaje",
        details: error.message,
      },
      { status: 500 }
    );
  }
}