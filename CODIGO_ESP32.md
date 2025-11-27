# 📟 Código ESP32 - Documentación Completa

## 📋 Resumen

El código del ESP32 escanea redes WiFi y dispositivos BLE, calcula distancias basadas en RSSI, y envía todos los datos con coordenadas GPS al servidor.

## ✅ Configuración Actualizada

### 🎯 IMPORTANTE: Cambiar Estas Coordenadas

El código actual tiene coordenadas de ejemplo de **Cusco, Perú**. **DEBES cambiarlas** a tu ubicación real:

```cpp
// UBICACIÓN DEL ESP32 (COORDENADAS GPS)
// Líneas 19-20
const float ESP32_LATITUDE = -13.5226;   // ← CAMBIAR AQUÍ
const float ESP32_LONGITUDE = -71.9674;  // ← CAMBIAR AQUÍ
```

### 📍 Cómo Obtener Tus Coordenadas

**Opción 1 - Google Maps:**
1. Abre Google Maps en tu navegador
2. Haz clic derecho donde está el ESP32
3. Selecciona "¿Qué hay aquí?"
4. Copia las coordenadas que aparecen (ej: `-16.409047, -71.537451`)

**Opción 2 - Desde Celular:**
1. Abre Google Maps en tu celular
2. Mantén presionado donde está el ESP32
3. Las coordenadas aparecen arriba
4. Tócalas para copiar

**Ejemplo para Arequipa, Perú:**
```cpp
const float ESP32_LATITUDE = -16.409047;
const float ESP32_LONGITUDE = -71.537451;
const char* ESP32_LOCATION_NAME = "ESP32 - Arequipa Centro";
```

## 🔧 Configuración WiFi

```cpp
// Líneas 14-15
const char* ssid = "jrdev";           // ← Tu red WiFi
const char* password = "123456ed";    // ← Tu contraseña
```

## 📡 Configuración del Servidor

```cpp
// Línea 18
const char* serverUrl = "http://18.219.142.124:3000/api/scan";
```

Ya está configurado correctamente para el servidor AWS.

## 🔍 Cómo Funciona

### 1. Inicialización (setup)

```cpp
void setup() {
  // 1. Inicializa Serial para debug
  Serial.begin(115200);

  // 2. Obtiene MAC address como ID único
  deviceId = WiFi.macAddress();

  // 3. Inicializa BLE para escanear dispositivos Bluetooth
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();

  // 4. Conecta a WiFi
  conectarWiFi();
}
```

### 2. Loop Principal

```cpp
void loop() {
  // Cada 10 segundos (SCAN_INTERVAL)
  if (millis() - lastScan >= SCAN_INTERVAL) {
    // Verifica conexión WiFi
    // Escanea WiFi y BLE
    // Envía datos al servidor
    enviarDatosAlServidor();
  }
}
```

### 3. Proceso de Escaneo

#### A. Escanear Redes WiFi
```cpp
int numRedes = WiFi.scanNetworks();

for (int i = 0; i < numRedes && i < 30; i++) {
  String ssid = WiFi.SSID(i);
  String bssid = WiFi.BSSIDstr(i);
  int rssi = WiFi.RSSI(i);
  int channel = WiFi.channel(i);

  // Calcular distancia desde RSSI
  float distancia = calcularDistancia(rssi);

  // Calcular coordenadas GPS aproximadas
  float lat, lon;
  calcularCoordenadas(distancia, &lat, &lon);
}
```

#### B. Escanear Dispositivos BLE
```cpp
BLEScanResults* foundDevices = pBLEScan->start(5, false);

for (int i = 0; i < numDispositivos && i < 30; i++) {
  BLEAdvertisedDevice device = foundDevices->getDevice(i);

  String nombre = device.getName().c_str();
  String address = device.getAddress().toString().c_str();
  int rssi = device.getRSSI();

  // Calcular distancia y coordenadas
  float distancia = calcularDistancia(rssi);
  float lat, lon;
  calcularCoordenadas(distancia, &lat, &lon);

  // Clasificar tipo de dispositivo
  String tipo = obtenerTipoDispositivo(nombre);
}
```

### 4. Cálculo de Distancia

```cpp
float calcularDistancia(int rssi) {
  // Fórmula: d = 10 ^ ((RSSI_1M - RSSI) / (10 * n))
  // Donde:
  // - RSSI_1M = -59 dBm (señal a 1 metro)
  // - n = 2.5 (exponente de pérdida de ruta)

  float distancia = pow(10.0, (RSSI_1M - rssi) / (10.0 * PATH_LOSS_EXPONENT));

  // Limitar a 100 metros máximo
  if (distancia > 100.0) {
    distancia = 100.0;
  }

  return distancia;
}
```

### 5. Cálculo de Coordenadas GPS

