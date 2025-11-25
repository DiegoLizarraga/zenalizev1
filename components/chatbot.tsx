// components/chatbot.tsx

"use client"

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorData, HistoricalData } from "@/lib/types";

// Define la estructura de un mensaje
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

// Función para procesar el mensaje del usuario y generar una respuesta
const processUserMessage = (
  message: string,
  currentData: SensorData | undefined,
  historicoData: HistoricalData[] | undefined
): string => {
  const lowerCaseMessage = message.toLowerCase();

  // Saludos
  if (lowerCaseMessage.includes("hola") || lowerCaseMessage.includes("buenos días")) {
    return "¡Hola! Soy tu asistente ambiental. Puedes preguntarme sobre el clima actual, la mejor temperatura de hoy o la calidad del aire.";
  }

  // Preguntas sobre el clima actual
  if (lowerCaseMessage.includes("clima hoy") || lowerCaseMessage.includes("cómo está") || lowerCaseMessage.includes("estado actual")) {
    if (!currentData) return "No tengo datos actuales en este momento.";
    return `Hoy el ambiente está a ${currentData.temperatura.toFixed(1)}°C con una humedad del ${currentData.humedad}%. La calidad del aire es de ${currentData.co2} ppm y hay ${currentData.luz} lux de luz.`;
  }

  // Preguntas sobre la mejor temperatura
  if (lowerCaseMessage.includes("mejor temperatura") || lowerCaseMessage.includes("temperatura ideal")) {
    if (!historicoData || historicoData.length === 0) return "No tengo datos históricos para responder eso.";
    
    const optimalTemp = 22; // Definimos una temperatura ideal
    let bestReading = historicoData[0];
    let minDiff = Math.abs(historicoData[0].temperatura - optimalTemp);

    for (const reading of historicoData) {
      const diff = Math.abs(reading.temperatura - optimalTemp);
      if (diff < minDiff) {
        minDiff = diff;
        bestReading = reading;
      }
    }
    const time = new Date(bestReading.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return `La lectura más cercana a la ideal (22°C) fue de ${bestReading.temperatura.toFixed(1)}°C a las ${time}.`;
  }
  
  // Preguntas sobre humedad
  if (lowerCaseMessage.includes("humedad")) {
    if (!currentData) return "No tengo datos actuales.";
    return `La humedad actual es del ${currentData.humedad}%.`;
  }

  // Preguntas sobre calidad del aire
  if (lowerCaseMessage.includes("aire") || lowerCaseMessage.includes("co2")) {
    if (!currentData) return "No tengo datos actuales.";
    return `La calidad del aire actual es de ${currentData.co2} ppm de CO2.`;
  }
  
  // Respuesta por defecto
  return "No estoy seguro de cómo responder a eso. Puedes preguntarme por 'el clima hoy' o la 'mejor temperatura'.";
};


export function Chatbot({ currentData, historicoData }: { currentData: SensorData | undefined, historicoData: HistoricalData[] | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "¡Hola! ¿En qué puedo ayudarte hoy?", sender: "bot" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
    };

    const botResponseText = processUserMessage(inputValue, currentData, historicoData);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponseText,
      sender: "bot",
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInputValue("");
  };

  return (
    <>
      {/* Botón Flotante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:scale-110 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Ventana del Chat */}
      {isOpen && (
        <Card className="fixed bottom-24 right-8 w-96 h-[500px] z-40 flex flex-col shadow-2xl border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20">
            <CardTitle className="text-lg font-bold text-white">Asistente Ambiental</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-br-none"
                        : "bg-slate-700/80 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 p-2 bg-slate-700/50 text-white rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <Button onClick={handleSendMessage} size="icon" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}