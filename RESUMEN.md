# 📡 ESP32 Scanner - Resumen del Proyecto

## 🎯 Descripción General

Sistema completo de monitoreo en tiempo real que recibe datos de un ESP32 que escanea redes WiFi y dispositivos Bluetooth Low Energy (BLE) en su entorno, mostrando la información en una interfaz web moderna con visualización en mapa.

## 🖥️ Información del Servidor

| Parámetro | Valor |
|-----------|-------|
| **IP Pública** | 18.219.142.124 |
| **Puerto** | 3000 |
| **URL Principal** | http://18.219.142.124:3000 |
| **URL Mapa** | http://18.219.142.124:3000/mapa |
| **Sistema** | Ubuntu 24.04 LTS |
| **Node.js** | v18.19.1 |
| **Gestor de Procesos** | PM2 |

## ✅ Estado Actual

El servidor está **ejecutándose** con las siguientes características:

- ✅ **PM2 activo**: El servidor se ejecuta bajo PM2 para alta disponibilidad
- ✅ **Auto-inicio**: Configurado para iniciarse automáticamente al reiniciar el sistema
- ✅ **Logs persistentes**: Todos los logs se guardan en `/home/ubuntu/esp32-scanner/logs/`
- ✅ **Monitoreo automático**: PM2 reinicia el servidor si falla o supera 500MB de RAM
- ✅ **Firewall configurado**: Puerto 3000 abierto y accesible

## 📁 Estructura de Archivos

```
esp32-scanner/
├── 📄 server.js                    # Servidor Express principal
├── ⚙️ ecosystem.config.js          # Configuración de PM2
├── 📦 package.json                 # Dependencias del proyecto
│
├── 🌐 public/
│   ├── index.html                  # Interfaz web principal
│   └── mapa.html                   # Visualización en mapa
│
├── 📊 logs/                        # Logs de PM2
│   ├── combined.log                # Todos los logs
│   ├── out.log                     # Salida estándar
│   └── err.log                     # Errores
│
├── 📚 Documentación/
│   ├── README.md                   # Documentación principal
│   ├── GUIA_PM2.md                 # Guía de PM2
│   ├── DEPLOYMENT.md               # Guía de despliegue
│   ├── ESPECIFICACIONES.md         # Especificaciones técnicas
│   ├── CONFIGURACION_MAPA.md       # Configuración del mapa
│   └── RESUMEN.md                  # Este archivo
│
└── 🔧 Configuración/
    ├── .gitignore                  # Archivos ignorados por Git
    └── esp32-scanner.service       # Servicio systemd (alternativo)
```

## 🚀 Comandos Principales

### Gestión del Servidor

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs esp32-scanner

# Reiniciar servidor
pm2 restart esp32-scanner

# Ver monitoreo (CPU, RAM)
pm2 monit
```

### Health Checks

```bash
# Verificar que el servidor esté funcionando
curl http://18.219.142.124:3000/api/health

# Ver estadísticas
curl http://18.219.142.124:3000/api/stats
```

## 🔌 API Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/scan` | Recibe datos del ESP32 |
| GET | `/api/scans/latest` | Obtiene último escaneo |
| GET | `/api/scans` | Obtiene todos los escaneos |
| GET | `/api/stats` | Estadísticas generales |
| GET | `/api/health` | Health check |
| GET | `/api/devices/wifi` | Dispositivos WiFi únicos |
| GET | `/api/devices/ble` | Dispositivos BLE únicos |
| GET | `/api/devices/all` | Todos los dispositivos |
| GET | `/api/map-data` | Datos para el mapa |
| GET | `/` | Interfaz web principal |
| GET | `/mapa` | Visualización en mapa |

## 📊 Características del Sistema

### Backend (server.js)
- ✅ Servidor Express.js en puerto 3000
- ✅ Almacenamiento en memoria (últimos 100 escaneos)
- ✅ Tracking de dispositivos únicos (WiFi y BLE)
- ✅ Cálculo automático de distancias basado en RSSI
- ✅ Estadísticas en tiempo real
- ✅ Geolocalización basada en distancia y ángulo
- ✅ Historial de RSSI (últimas 50 mediciones por dispositivo)
- ✅ CORS habilitado para acceso desde cualquier origen

### Frontend (index.html)
- ✅ Interfaz web moderna y responsive
- ✅ Auto-refresh cada 5 segundos
- ✅ Tarjetas de estadísticas
- ✅ Visualización de redes WiFi
- ✅ Visualización de dispositivos BLE
- ✅ Indicadores de calidad de señal
- ✅ Mostrar distancia aproximada
- ✅ Diseño mobile-friendly