```cpp
void calcularCoordenadas(float distancia, float* lat, float* lon) {
  // 1. Generar ángulo aleatorio (0-360°)
  float angle = random(0, 360) * (PI / 180.0);

  // 2. Convertir distancia a kilómetros
  float distKm = distancia / 1000.0;

  // 3. Calcular nueva latitud
  // 1 grado de latitud ≈ 111 km
  *lat = ESP32_LATITUDE + (distKm / 111.0) * cos(angle);

  // 4. Calcular nueva longitud
  // 1 grado de longitud ≈ 111 km * cos(latitud)
  *lon = ESP32_LONGITUDE +
         (distKm / (111.0 * cos(ESP32_LATITUDE * PI / 180.0))) * sin(angle);
}
```

**⚠️ Nota**: Este método es una **aproximación**. Los dispositivos se distribuyen en un círculo alrededor del ESP32, pero no sabemos su dirección real.

### 6. Formato de Datos Enviados

```json
{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "timestamp": 123456789,
  "scanNumber": 1,
  "esp32Location": {
    "latitude": -13.5226,
    "longitude": -71.9674,
    "name": "ESP32 Scanner"
  },
  "wifi": [
    {
      "ssid": "Mi WiFi",
      "bssid": "11:22:33:44:55:66",
      "rssi": -50,
      "channel": 6,
      "distance": "2.50",
      "encryption": "Segura",
      "latitude": "-13.522580",
      "longitude": "-71.967385"
    }
  ],
  "ble": [
    {
      "name": "Mi Celular",
      "address": "AA:BB:CC:DD:EE:FF",
      "rssi": -60,
      "type": "Celular",
      "distance": "5.20",
      "latitude": "-13.522615",
      "longitude": "-71.967420"
    }
  ]
}
```

## 🎯 Clasificación de Dispositivos BLE

El código identifica automáticamente el tipo de dispositivo BLE:

```cpp
String obtenerTipoDispositivo(String nombre) {
  if (nombre contiene "phone", "galaxy", "xiaomi", "iphone")
    return "Celular";

  if (nombre contiene "watch", "band")
    return "Reloj";

  if (nombre contiene "buds", "airpods", "speaker")
    return "Audio";

  if (nombre contiene "tv", "chromecast")
    return "TV";

  if (nombre contiene "laptop", "pc")
    return "Computadora";

  return "Generico";
}
```

## 📊 Constantes Importantes

### Cálculo de Distancia

```cpp
const float RSSI_1M = -59.0;           // RSSI a 1 metro de distancia
const float PATH_LOSS_EXPONENT = 2.5;  // Exponente de pérdida (2-4)
```

**Calibración:**
- Para ambiente abierto: `PATH_LOSS_EXPONENT = 2.0`
- Para ambiente con obstáculos: `PATH_LOSS_EXPONENT = 3.0-4.0`
- Actual (promedio): `PATH_LOSS_EXPONENT = 2.5`

### Intervalo de Escaneo

```cpp
const unsigned long SCAN_INTERVAL = 10000;  // 10 segundos
```

Puedes cambiar esto para escanear más o menos frecuentemente:
- Rápido: `5000` (5 segundos)
- Normal: `10000` (10 segundos)
- Lento: `30000` (30 segundos)

### Límites

```cpp
// Línea 99: Máximo 30 redes WiFi por escaneo
for (int i = 0; i < numRedes && i < 30; i++)

// Línea 133: Máximo 30 dispositivos BLE por escaneo
for (int i = 0; i < numDispositivos && i < 30; i++)
```

## 🔧 Calibración y Ajustes

### 1. Calibrar Distancia RSSI

Para mejorar precisión de distancia:

1. Coloca un dispositivo a exactamente 1 metro del ESP32
2. Observa el RSSI en el Serial Monitor
3. Actualiza `RSSI_1M` con ese valor:

```cpp
const float RSSI_1M = -XX.0;  // Tu valor medido
```

### 2. Ajustar Exponente de Pérdida

Prueba diferentes valores según tu ambiente:

```cpp
// Ambiente abierto (menos obstáculos)
const float PATH_LOSS_EXPONENT = 2.0;

// Ambiente normal (oficina)
const float PATH_LOSS_EXPONENT = 2.5;

// Ambiente con muchos obstáculos (muros, muebles)
const float PATH_LOSS_EXPONENT = 3.5;
```

### 3. Cambiar Intervalo de Escaneo

```cpp
// Cada 5 segundos (consume más batería)
const unsigned long SCAN_INTERVAL = 5000;

// Cada 30 segundos (ahorra batería)
const unsigned long SCAN_INTERVAL = 30000;
```

## 📝 Salida del Serial Monitor

