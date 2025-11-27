# 📍 Guía de Geolocalización - ESP32 Scanner

## ⚠️ PROBLEMA ACTUAL

**El mapa muestra dispositivos en una ubicación incorrecta** porque está usando coordenadas de ejemplo (Cusco, Perú).

## 🔍 Cómo Funciona Actualmente

### Sistema de Geolocalización Actual

El servidor usa un **sistema de geolocalización SIMULADO** que funciona así:

1. **Ubicación fija del ESP32**: Está configurada manualmente en el servidor
   - Por defecto: Cusco, Perú (-13.5226, -71.9674)
   - Archivo: `server.js` líneas 23-27

2. **Ubicación de dispositivos detectados**: Se calcula de forma aproximada
   - Basado en la distancia RSSI (señal del WiFi/BLE)
   - Basado en un ángulo generado desde la MAC address del dispositivo
   - **NO usa GPS real**

### Por Qué Marca en Otro Sitio

El mapa marca en otro sitio porque:
- ❌ La ubicación del ESP32 está configurada en Cusco, Perú (coordenadas de ejemplo)
- ❌ Las ubicaciones de los dispositivos se calculan desde ese punto falso
- ❌ El ESP32 **NO está enviando su ubicación GPS real**

## ✅ SOLUCIÓN RECOMENDADA (AHORA MÁS FÁCIL)

**🎉 BUENAS NOTICIAS**: El servidor ya está actualizado para leer la ubicación del ESP32 automáticamente.

### Lo Que Necesitas Hacer:

1. **Modificar el código del ESP32** con tus coordenadas reales
2. **Subir el código** al ESP32
3. **¡Listo!** El servidor actualizará la ubicación automáticamente

Lee la documentación completa: **[CODIGO_ESP32.md](CODIGO_ESP32.md)**

---

## ✅ SOLUCIONES DISPONIBLES

Hay **3 opciones** para arreglar esto:

---

## Opción 1: ⭐ Cambiar Coordenadas en el ESP32 (RECOMENDADO)

### Paso 1: Obtener tu ubicación real

Opción A - Usando Google Maps:
1. Abre Google Maps
2. Haz clic derecho donde está tu ESP32
3. Copia las coordenadas (ej: `-16.4090, -71.5375`)

Opción B - Desde tu celular:
1. Abre la app de Maps
2. Mantén presionado donde está el ESP32
3. Copia las coordenadas que aparecen

### Paso 2: Editar server.js

```bash
nano ~/esp32-scanner/server.js
```

Busca las líneas 23-27 y cambia:

```javascript
// ANTES (coordenadas de ejemplo - Cusco)
let esp32Location = {
  latitude: -13.5226,
  longitude: -71.9674,
  name: 'ESP32 Scanner'
};

// DESPUÉS (pon TUS coordenadas reales)
let esp32Location = {
  latitude: -16.4090,    // ← TU LATITUD
  longitude: -71.5375,   // ← TU LONGITUD
  name: 'ESP32 Scanner - Mi Ubicación'
};
```

### Paso 3: Reiniciar el servidor

```bash
pm2 restart esp32-scanner
```

### Paso 4: Verificar

Abre el mapa: http://18.219.142.124:3000/mapa

El marcador azul del ESP32 debería aparecer en la ubicación correcta.

---

### Paso 1: Modificar el código del ESP32

Edita el archivo `.ino` del ESP32 y cambia las líneas 19-20:

```cpp
// ANTES (coordenadas de ejemplo - Cusco)
const float ESP32_LATITUDE = -13.5226;
const float ESP32_LONGITUDE = -71.9674;

// DESPUÉS (pon TUS coordenadas reales)
const float ESP32_LATITUDE = -16.4090;    // ← TU LATITUD
const float ESP32_LONGITUDE = -71.5375;   // ← TU LONGITUD
const char* ESP32_LOCATION_NAME = "ESP32 - Mi Ubicación";
```

### Paso 2: Subir el código al ESP32

1. Abre Arduino IDE
2. Conecta el ESP32 por USB
3. Compila y sube el código
4. Abre Serial Monitor para verificar

### Paso 3: Verificar en el mapa

