# Guía para Expandir la Base de Datos

## Estado Actual

### Tabla Existente: `sensor_temp`

```sql
CREATE TABLE sensor_temp (
  temperature DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMP,
  humidity DOUBLE PRECISION
);
```

**Total de registros:** 327
**Datos actuales:** Temperatura y Humedad
**Frecuencia de captura:** Cada ~3 segundos (según datos)

## Opción 1: Agregar Columnas a Tabla Existente (Recomendado)

### Ventajas
- Mantiene todos los datos en un solo lugar
- Facilita consultas y joins
- Más simple de mantener
- Timestamp único por lectura

### SQL para Agregar Columnas

```sql
-- Agregar ID autoincremental (recomendado)
ALTER TABLE sensor_temp
ADD COLUMN id SERIAL PRIMARY KEY;

-- Agregar columnas de nuevos sensores
ALTER TABLE sensor_temp
ADD COLUMN co2 DOUBLE PRECISION,
ADD COLUMN luz DOUBLE PRECISION,
ADD COLUMN movimiento BOOLEAN DEFAULT false,
ADD COLUMN ruido BOOLEAN DEFAULT false;

-- Crear índice para búsquedas rápidas por fecha
CREATE INDEX idx_sensor_temp_recorded_at ON sensor_temp(recorded_at DESC);

-- Opcional: Agregar columna de calidad de aire calculada
ALTER TABLE sensor_temp
ADD COLUMN calidad_aire VARCHAR(10);

-- Función para actualizar calidad_aire automáticamente
CREATE OR REPLACE FUNCTION calcular_calidad_aire()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.co2 IS NOT NULL THEN
    IF NEW.co2 < 800 THEN
      NEW.calidad_aire := 'buena';
    ELSIF NEW.co2 < 1200 THEN
      NEW.calidad_aire := 'moderada';
    ELSE
      NEW.calidad_aire := 'mala';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función
CREATE TRIGGER trigger_calidad_aire
  BEFORE INSERT OR UPDATE ON sensor_temp
  FOR EACH ROW
  EXECUTE FUNCTION calcular_calidad_aire();
```

### Estructura Final de sensor_temp

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | SERIAL | NO | Identificador único |
| temperature | DOUBLE PRECISION | NO | Temperatura en °C |
| humidity | DOUBLE PRECISION | YES | Humedad relativa % |
| co2 | DOUBLE PRECISION | YES | CO2 en ppm |
| luz | DOUBLE PRECISION | YES | Luz en lux |
| movimiento | BOOLEAN | YES | Movimiento detectado |
| ruido | BOOLEAN | YES | Ruido detectado |
| recorded_at | TIMESTAMP | YES | Momento de captura |
| calidad_aire | VARCHAR(10) | YES | buena/moderada/mala |

## Opción 2: Crear Tablas Separadas por Sensor

### Ventajas
- Mayor flexibilidad por sensor
- Permite frecuencias de captura diferentes
- Más escalable a largo plazo

### SQL para Tablas Separadas

```sql
-- Tabla principal de lecturas (mantener sensor_temp como está)

-- Tabla para CO2
CREATE TABLE sensor_co2 (
  id SERIAL PRIMARY KEY,
  valor DOUBLE PRECISION NOT NULL,
  calidad VARCHAR(10),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_co2_recorded_at ON sensor_co2(recorded_at DESC);

-- Tabla para luz
CREATE TABLE sensor_luz (
  id SERIAL PRIMARY KEY,
  valor DOUBLE PRECISION NOT NULL,
  es_noche BOOLEAN,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_luz_recorded_at ON sensor_luz(recorded_at DESC);

-- Tabla para movimiento
CREATE TABLE sensor_movimiento (
  id SERIAL PRIMARY KEY,
  detectado BOOLEAN NOT NULL DEFAULT false,
  intensidad INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movimiento_recorded_at ON sensor_movimiento(recorded_at DESC);

-- Tabla para ruido
CREATE TABLE sensor_ruido (
  id SERIAL PRIMARY KEY,
  detectado BOOLEAN NOT NULL DEFAULT false,
  decibeles DOUBLE PRECISION,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ruido_recorded_at ON sensor_ruido(recorded_at DESC);
```

## Tablas Adicionales Recomendadas

### Tabla de Estado de Ánimo