```
╔════════════════════════════════════════╗
║  ESP32 SCANNER - Con Geolocalización  ║
╚════════════════════════════════════════╝
📍 Ubicación: -13.522600, -71.967400
🗺️  Mapa: http://18.219.142.124:3000/mapa
════════════════════════════════════════

🆔 ID: AA:BB:CC:DD:EE:FF
🔵 [BLE] Inicializando...
✅ [BLE] Listo
📶 [WiFi] Conectando a: jrdev
......
✅ [WiFi] Conectado
🌐 [WiFi] IP: 192.168.1.100

🚀 Sistema listo

╔════════════════════════════════════════╗
║   ESCANEO #1                           ║
╚════════════════════════════════════════╝

📡 [WiFi] Escaneando redes...
✅ [WiFi] Redes encontradas: 4
   1. Mi WiFi             | -45 dBm | 1.50m | -13.522580,-71.967385
   2. Vecino_WiFi         | -67 dBm | 12.30m | -13.522615,-71.967420
   ...

🔵 [BLE] Escaneando dispositivos (5 segundos)...
✅ [BLE] Dispositivos encontrados: 2
   1. Galaxy S21          | -55 dBm | 3.20m | -13.522590,-71.967395
   2. AirPods Pro         | -72 dBm | 18.50m | -13.522625,-71.967430
   ...

🌐 [HTTP] Enviando datos al servidor...
📦 [HTTP] Tamaño: 1234 bytes
📨 [HTTP] Respuesta: 200
✅ [OK] Datos enviados exitosamente

╔════════════════════════════════════════╗
║   Próximo escaneo en 10s              ║
╚════════════════════════════════════════╝
```

## 🐛 Troubleshooting

### WiFi no conecta

```cpp
❌ [ERROR] No se pudo conectar
```

**Solución:**
1. Verifica SSID y contraseña
2. Verifica que el router esté encendido
3. Acércate al router

### No encuentra dispositivos BLE

```cpp
✅ [BLE] Dispositivos encontrados: 0
```

**Causas:**
- No hay dispositivos BLE cerca
- Dispositivos en modo "no visible"
- Interferencia de señal

### Error HTTP

```cpp
❌ [ERROR] Fallo HTTP: connection refused
```

**Solución:**
1. Verifica que el servidor esté ejecutando
2. Verifica la URL del servidor
3. Verifica conectividad a internet

### Distancias incorrectas

**Solución:**
1. Calibra `RSSI_1M`
2. Ajusta `PATH_LOSS_EXPONENT`
3. Ten en cuenta que RSSI varía con obstáculos

## 🔐 Seguridad

### Datos Sensibles

```cpp
// ⚠️ NUNCA compartas tu código con:
const char* password = "123456ed";  // ← Contraseña WiFi
```

### Buenas Prácticas

1. **No subas credenciales a Git**
2. **Cambia contraseñas de fábrica**
3. **Usa WPA2/WPA3 en tu WiFi**

## 📚 Bibliotecas Necesarias

```cpp
#include <WiFi.h>          // WiFi para ESP32
#include <HTTPClient.h>    // Cliente HTTP
#include <BLEDevice.h>     // Bluetooth Low Energy
#include <BLEUtils.h>      // Utilidades BLE
#include <BLEScan.h>       // Escaneo BLE
#include <BLEAdvertisedDevice.h>  // Dispositivos BLE
#include <ArduinoJson.h>   // Manejo de JSON
```

**Instalación:**
- Arduino IDE → Herramientas → Gestor de Bibliotecas
- Buscar "ArduinoJson" e instalar versión 6.x

## 🎓 Mejoras Futuras

### 1. Agregar Módulo GPS Real

```cpp
#include <TinyGPS++.h>

TinyGPSPlus gps;
HardwareSerial SerialGPS(2);  // UART2

void setup() {
  SerialGPS.begin(9600, SERIAL_8N1, 16, 17);  // RX, TX
}

void loop() {
  while (SerialGPS.available() > 0) {
    if (gps.encode(SerialGPS.read())) {
      if (gps.location.isValid()) {
        ESP32_LATITUDE = gps.location.lat();
        ESP32_LONGITUDE = gps.location.lng();
      }
    }
  }
}
```

### 2. Pantalla OLED

Mostrar datos en una pantalla I2C OLED de 0.96"

### 3. Modo Deep Sleep

Ahorrar batería con:
```cpp
esp_sleep_enable_timer_wakeup(30 * 1000000);  // 30 segundos
esp_deep_sleep_start();
```

### 4. SD Card Logging

Guardar datos localmente en tarjeta SD

### 5. Botón de Control

Agregar botón para iniciar/detener escaneo manualmente

## 👥 Desarrolladores

- **Axel Aranibar Rojas** - Código: 220547
- **Edmil Jampier Saire Bustamante** - Código: 174449

---

**Versión**: 1.0.0
**Fecha**: 2025-11-27
**Plataforma**: ESP32
