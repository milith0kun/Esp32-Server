# Especificaciones de Sincronización ESP32 Scanner

## Estado del Sistema

**Servidor:** ✅ Operativo y actualizado
**Interfaz Web:** ✅ Mejorada con tracking de dispositivos únicos
**URL:** http://18.219.142.124:3000

---

## 📡 Formato de Datos ESP32 → Servidor

### Endpoint de Envío
```
POST http://18.219.142.124:3000/api/scan
Content-Type: application/json
```

### Estructura JSON Requerida

Tu código ESP32 **YA ESTÁ CORRECTAMENTE CONFIGURADO** y sincronizado con el servidor. El formato que envía es perfecto:

```json
{
  "deviceId": "AA:BB:CC:DD:EE:FF",        // MAC del ESP32 (requerido)
  "timestamp": 1732658238,                 // Timestamp Unix (opcional)
  "scanNumber": 1,                         // Número de escaneo (opcional)
  "wifi": [                                // Array de redes WiFi detectadas
    {
      "ssid": "Nombre de la Red",          // Nombre de la red (puede ser vacío)
      "bssid": "AA:BB:CC:DD:EE:FF",        // MAC del router (requerido)
      "rssi": -57,                         // Nivel de señal en dBm (requerido)
      "channel": 6,                        // Canal WiFi (requerido)
      "distance": "2.5",                   // Distancia calculada en metros
      "encryption": "Segura"               // Tipo de encriptación
    }
  ],
  "ble": [                                 // Array de dispositivos BLE detectados
    {
      "name": "Dispositivo BLE",           // Nombre del dispositivo (puede estar vacío)
      "address": "aa:bb:cc:dd:ee:ff",      // MAC del dispositivo BLE (requerido)
      "rssi": -65,                         // Nivel de señal en dBm (requerido)
      "type": "Celular",                   // Tipo de dispositivo (opcional)
      "distance": "4.5"                    // Distancia calculada en metros
    }
  ]
}
```

### Respuesta del Servidor

```json
{
  "success": true,
  "message": "Escaneo recibido correctamente",
  "scanId": 123,
  "timestamp": "2025-11-26T21:30:00.000Z"
}
```

---

## 🔍 Tracking de Dispositivos Únicos

### WiFi - Identificación por BSSID
El servidor trackea cada red WiFi única usando su **BSSID** (MAC del router):

**Información almacenada:**
- BSSID (identificador único)
- SSID (nombre de la red)
- Primera vez detectada
- Última vez detectada
- Número de detecciones
- Historial de RSSI (últimas 50 mediciones)
- RSSI promedio, máximo y mínimo
- Canal
- Tipo de encriptación

### BLE - Identificación por Address
El servidor trackea cada dispositivo BLE único usando su **address** (MAC del dispositivo):

**Información almacenada:**
- Address (identificador único)
- Nombre del dispositivo
- Tipo de dispositivo
- Primera vez detectado
- Última vez detectado
- Número de detecciones
- Historial de RSSI (últimas 50 mediciones)
- RSSI promedio, máximo y mínimo

---

## 📊 Endpoints API Disponibles

### 1. Estadísticas Generales
```bash
GET http://18.219.142.124:3000/api/stats
```
Retorna:
- Total de escaneos
- Total de dispositivos WiFi y BLE únicos
- Promedios
- Última actualización

### 2. Todos los Dispositivos
```bash
GET http://18.219.142.124:3000/api/devices/all
```
Retorna todos los dispositivos WiFi y BLE detectados (ordenados por última aparición)

### 3. Solo WiFi
```bash
GET http://18.219.142.124:3000/api/devices/wifi
```
Retorna todas las redes WiFi únicas detectadas

### 4. Solo BLE
```bash
GET http://18.219.142.124:3000/api/devices/ble
```
Retorna todos los dispositivos BLE únicos detectados

### 5. Detalle de WiFi Específico
```bash
GET http://18.219.142.124:3000/api/devices/wifi/:bssid
```
Ejemplo: `/api/devices/wifi/AA:BB:CC:DD:EE:FF`

### 6. Detalle de BLE Específico
```bash
GET http://18.219.142.124:3000/api/devices/ble/:address
```
Ejemplo: `/api/devices/ble/aa:bb:cc:dd:ee:ff`

### 7. Último Escaneo
```bash
GET http://18.219.142.124:3000/api/scans/latest
```
Retorna el último escaneo completo recibido del ESP32

### 8. Health Check
```bash
GET http://18.219.142.124:3000/api/health
```
Estado del servidor, uptime y memoria

---