```sql
CREATE TABLE encuesta_diaria (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  estado_animo VARCHAR(10) CHECK (estado_animo IN ('bien', 'regular', 'mal')),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla de Eventos

```sql
CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) CHECK (tipo IN ('movement', 'noise', 'threshold')) NOT NULL,
  descripcion TEXT NOT NULL,
  severidad VARCHAR(10) CHECK (severidad IN ('info', 'warning', 'error')),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eventos_recorded_at ON eventos(recorded_at DESC);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
```

### Tabla de Estadísticas Diarias (Pre-calculadas)

```sql
CREATE TABLE estadisticas_diarias (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,

  -- Temperatura
  temp_min DOUBLE PRECISION,
  temp_max DOUBLE PRECISION,
  temp_avg DOUBLE PRECISION,

  -- Humedad
  humedad_min DOUBLE PRECISION,
  humedad_max DOUBLE PRECISION,
  humedad_avg DOUBLE PRECISION,

  -- CO2
  co2_min DOUBLE PRECISION,
  co2_max DOUBLE PRECISION,
  co2_avg DOUBLE PRECISION,

  -- Calidad del sueño (si aplica)
  duracion_sueno DOUBLE PRECISION,
  calidad_sueno INT,
  interrupciones INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stats_fecha ON estadisticas_diarias(fecha DESC);
```

## Script Python Actualizado para Raspberry Pi

### Opción 1: Con Columnas Adicionales

```python
import psycopg2
from datetime import datetime
import time

# Configuración de sensores (placeholder)
# import Adafruit_DHT  # Para temperatura y humedad
# import mh_z19      # Para CO2
# import RPi.GPIO as GPIO  # Para movimiento y ruido

DB_CONFIG = {
    'host': '78.12.149.93',
    'port': 5432,
    'user': 'proyecto_iot',
    'password': 'testing123',
    'dbname': 'bienestar_db'
}

def leer_sensores():
    """Leer todos los sensores"""

    # Temperatura y humedad (DHT22)
    # humedad, temperatura = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, PIN_DHT)
    temperatura = 25.0  # Placeholder
    humedad = 60.0  # Placeholder

    # CO2 (MH-Z19)
    # co2_data = mh_z19.read()
    # co2 = co2_data.get('co2', None)
    co2 = 450.0  # Placeholder

    # Luz (LDR o BH1750)
    # luz = leer_sensor_luz()
    luz = 320.0  # Placeholder

    # Movimiento (PIR HC-SR501)
    # movimiento = GPIO.input(PIN_PIR)
    movimiento = False  # Placeholder

    # Ruido (Sensor de sonido KY-038)
    # ruido = GPIO.input(PIN_SONIDO)
    ruido = False  # Placeholder

    return {
        'temperatura': temperatura,
        'humedad': humedad,
        'co2': co2,
        'luz': luz,
        'movimiento': movimiento,
        'ruido': ruido
    }

def insertar_lectura(datos):
    """Insertar lectura en la base de datos"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO sensor_temp
            (temperature, humidity, co2, luz, movimiento, ruido, recorded_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            datos['temperatura'],
            datos['humedad'],
            datos['co2'],
            datos['luz'],
            datos['movimiento'],
            datos['ruido'],
            datetime.now()
        ))

        conn.commit()
        cur.close()
        conn.close()

        print(f"✅ Lectura insertada: Temp={datos['temperatura']}°C, Hum={datos['humedad']}%")

    except Exception as e:
        print(f"❌ Error al insertar: {e}")

def main():
    """Loop principal"""
    print("🚀 Iniciando monitoreo de sensores...")

    while True:
        try:
            datos = leer_sensores()
            insertar_lectura(datos)

            # Esperar 3 minutos antes de la siguiente lectura
            time.sleep(180)

        except KeyboardInterrupt:
            print("\n⏹️  Deteniendo monitoreo...")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(60)  # Esperar 1 minuto si hay error

if __name__ == "__main__":
    main()
```

### Opción 2: Con Tablas Separadas

```python
def insertar_lecturas_separadas(datos):
    """Insertar en tablas separadas"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        timestamp = datetime.now()

        # Insertar temperatura y humedad
        cur.execute("""
            INSERT INTO sensor_temp (temperature, humidity, recorded_at)
            VALUES (%s, %s, %s)
        """, (datos['temperatura'], datos['humedad'], timestamp))

        # Insertar CO2
        if datos['co2'] is not None:
            cur.execute("""
                INSERT INTO sensor_co2 (valor, recorded_at)
                VALUES (%s, %s)
            """, (datos['co2'], timestamp))

        # Insertar luz
        if datos['luz'] is not None:
            cur.execute("""
                INSERT INTO sensor_luz (valor, recorded_at)
                VALUES (%s, %s)
            """, (datos['luz'], timestamp))

        # Insertar movimiento si se detectó
        if datos['movimiento']:
            cur.execute("""
                INSERT INTO sensor_movimiento (detectado, recorded_at)
                VALUES (%s, %s)
            """, (True, timestamp))

        # Insertar ruido si se detectó
        if datos['ruido']:
            cur.execute("""
                INSERT INTO sensor_ruido (detectado, recorded_at)
                VALUES (%s, %s)
            """, (True, timestamp))

        conn.commit()
        cur.close()
        conn.close()

        print(f"✅ Lecturas insertadas: {timestamp}")

    except Exception as e:
        print(f"❌ Error al insertar: {e}")
```

## Actualizar Endpoints de Next.js

Una vez expandida la base de datos, actualizar los endpoints para usar datos reales:

### `/api/sensores/current/route.ts`

```typescript
const result = await pool.query(`
  SELECT
    temperature as temperatura,
    humidity as humedad,
    co2,
    luz,
    movimiento,
    ruido,
    recorded_at as timestamp
  FROM sensor_temp
  ORDER BY recorded_at DESC
  LIMIT 1
`)
```

### `/api/sensores/historico/route.ts`

```typescript
const result = await pool.query(`
  SELECT
    temperature as temperatura,
    humidity as humedad,
    co2,
    luz,
    recorded_at as timestamp
  FROM sensor_temp
  WHERE recorded_at >= $1
  ORDER BY recorded_at ASC
`, [startTime])
```

## Jobs de Mantenimiento

### Calcular Estadísticas Diarias (Cron Job)

```sql
-- Ejecutar diariamente a las 00:05
INSERT INTO estadisticas_diarias (
  fecha,
  temp_min, temp_max, temp_avg,
  humedad_min, humedad_max, humedad_avg,
  co2_min, co2_max, co2_avg
)
SELECT
  CURRENT_DATE - INTERVAL '1 day' as fecha,
  MIN(temperature), MAX(temperature), AVG(temperature),
  MIN(humidity), MAX(humidity), AVG(humidity),
  MIN(co2), MAX(co2), AVG(co2)
FROM sensor_temp
WHERE recorded_at >= CURRENT_DATE - INTERVAL '1 day'
  AND recorded_at < CURRENT_DATE
ON CONFLICT (fecha) DO UPDATE SET
  temp_min = EXCLUDED.temp_min,
  temp_max = EXCLUDED.temp_max,
  temp_avg = EXCLUDED.temp_avg,
  humedad_min = EXCLUDED.humedad_min,
  humedad_max = EXCLUDED.humedad_max,
  humedad_avg = EXCLUDED.humedad_avg,
  co2_min = EXCLUDED.co2_min,
  co2_max = EXCLUDED.co2_max,
  co2_avg = EXCLUDED.co2_avg;
```

### Limpiar Datos Antiguos (Opcional)

```sql
-- Eliminar registros de más de 90 días
DELETE FROM sensor_temp
WHERE recorded_at < CURRENT_DATE - INTERVAL '90 days';

-- O archivar en tabla histórica
INSERT INTO sensor_temp_archivo
SELECT * FROM sensor_temp
WHERE recorded_at < CURRENT_DATE - INTERVAL '90 days';
```

## Monitoreo y Mantenimiento

### Ver Uso de Espacio

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('sensor_temp')) as tamaño_total,
  pg_size_pretty(pg_relation_size('sensor_temp')) as tamaño_tabla,
  pg_size_pretty(pg_indexes_size('sensor_temp')) as tamaño_indices;
```

### Estadísticas de Inserción

```sql
SELECT
  DATE(recorded_at) as fecha,
  COUNT(*) as total_registros,
  COUNT(*) / 24.0 as registros_por_hora
FROM sensor_temp
WHERE recorded_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(recorded_at)
ORDER BY fecha DESC;
```

## Próximos Pasos

1. **Agregar columnas a sensor_temp** (Opción 1 recomendada)
2. **Actualizar script Python** en Raspberry Pi
3. **Conectar sensores físicos** (CO2, luz, PIR, sonido)
4. **Actualizar endpoints** de Next.js
5. **Configurar cron job** para estadísticas diarias
6. **Implementar alertas** para valores fuera de rango

---

**Nota:** Los datos mock de CO2, luz, movimiento y ruido seguirán activos hasta que implementes los sensores físicos y actualices la base de datos.
