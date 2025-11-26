# ESP32 Scanner - Sistema de Monitoreo

Sistema completo de monitoreo para ESP32 que detecta redes WiFi y dispositivos BLE en tiempo real.

## Características

- Recepción de datos desde ESP32 vía HTTP POST
- Interfaz web moderna y responsive
- Monitoreo en tiempo real con auto-refresh cada 5 segundos
- Almacenamiento en memoria de hasta 100 escaneos
- Tracking de dispositivos únicos
- Estadísticas detalladas
- Indicadores de calidad de señal
- Cálculo de distancia aproximada

## Información del Servidor

- **IP Pública**: 18.219.142.124
- **IP Privada**: 172.31.38.33
- **Puerto**: 3000
- **Sistema**: Ubuntu 24.04
- **Node.js**: 18.19.1

## Estructura del Proyecto

```
esp32-scanner/
├── package.json
├── server.js
├── public/
│   └── index.html
└── README.md
```

## Instalación

### 1. Instalar dependencias

```bash
cd ~/esp32-scanner
npm install
```

### 2. Iniciar el servidor manualmente

```bash
npm start
```

O directamente con Node:

```bash
node server.js
```

El servidor estará disponible en:
- Local: http://localhost:3000
- Público: http://18.219.142.124:3000

## Configuración como Servicio Systemd

Para que el servidor se inicie automáticamente con el sistema:

### 1. Crear archivo de servicio

```bash
sudo nano /etc/systemd/system/esp32-scanner.service
```

### 2. Agregar el siguiente contenido:

```ini
[Unit]
Description=ESP32 Scanner Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/esp32-scanner
ExecStart=/usr/bin/node /home/ubuntu/esp32-scanner/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=esp32-scanner
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 3. Habilitar y iniciar el servicio

```bash
sudo systemctl daemon-reload
sudo systemctl enable esp32-scanner
sudo systemctl start esp32-scanner
```

### 4. Verificar estado del servicio

```bash
sudo systemctl status esp32-scanner
```

### 5. Otros comandos útiles

```bash
# Detener el servicio
sudo systemctl stop esp32-scanner

# Reiniciar el servicio
sudo systemctl restart esp32-scanner

# Ver logs del servicio
sudo journalctl -u esp32-scanner -f