## 🎨 Características de la Interfaz Web

### Panel Principal
- **4 Cards de Estadísticas:**
  - Total de escaneos realizados
  - Redes WiFi únicas detectadas
  - Dispositivos BLE únicos detectados
  - Total de dispositivos únicos

### Pestañas de Navegación
1. **Todos los Dispositivos:** Vista combinada de WiFi y BLE
2. **Redes WiFi:** Solo redes WiFi detectadas
3. **Dispositivos BLE:** Solo dispositivos BLE detectados
4. **Último Escaneo:** Detalle del último scan del ESP32

### Barra de Búsqueda
- Busca por SSID, BSSID, nombre de dispositivo, MAC address, tipo

### Tarjetas de Dispositivos
Cada dispositivo muestra:
- **Nombre/SSID** y **MAC/BSSID**
- **Badge de tipo:** WiFi o BLE
- **Badge de categoría:** Para BLE (Celular, Reloj, Audio, etc.)
- **Información detallada:**
  - Canal (WiFi) / Tipo (BLE)
  - Seguridad / Tipo de dispositivo
  - Distancia aproximada
  - Número de detecciones
- **Barra de señal RSSI:**
  - Excelente (≥ -50 dBm) - Verde
  - Buena (≥ -60 dBm) - Azul
  - Regular (≥ -70 dBm) - Naranja
  - Débil (< -70 dBm) - Rojo
- **Timeline:**
  - Primera detección
  - Última detección (tiempo relativo)

### Auto-Refresh
- Actualización automática cada 5 segundos
- Botón para pausar/reanudar
- Botón de actualización manual
- Indicador de última actualización

---

## ✅ Verificación de Sincronización

### Tu Código ESP32 está sincronizado si:

1. **Configuración de URL:**
   ```cpp
   const char* serverUrl = "http://18.219.142.124:3000/api/scan";
   ```
   ✅ Ya lo tienes configurado correctamente

2. **Estructura JSON:**
   - Envía `deviceId` (MAC del ESP32) ✅
   - Envía array `wifi` con: ssid, bssid, rssi, channel, distance, encryption ✅
   - Envía array `ble` con: name, address, rssi, type, distance ✅

3. **Headers HTTP:**
   ```cpp
   http.addHeader("Content-Type", "application/json");
   ```
   ✅ Ya lo tienes

4. **Método POST:**
   ```cpp
   int httpResponseCode = http.POST(jsonString);
   ```
   ✅ Ya lo tienes

### Verificar desde ESP32:

Tu código ya imprime en Serial:
```
[HTTP] Código de respuesta: 200
[HTTP] Respuesta del servidor:
{"success":true,"message":"Escaneo recibido correctamente","scanId":X,"timestamp":"..."}
[OK] Datos enviados exitosamente
```

Si ves esto, **todo está perfectamente sincronizado**.

---

## 🔧 Configuración Actual del ESP32

Tu código tiene estas configuraciones que están **perfectas para el servidor**:

```cpp
// WiFi (ya configurado)
const char* ssid = "jrdev";
const char* password = "123456ed";

// Servidor (ya configurado)
const char* serverUrl = "http://18.219.142.124:3000/api/scan";

// Intervalo de escaneo
const unsigned long SCAN_INTERVAL = 10000;  // 10 segundos

// Cálculo de distancia
const float RSSI_1M = -59.0;
const float PATH_LOSS_EXPONENT = 2.5;
```

**No necesitas cambiar nada en tu código ESP32. Ya está 100% sincronizado.**

---

## 📈 Mejoras Implementadas en el Servidor

### 1. Tracking Avanzado
- Cada dispositivo WiFi se identifica por su **BSSID**
- Cada dispositivo BLE se identifica por su **address**
- Historial de señal RSSI (últimas 50 mediciones)
- Estadísticas de señal (promedio, máximo, mínimo)
- Contador de detecciones
- Timestamps de primera y última aparición

### 2. Endpoints Nuevos
- `/api/devices/all` - Todos los dispositivos
- `/api/devices/wifi` - Solo WiFi
- `/api/devices/ble` - Solo BLE
- `/api/devices/wifi/:bssid` - Detalle de WiFi específico
- `/api/devices/ble/:address` - Detalle de BLE específico

### 3. Interfaz Web Mejorada
- Dashboard con estadísticas
- 4 pestañas de navegación
- Búsqueda y filtrado
- Tarjetas detalladas de dispositivos
- Indicadores visuales de señal
- Auto-refresh configurable
- Diseño responsive

---

## 🎯 Funciones de Clasificación

