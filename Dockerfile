# Imagen base con Node.js
FROM node:20-alpine

# Carpeta de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código
COPY . .

# Construir la aplicación
RUN npm run build

# Puerto que usa la aplicación
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar
CMD ["npm", "start"]