# Ver logs recientes
sudo journalctl -u esp32-scanner -n 100
```

## API Endpoints

### POST /api/scan
Recibe datos de escaneo desde el ESP32.

**Request Body:**
```json
{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "timestamp": 1234567890,
  "scanNumber": 1,
  "wifi": [
    {
      "ssid": "Mi Red WiFi",
      "bssid": "11:22:33:44:55:66",
      "rssi": -50,
      "channel": 6,
      "distance": "2.5",
      "encryption": "Segura"
    }
  ],
  "ble": [
    {
      "name": "Dispositivo BLE",
      "address": "AA:BB:CC:DD:EE:FF",
      "rssi": -60,
      "type": "Celular",
      "distance": "3.2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Escaneo recibido correctamente",
  "scanId": 1,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### GET /api/scans/latest
Obtiene el último escaneo recibido.

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "timestamp": 1234567890,
    "scanNumber": 1,
    "wifi": [...],
    "ble": [...],
    "receivedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### GET /api/scans
Obtiene todos los escaneos (con paginación opcional).

**Query Parameters:**
- `limit`: Número de escaneos a retornar (default: todos)
- `offset`: Posición inicial (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

### GET /api/stats
Obtiene estadísticas generales.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalScans": 50,
    "totalDevices": 120,
    "totalWiFi": 75,
    "totalBLE": 45,
    "uniqueDevices": 3,
    "avgWiFiPerScan": "1.50",
    "avgBLEPerScan": "0.90",
    "lastUpdate": "2025-01-15T10:30:00.000Z"
  }
}
```

### GET /api/health
Health check del servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123456.78,
  "memory": {
    "rss": 12345678,
    "heapTotal": 8765432,
    "heapUsed": 6543210,
    "external": 123456
  }
}
```

## Configuración del ESP32

Para enviar datos al servidor desde tu ESP32, configura la URL:

```cpp
const char* serverUrl = "http://18.219.142.124:3000/api/scan";
```

## Interfaz Web

Accede a la interfaz web en: http://18.219.142.124:3000

### Características de la interfaz:

- **Tarjetas de estadísticas**: Total de dispositivos, WiFi, BLE y escaneos
- **Dos columnas**: Una para redes WiFi y otra para dispositivos BLE
- **Auto-refresh**: Actualización automática cada 5 segundos
- **Botón de actualización manual**: Actualizar datos bajo demanda
- **Indicadores de señal**:
  - Excelente (≥ -50 dBm)
  - Buena (≥ -60 dBm)
  - Regular (≥ -70 dBm)
  - Débil (< -70 dBm)
- **Distancia calculada**: Mostrada en metros
- **Diseño responsive**: Funciona en móviles y desktop

## Logs

### Ver logs en tiempo real (si se ejecuta como servicio)

```bash
sudo journalctl -u esp32-scanner -f
```

### Ver logs del día actual

```bash
sudo journalctl -u esp32-scanner --since today
```

### Ver logs con errores solamente

```bash
sudo journalctl -u esp32-scanner -p err
```

### Si se ejecuta manualmente

Los logs se mostrarán directamente en la consola con timestamps:

```
[2025-01-15T10:30:00.000Z] =================================
[2025-01-15T10:30:00.000Z] ESP32 Scanner Server INICIADO
[2025-01-15T10:30:00.000Z] Puerto: 3000
[2025-01-15T10:30:00.000Z] URL Local: http://localhost:3000
[2025-01-15T10:30:00.000Z] URL Pública: http://18.219.142.124:3000
[2025-01-15T10:30:00.000Z] =================================
[2025-01-15T10:30:15.123Z] Escaneo recibido - Device: AA:BB:CC:DD:EE:FF | Scan #1 | WiFi: 5 | BLE: 3
```

## Firewall

Asegúrate de que el puerto 3000 esté abierto en el firewall:

```bash
# Para UFW (Ubuntu Firewall)
sudo ufw allow 3000/tcp

# Para AWS Security Groups
# Agregar regla de entrada:
# Type: Custom TCP
# Port: 3000
# Source: 0.0.0.0/0 (o tu IP específica)
```

## Solución de Problemas

### El servidor no inicia

```bash
# Verificar que Node.js esté instalado
node --version

# Verificar que las dependencias estén instaladas
npm list

# Reinstalar dependencias
npm install
```

### No puedo acceder desde internet

```bash
# Verificar que el servidor está escuchando en 0.0.0.0
netstat -tulpn | grep 3000

# Verificar reglas de firewall
sudo ufw status

# Verificar Security Groups en AWS
```

### El ESP32 no puede enviar datos

1. Verifica que el ESP32 tenga acceso a internet
2. Verifica que la URL sea correcta: http://18.219.142.124:3000/api/scan
3. Verifica que el formato JSON sea correcto
4. Revisa los logs del servidor para ver si llegan las peticiones

## Desarrollo

### Modo desarrollo con auto-restart

```bash
npm install -g nodemon
npm run dev
```

### Testing de endpoints

```bash
# Health check
curl http://18.219.142.124:3000/api/health

# Enviar escaneo de prueba
curl -X POST http://18.219.142.124:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "TEST:DEVICE:001",
    "timestamp": 1234567890,
    "scanNumber": 1,
    "wifi": [
      {
        "ssid": "Test WiFi",
        "bssid": "AA:BB:CC:DD:EE:FF",
        "rssi": -50,
        "channel": 6,
        "distance": "2.5",
        "encryption": "Segura"
      }
    ],
    "ble": []
  }'

# Ver último escaneo
curl http://18.219.142.124:3000/api/scans/latest

# Ver estadísticas
curl http://18.219.142.124:3000/api/stats
```

## Licencia

MIT

## Autor

ESP32 Scanner Project
