const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const MAX_SCANS = 100;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Almacenamiento en memoria
let scans = [];
let deviceTracker = new Map();
let wifiDevices = new Map();  // Tracking de redes WiFi únicas por BSSID
let bleDevices = new Map();   // Tracking de dispositivos BLE únicos por address

// Ubicación del ESP32 (coordenadas por defecto - Cusco, Perú)
// CAMBIAR ESTAS COORDENADAS A LA UBICACIÓN REAL DEL ESP32
let esp32Location = {
  latitude: -13.5226,
  longitude: -71.9674,
  name: 'ESP32 Scanner'
};

// Utilidades
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const logWithTimestamp = (message) => {
  console.log(`[${getTimestamp()}] ${message}`);
};

// Calcular coordenadas geográficas basadas en distancia y ángulo
const calculateGeoLocation = (distance, angle) => {
  // Convertir distancia de metros a grados (aproximado)
  // 1 grado de latitud = ~111 km = 111,000 metros
  const distanceInDegrees = parseFloat(distance) / 111000;

  // Convertir ángulo a radianes
  const angleRad = (angle * Math.PI) / 180;

  // Calcular nuevas coordenadas
  const newLat = esp32Location.latitude + (distanceInDegrees * Math.cos(angleRad));
  const newLng = esp32Location.longitude + (distanceInDegrees * Math.sin(angleRad) / Math.cos(esp32Location.latitude * Math.PI / 180));

  return {
    latitude: newLat.toFixed(6),
    longitude: newLng.toFixed(6)
  };
};

