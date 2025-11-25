# Zenalyze

Sistema de monitoreo de bienestar ambiental con IoT. Monitorea temperatura, humedad y otros sensores en tiempo real desde Raspberry Pi.

## Inicio Rápido con Docker

### Requisitos
- Docker Desktop ([Descargar](https://www.docker.com/products/docker-desktop))

### Ejecutar

```bash
docker-compose up -d --build
```

Abre http://localhost:3003

### Detener

```bash
docker-compose down
```

## Desarrollo Local (sin Docker)

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Documentación

- **[INSTRUCCIONES-FACIL.md](INSTRUCCIONES-FACIL.md)** - Guía rápida de uso con Docker
- **[README-PROYECTO.md](README-PROYECTO.md)** - Documentación técnica completa
- **[GUIA-EXPANSION-DB.md](GUIA-EXPANSION-DB.md)** - Cómo agregar más sensores a la DB

## Stack Tecnológico

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL (AWS EC2)
- Recharts para gráficos
- Docker para deployment

## Páginas

- `/` - Dashboard con métricas en tiempo real
- `/sueno` - Análisis de calidad del sueño
- `/historial` - Datos históricos y estadísticas

## Estructura

```
app/
  ├── api/              # API endpoints
  ├── sueno/            # Página análisis sueño
  ├── historial/        # Página historial
  └── page.tsx          # Dashboard principal
components/             # Componentes reutilizables
lib/                    # Utilidades y tipos
```

## Variables de Entorno

### Para Docker (Producción)

Copia `.env.example` a `.env` y configura:

```env
# Database
DB_HOST=tu-servidor
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=tu-database

# Groq API
GROQ_API_KEY=tu-api-key-de-groq
```

### Para Desarrollo Local

Copia `.env.example` a `.env.local` y configura las mismas variables.

**Nota:** El archivo `.env` es leído automáticamente por docker-compose. Nunca subas archivos `.env` o `.env.local` a Git.

---

Proyecto IoT para monitoreo de condiciones ambientales y análisis de sueño
