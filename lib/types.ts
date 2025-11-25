// Tipos de datos de sensores
export interface SensorData {
  temperatura: number
  humedad: number
  co2: number
  luz: number
  movimiento: boolean
  ruido: boolean
  timestamp: string
}

// Datos históricos
export interface HistoricalData {
  timestamp: string
  temperatura: number
  humedad: number
  co2: number
  luz: number
}

// Estado de ánimo
export type EstadoAnimo = "bien" | "regular" | "mal"

export interface RegistroEstado {
  id: number
  estado: EstadoAnimo
  timestamp: string
}

// Eventos
export type TipoEvento = "movement" | "noise" | "threshold"

export interface Evento {
  id: number
  timestamp: string
  tipo: TipoEvento
  descripcion: string
}

// Análisis de sueño
export interface FactoresAmbientales {
  temperatura: { min: number; max: number; avg: number }
  humedad: { min: number; max: number; avg: number }
  co2: { min: number; max: number; avg: number }
}

export interface TimelineSegment {
  hora: string
  condicion: "optimo" | "aceptable" | "malo"
}

export interface AnalisisSueno {
  fecha: string
  duracion: number
  calidad: number
  interrupciones: number
  factores: FactoresAmbientales
  timeline: TimelineSegment[]
}

// Estadísticas
export interface Estadisticas {
  promedio_calidad: number
  mejor_dia: { fecha: string; valor: number }
  peor_dia: { fecha: string; valor: number }
}

// Resumen diario para historial
export interface ResumenDiario {
  fecha: string
  calidad: number
  temp_promedio: number
  humedad_promedio: number
  estado_animo: EstadoAnimo | null
}