### Mapa (mapa.html)
- ✅ Visualización en mapa interactivo (Leaflet.js)
- ✅ Marcador de ubicación del ESP32
- ✅ Marcadores de dispositivos WiFi (azul)
- ✅ Marcadores de dispositivos BLE (verde)
- ✅ Popups con información detallada
- ✅ Auto-refresh cada 5 segundos

## 🔧 Configuración del ESP32

Para enviar datos al servidor, configurar en el código del ESP32:

```cpp
const char* serverUrl = "http://18.219.142.124:3000/api/scan";
```

### Formato de datos esperado:

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

## 📖 Documentación Disponible

| Archivo | Descripción |
|---------|-------------|
| [README.md](README.md) | Documentación completa del proyecto |
| [GUIA_PM2.md](GUIA_PM2.md) | Guía detallada de comandos PM2 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guía de despliegue y mantenimiento |
| [ESPECIFICACIONES.md](ESPECIFICACIONES.md) | Especificaciones técnicas completas |
| [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md) | Configuración del mapa interactivo |
| [RESUMEN.md](RESUMEN.md) | Este documento (resumen ejecutivo) |

## 🔍 Verificación Rápida

Para verificar que todo esté funcionando correctamente:

```bash
# 1. Verificar PM2
pm2 status

# 2. Verificar logs
pm2 logs esp32-scanner --lines 20

# 3. Verificar API
curl http://localhost:3000/api/health

# 4. Verificar servicio systemd de PM2
systemctl status pm2-ubuntu
```

## 📈 Datos Almacenados

El servidor almacena en memoria:

- **Últimos 100 escaneos** completos
- **Dispositivos WiFi únicos** (por BSSID)
- **Dispositivos BLE únicos** (por address)
- **Historial de RSSI** (últimas 50 mediciones por dispositivo)
- **Estadísticas de detección** (primera vez visto, última vez visto, conteo)

⚠️ **Nota**: Los datos NO persisten al reiniciar el servidor (se almacenan solo en RAM)

## 🎨 Interfaz Web

### Página Principal (/)
- Dashboard con tarjetas de estadísticas
- Lista de redes WiFi detectadas con:
  - SSID y BSSID
  - Calidad de señal (Excelente/Buena/Regular/Débil)
  - Distancia aproximada
  - Canal y tipo de encriptación
- Lista de dispositivos BLE detectados con:
  - Nombre y dirección MAC
  - Calidad de señal
  - Distancia aproximada
  - Tipo de dispositivo

### Mapa Interactivo (/mapa)
- Mapa centrado en la ubicación del ESP32
- Marcadores para cada dispositivo detectado
- Información detallada en popups
- Auto-refresh automático

## 🔐 Seguridad

- ✅ Puerto 3000 configurado en AWS Security Groups
- ✅ Firewall UFW con puerto 3000 permitido
- ✅ No se exponen datos sensibles
- ✅ CORS habilitado (considerar restringir en producción)
- ⚠️ Sin autenticación (considerar agregar para APIs sensibles)
- ⚠️ Sin rate limiting (considerar agregar para prevenir abuso)

## 🚨 Solución de Problemas

### El servidor no responde
```bash
pm2 restart esp32-scanner
```

### Ver errores recientes
```bash
pm2 logs esp32-scanner --err --lines 50
```

### Verificar uso de recursos
```bash
pm2 monit
```

### Reiniciar todo el sistema PM2
```bash
sudo systemctl restart pm2-ubuntu
```

## 📞 Acceso Rápido

- **Interfaz Web**: http://18.219.142.124:3000
- **Mapa**: http://18.219.142.124:3000/mapa
- **Health Check**: http://18.219.142.124:3000/api/health
- **Stats**: http://18.219.142.124:3000/api/stats

## 💡 Próximas Mejoras Sugeridas

1. **Persistencia de datos**: Agregar base de datos (MongoDB/PostgreSQL)
2. **HTTPS**: Implementar SSL/TLS con Let's Encrypt
3. **Autenticación**: JWT o API keys
4. **Rate Limiting**: Prevenir abuso
5. **Nginx**: Reverse proxy para mejor rendimiento
6. **Backup automático**: Cron job para backups
7. **Alertas**: Notificaciones si el servidor cae
8. **Dashboard avanzado**: Grafana + Prometheus

---

## 👥 Desarrolladores

- **Axel Aranibar Rojas** - Código: 220547
- **Edmil Jampier Saire Bustamante** - Código: 174449

---

**Proyecto**: ESP32 Scanner Server
**Versión**: 1.0.0
**Estado**: ✅ Producción
**Última actualización**: 2025-11-27
