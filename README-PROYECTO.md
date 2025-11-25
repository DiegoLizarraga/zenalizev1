# Zenalyze - Sistema de Monitoreo de Bienestar Ambiental

Sistema IoT para monitorear condiciones ambientales y calidad del sueño mediante sensores conectados a Raspberry Pi.

## Estado del Proyecto

**Fase actual:** MVP Frontend Completado ✅
**Próxima fase:** Integración con PostgreSQL

## Características Implementadas

### 1. Dashboard Principal (/)
- Métricas en tiempo real: Temperatura, Humedad, CO2, Luz
- Indicadores de estado con códigos de color (óptimo, advertencia, crítico)
- Sparklines con tendencias recientes
- Registro de estado de ánimo con modal interactivo
- Gráfico de evolución con períodos ajustables (6h, 24h, 7d, 30d)
- Lista de eventos recientes
- Métricas secundarias (movimientos, ruido, tiempo óptimo)
- Polling automático cada 30 segundos

### 2. Análisis de Sueño (/sueno)
- Selector de fecha con navegación anterior/siguiente
- Resumen de la noche (duración, calidad, interrupciones, comparativa)
- Timeline visual con segmentos de condición (óptimo/aceptable/malo)
- Factores ambientales detallados (min/max/promedio)
- Recomendaciones personalizadas

### 3. Historial (/historial)
- Estadísticas del período (últimos 30 días)
- Cards de resumen (promedio, mejor día, peor día)
- Gráficos dinámicos (calidad del sueño, temperatura, humedad)
- Tabla de resumen diario con paginación
- Exportación a CSV con datos completos

## Stack Tecnológico

- **Framework:** Next.js 16.0.3 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Componentes:** shadcn/ui (custom)
- **Gráficos:** Recharts
- **Iconos:** Lucide React
- **Font:** Inter + JetBrains Mono

## Estructura del Proyecto

```
zenalizev1/
├── app/
│   ├── api/
│   │   ├── estado/          # Estado de ánimo
│   │   ├── eventos/         # Eventos recientes
│   │   ├── sensores/        # Datos de sensores
│   │   ├── sueno/           # Análisis de sueño
│   │   └── estadisticas/    # Estadísticas históricas
│   ├── sueno/               # Página análisis sueño
│   ├── historial/           # Página historial
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Dashboard
│   └── globals.css          # Estilos globales
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── header.tsx           # Header con navegación
│   ├── metric-card.tsx      # Tarjeta de métrica
│   ├── stat-card.tsx        # Tarjeta estadística
│   ├── line-chart.tsx       # Gráfico de líneas
│   ├── estado-modal.tsx     # Modal registro estado
│   ├── event-badge.tsx      # Badge de eventos
│   └── status-indicator.tsx # Indicador conexión
├── lib/
│   ├── types.ts             # Definiciones TypeScript
│   ├── hooks.ts             # Hooks personalizados
│   └── utils.ts             # Utilidades
└── package.json
```

## Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| Fondo Principal | `#0F172A` | Header, fondos oscuros |
| Fondo Secundario | `#F8FAFC` | Body, cards |
| Primario | `#06B6D4` | Botones, enlaces, acentos |
| Éxito | `#10B981` | Estados óptimos |
| Advertencia | `#F59E0B` | Estados moderados |
| Error | `#EF4444` | Estados críticos |
| Texto Oscuro | `#1E293B` | Textos principales |
| Texto Claro | `#F1F5F9` | Textos en fondos oscuros |
| Bordes | `#E2E8F0` | Separadores, bordes |

## API Endpoints (Actualmente Mock)

### GET /api/sensores/current
Retorna lecturas actuales de todos los sensores.

```json
{
  "temperatura": 22.5,
  "humedad": 58,
  "co2": 420,
  "luz": 340,
  "movimiento": false,
  "ruido": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/sensores/historico?periodo=24h
Retorna datos históricos según período (6h|24h|7d|30d).

```json
{
  "datos": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "temperatura": 22.5,
      "humedad": 58,
      "co2": 420,
      "luz": 340
    }
  ]
}
```

### GET /api/estado
Retorna último estado de ánimo registrado.

### POST /api/estado
Registra nuevo estado de ánimo.

```json
{
  "estado": "bien" | "regular" | "mal"
}
```

### GET /api/eventos/recientes
Retorna últimos 10 eventos detectados.

### GET /api/sueno/[fecha]
Retorna análisis de sueño para fecha específica (YYYY-MM-DD).

### GET /api/estadisticas?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
Retorna estadísticas del período especificado.

## Comandos

```bash
# Desarrollo
npm run dev          # Servidor en http://localhost:3000

# Producción
npm run build        # Construir aplicación
npm run start        # Servidor producción

# Utilidades
npm run lint         # Linter
```

## Próximos Pasos: Integración PostgreSQL

### 1. Instalar Dependencias

```bash
npm install pg dotenv
npm install -D @types/pg
```

### 2. Configurar Variables de Entorno

Crear `.env.local`:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/zenalyze"
```