### Tipos de Dispositivos BLE (del ESP32)

Tu código ESP32 ya clasifica dispositivos BLE en:
- **Celular:** Detecta phones, Galaxy, Xiaomi, Redmi, iPhone, Android, OnePlus, Huawei
- **Reloj:** Detecta watch, band, fit, wear
- **Audio:** Detecta buds, AirPods, headphone, speaker, audio
- **TV:** Detecta tv, Fire, Chromecast, Roku
- **Computadora:** Detecta laptop, pc, MacBook
- **Genérico:** Otros dispositivos

El servidor preserva esta clasificación y la muestra en la interfaz.

---

## 🌐 Acceso a la Interfaz Web

### URLs Disponibles:
- **Interfaz Principal:** http://18.219.142.124:3000
- **API Stats:** http://18.219.142.124:3000/api/stats
- **API Devices:** http://18.219.142.124:3000/api/devices/all

### Visualización en Tiempo Real:
1. Abre http://18.219.142.124:3000 en tu navegador
2. La página se actualiza automáticamente cada 5 segundos
3. Usa las pestañas para filtrar por tipo de dispositivo
4. Usa la barra de búsqueda para encontrar dispositivos específicos

---

## 📝 Logs del Servidor

### Ver logs en tiempo real:
```bash
# Si el servidor corre en terminal
# Los logs aparecen directamente

# Si usas systemd:
sudo journalctl -u esp32-scanner -f
```

### Formato de logs:
```
[2025-11-26T21:30:00.000Z] ESP32 Scanner Server INICIADO
[2025-11-26T21:30:15.123Z] Escaneo recibido - Device: AA:BB:CC:DD:EE:FF | Scan #1 | WiFi: 5 | BLE: 3
```

---

## ✨ Ejemplo de Uso Completo

### 1. ESP32 envía:
```json
{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "scanNumber": 42,
  "wifi": [
    {
      "ssid": "Mi Casa WiFi",
      "bssid": "11:22:33:44:55:66",
      "rssi": -55,
      "channel": 6,
      "distance": "3.2",
      "encryption": "Segura"
    }
  ],
  "ble": [
    {
      "name": "Galaxy S23",
      "address": "aa:bb:cc:dd:ee:ff",
      "rssi": -60,
      "type": "Celular",
      "distance": "4.0"
    }
  ]
}
```

### 2. Servidor procesa:
- Almacena el escaneo completo
- Actualiza tracking del WiFi con BSSID `11:22:33:44:55:66`
- Actualiza tracking del BLE con address `aa:bb:cc:dd:ee:ff`
- Calcula estadísticas
- Responde al ESP32 con confirmación

### 3. Interfaz Web muestra:
- Card para "Mi Casa WiFi" con toda su información
- Card para "Galaxy S23" con toda su información
- Historial de señal RSSI
- Número de veces detectado
- Primera y última detección

---

## 🚀 Próximos Pasos Opcionales

### Funciones que podrías agregar (si quieres):

1. **Persistencia de datos:** Guardar en base de datos (MongoDB, SQLite)
2. **Gráficos de señal:** Visualizar historial de RSSI en tiempo real
3. **Alertas:** Notificaciones cuando aparece/desaparece un dispositivo
4. **Filtros avanzados:** Por rango de señal, por tiempo, etc.
5. **Exportación:** Descargar datos en CSV/JSON
6. **Mapas de calor:** Visualizar distribución de dispositivos

---

## 📞 Soporte

Si necesitas agregar más funciones o modificar algo:
1. El servidor está en: `/home/ubuntu/esp32-scanner/server.js`
2. La interfaz está en: `/home/ubuntu/esp32-scanner/public/index.html`
3. Reiniciar servidor: `pkill -f "node server.js" && cd ~/esp32-scanner && node server.js &`

---

## ✅ Resumen de Estado

| Componente | Estado | Detalles |
|------------|--------|----------|
| **ESP32 Code** | ✅ Sincronizado | No requiere cambios |
| **Servidor** | ✅ Actualizado | Tracking avanzado implementado |
| **API** | ✅ Operativa | 8 endpoints disponibles |
| **Interfaz Web** | ✅ Mejorada | Dashboard + 4 pestañas + búsqueda |
| **Tracking WiFi** | ✅ Activo | Por BSSID con historial |
| **Tracking BLE** | ✅ Activo | Por address con historial |
| **Auto-refresh** | ✅ Activo | Cada 5 segundos |

**Todo está funcionando perfectamente. Tu ESP32 ya está enviando datos y el servidor los está procesando correctamente.**
