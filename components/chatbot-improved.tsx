"use client"

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorData, HistoricalData, RegistroEstado } from "@/lib/types";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatbotProps {
  currentData?: SensorData;
  historicoData?: HistoricalData[];
  estadoActual?: RegistroEstado;
}

export function ChatbotImproved({
  currentData,
  historicoData,
  estadoActual,
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! 👋 Soy Zenalyze, tu asistente ambiental. Puedo ayudarte con consejos sobre tu ambiente, analizar tus datos y charlar sobre cómo mejorar tu bienestar. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      // Filtrar el historial para enviar solo los últimos 6 mensajes (para no saturar la API)
      const recentHistory = messages
        .slice(-6)
        .map((msg) => ({
          role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.text,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          currentData,
          historicoData: historicoData?.slice(-24), // Últimas 24 lecturas
          estadoActual,
          conversationHistory: recentHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || "Disculpa, no pude procesar tu mensaje.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lo siento, tuve un problema. ¿Podrías intentar de nuevo? 😅",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:scale-110 transition-transform"
        title={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Ventana del Chat */}
      {isOpen && (
        <Card className="fixed bottom-24 right-8 w-96 h-[500px] z-40 flex flex-col shadow-2xl border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 border-b border-slate-700/50">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                🌍 Zenalyze
              </CardTitle>
              <p className="text-xs text-slate-400">Asistente Ambiental IA</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed break-words ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-br-none shadow-md"
                        : "bg-slate-700/80 text-slate-100 rounded-bl-none shadow-md border border-slate-600/30"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-slate-700/80 text-slate-100 p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Área de entrada */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escribe tu pregunta..."
                  disabled={loading}
                  className="flex-1 p-2.5 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transition-all"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || inputValue.trim() === ""}
                  size="icon"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Presiona Enter o haz clic en enviar
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}