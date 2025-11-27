# 📚 Índice de Documentación - ESP32 Scanner

Esta es la guía maestra de toda la documentación disponible del proyecto ESP32 Scanner.

## 🎯 Inicio Rápido

Si es tu primera vez con el proyecto, lee en este orden:

1. **[RESUMEN.md](RESUMEN.md)** - Vista general del proyecto (⏱️ 3 min)
2. **[README.md](README.md)** - Documentación completa (⏱️ 10 min)
3. **[GUIA_PM2.md](GUIA_PM2.md)** - Gestión del servidor (⏱️ 5 min)

## 📖 Documentación Completa

### 📋 Documentos Principales

| Archivo | Descripción | Para quién | Tamaño |
|---------|-------------|------------|--------|
| **[RESUMEN.md](RESUMEN.md)** | Resumen ejecutivo del proyecto | Todos | ⭐ Esencial |
| **[README.md](README.md)** | Documentación principal completa | Desarrolladores | ⭐ Esencial |
| **[GUIA_PM2.md](GUIA_PM2.md)** | Guía completa de comandos PM2 | Administradores | ⭐ Importante |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Guía de despliegue y mantenimiento | DevOps/Admins | ⭐ Importante |
| **[ESPECIFICACIONES.md](ESPECIFICACIONES.md)** | Especificaciones técnicas detalladas | Desarrolladores | Referencia |
| **[CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)** | Configuración del mapa interactivo | Desarrolladores | Referencia |
| **[INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md)** | Este archivo (índice maestro) | Todos | Navegación |

---

## 📑 Guía por Caso de Uso

### 🚀 "Quiero ejecutar el servidor"

1. Lee: [README.md](README.md) - Sección "Instalación"
2. Ejecuta:
   ```bash
   cd ~/esp32-scanner
   npm install
   pm2 start ecosystem.config.js
   pm2 save
   ```
3. Verifica: http://18.219.142.124:3000

