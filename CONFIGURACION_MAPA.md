# Configuración del Mapa - ESP32 Scanner

## ✅ Funcionalidad Implementada

El servidor ahora incluye una **visualización de mapa en tiempo real** que muestra:
- 📍 Ubicación del ESP32
- 📡 Redes WiFi detectadas (marcadores azules)
- 🔵 Dispositivos BLE detectados (marcadores verdes)

---

## 🗺️ Acceso al Mapa

### URL del Mapa:
```
http://18.219.142.124:3000/mapa
```

### Desde el Dashboard:
Haz clic en el botón **"🗺️ Ver Mapa"** en la interfaz principal.

---

## 📍 Configurar Ubicación del ESP32

### IMPORTANTE: Cambiar Coordenadas

Las coordenadas actuales son **coordenadas de ejemplo (Cusco, Perú)**. Debes cambiarlas a la ubicación real de tu ESP32.

### Paso 1: Obtener tus coordenadas

**Opción A - Usando Google Maps:**
1. Abre https://www.google.com/maps
2. Haz clic derecho en tu ubicación
3. Selecciona las coordenadas que aparecen (se copian automáticamente)
4. Ejemplo: `-13.5226, -71.9674`

**Opción B - Usando GPS del celular:**
1. Instala una app de GPS (ej: GPS Status)
2. Obtén latitud y longitud de tu ubicación

### Paso 2: Editar el archivo server.js

Abre el archivo y busca estas líneas (cerca del inicio):

```javascript
// Ubicación del ESP32 (coordenadas por defecto - Cusco, Perú)
// CAMBIAR ESTAS COORDENADAS A LA UBICACIÓN REAL DEL ESP32
let esp32Location = {
  latitude: -13.5226,      // ⬅️ CAMBIAR AQUÍ
  longitude: -71.9674,     // ⬅️ CAMBIAR AQUÍ
  name: 'ESP32 Scanner'    // ⬅️ Opcional: cambiar nombre
};
```

**Ejemplo de cambio:**
```javascript
let esp32Location = {
  latitude: 40.7128,           // Nueva York
  longitude: -74.0060,
  name: 'Mi Casa - ESP32'
};
```

### Paso 3: Reiniciar el servidor

```bash
pkill -f "node server.js" && cd ~/esp32-scanner && node server.js &
```

---

## 🎯 Cómo Funciona el Mapa

### Cálculo de Posiciones

El sistema calcula la posición geográfica de cada dispositivo usando:
1. **Ubicación del ESP32:** Centro del mapa
2. **Distancia al dispositivo:** Calculada por el ESP32 usando RSSI
3. **Ángulo:** Generado de forma consistente basado en la MAC address

**Nota:** Como el ESP32 no tiene antena direccional, el ángulo es simulado pero **consistente** - el mismo dispositivo siempre aparecerá en la misma dirección relativa.

### Precisión

- ✅ La **distancia** es razonablemente precisa (basada en RSSI)
- ⚠️ La **dirección** es simulada (distribución circular alrededor del ESP32)
- 📏 Útil para ver qué dispositivos están cerca/lejos
- 🎯 No es GPS real, es una visualización aproximada

---

## 🎨 Características del Mapa

### Marcadores

| Color | Tipo | Descripción |
|-------|------|-------------|
| 🔴 Rojo | ESP32 | Ubicación de tu dispositivo |
| 🔵 Azul | WiFi | Redes WiFi detectadas |
| 🟢 Verde | BLE | Dispositivos BLE detectados |

### Controles

- **🔄 Actualizar Mapa:** Refresca los datos manualmente
- **📍 Centrar ESP32:** Centra el mapa en el ESP32
- **📡 WiFi ON/OFF:** Ocultar/mostrar redes WiFi
- **🔵 BLE ON/OFF:** Ocultar/mostrar dispositivos BLE
- **🏠 Dashboard:** Volver al panel principal

### Auto-Refresh

El mapa se actualiza automáticamente cada **10 segundos** con los datos más recientes del ESP32.

### Círculo de Cobertura

El círculo rojo alrededor del ESP32 representa un radio de **100 metros** de cobertura típica.

---

## 📊 Información en Popups

Al hacer clic en cualquier marcador, verás:

### ESP32 (Rojo)
- Nombre del dispositivo
- Latitud y longitud exactas
- Última actualización

### WiFi (Azul)
- Nombre de la red (SSID)
- Dirección MAC (BSSID)
- Potencia de señal (RSSI)
- Canal WiFi
- Distancia estimada
- Tipo de seguridad

### BLE (Verde)
- Nombre del dispositivo
- Dirección MAC
- Tipo de dispositivo (Celular, Reloj, Audio, etc.)
- Potencia de señal (RSSI)
- Distancia estimada

---

## 🔧 API del Mapa

### Endpoint Principal

```
GET http://18.219.142.124:3000/api/map-data
```

### Respuesta:

