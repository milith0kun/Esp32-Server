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
├── package.json              # Dependencias del proyecto
├── package-lock.json         # Lock de dependencias
├── server.js                 # Servidor Express principal
├── ecosystem.config.js       # Configuración de PM2
├── esp32-scanner.service     # Archivo de servicio systemd (alternativo)
├── public/                   # Archivos estáticos
│   ├── index.html           # Interfaz web principal
│   └── mapa.html            # Visualización de mapa
├── logs/                     # Logs de PM2
│   ├── combined.log         # Logs combinados
│   ├── out.log              # Logs de salida estándar
│   └── err.log              # Logs de error
├── README.md                 # Documentación principal
├── ESPECIFICACIONES.md       # Especificaciones técnicas
├── CONFIGURACION_MAPA.md     # Configuración del mapa
└── .gitignore               # Archivos ignorados por Git
```

## Instalación

### 1. Instalar dependencias

```bash
cd ~/esp32-scanner
npm install
```

### 2. Instalar PM2 (recomendado para producción)

```bash
sudo npm install -g pm2
```

### 3. Iniciar el servidor

#### Con PM2 (recomendado)

```bash
# Iniciar el servidor
pm2 start ecosystem.config.js

# Guardar la configuración
pm2 save

# Configurar PM2 para inicio automático al reiniciar el sistema
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

El servidor estará disponible en:
- Local: http://localhost:3000
- Público: http://18.219.142.124:3000

#### Manualmente (solo para desarrollo)

```bash
npm start
```

O directamente con Node:

```bash
node server.js
```

## Gestión del Servidor con PM2

PM2 es un gestor de procesos para aplicaciones Node.js que mantiene el servidor ejecutándose 24/7.

### Comandos básicos de PM2

```bash
# Ver estado de todos los procesos
pm2 status

# Ver estado detallado
pm2 show esp32-scanner

# Ver logs en tiempo real
pm2 logs esp32-scanner

# Ver logs (últimas 100 líneas)
pm2 logs esp32-scanner --lines 100

# Reiniciar el servidor
pm2 restart esp32-scanner

# Detener el servidor
pm2 stop esp32-scanner

# Iniciar el servidor
pm2 start ecosystem.config.js

# Eliminar el proceso de PM2
pm2 delete esp32-scanner

# Ver monitoreo en tiempo real (CPU, memoria)
pm2 monit
```

### Ubicación de logs

Los logs se guardan en:
- Logs combinados: `./logs/combined.log`
- Logs de salida: `./logs/out.log`
- Logs de errores: `./logs/err.log`

```bash
# Ver logs del archivo directamente
tail -f logs/combined.log
```

### Auto-inicio con el sistema

PM2 está configurado para iniciarse automáticamente cuando se reinicia el servidor.

```bash
# Verificar que el auto-inicio esté configurado
systemctl status pm2-ubuntu

# Si necesitas reconfigurarlo
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

## Configuración Alternativa: Systemd

Si prefieres usar systemd en lugar de PM2:

### 1. Detener PM2 primero

```bash
pm2 stop esp32-scanner
pm2 delete esp32-scanner
```

### 2. Crear archivo de servicio

```bash
sudo nano /etc/systemd/system/esp32-scanner.service
```

### 3. Agregar el siguiente contenido:

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

### 4. Habilitar y iniciar el servicio

```bash
sudo systemctl daemon-reload
sudo systemctl enable esp32-scanner
sudo systemctl start esp32-scanner
sudo systemctl status esp32-scanner
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

## Desarrolladores

Este proyecto fue desarrollado por:

- **Axel Aranibar Rojas** - Código: 220547
- **Edmil Jampier Saire Bustamante** - Código: 174449

## Contacto

ESP32 Scanner Project - 2025