El servidor **automáticamente** leerá la ubicación del ESP32 y actualizará el mapa.

Abre: http://18.219.142.124:3000/mapa

**✅ El marcador azul del ESP32 debe aparecer en tu ubicación real.**

📖 **Documentación completa**: Ver [CODIGO_ESP32.md](CODIGO_ESP32.md)

---

## Opción 2: Configurar Ubicación Manualmente en el Servidor

Si no quieres modificar el ESP32, puedes cambiar la ubicación en el servidor:

### Paso 1: Obtener tu ubicación real

(Igual que en la Opción 1)

### Paso 2: Editar server.js

```bash
nano ~/esp32-scanner/server.js
```

Busca las líneas 23-27 y cambia:

```javascript
let esp32Location = {
  latitude: -16.4090,    // ← TU LATITUD
  longitude: -71.5375,   // ← TU LONGITUD
  name: 'ESP32 Scanner - Mi Ubicación'
};
```

### Paso 3: Reiniciar el servidor

```bash
pm2 restart esp32-scanner
```

---

## Opción 3: Enviar GPS Real desde el ESP32 (Módulo GPS)

Si tu ESP32 tiene módulo GPS, puedes enviar la ubicación real.

### Paso 1: Modificar el código del ESP32

El ESP32 debe enviar su ubicación GPS en cada scan:

```cpp
// En el JSON que envía el ESP32
{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "timestamp": 1234567890,
  "scanNumber": 1,
  "location": {                    // ← AGREGAR ESTO
    "latitude": -16.4090,          // Desde módulo GPS
    "longitude": -71.5375,         // Desde módulo GPS
    "altitude": 2335.5             // Opcional
  },
  "wifi": [...],
  "ble": [...]
}
```

### Paso 2: Modificar server.js

Agregar lógica para recibir y usar la ubicación GPS del ESP32:

```javascript
// En el endpoint POST /api/scan (línea ~207)
app.post('/api/scan', (req, res) => {
  try {
    const scanData = req.body;

    // Si el ESP32 envía su ubicación GPS, actualizarla
    if (scanData.location && scanData.location.latitude && scanData.location.longitude) {
      esp32Location = {
        latitude: scanData.location.latitude,
        longitude: scanData.location.longitude,
        altitude: scanData.location.altitude || 0,
        name: 'ESP32 Scanner'
      };
    }

    // ... resto del código
  }
});
```

**📎 ¿Tienes el código del ESP32?**
Si me lo pasas, puedo ayudarte a agregar la funcionalidad GPS.

---

---

## ℹ️ Cómo Funciona Ahora (Actualizado)

El servidor **ahora acepta la ubicación del ESP32** automáticamente:

1. **ESP32 envía** su ubicación GPS en cada escaneo
2. **Servidor lee** `esp32Location` del JSON
3. **Servidor actualiza** su variable interna
4. **Mapa muestra** la ubicación correcta

### Código del Servidor (ya actualizado)

```javascript
// server.js líneas 219-231
if (scanData.esp32Location &&
    scanData.esp32Location.latitude &&
    scanData.esp32Location.longitude) {
  esp32Location = {
    latitude: parseFloat(scanData.esp32Location.latitude),
    longitude: parseFloat(scanData.esp32Location.longitude),
    name: scanData.esp32Location.name || 'ESP32 Scanner'
  };
  // Log: "Ubicación ESP32 actualizada: -16.4090, -71.5375"
}
```

---

## Opción 4: Obtener Ubicación desde WiFi Conectado

Si el ESP32 está conectado a WiFi, podemos usar servicios de geolocalización por IP.

### Limitaciones:
- ⚠️ Menos preciso (error de 100-1000 metros)
- ⚠️ Requiere conexión a internet desde el servidor
- ⚠️ Puede requerir API key (algunos servicios)

### Implementación básica:

```javascript
// Servicio de geolocalización por IP
const getLocationFromIP = async (ip) => {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      latitude: data.lat,
      longitude: data.lon
    };
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    return null;
  }
};
```

---

## 🎯 Solución Recomendada

### Para desarrollo/pruebas:
✅ **Opción 1** - Configurar ubicación manualmente (5 minutos)