// Generar ángulo basado en MAC address para consistencia
const getAngleFromMac = (macAddress) => {
  // Usar el hash del MAC para generar un ángulo consistente (0-360)
  let hash = 0;
  for (let i = 0; i < macAddress.length; i++) {
    hash = ((hash << 5) - hash) + macAddress.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 360;
};

// Calcular estadísticas
// Actualizar tracking de dispositivos WiFi y BLE
const updateDeviceTracking = (scanData) => {
  const now = getTimestamp();

  // Trackear redes WiFi por BSSID
  if (scanData.wifi && Array.isArray(scanData.wifi)) {
    scanData.wifi.forEach(wifi => {
      const bssid = wifi.bssid;
      if (!bssid) return;

      if (!wifiDevices.has(bssid)) {
        wifiDevices.set(bssid, {
          bssid: bssid,
          ssid: wifi.ssid,
          firstSeen: now,
          lastSeen: now,
          detectionCount: 1,
          rssiHistory: [{ rssi: wifi.rssi, timestamp: now, distance: wifi.distance }],
          channel: wifi.channel,
          encryption: wifi.encryption,
          maxRssi: wifi.rssi,
          minRssi: wifi.rssi,
          avgRssi: wifi.rssi
        });
      } else {
        const device = wifiDevices.get(bssid);
        device.lastSeen = now;
        device.detectionCount++;
        device.ssid = wifi.ssid || device.ssid; // Actualizar SSID si está disponible
        device.channel = wifi.channel || device.channel;
        device.encryption = wifi.encryption || device.encryption;

        // Actualizar historial de RSSI (mantener últimos 50)
        device.rssiHistory.push({ rssi: wifi.rssi, timestamp: now, distance: wifi.distance });
        if (device.rssiHistory.length > 50) {
          device.rssiHistory.shift();
        }

        // Actualizar estadísticas de RSSI
        device.maxRssi = Math.max(device.maxRssi, wifi.rssi);
        device.minRssi = Math.min(device.minRssi, wifi.rssi);
        const avgSum = device.rssiHistory.reduce((sum, item) => sum + item.rssi, 0);
        device.avgRssi = (avgSum / device.rssiHistory.length).toFixed(1);
      }
    });
  }

  // Trackear dispositivos BLE por address
  if (scanData.ble && Array.isArray(scanData.ble)) {
    scanData.ble.forEach(ble => {
      const address = ble.address;
      if (!address) return;

      if (!bleDevices.has(address)) {
        bleDevices.set(address, {
          address: address,
          name: ble.name,
          type: ble.type,
          firstSeen: now,
          lastSeen: now,
          detectionCount: 1,
          rssiHistory: [{ rssi: ble.rssi, timestamp: now, distance: ble.distance }],
          maxRssi: ble.rssi,
          minRssi: ble.rssi,
          avgRssi: ble.rssi
        });
      } else {
        const device = bleDevices.get(address);
        device.lastSeen = now;
        device.detectionCount++;
        device.name = ble.name || device.name; // Actualizar nombre si está disponible
        device.type = ble.type || device.type;

        // Actualizar historial de RSSI (mantener últimos 50)
        device.rssiHistory.push({ rssi: ble.rssi, timestamp: now, distance: ble.distance });
        if (device.rssiHistory.length > 50) {
          device.rssiHistory.shift();
        }

        // Actualizar estadísticas de RSSI
        device.maxRssi = Math.max(device.maxRssi, ble.rssi);
        device.minRssi = Math.min(device.minRssi, ble.rssi);
        const avgSum = device.rssiHistory.reduce((sum, item) => sum + item.rssi, 0);
        device.avgRssi = (avgSum / device.rssiHistory.length).toFixed(1);
      }
    });
  }
};

// Calcular estadísticas
const calculateStats = () => {
  if (scans.length === 0) {
    return {
      totalScans: 0,
      totalDevices: 0,
      totalWiFi: 0,
      totalBLE: 0,
      uniqueDevices: deviceTracker.size,
      uniqueWiFi: wifiDevices.size,
      uniqueBLE: bleDevices.size,
      avgWiFiPerScan: 0,
      avgBLEPerScan: 0,
      lastUpdate: null
    };
  }

  const totalWiFi = scans.reduce((sum, scan) => sum + (scan.wifi?.length || 0), 0);
  const totalBLE = scans.reduce((sum, scan) => sum + (scan.ble?.length || 0), 0);
  const lastScan = scans[scans.length - 1];

  return {
    totalScans: scans.length,
    totalDevices: totalWiFi + totalBLE,
    totalWiFi,
    totalBLE,
    uniqueDevices: deviceTracker.size,
    uniqueWiFi: wifiDevices.size,
    uniqueBLE: bleDevices.size,
    avgWiFiPerScan: (totalWiFi / scans.length).toFixed(2),
    avgBLEPerScan: (totalBLE / scans.length).toFixed(2),
    lastUpdate: lastScan?.receivedAt || null
  };
};

// Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: getTimestamp(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// POST /api/scan - Recibir datos del ESP32
app.post('/api/scan', (req, res) => {
  try {
    const scanData = req.body;

    // Validar datos básicos
    if (!scanData.deviceId) {
      return res.status(400).json({
        success: false,
        error: 'deviceId es requerido'
      });
    }

    // Agregar timestamp de recepción
    const enrichedScan = {
      ...scanData,
      receivedAt: getTimestamp(),
      wifi: scanData.wifi || [],
      ble: scanData.ble || []
    };

    // Agregar al almacenamiento
    scans.push(enrichedScan);

    // Limitar a MAX_SCANS escaneos
    if (scans.length > MAX_SCANS) {
      scans.shift();
    }

    // Actualizar tracking de dispositivos ESP32
    if (!deviceTracker.has(scanData.deviceId)) {
      deviceTracker.set(scanData.deviceId, {
        firstSeen: getTimestamp(),
        lastSeen: getTimestamp(),
        scanCount: 1
      });
    } else {
      const device = deviceTracker.get(scanData.deviceId);
      device.lastSeen = getTimestamp();
      device.scanCount++;
    }

    // Actualizar tracking de dispositivos WiFi y BLE detectados
    updateDeviceTracking(enrichedScan);

    // Log detallado
    logWithTimestamp(
      `Escaneo recibido - Device: ${scanData.deviceId} | ` +
      `Scan #${scanData.scanNumber || 'N/A'} | ` +
      `WiFi: ${enrichedScan.wifi.length} | ` +
      `BLE: ${enrichedScan.ble.length}`
    );

    res.json({
      success: true,
      message: 'Escaneo recibido correctamente',
      scanId: scans.length,
      timestamp: enrichedScan.receivedAt
    });

  } catch (error) {
    logWithTimestamp(`Error procesando escaneo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// GET /api/scans/latest - Obtener último escaneo
app.get('/api/scans/latest', (req, res) => {
  try {
    if (scans.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No hay escaneos disponibles'
      });
    }

    const latestScan = scans[scans.length - 1];
    res.json({
      success: true,
      data: latestScan
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo último escaneo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/scans - Obtener todos los escaneos
app.get('/api/scans', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || scans.length;
    const offset = parseInt(req.query.offset) || 0;

    const paginatedScans = scans.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedScans,
      total: scans.length,
      limit,
      offset
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo escaneos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/stats - Obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const stats = calculateStats();
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logWithTimestamp(`Error calculando estadísticas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/devices/wifi - Obtener todos los dispositivos WiFi únicos
app.get('/api/devices/wifi', (req, res) => {
  try {
    const devices = Array.from(wifiDevices.values());

    // Ordenar por última vez visto (más reciente primero)
    devices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    res.json({
      success: true,
      data: devices,
      total: devices.length
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo dispositivos WiFi: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/devices/ble - Obtener todos los dispositivos BLE únicos
app.get('/api/devices/ble', (req, res) => {
  try {
    const devices = Array.from(bleDevices.values());

    // Ordenar por última vez visto (más reciente primero)
    devices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    res.json({
      success: true,
      data: devices,
      total: devices.length
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo dispositivos BLE: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/devices/wifi/:bssid - Obtener detalles de red WiFi específica
app.get('/api/devices/wifi/:bssid', (req, res) => {
  try {
    const bssid = req.params.bssid.toUpperCase();
    const device = wifiDevices.get(bssid);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo WiFi no encontrado'
      });
    }

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo dispositivo WiFi: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/devices/ble/:address - Obtener detalles de dispositivo BLE específico
app.get('/api/devices/ble/:address', (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const device = bleDevices.get(address);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo BLE no encontrado'
      });
    }

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo dispositivo BLE: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/devices/all - Obtener todos los dispositivos (WiFi + BLE)
app.get('/api/devices/all', (req, res) => {
  try {
    const wifi = Array.from(wifiDevices.values()).map(d => ({ ...d, type: 'wifi' }));
    const ble = Array.from(bleDevices.values()).map(d => ({ ...d, type: 'ble' }));

    const allDevices = [...wifi, ...ble];

    // Ordenar por última vez visto (más reciente primero)
    allDevices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    res.json({
      success: true,
      data: allDevices,
      total: allDevices.length,
      wifi: wifi.length,
      ble: ble.length
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo todos los dispositivos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET / - Servir interfaz web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /mapa - Servir interfaz de mapa
app.get('/mapa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mapa.html'));
});

// GET /api/map-data - Obtener datos para el mapa
app.get('/api/map-data', (req, res) => {
  try {
    if (scans.length === 0) {
      return res.json({
        success: false,
        message: 'No hay datos disponibles'
      });
    }

    const latestScan = scans[scans.length - 1];

    // Agregar coordenadas geográficas a dispositivos WiFi
    const wifiWithLocation = (latestScan.wifi || []).map(wifi => {
      const angle = getAngleFromMac(wifi.bssid || '');
      const location = calculateGeoLocation(wifi.distance || 10, angle);
      return {
        ...wifi,
        latitude: location.latitude,
        longitude: location.longitude
      };
    });

    // Agregar coordenadas geográficas a dispositivos BLE
    const bleWithLocation = (latestScan.ble || []).map(ble => {
      const angle = getAngleFromMac(ble.address || '');
      const location = calculateGeoLocation(ble.distance || 10, angle);
      return {
        ...ble,
        latitude: location.latitude,
        longitude: location.longitude
      };
    });

    res.json({
      success: true,
      esp32Location: esp32Location,
      wifi: wifiWithLocation,
      ble: bleWithLocation,
      timestamp: latestScan.receivedAt
    });

  } catch (error) {
    logWithTimestamp(`Error obteniendo datos del mapa: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  logWithTimestamp(`Error no manejado: ${err.message}`);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logWithTimestamp(`=================================`);
  logWithTimestamp(`ESP32 Scanner Server INICIADO`);
  logWithTimestamp(`Puerto: ${PORT}`);
  logWithTimestamp(`URL Local: http://localhost:${PORT}`);
  logWithTimestamp(`URL Pública: http://18.219.142.124:${PORT}`);
  logWithTimestamp(`=================================`);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logWithTimestamp('SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logWithTimestamp('SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});
