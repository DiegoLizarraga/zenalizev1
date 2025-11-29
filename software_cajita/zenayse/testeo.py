#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor de Sensores en Pantalla LCD - Proyecto Zenalyze
Version con DEBUG para botones y Medidor de Ruido
"""

import time
import sys
import os
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
from PIL import Image, ImageDraw, ImageFont, ImageOps

# Cargar configuracion
load_dotenv()

# ============================================
# CONFIGURACION
# ============================================

# Inicializar I2C y ADS1115 primero
i2c = board.I2C()
ads = ADS.ADS1115(i2c)

# GPIO Sensores
PIN_DHT11 = int(os.getenv('PIN_DHT11', 23))
PIN_MQ135 = int(os.getenv('PIN_MQ135', 26))
PIN_PIR = int(os.getenv('PIN_PIR', 14))
PIN_MIC = int(os.getenv('PIN_MIC', 16))

# Botones - Los pines reales (16, 20, 21)
PIN_BTN1 = 16
PIN_BTN2 = 20
PIN_BTN3 = 21

# Display
PIN_DC = int(os.getenv('PIN_DISPLAY_DC', 24))
PIN_RST = int(os.getenv('PIN_DISPLAY_RST', 25))

# Microfono - Canal ADS1115
CANAL_MIC = 1

# DEBUG
DEBUG = True

# ============================================
# CLASE PRINCIPAL
# ============================================

class SensorLCDMonitor:
    def __init__(self):
        self.device = None
        self.dht = None
        self.ldr = None
        self.mic = None
        
        # Fuentes
        self.font_titulo = None
        self.font_normal = None
        self.font_pequena = None
        
        # Estado de sensores
        self.temp = 0
        self.hum = 0
        self.temp_anterior = 0  # Cache del ultimo valor valido
        self.hum_anterior = 0   # Cache del ultimo valor valido
        self.co2 = False
        self.movimiento = False
        self.movimiento_anterior = False
        self.ruido = False
        self.lux = 0
        self.lux_anterior = 0   # Cache del ultimo valor valido
        self.voltaje_ldr = 0
        self.voltaje_ldr_anterior = 0  # Cache del ultimo valor valido
        
        # MQ-135 Analogico
        self.voltaje_mq135 = 0
        self.ppm_co2 = 0
        self.calidad_aire = "normal"
        self.mq135_channel = None
        
        # Calibracion MQ-135
        self.voltaje_aire_limpio = 0.5
        self.voltaje_max = 3.0
        
        # Microfono
        self.nivel_base_mic = 0
        self.valor_mic = 0
        self.diferencia_mic = 0
        self.nivel_ruido = "silencio"
        self.estadisticas_mic = {"silencio": 0, "bajo": 0, "medio": 0, "alto": 0}
        
        # Umbrales del microfono
        self.umbral_bajo = 300
        self.umbral_medio = 800
        self.umbral_alto = 1500
        
        # Botones
        self.btn1 = False
        self.btn2 = False
        self.btn3 = False
        self.btn1_anterior = False
        self.btn3_anterior = False
        
        # Pagina actual (0 a 2)
        self.pagina = 0
        
        # Control de tiempo
        self.ultimo_update_sensores = 0
        self.intervalo_sensores = 1  # segundos - Mas rapido
        
    def cargar_fuentes(self):
        """Carga las fuentes disponibles"""
        try:
            self.font_titulo = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            self.font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
            self.font_pequena = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except:
            self.font_titulo = ImageFont.load_default()
            self.font_normal = ImageFont.load_default()
            self.font_pequena = ImageFont.load_default()
        
    def calibrar_microfono(self):
        """Calibra el microfono tomando el nivel base"""
        if DEBUG:
            print("INFO: Calibrando microfono...")
        
        valores = []
        for i in range(50):
            if self.mic:
                valores.append(self.mic.value)
            time.sleep(0.02)
        
        if valores:
            self.nivel_base_mic = sum(valores) / len(valores)
            if DEBUG:
                print("OK: Nivel base del microfono: {}\n".format(int(self.nivel_base_mic)))
        
    def inicializar(self):
        """Inicializa todos los componentes"""
        print("CONFIG: Inicializando componentes...\n")
        
        # Cargar fuentes
        self.cargar_fuentes()
        
        # GPIO
        print("INFO: Configurando GPIO...")
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
        
        # Sensores como entrada
        GPIO.setup(PIN_MQ135, GPIO.IN)
        GPIO.setup(PIN_PIR, GPIO.IN)
        
        # Configurar botones con pull-up interno
        GPIO.setup(PIN_BTN1, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_BTN2, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_BTN3, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        print("OK: GPIO configurado")
        print("  PIN_BTN1 = GPIO {}".format(PIN_BTN1))
        print("  PIN_BTN2 = GPIO {}".format(PIN_BTN2))
        print("  PIN_BTN3 = GPIO {}".format(PIN_BTN3))
        print()
        
        # DHT11
        print("INFO: Inicializando DHT11...")
        try:
            self.dht = adafruit_dht.DHT11(board.D23, use_pulseio=False)
            print("OK: DHT11 inicializado\n")
        except Exception as e:
            print("ERROR: DHT11 - " + str(e) + "\n")
        
        # ADS1115 + LDR (Canal A0)
        print("INFO: Inicializando ADS1115 y LDR (Canal A0)...")
        try:
            self.ldr = AnalogIn(ads, 0)
            print("OK: ADS1115 y LDR inicializados (Canal A0)")
            
            # MQ-135 Analogico en canal A2
            self.mq135_channel = AnalogIn(ads, 2)
            print("OK: MQ-135 Analogico inicializado (Canal A2)")
            
            # Microfono en canal A1
            self.mic = AnalogIn(ads, CANAL_MIC)
            print("OK: Microfono inicializado (Canal A{})\n".format(CANAL_MIC))
        except Exception as e:
            print("ERROR: ADS1115 - " + str(e) + "\n")
        
        # Calibrar micrófono
        if self.mic:
            self.calibrar_microfono()
        
        # Display ST7789
        print("INFO: Inicializando Display ST7789...")
        try:
            serial = spi(port=0, device=0, gpio_DC=PIN_DC, gpio_RST=PIN_RST)
            self.device = st7789(serial, width=240, height=240, rotate=3)
            print("OK: Display inicializado\n")
        except Exception as e:
            print("ERROR: Display - " + str(e))
            print("INFO: Verifica conexion SPI")
            return False
        
        print("="*60)
        print("OK: INICIALIZACION COMPLETADA")
        print("="*60)
        return True
    
    def leer_sensores(self):
        """Lee todos los sensores - Solo si paso el intervalo"""
        ahora = time.time()
        
        if ahora - self.ultimo_update_sensores < self.intervalo_sensores:
            return  # No leer todavia
        
        self.ultimo_update_sensores = ahora
        
        # DHT11
        if self.dht:
            try:
                temp_nueva = self.dht.temperature
                hum_nueva = self.dht.humidity
                
                # Solo actualizar si la lectura es valida
                if temp_nueva is not None and hum_nueva is not None:
                    self.temp = temp_nueva
                    self.hum = hum_nueva
                    # Guardar como ultimo valor valido
                    self.temp_anterior = temp_nueva
                    self.hum_anterior = hum_nueva
                else:
                    # Si falla, usar el valor anterior (invisible para el usuario)
                    self.temp = self.temp_anterior
                    self.hum = self.hum_anterior
                    if DEBUG:
                        print("DEBUG: DHT11 lectura None, usando valor anterior")
            except:
                # Si hay excepcion, usar el valor anterior
                self.temp = self.temp_anterior
                self.hum = self.hum_anterior
                if DEBUG:
                    print("DEBUG: DHT11 error, usando valor anterior")
        
        # Sensores digitales
        self.co2 = GPIO.input(PIN_MQ135)
        estado_pir_actual = GPIO.input(PIN_PIR)
        self.movimiento = bool(estado_pir_actual)
        
        # Detectar transicion (cambio de estado)
        if self.movimiento and not self.movimiento_anterior:
            if DEBUG:
                print("DEBUG: MOVIMIENTO DETECTADO (flanco de subida)")
        elif not self.movimiento and self.movimiento_anterior:
            if DEBUG:
                print("DEBUG: Movimiento finalizado (flanco de bajada)")
        
        self.movimiento_anterior = self.movimiento
        
        # LDR (Canal A0)
        if self.ldr:
            try:
                voltaje_nuevo = self.ldr.voltage
                lux_nuevo = int((voltaje_nuevo / 3.3) * 1000)
                
                # Solo actualizar si es valido
                if voltaje_nuevo > 0:
                    self.voltaje_ldr = voltaje_nuevo
                    self.lux = lux_nuevo
                    # Guardar como ultimo valor valido
                    self.voltaje_ldr_anterior = voltaje_nuevo
                    self.lux_anterior = lux_nuevo
                else:
                    # Si falla, usar el valor anterior
                    self.voltaje_ldr = self.voltaje_ldr_anterior
                    self.lux = self.lux_anterior
                    if DEBUG:
                        print("DEBUG: LDR lectura invalida, usando valor anterior")
            except:
                # Si hay excepcion, usar el valor anterior
                self.voltaje_ldr = self.voltaje_ldr_anterior
                self.lux = self.lux_anterior
                if DEBUG:
                    print("DEBUG: LDR error, usando valor anterior")
        
        # MQ-135 Analogico (Canal A2)
        if self.mq135_channel:
            try:
                voltaje_nuevo = self.mq135_channel.voltage
                ppm_nuevo = self.voltaje_a_ppm(voltaje_nuevo)
                calidad_nueva = self.clasificar_calidad(ppm_nuevo)
                
                # Solo actualizar si es valido
                if voltaje_nuevo > 0:
                    self.voltaje_mq135 = voltaje_nuevo
                    self.ppm_co2 = ppm_nuevo
                    self.calidad_aire = calidad_nueva
                else:
                    if DEBUG:
                        print("DEBUG: MQ-135 lectura invalida")
            except:
                if DEBUG:
                    print("DEBUG: MQ-135 error en lectura")
        
        # Microfono (Canal A1)
        if self.mic:
            try:
                self.valor_mic = self.mic.value
                self.diferencia_mic = abs(self.valor_mic - self.nivel_base_mic)
                
                # Determinar nivel de ruido
                if self.diferencia_mic < self.umbral_bajo:
                    self.nivel_ruido = "silencio"
                    self.estadisticas_mic["silencio"] += 1
                elif self.diferencia_mic < self.umbral_medio:
                    self.nivel_ruido = "bajo"
                    self.estadisticas_mic["bajo"] += 1
                elif self.diferencia_mic < self.umbral_alto:
                    self.nivel_ruido = "medio"
                    self.estadisticas_mic["medio"] += 1
                else:
                    self.nivel_ruido = "alto"
                    self.estadisticas_mic["alto"] += 1
            except:
                if DEBUG:
                    print("DEBUG: Microfono error en lectura")
    
    def voltaje_a_ppm(self, voltaje):
        """Convierte voltaje del MQ-135 a PPM CO2"""
        if voltaje <= self.voltaje_aire_limpio:
            return 400
        
        ppm = 400 + ((voltaje - self.voltaje_aire_limpio) / 
                     (self.voltaje_max - self.voltaje_aire_limpio)) * 2100
        
        return int(min(ppm, 3000))
    
    def clasificar_calidad(self, ppm):
        """Clasifica calidad del aire segun PPM CO2"""
        if ppm < 600:
            return "excelente"
        elif ppm < 800:
            return "bueno"
        elif ppm < 1000:
            return "regular"
        else:
            return "malo"
    
    def leer_botones(self):
        """Lee estado de botones - Invierte porque usa pull-up"""
        self.btn1 = not GPIO.input(PIN_BTN1)
        self.btn2 = not GPIO.input(PIN_BTN2)
        self.btn3 = not GPIO.input(PIN_BTN3)
    
    def dibujar_pagina_1(self, draw):
        """Pagina 1: Temperatura, Humedad, LDR"""
        draw.rectangle((0, 0, 240, 240), fill="black")
        
        y = 10
        draw.text((10, y), "SENSOR MONITOR", fill="white", font=self.font_titulo)
        y += 35
        
        draw.text((10, y), "Pag 1/3: Clima & Luz", fill="cyan", font=self.font_normal)
        y += 30
        
        draw.line((0, y, 240, y), fill="blue", width=2)
        y += 15
        
        # DHT11
        if self.temp and self.hum:
            draw.text((10, y), "Temp: {:.1f} C".format(self.temp), fill="cyan", font=self.font_normal)
            y += 30
            draw.text((10, y), "Humedad: {:.0f}%".format(self.hum), fill="cyan", font=self.font_normal)
        else:
            draw.text((10, y), "Temp/Hum: ERROR", fill="red", font=self.font_normal)
            y += 30
        
        y += 20
        
        # LDR
        if self.ldr:
            draw.text((10, y), "Luz: {} lux".format(self.lux), fill="yellow", font=self.font_normal)
            y += 30
            draw.text((10, y), "V: {:.2f}V".format(self.voltaje_ldr), fill="yellow", font=self.font_normal)
        else:
            draw.text((10, y), "LDR: NO CONECTADO", fill="red", font=self.font_normal)
        
        y += 40
        draw.text((10, y), "BTN1=Atras  BTN3=Siguiente", fill="gray", font=self.font_pequena)
    
    def dibujar_pagina_2(self, draw):
        """Pagina 2: Sensores de movimiento y gas analogico"""
        draw.rectangle((0, 0, 240, 240), fill="black")
        
        y = 10
        draw.text((10, y), "SENSOR MONITOR", fill="white", font=self.font_titulo)
        y += 35
        
        draw.text((10, y), "Pag 2/3: Movimiento & Aire", fill="cyan", font=self.font_normal)
        y += 30
        
        draw.line((0, y, 240, y), fill="blue", width=2)
        y += 15
        
        # PIR - Movimiento
        pir_texto = "MOVIMIENTO" if self.movimiento else "Reposo"
        pir_color = "red" if self.movimiento else "green"
        draw.text((10, y), pir_texto, fill=pir_color, font=self.font_normal)
        y += 35
        
        # MQ-135 Analogico - CO2
        if self.calidad_aire != "error":
            draw.text((10, y), "CO2: {} ppm".format(self.ppm_co2), fill="yellow", font=self.font_normal)
            y += 30
            
            calidad_color = "green" if self.calidad_aire == "excelente" else "yellow" if self.calidad_aire == "bueno" else "orange" if self.calidad_aire == "regular" else "red"
            draw.text((10, y), "Aire: {}".format(self.calidad_aire.upper()), fill=calidad_color, font=self.font_normal)
        else:
            draw.text((10, y), "MQ-135: ERROR", fill="red", font=self.font_normal)
        
        y += 50
        draw.text((10, y), "BTN1=Atras  BTN3=Siguiente", fill="gray", font=self.font_pequena)
    
    def dibujar_pagina_3(self, draw):
        """Pagina 3: Medidor de ruido del microfono"""
        draw.rectangle((0, 0, 240, 240), fill="black")
        
        y = 10
        draw.text((10, y), "SENSOR MONITOR", fill="white", font=self.font_titulo)
        y += 35
        
        draw.text((10, y), "Pag 3/3: Ruido (Microfono)", fill="cyan", font=self.font_normal)
        y += 30
        
        draw.line((0, y, 240, y), fill="blue", width=2)
        y += 15
        
        # Estado del micrófono
        if self.mic:
            # Valor actual
            draw.text((10, y), "Valor: {}".format(int(self.valor_mic)), fill="white", font=self.font_normal)
            y += 30
            
            # Diferencia del nivel base
            draw.text((10, y), "Dif: {}".format(int(self.diferencia_mic)), fill="white", font=self.font_normal)
            y += 30
            
            # Nivel de ruido con color
            if self.nivel_ruido == "silencio":
                ruido_color = "green"
                ruido_texto = "SILENCIO"
            elif self.nivel_ruido == "bajo":
                ruido_color = "yellow"
                ruido_texto = "BAJO"
            elif self.nivel_ruido == "medio":
                ruido_color = "orange"
                ruido_texto = "MEDIO"
            else:  # alto
                ruido_color = "red"
                ruido_texto = "ALTO"
            
            draw.text((10, y), "Estado: {}".format(ruido_texto), fill=ruido_color, font=self.font_normal)
            y += 35
            
            # Barra visual
            barras = int(self.diferencia_mic / 30) if self.diferencia_mic > 0 else 0
            barra_visual = "|" * min(barras, 20)
            draw.text((10, y), barra_visual, fill=ruido_color, font=self.font_pequena)
        else:
            draw.text((10, y), "Microfono: ERROR", fill="red", font=self.font_normal)
        
        y += 50
        draw.text((10, y), "BTN1=Atras  BTN3=Siguiente", fill="gray", font=self.font_pequena)
    
    def actualizar_display(self):
        """Actualiza la pantalla"""
        try:
            with canvas(self.device) as draw:
                if self.pagina == 0:
                    self.dibujar_pagina_1(draw)
                elif self.pagina == 1:
                    self.dibujar_pagina_2(draw)
                elif self.pagina == 2:
                    self.dibujar_pagina_3(draw)
        except Exception as e:
            print("ERROR: Actualizando display - " + str(e))
    
    def procesar_entrada(self):
        """Procesa entrada de botones - Detecta cambio de estado"""
        self.leer_botones()
        
        # Detecta transicion: botón presionado (cambio de 0 a 1)
        if self.btn1 and not self.btn1_anterior:
            if DEBUG:
                print("DEBUG: BTN1 presionado - Pagina anterior")
            self.pagina = (self.pagina - 1) % 3
            time.sleep(0.3)
        
        if self.btn3 and not self.btn3_anterior:
            if DEBUG:
                print("DEBUG: BTN3 presionado - Pagina siguiente")
            self.pagina = (self.pagina + 1) % 3
            time.sleep(0.3)
        
        # Guardar estado anterior
        self.btn1_anterior = self.btn1
        self.btn3_anterior = self.btn3
    
    def ejecutar(self):
        """Loop principal"""
        if not self.inicializar():
            return
        
        print("\nOK: Monitor iniciado")
        print("   PIN_BTN1 (GPIO {}) = Pagina anterior".format(PIN_BTN1))
        print("   PIN_BTN3 (GPIO {}) = Pagina siguiente".format(PIN_BTN3))
        print("   Ctrl+C para salir\n")
        
        if DEBUG:
            print("DEBUG: Modo DEBUG activado - Veras mensajes cuando se presionen botones\n")
        
        try:
            while True:
                self.leer_sensores()
                self.procesar_entrada()
                self.actualizar_display()
                time.sleep(0.025)  # 25ms para refresh MAS RAPIDO (40 FPS)
        
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
    # Verificar .env
    if not os.path.exists('.env'):
        print("ERROR: Archivo .env no encontrado")
        print("INFO: Copia el archivo .env de tu proyecto")
        sys.exit(1)
    
    # Crear y ejecutar monitor
    monitor = SensorLCDMonitor()
    monitor.ejecutar()