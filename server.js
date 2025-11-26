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

// Utilidades
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const logWithTimestamp = (message) => {
  console.log(`[${getTimestamp()}] ${message}`);
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

    // Actualizar tracking de dispositivos
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

// GET / - Servir interfaz web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
