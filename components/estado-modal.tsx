"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EstadoAnimo } from "@/lib/types"

interface EstadoModalProps {
  onSubmit: (estado: EstadoAnimo) => Promise<void>
}

const estadosConfig = [
  { value: "bien" as EstadoAnimo, emoji: "😊", label: "Bien", color: "bg-success" },
  { value: "regular" as EstadoAnimo, emoji: "😐", label: "Regular", color: "bg-warning" },
  { value: "mal" as EstadoAnimo, emoji: "😞", label: "Mal", color: "bg-error" },
]

export function EstadoModal({ onSubmit }: EstadoModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (estado: EstadoAnimo) => {
    setLoading(true)
    try {
      await onSubmit(estado)
      setOpen(false)
    } catch (error) {
      console.error("Error al registrar estado:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          Registrar nuevo estado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cómo te sientes?</DialogTitle>
          <DialogDescription>
            Selecciona tu estado de ánimo actual
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {estadosConfig.map((config) => (
            <button
              key={config.value}
              onClick={() => handleSubmit(config.value)}
              disabled={loading}
              className={`
                flex flex-col items-center justify-center p-6 rounded-lg border-2
                transition-all hover:scale-105 hover:shadow-lg
                ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                border-slate-200 hover:border-primary
              `}
            >
              <span className="text-5xl mb-2">{config.emoji}</span>
              <span className="font-semibold text-slate-900">{config.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
