#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor Mandala Avanzado - Proyecto Zenalyze
Mandala interactiva con registro de estados de animo
"""

import time
import sys
import os
import socket
import math
from datetime import datetime
from dotenv import load_dotenv
import RPi.GPIO as GPIO
import board
import adafruit_dht
import busio
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from luma.core.interface.serial import spi
from luma.lcd.device import st7789
from luma.core.render import canvas
from PIL import Image, ImageDraw, ImageFont

# Cargar configuracion
load_dotenv()

# ============================================
# CONFIGURACION
# ============================================

i2c = board.I2C()
ads = ADS.ADS1115(i2c)

# GPIO Sensores
PIN_DHT11 = int(os.getenv('PIN_DHT11', 23))
PIN_MQ135 = int(os.getenv('PIN_MQ135', 26))
PIN_PIR = int(os.getenv('PIN_PIR', 14))
PIN_MIC = int(os.getenv('PIN_MIC', 16))

# GPIO Botones Estados de Animo
PIN_BTN1 = int(os.getenv('PIN_BTN1', 16))  # Boton 1 - Bien
PIN_BTN2 = int(os.getenv('PIN_BTN2', 20))  # Boton 2 - Neutral
PIN_BTN3 = int(os.getenv('PIN_BTN3', 21))  # Boton 3 - Mal

# Display
PIN_DC = int(os.getenv('PIN_DISPLAY_DC', 24))
PIN_RST = int(os.getenv('PIN_DISPLAY_RST', 25))

# Microfono
CANAL_MIC = 1

DEBUG = True

# ============================================
# CLASE MANDALA MONITOR
# ============================================

class MandalaAvanzada:
    def __init__(self):
        self.device = None
        self.dht = None
        self.ldr = None
        self.mic = None
        self.mq135_channel = None
        self.font_ip = None
        self.font_estado = None
        
        # Sensores
        self.temp = 22.0
        self.hum = 50.0
        self.ppm_co2 = 400
        self.lux = 300
        self.nivel_ruido = "silencio"
        self.valor_mic = 0
        self.nivel_base_mic = 0
        self.diferencia_mic = 0
        self.movimiento = False
        
        # Estados de animo
        self.estado_actual = None  # "bien", "neutral", "mal"
        self.tiempo_mostrar_estado = 0
        self.duracion_mostrar_estado = 3.0  # segundos
        self.ultimo_check_botones = 0
        self.debounce_time = 0.3  # Anti-rebote
        
        # Estados de los botones
        self.btn1 = False
        self.btn2 = False
        self.btn3 = False
        
        # Cache de valores
        self.temp_anterior = 22.0
        self.hum_anterior = 50.0
        self.lux_anterior = 300
        
        # Calibracion MQ-135
        self.voltaje_aire_limpio = 0.5
        self.voltaje_max = 3.0
        
        # Umbrales microfono
        self.umbral_bajo = 300
        self.umbral_medio = 800
        self.umbral_alto = 1500
        
        # Estado
        self.rotation = 0
        self.tiempo_inicio = 0
        self.mostrando_splash = True
        self.ip_address = self.obtener_ip()
        self.sensores_ok = {}
        
        # Control de tiempo
        self.ultimo_update_sensores = 0
        self.intervalo_sensores = 0.3
        
    def obtener_ip(self):
        """Obtiene la IP del dispositivo"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "No conectado"
    
    def cargar_fuentes(self):
        """Carga las fuentes"""
        try:
            self.font_ip = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
            self.font_estado = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        except:
            self.font_ip = ImageFont.load_default()
            self.font_estado = ImageFont.load_default()
    
    def guardar_estado_animo(self, estado):
        """Guarda el estado de animo en la base de datos"""
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Crear directorio si no existe
            if not os.path.exists('data'):
                os.makedirs('data')
            
            # Guardar en archivo CSV
            filename = 'data/estados_animo.csv'
            file_exists = os.path.exists(filename)
            
            with open(filename, 'a', encoding='utf-8') as f:
                if not file_exists:
                    f.write("timestamp,estado,temperatura,humedad,co2,luz,ruido\n")
                
                f.write(f"{timestamp},{estado},{self.temp:.1f},{self.hum:.1f},{self.ppm_co2},{self.lux},{self.nivel_ruido}\n")
            
            print(f"Estado '{estado}' guardado: {timestamp}")
            return True
            
        except Exception as e:
            print(f"ERROR: No se pudo guardar estado - {str(e)}")
            return False
    
    def verificar_botones(self):
        """Verifica el estado de los botones"""
        ahora = time.time()
        
        # Anti-rebote
        if ahora - self.ultimo_check_botones < self.debounce_time:
            return
        
        try:
            # Leer botones (invertir porque usan pull-up)
            btn1_actual = not GPIO.input(PIN_BTN1)
            btn2_actual = not GPIO.input(PIN_BTN2)
            btn3_actual = not GPIO.input(PIN_BTN3)
            
            # BTN1 - BIEN
            if btn1_actual and not self.btn1:
                self.registrar_estado("bien")
                self.ultimo_check_botones = ahora
            
            # BTN2 - NEUTRAL
            if btn2_actual and not self.btn2:
                self.registrar_estado("neutral")
                self.ultimo_check_botones = ahora
            
            # BTN3 - MAL
            if btn3_actual and not self.btn3:
                self.registrar_estado("mal")
                self.ultimo_check_botones = ahora
            
            # Actualizar estados
            self.btn1 = btn1_actual
            self.btn2 = btn2_actual
            self.btn3 = btn3_actual
            
        except Exception as e:
            if DEBUG:
                print(f"ERROR: Verificando botones - {str(e)}")
    
    def registrar_estado(self, estado):
        """Registra un nuevo estado de animo"""
        self.estado_actual = estado
        self.tiempo_mostrar_estado = time.time()
        
        # Guardar en base de datos
        self.guardar_estado_animo(estado)
        
        # Feedback en consola
        print(f"\nEstado registrado: {estado.upper()}\n")
    
    def calibrar_microfono(self):
        """Calibra el microfono"""
        if DEBUG:
            print("INFO: Calibrando microfono...")
        
        valores = []
        for i in range(50):
            if self.mic:
                valores.append(self.mic.value)
            time.sleep(0.02)
        
        if valores:
            self.nivel_base_mic = sum(valores) / len(valores)
    
    def inicializar(self):
        """Inicializa todos los componentes"""
        print("CONFIG: Inicializando componentes...\n")
        
        self.cargar_fuentes()
        
        # GPIO
        print("INFO: Configurando GPIO...")
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(PIN_MQ135, GPIO.IN)
        GPIO.setup(PIN_PIR, GPIO.IN)
        
        # Configurar botones con pull-up interno
        GPIO.setup(PIN_BTN1, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_BTN2, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_BTN3, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        print("OK: GPIO y botones configurados\n")
        
        # DHT11
        print("INFO: Inicializando DHT11...", end=" ")
        try:
            self.dht = adafruit_dht.DHT11(board.D23, use_pulseio=False)
            self.sensores_ok['DHT11'] = True
            print("OK")
        except Exception as e:
            self.sensores_ok['DHT11'] = False
            print("ERROR - " + str(e))
        
        # ADS1115
        print("INFO: Inicializando ADS1115...", end=" ")
        try:
            self.ldr = AnalogIn(ads, 0)
            self.mq135_channel = AnalogIn(ads, 2)
            self.mic = AnalogIn(ads, CANAL_MIC)
            self.sensores_ok['ADS1115'] = True
            print("OK")
        except Exception as e:
            self.sensores_ok['ADS1115'] = False
            print("ERROR - " + str(e))
        
        # Calibrar microfono
        if self.mic:
            self.calibrar_microfono()
        
        # Display
        print("INFO: Inicializando Display...", end=" ")
        try:
            serial = spi(port=0, device=0, gpio_DC=PIN_DC, gpio_RST=PIN_RST)
            self.device = st7789(serial, width=240, height=240, rotate=3)
            self.sensores_ok['Display'] = True
            print("OK\n")
        except Exception as e:
            self.sensores_ok['Display'] = False
            print("ERROR - " + str(e))
            return False
        
        self.tiempo_inicio = time.time()
        print("="*60)
        print("OK: INICIALIZACION COMPLETADA")
        print("="*60)
        print("\nBotones de Estado de Animo:")
        print("  - BTN1 (GPIO 16): BIEN")
        print("  - BTN2 (GPIO 20): NEUTRAL")
        print("  - BTN3 (GPIO 21): MAL")
        print("="*60 + "\n")
        return True
    
    def leer_sensores(self):
        """Lee todos los sensores"""
        ahora = time.time()
        
        if ahora - self.ultimo_update_sensores < self.intervalo_sensores:
            return
        
        self.ultimo_update_sensores = ahora
        
        # DHT11
        if self.dht:
            try:
                temp_nueva = self.dht.temperature
                hum_nueva = self.dht.humidity
                if temp_nueva and hum_nueva:
                    self.temp = temp_nueva
                    self.hum = hum_nueva
                    self.temp_anterior = temp_nueva
                    self.hum_anterior = hum_nueva
                else:
                    self.temp = self.temp_anterior
                    self.hum = self.hum_anterior
            except:
                self.temp = self.temp_anterior
                self.hum = self.hum_anterior
        
        # PIR
        try:
            self.movimiento = bool(GPIO.input(PIN_PIR))
        except:
            pass
        
        # LDR
        if self.ldr:
            try:
                voltaje = self.ldr.voltage
                if voltaje > 0:
                    self.lux = int((voltaje / 3.3) * 1000)
                    self.lux_anterior = self.lux
                else:
                    self.lux = self.lux_anterior
            except:
                self.lux = self.lux_anterior
        
        # MQ-135
        if self.mq135_channel:
            try:
                voltaje = self.mq135_channel.voltage
                if voltaje > 0:
                    self.ppm_co2 = self.voltaje_a_ppm(voltaje)
            except:
                pass
        
        # Microfono
        if self.mic:
            try:
                self.valor_mic = self.mic.value
                self.diferencia_mic = abs(self.valor_mic - self.nivel_base_mic)
                
                if self.diferencia_mic < self.umbral_bajo:
                    self.nivel_ruido = "silencio"
                elif self.diferencia_mic < self.umbral_medio:
                    self.nivel_ruido = "bajo"
                elif self.diferencia_mic < self.umbral_alto:
                    self.nivel_ruido = "medio"
                else:
                    self.nivel_ruido = "alto"
            except:
                pass
    
    def voltaje_a_ppm(self, voltaje):
        """Convierte voltaje a PPM"""
        if voltaje <= self.voltaje_aire_limpio:
            return 400
        ppm = 400 + ((voltaje - self.voltaje_aire_limpio) / 
                     (self.voltaje_max - self.voltaje_aire_limpio)) * 2100
        return int(min(ppm, 3000))
    
    def obtener_color_temperatura(self):
        """Obtiene color RGB segun temperatura"""
        temp = self.temp
        if temp < 18:
            return (100, 150, 220)  # Azul
        elif temp < 22:
            return (100, 220, 150)  # Verde azulado
        elif temp < 25:
            return (150, 220, 100)  # Verde
        elif temp < 28:
            return (220, 200, 100)  # Amarillo
        else:
            return (220, 100, 150)  # Rosa/Magenta
    
    def obtener_color_ruido(self):
        """Obtiene color segun nivel de ruido"""
        if self.nivel_ruido == "silencio":
            return (100, 220, 180)  # Verde
        elif self.nivel_ruido == "bajo":
            return (150, 200, 255)  # Azul claro
        elif self.nivel_ruido == "medio":
            return (200, 150, 255)  # Morado
        else:
            return (255, 150, 150)  # Rosa
    
    def dibujar_texto_estado(self, draw):
        """Dibuja el texto del estado actual sobre la mandala"""
        if not self.estado_actual:
            return
        
        # Verificar si aun debe mostrarse
        tiempo_transcurrido = time.time() - self.tiempo_mostrar_estado
        if tiempo_transcurrido > self.duracion_mostrar_estado:
            self.estado_actual = None
            return
        
        # Texto segun estado
        textos = {
            "bien": "BIEN",
            "neutral": "NEUTRAL",
            "mal": "MAL"
        }
        
        # Colores de fondo segun estado
        colores_bg = {
            "bien": (50, 200, 100),     # Verde
            "neutral": (200, 150, 50),   # Amarillo
            "mal": (200, 100, 100)       # Rojo
        }
        
        texto = textos.get(self.estado_actual, "")
        color_bg = colores_bg.get(self.estado_actual, (100, 100, 100))
        
        # Dibujar fondo
        overlay_width = 120
        overlay_height = 50
        cx, cy = 120, 50  # Posicion superior centro
        
        # Rectangulo de fondo
        x1 = cx - overlay_width // 2
        y1 = cy - overlay_height // 2
        x2 = cx + overlay_width // 2
        y2 = cy + overlay_height // 2
        
        draw.rectangle([(x1, y1), (x2, y2)], fill=color_bg)
        
        # Dibujar texto centrado
        try:
            bbox = draw.textbbox((0, 0), texto, font=self.font_estado)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            text_x = cx - text_width // 2
            text_y = cy - text_height // 2
            
            draw.text((text_x, text_y), texto, fill="white", font=self.font_estado)
        except:
            # Fallback
            draw.text((cx - 25, cy - 10), texto, fill="white", font=self.font_ip)
    
    def dibujar_splash(self, draw):
        """Pantalla de bienvenida con estado de sensores"""
        draw.rectangle([(0, 0), (240, 240)], fill="black")
        
        y = 20
        draw.text((30, y), "ZENALYZE", fill="cyan", font=self.font_ip)
        y += 30
        
        draw.text((20, y), "Estado de Sensores:", fill="white", font=self.font_ip)
        y += 25
        
        # Estado de cada sensor
        sensores = ['DHT11', 'ADS1115', 'Display']
        for sensor in sensores:
            ok = self.sensores_ok.get(sensor, False)
            estado = "OK" if ok else "ERROR"
            color = "green" if ok else "red"
            draw.text((30, y), "{}: {}".format(sensor, estado), fill=color, font=self.font_ip)
            y += 20
        
        # IP
        y += 10
        draw.text((20, y), "IP: " + self.ip_address, fill="yellow", font=self.font_ip)
        
        # Info botones
        y += 30
        draw.text((20, y), "Botones de Animo:", fill="cyan", font=self.font_ip)
        y += 20
        draw.text((25, y), "BTN1: Bien", fill="green", font=self.font_ip)
        y += 18
        draw.text((25, y), "BTN2: Neutral", fill="yellow", font=self.font_ip)
        y += 18
        draw.text((25, y), "BTN3: Mal", fill="red", font=self.font_ip)
    
    def dibujar_mandala(self, draw):
        """Dibuja la mandala interactiva"""
        w, h = 240, 240
        cx, cy = w // 2, h // 2
        maxR = min(w, h) // 2 - 20
        
        # Colores
        color_temp = self.obtener_color_temperatura()
        color_ruido = self.obtener_color_ruido()
        temp_hex = "#{:02x}{:02x}{:02x}".format(*color_temp)
        ruido_hex = "#{:02x}{:02x}{:02x}".format(*color_ruido)
        
        # Color del aire (verde, amarillo, rojo)
        if self.ppm_co2 < 600:
            air_hex = "#10B981"  # Verde
        elif self.ppm_co2 < 1000:
            air_hex = "#F59E0B"  # Amarillo
        else:
            air_hex = "#EF4444"  # Rojo
        
        # Circulo exterior (temperatura) - Rosa/Morado/Azul
        ext_radius = int(maxR * 0.90)
        draw.ellipse([(cx - ext_radius, cy - ext_radius),
                      (cx + ext_radius, cy + ext_radius)],
                     outline=temp_hex, width=3)
        
        # Triangulos (humedad) - Morado
        triangles = 6
        for i in range(triangles):
            angle = (i / triangles) * math.pi * 2 + (self.rotation * math.pi / 180)
            r1 = maxR * 0.75
            r2 = maxR * 0.85
            
            x1 = cx + math.cos(angle) * r1
            y1 = cy + math.sin(angle) * r1
            x2 = cx + math.cos(angle + 0.35) * r2
            y2 = cy + math.sin(angle + 0.35) * r2
            x3 = cx + math.cos(angle + 0.70) * r1
            y3 = cy + math.sin(angle + 0.70) * r1
            
            morado = "#A855F7"
            draw.polygon([(int(x1), int(y1)), (int(x2), int(y2)), (int(x3), int(y3))],
                         outline=morado, fill=None)
        
        # Petales (CO2/Aire) - Verdes/Amarillos/Rojos
        petals = 12
        for i in range(petals):
            angle = (i / petals) * math.pi * 2 + (self.rotation * math.pi / 180)
            petal_len = maxR * 0.70
            
            x1 = cx + math.cos(angle) * petal_len
            y1 = cy + math.sin(angle) * petal_len
            x2 = cx + math.cos(angle) * (petal_len * 0.3)
            y2 = cy + math.sin(angle) * (petal_len * 0.3)
            
            draw.line([(int(x2), int(y2)), (int(x1), int(y1))],
                     fill=air_hex, width=2)
        
        # Anillos de humedad - Azul
        rings = max(3, min(8, int(self.hum / 15)))
        for i in range(1, rings + 1):
            ring_r = int(maxR * (0.3 + (i / rings) * 0.25))
            draw.ellipse([(cx - ring_r, cy - ring_r),
                         (cx + ring_r, cy + ring_r)],
                        outline="#60A5FA", width=1)
        
        # Circulo central (ruido) - Rosa/Morado
        central_r = int(maxR * 0.20)
        draw.ellipse([(cx - central_r, cy - central_r),
                     (cx + central_r, cy + central_r)],
                    outline=ruido_hex, fill=None, width=3)
        
        # Punto central - Blanco
        punto_r = 3
        draw.ellipse([(cx - punto_r, cy - punto_r),
                     (cx + punto_r, cy + punto_r)],
                    fill="white")
        
        # Luz (circulos internos) - Amarillo/Azul
        if self.lux > 200:
            luz_color = "#FDE047"  # Amarillo
        else:
            luz_color = "#3B82F6"  # Azul
        
        luz_r = int(maxR * 0.08)
        draw.ellipse([(cx - luz_r, cy - luz_r),
                     (cx + luz_r, cy + luz_r)],
                    outline=luz_color, width=2)
        
        # Dibujar texto de estado si esta activo
        self.dibujar_texto_estado(draw)
    
    def dibujar_pantalla(self):
        """Dibuja la pantalla"""
        try:
            with canvas(self.device) as draw:
                tiempo_transcurrido = time.time() - self.tiempo_inicio
                
                if self.mostrando_splash and tiempo_transcurrido < 4:
                    self.dibujar_splash(draw)
                else:
                    self.mostrando_splash = False
                    draw.rectangle([(0, 0), (240, 240)], fill="black")
                    self.dibujar_mandala(draw)
        except Exception as e:
            print("ERROR: Dibujando pantalla - " + str(e))
    
    def ejecutar(self):
        """Loop principal"""
        if not self.inicializar():
            return
        
        print("\nOK: Monitor Mandala iniciado")
        print("   Mostrando pantalla de inicio por 4 segundos...")
        print("   Presiona los botones para registrar tu estado de animo")
        print("   Ctrl+C para salir\n")
        
        try:
            while True:
                self.leer_sensores()
                self.verificar_botones()  # Verificar botones en cada ciclo
                self.dibujar_pantalla()
                self.rotation = (self.rotation + 1) % 360
                time.sleep(0.025)  # 40 FPS
        
        except KeyboardInterrupt:
            print("\n\nINFO: Monitor detenido por usuario")
        
        finally:
            print("INFO: Limpiando recursos...")
            if self.dht:
                self.dht.exit()
            GPIO.cleanup()
            print("OK: Finalizado")

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    if not os.path.exists('.env'):
        print("ERROR: Archivo .env no encontrado")
        sys.exit(1)
    
    monitor = MandalaAvanzada()
    monitor.ejecutar()