### 3. Esquema de Base de Datos

```sql
-- Tabla principal de lecturas procesadas
CREATE TABLE lecturas_procesadas (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  temp_promedio FLOAT,
  humedad_promedio FLOAT,
  co2_promedio FLOAT,
  luz_promedio FLOAT,
  movimiento_detectado BOOLEAN,
  ruido_detectado BOOLEAN
);

-- Índice para búsquedas por timestamp
CREATE INDEX idx_lecturas_timestamp ON lecturas_procesadas(timestamp DESC);

-- Tabla de encuesta diaria (estado de ánimo)
CREATE TABLE encuesta_diaria (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  estado_animo VARCHAR(10) CHECK (estado_animo IN ('bien', 'regular', 'mal')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estadísticas diarias (calidad de sueño)
CREATE TABLE estadisticas_diarias (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  duracion_sueno FLOAT,
  calidad_sueno INT,
  interrupciones INT,
  temp_min FLOAT,
  temp_max FLOAT,
  temp_avg FLOAT,
  humedad_min FLOAT,
  humedad_max FLOAT,
  humedad_avg FLOAT,
  co2_min FLOAT,
  co2_max FLOAT,
  co2_avg FLOAT
);

-- Tabla de eventos
CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('movement', 'noise', 'threshold')),
  descripcion TEXT
);
```

### 4. Crear Cliente de Base de Datos

Archivo `lib/db.ts`:

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
})

export default pool
```

### 5. Actualizar API Routes

Reemplazar datos mock en cada endpoint con consultas SQL reales.

Ejemplo para `/api/sensores/current/route.ts`:

```typescript
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        temp_promedio as temperatura,
        humedad_promedio as humedad,
        co2_promedio as co2,
        luz_promedio as luz,
        movimiento_detectado as movimiento,
        ruido_detectado as ruido,
        timestamp
      FROM lecturas_procesadas
      ORDER BY timestamp DESC
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay datos disponibles' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error al consultar DB:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}
```

### 6. Script de Raspberry Pi

El script Python en la Raspberry Pi debe insertar datos cada 3 minutos:

```python
import psycopg2
from datetime import datetime

# Conectar a PostgreSQL
conn = psycopg2.connect(
    dbname="zenalyze",
    user="usuario",
    password="password",
    host="tu-servidor.aws.com",
    port="5432"
)

cur = conn.cursor()

# Leer sensores (pseudocódigo)
temp = leer_sensor_temperatura()
humedad = leer_sensor_humedad()
co2 = leer_sensor_co2()
luz = leer_sensor_luz()
movimiento = detectar_movimiento()
ruido = detectar_ruido()

# Insertar en DB
cur.execute("""
    INSERT INTO lecturas_procesadas
    (timestamp, temp_promedio, humedad_promedio, co2_promedio,
     luz_promedio, movimiento_detectado, ruido_detectado)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
""", (
    datetime.now(), temp, humedad, co2,
    luz, movimiento, ruido
))

conn.commit()
cur.close()
conn.close()
```

## Despliegue

### Opción 1: Vercel (Recomendado)
1. Push del código a GitHub
2. Conectar repositorio en Vercel
3. Configurar variable `DATABASE_URL` en settings
4. Deploy automático

### Opción 2: AWS (EC2 + S3 + CloudFront)
1. Construir aplicación: `npm run build`
2. Subir archivos estáticos a S3
3. Configurar CloudFront
4. API Routes en Lambda o EC2

## Responsive Design

- **Mobile:** Cards apilan verticalmente, navegación simplificada
- **Tablet:** Grid 2 columnas, sparklines visibles
- **Desktop:** Grid 4 columnas, todas las features

## Optimizaciones Pendientes

- [ ] Implementar React Query/SWR para mejor cache
- [ ] Agregar skeleton loaders
- [ ] Implementar dark mode
- [ ] Agregar autenticación (NextAuth.js)
- [ ] Notificaciones push para alertas
- [ ] PWA para instalación móvil
- [ ] Gráficos más avanzados (área, scatter)
- [ ] Filtros de fecha personalizados
- [ ] Comparativas entre períodos
- [ ] Reportes PDF descargables

## Notas Importantes

- Todos los datos actuales son **mock** (aleatorios)
- El polling está configurado a 30 segundos (ajustable)
- Los colores y umbrales son configurables en cada componente
- La aplicación es completamente responsive
- TypeScript strict mode habilitado

## Soporte

Para dudas o problemas:
1. Revisar console del navegador para errores
2. Verificar logs del servidor Next.js
3. Comprobar conexión a base de datos (cuando se implemente)

## Licencia

Proyecto privado - Todos los derechos reservados

---

**Desarrollado con Next.js 16 + TypeScript + Tailwind CSS**