**Documentos relevantes:**
- [README.md](README.md#instalación)
- [GUIA_PM2.md](GUIA_PM2.md#comandos-esenciales)

---

### 🔧 "Necesito gestionar el servidor"

1. Lee: [GUIA_PM2.md](GUIA_PM2.md)
2. Comandos más usados:
   ```bash
   pm2 status              # Ver estado
   pm2 logs esp32-scanner  # Ver logs
   pm2 restart esp32-scanner  # Reiniciar
   ```

**Documentos relevantes:**
- [GUIA_PM2.md](GUIA_PM2.md)
- [DEPLOYMENT.md](DEPLOYMENT.md#procedimientos-de-mantenimiento)

---

### 🐛 "Tengo un problema"

1. Lee: [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting-común)
2. Verifica estado:
   ```bash
   pm2 status
   pm2 logs esp32-scanner --err --lines 50
   curl http://localhost:3000/api/health
   ```

**Documentos relevantes:**
- [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting-común)
- [README.md](README.md#solución-de-problemas)

---

### 🔌 "Quiero integrar un ESP32"

1. Lee: [README.md](README.md#configuración-del-esp32)
2. Lee: [ESPECIFICACIONES.md](ESPECIFICACIONES.md#formato-de-datos)
3. Configura la URL en tu ESP32:
   ```cpp
   const char* serverUrl = "http://18.219.142.124:3000/api/scan";
   ```
4. Envía datos en formato JSON (ver [ESPECIFICACIONES.md](ESPECIFICACIONES.md))

**Documentos relevantes:**
- [README.md](README.md#api-endpoints)
- [ESPECIFICACIONES.md](ESPECIFICACIONES.md)
- [RESUMEN.md](RESUMEN.md#configuración-del-esp32)

---

### 🗺️ "Quiero configurar el mapa"

1. Lee: [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)
2. Modifica coordenadas del ESP32 en `server.js`:
   ```javascript
   let esp32Location = {
     latitude: -13.5226,
     longitude: -71.9674,
     name: 'ESP32 Scanner'
   };
   ```
3. Reinicia: `pm2 restart esp32-scanner`

**Documentos relevantes:**
- [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)
- [README.md](README.md#interfaz-web)

---

### 📊 "Quiero entender la API"

1. Lee: [README.md](README.md#api-endpoints)
2. Lee: [ESPECIFICACIONES.md](ESPECIFICACIONES.md#api-endpoints)
3. Prueba los endpoints:
   ```bash
   curl http://18.219.142.124:3000/api/health
   curl http://18.219.142.124:3000/api/stats
   ```

**Documentos relevantes:**
- [README.md](README.md#api-endpoints)
- [ESPECIFICACIONES.md](ESPECIFICACIONES.md)
- [RESUMEN.md](RESUMEN.md#api-endpoints-principales)

---

### 🛠️ "Necesito hacer mantenimiento"

1. Lee: [DEPLOYMENT.md](DEPLOYMENT.md#procedimientos-de-mantenimiento)
2. Operaciones comunes:
   ```bash
   # Reiniciar servidor
   pm2 restart esp32-scanner

   # Ver uso de recursos
   pm2 monit

   # Limpiar logs
   pm2 flush

   # Backup
   cp server.js server.js.backup
   ```

**Documentos relevantes:**
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [GUIA_PM2.md](GUIA_PM2.md)

---

### 🎨 "Quiero modificar la interfaz"

1. Archivos a editar:
   - `public/index.html` - Interfaz principal
   - `public/mapa.html` - Mapa interactivo
2. Después de editar:
   ```bash
   # No necesitas reiniciar PM2 para cambios en archivos HTML
   # Solo refresca el navegador
   ```

**Documentos relevantes:**
- [README.md](README.md#interfaz-web)
- [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)

---

## 📂 Estructura de Documentación

```
Documentación/
│
├── 🎯 General
│   ├── RESUMEN.md                    # Vista rápida del proyecto
│   ├── README.md                     # Documentación completa
│   └── INDICE_DOCUMENTACION.md       # Este archivo
│
├── 🔧 Administración
│   ├── GUIA_PM2.md                   # Gestión con PM2
│   └── DEPLOYMENT.md                 # Despliegue y mantenimiento
│
└── 💻 Desarrollo
    ├── ESPECIFICACIONES.md           # Especificaciones técnicas
    └── CONFIGURACION_MAPA.md         # Configuración del mapa
```

## 🔍 Buscar por Tema

### Instalación y Configuración
- [README.md#instalación](README.md#instalación)
- [DEPLOYMENT.md#arquitectura-del-despliegue](DEPLOYMENT.md#arquitectura-del-despliegue)

### API y Endpoints
- [README.md#api-endpoints](README.md#api-endpoints)
- [ESPECIFICACIONES.md#api-endpoints](ESPECIFICACIONES.md#api-endpoints)
- [RESUMEN.md#api-endpoints-principales](RESUMEN.md#api-endpoints-principales)

### PM2 y Gestión de Procesos
- [GUIA_PM2.md](GUIA_PM2.md)
- [DEPLOYMENT.md#configuración-de-pm2](DEPLOYMENT.md#configuración-de-pm2)

### Logs y Monitoreo
- [GUIA_PM2.md#logs](GUIA_PM2.md#logs)
- [DEPLOYMENT.md#logs](DEPLOYMENT.md#logs)
- [README.md#logs](README.md#logs)

### Troubleshooting
- [DEPLOYMENT.md#troubleshooting-común](DEPLOYMENT.md#troubleshooting-común)
- [README.md#solución-de-problemas](README.md#solución-de-problemas)
- [GUIA_PM2.md#troubleshooting](GUIA_PM2.md#troubleshooting)

### ESP32 Configuration
- [README.md#configuración-del-esp32](README.md#configuración-del-esp32)
- [ESPECIFICACIONES.md#formato-de-datos](ESPECIFICACIONES.md#formato-de-datos)
- [RESUMEN.md#configuración-del-esp32](RESUMEN.md#configuración-del-esp32)

### Mapa Interactivo
- [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)
- [README.md#interfaz-web](README.md#interfaz-web)

### Seguridad
- [DEPLOYMENT.md#seguridad](DEPLOYMENT.md#seguridad)
- [README.md#firewall](README.md#firewall)

## 🎓 Niveles de Experiencia

### Principiante
👉 Empieza aquí:
1. [RESUMEN.md](RESUMEN.md)
2. [README.md](README.md) - Secciones básicas
3. [GUIA_PM2.md](GUIA_PM2.md) - Comandos esenciales

### Intermedio
👉 Continúa con:
1. [DEPLOYMENT.md](DEPLOYMENT.md)
2. [ESPECIFICACIONES.md](ESPECIFICACIONES.md)
3. [GUIA_PM2.md](GUIA_PM2.md) - Todo el documento

### Avanzado
👉 Profundiza en:
1. [ESPECIFICACIONES.md](ESPECIFICACIONES.md)
2. [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)
3. [DEPLOYMENT.md](DEPLOYMENT.md) - Secciones avanzadas

## 📞 Acceso Rápido

| Recurso | URL |
|---------|-----|
| **Interfaz Web** | http://18.219.142.124:3000 |
| **Mapa** | http://18.219.142.124:3000/mapa |
| **Health Check** | http://18.219.142.124:3000/api/health |
| **Stats** | http://18.219.142.124:3000/api/stats |

## 🔗 Referencias Externas

- [Documentación de PM2](https://pm2.keymetrics.io/)
- [Express.js Documentation](https://expressjs.com/)
- [Leaflet.js (Mapas)](https://leafletjs.com/)
- [Node.js Documentation](https://nodejs.org/)

## 💡 Consejos

- ⭐ **Comienza siempre por el [RESUMEN.md](RESUMEN.md)** si no conoces el proyecto
- 📌 **Marca esta página** para acceso rápido a toda la documentación
- 🔍 **Usa Ctrl+F** para buscar términos específicos en cada documento
- 📱 **Todos los documentos son mobile-friendly**

## ✅ Checklist de Documentos

Marca los documentos que ya has leído:

- [ ] [RESUMEN.md](RESUMEN.md)
- [ ] [README.md](README.md)
- [ ] [GUIA_PM2.md](GUIA_PM2.md)
- [ ] [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] [ESPECIFICACIONES.md](ESPECIFICACIONES.md)
- [ ] [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md)
- [x] [INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md) ← Estás aquí

---

**Última actualización**: 2025-11-27
**Versión del proyecto**: 1.0.0
**Total de documentos**: 7