### Para producción:
✅ **Opción 2** - Enviar GPS desde el ESP32 (más preciso)

---

## 📊 Cómo se Calculan las Ubicaciones de Dispositivos

Una vez que tengas la ubicación correcta del ESP32, el sistema calcula la ubicación de cada dispositivo WiFi/BLE así:

### 1. Distancia (desde RSSI)

Ya lo hace el ESP32 (basado en la fuerza de la señal).

### 2. Ángulo (desde MAC Address)

El servidor genera un ángulo consistente desde la MAC:

```javascript
// server.js líneas 59-67
const getAngleFromMac = (macAddress) => {
  let hash = 0;
  for (let i = 0; i < macAddress.length; i++) {
    hash = ((hash << 5) - hash) + macAddress.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 360;  // Ángulo 0-360°
};
```

⚠️ **Esto es APROXIMADO** porque:
- No sabemos la dirección real del dispositivo
- Solo sabemos la distancia
- El ángulo se genera de la MAC para que sea consistente

### 3. Coordenadas Finales

```javascript
// server.js líneas 40-56
const calculateGeoLocation = (distance, angle) => {
  const distanceInDegrees = parseFloat(distance) / 111000;
  const angleRad = (angle * Math.PI) / 180;

  const newLat = esp32Location.latitude + (distanceInDegrees * Math.cos(angleRad));
  const newLng = esp32Location.longitude + (distanceInDegrees * Math.sin(angleRad) /
                  Math.cos(esp32Location.latitude * Math.PI / 180));

  return {
    latitude: newLat.toFixed(6),
    longitude: newLng.toFixed(6)
  };
};
```

---

## 🔧 Configuración Actual

### Ver ubicación configurada:

```bash
grep -A 3 "esp32Location" ~/esp32-scanner/server.js
```

### Coordenadas actuales:

```javascript
latitude: -13.5226    // Cusco, Perú
longitude: -71.9674   // Cusco, Perú
```

---

## 📝 Checklist de Configuración

- [ ] Obtener coordenadas GPS reales de donde está el ESP32
- [ ] Editar `server.js` y cambiar `esp32Location`
- [ ] Reiniciar el servidor: `pm2 restart esp32-scanner`
- [ ] Verificar en el mapa: http://18.219.142.124:3000/mapa
- [ ] El marcador azul (ESP32) debe estar en la ubicación correcta
- [ ] Los dispositivos detectados aparecerán alrededor del ESP32

---

## 💡 Mejoras Futuras

### Para mayor precisión:

1. **Módulo GPS en el ESP32**
   - GPS Neo-6M o similar
   - Enviar coordenadas reales en cada scan

2. **Array de antenas direccionales**
   - Determinar dirección real de los dispositivos
   - Triangulación más precisa

3. **Machine Learning**
   - Aprender patrones de señal
   - Mejorar cálculo de distancia

4. **Múltiples ESP32**
   - Triangulación real con 3+ puntos
   - Ubicación mucho más precisa

---

## ❓ Preguntas Frecuentes

### ¿Por qué los dispositivos no aparecen en su ubicación exacta?

Porque el sistema usa aproximaciones:
- Distancia: basada en RSSI (no es 100% precisa)
- Ángulo: generado desde la MAC (no es la dirección real)

### ¿Puedo tener ubicación exacta?

No con el sistema actual. Para ubicación exacta necesitarías:
- Que cada dispositivo reporte su propia ubicación GPS (no es posible)
- O triangulación con múltiples ESP32

### ¿Cómo mejoro la precisión?

1. Configura la ubicación correcta del ESP32
2. Calibra el cálculo RSSI-distancia
3. Usa múltiples ESP32 para triangulación

### ¿El WiFi conectado afecta la ubicación?

No directamente. El WiFi del ESP32 no se usa para geolocalización actualmente.

---

## 🆘 Ayuda

Si necesitas ayuda:
1. Pásame el código del ESP32 para ver qué envía
2. Dime dónde está ubicado físicamente el ESP32 (ciudad, país)
3. Indicame si tienes módulo GPS en el ESP32

---

**Última actualización**: 2025-11-27
**Versión**: 1.0.0