```json
{
  "success": true,
  "esp32Location": {
    "latitude": -13.5226,
    "longitude": -71.9674,
    "name": "ESP32 Scanner"
  },
  "wifi": [
    {
      "ssid": "Mi Red",
      "bssid": "AA:BB:CC:DD:EE:FF",
      "rssi": -55,
      "channel": 6,
      "distance": "3.2",
      "encryption": "Segura",
      "latitude": "-13.522628",
      "longitude": "-71.967432"
    }
  ],
  "ble": [
    {
      "name": "Galaxy S23",
      "address": "11:22:33:44:55:66",
      "rssi": -60,
      "type": "Celular",
      "distance": "4.0",
      "latitude": "-13.522645",
      "longitude": "-71.967385"
    }
  ],
  "timestamp": "2025-11-26T22:00:00.000Z"
}
```

---

## 🌍 Mapas Usados

El sistema usa **OpenStreetMap** (OSM):
- ✅ Completamente gratuito
- ✅ No requiere API key
- ✅ Disponible en todo el mundo
- ✅ Actualizado por la comunidad

---

## 🔧 Personalización Avanzada

### Cambiar Radio de Cobertura

Edita `mapa.html` línea ~237:

```javascript
L.circle([esp32Location.lat, esp32Location.lng], {
    color: '#ff4444',
    fillColor: '#ff4444',
    fillOpacity: 0.1,
    radius: 100  // ⬅️ Cambiar aquí (en metros)
}).addTo(map);
```

### Cambiar Zoom Inicial

Edita `mapa.html` línea ~176:

```javascript
map = L.map('map').setView([esp32Location.lat, esp32Location.lng], 16);
//                                                                    ⬆️
//                                                           Nivel de zoom (1-19)
```

Niveles de zoom comunes:
- **13:** Ciudad completa
- **15:** Barrio
- **16:** Varias cuadras (recomendado)
- **18:** Una cuadra
- **19:** Máximo detalle

### Cambiar Intervalo de Auto-Refresh

Edita `mapa.html` línea ~184:

```javascript
setInterval(refreshMap, 10000);  // ⬅️ Tiempo en milisegundos
```

Ejemplos:
- `5000` = 5 segundos
- `10000` = 10 segundos (actual)
- `30000` = 30 segundos

---

## 🐛 Solución de Problemas

### El mapa no carga

1. Verifica que el servidor esté corriendo:
   ```bash
   netstat -tulpn | grep 3000
   ```

2. Verifica que puedas acceder al endpoint:
   ```bash
   curl http://localhost:3000/api/map-data
   ```

3. Revisa los logs del navegador (F12 → Console)

### Los dispositivos no aparecen

1. Verifica que el ESP32 esté enviando datos
2. Chequea que haya al menos un escaneo en el sistema:
   ```bash
   curl http://localhost:3000/api/scans/latest
   ```

3. Verifica que los dispositivos tengan distancia calculada

### El mapa está en el lugar equivocado

1. Cambia las coordenadas en `server.js` como se explicó arriba
2. Reinicia el servidor
3. Refresca la página del mapa

---

## 📱 Uso en Móvil

El mapa es completamente **responsive** y funciona en:
- ✅ Celulares
- ✅ Tablets
- ✅ Desktop

En móvil, los controles se adaptan automáticamente y puedes:
- Hacer zoom con pellizco
- Arrastrar el mapa con un dedo
- Tocar los marcadores para ver información

---

## 🎯 Casos de Uso

### 1. Monitoreo de Cobertura
- Ver qué tan lejos llegan las señales
- Identificar zonas con mejor/peor cobertura

### 2. Detección de Dispositivos
- Ver dispositivos BLE cercanos
- Localizar redes WiFi en el área

### 3. Análisis de Entorno
- Mapear todas las redes disponibles
- Identificar dispositivos por ubicación aproximada

### 4. Debugging
- Verificar que el ESP32 esté detectando correctamente
- Ver distribución de dispositivos

---

## ✨ Ejemplo de Configuración Completa

### Para una casa en Madrid, España:

```javascript
// En server.js
let esp32Location = {
  latitude: 40.4168,
  longitude: -3.7038,
  name: 'Casa Madrid - Salón'
};
```

### Para una oficina en Ciudad de México:

```javascript
// En server.js
let esp32Location = {
  latitude: 19.4326,
  longitude: -99.1332,
  name: 'Oficina CDMX - Piso 3'
};
```

---

## 🔐 Seguridad

El mapa muestra datos en tiempo real de tu red. Considera:

- 🔒 Usa un firewall para limitar acceso al puerto 3000
- 🌐 Si es solo para uso local, configura el servidor para escuchar solo en localhost
- 🔑 Para producción, considera agregar autenticación

---

## 📞 Soporte

Si necesitas ayuda o quieres agregar más funciones:

1. Verifica los logs del servidor
2. Revisa la consola del navegador (F12)
3. Prueba el endpoint API directamente

---

## ✅ Checklist de Configuración

- [ ] Obtener coordenadas GPS de tu ubicación
- [ ] Editar `server.js` con las coordenadas correctas
- [ ] Reiniciar el servidor
- [ ] Acceder a http://18.219.142.124:3000/mapa
- [ ] Verificar que el ESP32 aparece en tu ubicación
- [ ] Confirmar que los dispositivos se muestran correctamente
- [ ] Ajustar zoom y radio de cobertura si es necesario

---

¡Disfruta tu mapa en tiempo real! 🎉
