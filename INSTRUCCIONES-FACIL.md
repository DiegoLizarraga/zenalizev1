# 🚀 Zenalyze - Instrucciones

## ¿Qué necesitas?

Solo **Docker Desktop**:
- **Windows/Mac:** [Descargar aquí](https://www.docker.com/products/docker-desktop)
- **Linux:** `sudo apt install docker.io docker-compose`

## Configurar (Primera vez)

1. **Descargar el proyecto:**
```bash
cd zenalizev1
```

2. **Copiar configuración (opcional):**
```bash
cp .env.example .env.local
```
La configuración por defecto ya funciona. Solo edita `.env.local` si necesitas cambiar la base de datos.

## Comandos

### Iniciar
```bash
docker-compose up -d --build
```
Espera 1-2 minutos. Luego abre: **http://localhost:3000**

### Detener
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```
(Presiona `Ctrl+C` para salir)

### Reiniciar
```bash
docker-compose restart
```

### Limpiar todo
```bash
docker-compose down -v
```

## ¿Funciona?

Abre http://localhost:3000

Si ves temperatura y humedad, ¡funciona! ✅

## Problemas Comunes

**Puerto 3000 ocupado:**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

**Docker no corre:**
- Abre Docker Desktop
- Espera que inicie
- Intenta de nuevo

**Error de base de datos:**
- Verifica `.env.local`
- Verifica internet
- Contacta al admin de la DB

## Para Desarrollar

Si quieres trabajar sin Docker:

```bash
# Detener Docker
docker-compose down

# Desarrollo normal
npm install
npm run dev
```

---

**Eso es todo. Simple y directo** 👍
