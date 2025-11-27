# Guía de Despliegue - ESP32 Scanner

Esta guía documenta cómo está desplegado actualmente el servidor ESP32 Scanner en producción.

## Información del Servidor

### Detalles del Servidor
- **IP Pública**: 18.219.142.124
- **IP Privada**: 172.31.38.33
- **Sistema Operativo**: Ubuntu 24.04 LTS
- **Node.js**: v18.19.1
- **Puerto**: 3000
- **Usuario**: ubuntu
- **Directorio**: /home/ubuntu/esp32-scanner

### URLs de Acceso
- **Interfaz Web**: http://18.219.142.124:3000
- **Mapa**: http://18.219.142.124:3000/mapa
- **API Health**: http://18.219.142.124:3000/api/health
- **API Stats**: http://18.219.142.124:3000/api/stats

## Estado del Despliegue Actual

### Gestor de Procesos
El servidor está ejecutándose con **PM2** (Process Manager 2), configurado para:
- ✅ Inicio automático al reiniciar el sistema
- ✅ Reinicio automático si el proceso falla
- ✅ Logs persistentes en archivos
- ✅ Monitoreo de memoria (reinicio si supera 500MB)

### Comando para verificar estado
```bash
pm2 status
```

## Arquitectura del Despliegue

```
┌─────────────────────────────────────────────┐
│         Internet (Puerto 3000)              │
│                                             │
│    http://18.219.142.124:3000              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      AWS Security Group                     │
│      - Permite TCP 3000                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Ubuntu 24.04 Server                    │
│      - UFW Firewall                         │
│      - PM2 Process Manager                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      PM2 (systemd service)                  │
│      - Auto-start on boot                   │
│      - Process monitoring                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Node.js Application                    │
│      - Express.js Server                    │
│      - Puerto 3000 (0.0.0.0)               │
│      - In-memory storage                    │
└─────────────────────────────────────────────┘
```

## Configuración de PM2

### Archivo: ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'esp32-scanner',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### Servicio Systemd
PM2 está registrado como servicio systemd: `pm2-ubuntu.service`

```bash
# Ver estado del servicio
systemctl status pm2-ubuntu

# Ubicación del archivo
/etc/systemd/system/pm2-ubuntu.service
```

## Logs

### Ubicación de Logs de PM2
```
/home/ubuntu/esp32-scanner/logs/
├── combined.log    # Todos los logs
├── out.log         # Solo stdout
└── err.log         # Solo stderr
```

### Comandos para ver logs
```bash
# En tiempo real con PM2
pm2 logs esp32-scanner

# Últimas 100 líneas
pm2 logs esp32-scanner --lines 100

# Ver archivo directamente
tail -f ~/esp32-scanner/logs/combined.log

# Ver logs del servicio systemd de PM2
journalctl -u pm2-ubuntu -f
```

## Procedimientos de Mantenimiento

### Reiniciar el Servidor

```bash
# Opción 1: Con PM2 (recomendado)
pm2 restart esp32-scanner

# Opción 2: Detener y volver a iniciar
pm2 stop esp32-scanner
pm2 start ecosystem.config.js

# Opción 3: Reiniciar servicio systemd de PM2
sudo systemctl restart pm2-ubuntu
```

### Actualizar el Código

```bash
# 1. Navegar al directorio
cd ~/esp32-scanner

# 2. Hacer backup (opcional)
cp server.js server.js.backup

# 3. Actualizar el código (git pull, editar archivos, etc.)
# ...

# 4. Reiniciar el servidor
pm2 restart esp32-scanner

# 5. Verificar que funcione
pm2 logs esp32-scanner --lines 20
curl http://localhost:3000/api/health
```

### Limpiar Logs

```bash
# Opción 1: Con PM2
pm2 flush

# Opción 2: Manualmente
rm ~/esp32-scanner/logs/*.log
pm2 restart esp32-scanner
```

### Verificar Uso de Recursos

```bash
# Monitor de PM2
pm2 monit

# Detalles del proceso
pm2 show esp32-scanner

# Uso del sistema
htop
free -h
df -h
```

## Backup y Recuperación

### Archivos Importantes a Respaldar

1. **Código del servidor**: `server.js`
2. **Configuración de PM2**: `ecosystem.config.js`
3. **Archivos HTML**: `public/index.html`, `public/mapa.html`
4. **Documentación**: `README.md`, `ESPECIFICACIONES.md`, etc.
5. **Configuración de PM2**: `~/.pm2/dump.pm2`

### Script de Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="~/backups/esp32-scanner-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Copiar archivos
cp -r ~/esp32-scanner/*.js $BACKUP_DIR/
cp -r ~/esp32-scanner/public $BACKUP_DIR/
cp -r ~/esp32-scanner/*.md $BACKUP_DIR/
cp ~/.pm2/dump.pm2 $BACKUP_DIR/

echo "Backup creado en: $BACKUP_DIR"
```

### Recuperación ante Fallos

```bash
# 1. Si PM2 no responde
sudo systemctl restart pm2-ubuntu

# 2. Si el proceso está zombie
pm2 delete esp32-scanner
pm2 start ecosystem.config.js
pm2 save

# 3. Si el servidor no arranca
# Ver logs para diagnosticar
pm2 logs esp32-scanner --err --lines 50

# 4. Reinstalar dependencias si es necesario
cd ~/esp32-scanner
rm -rf node_modules package-lock.json
npm install
pm2 restart esp32-scanner
```

## Seguridad

### Firewall (UFW)

```bash
# Ver reglas actuales
sudo ufw status

# Asegurar que el puerto 3000 esté abierto
sudo ufw allow 3000/tcp
```

### AWS Security Groups

Asegurar que el Security Group tenga:
- **Inbound Rule**: TCP, Port 3000, Source 0.0.0.0/0 (o IPs específicas)

### Recomendaciones

1. ✅ El servidor NO expone datos sensibles
2. ✅ Los datos se almacenan solo en memoria (no persisten)
3. ⚠️ Considerar agregar autenticación para API endpoints críticos
4. ⚠️ Considerar agregar rate limiting para prevenir abuso
5. ⚠️ Considerar usar HTTPS con certificado SSL/TLS

## Monitoreo

### Health Check

```bash
# Verificar que el servidor responda
curl http://18.219.142.124:3000/api/health

# Debe retornar:
# {"status":"ok","timestamp":"...","uptime":...,"memory":{...}}
```

### Verificar desde el ESP32

```bash
# Simular envío desde ESP32
curl -X POST http://18.219.142.124:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "TEST:DEVICE:001",
    "timestamp": 1234567890,
    "scanNumber": 1,
    "wifi": [],
    "ble": []
  }'
```

### Alertas Automáticas

Para configurar alertas (opcional):

```bash
# Instalar pm2-logrotate para rotación de logs
pm2 install pm2-logrotate

# Configurar rotación
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Troubleshooting Común

### Problema: El servidor no responde

```bash
# 1. Verificar que PM2 esté ejecutando
pm2 status

# 2. Verificar logs
pm2 logs esp32-scanner --err

# 3. Reiniciar
pm2 restart esp32-scanner

# 4. Verificar puerto
netstat -tulpn | grep 3000
```

### Problema: PM2 no se inicia al reiniciar

```bash
# 1. Verificar servicio
systemctl status pm2-ubuntu

# 2. Reconfigurar startup
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

### Problema: Alto uso de memoria

```bash
# Ver uso actual
pm2 monit

# Si supera 500MB, PM2 reiniciará automáticamente
# Para reiniciar manualmente:
pm2 restart esp32-scanner
```

### Problema: No se pueden ver los logs

```bash
# Verificar que exista el directorio
ls -la ~/esp32-scanner/logs/

# Crear si no existe
mkdir -p ~/esp32-scanner/logs/

# Dar permisos
chmod 755 ~/esp32-scanner/logs/

# Reiniciar
pm2 restart esp32-scanner
```

## Comandos de Referencia Rápida

```bash
# Estado
pm2 status
pm2 show esp32-scanner

# Logs
pm2 logs esp32-scanner
pm2 logs esp32-scanner --lines 100

# Reiniciar
pm2 restart esp32-scanner

# Detener
pm2 stop esp32-scanner

# Iniciar
pm2 start ecosystem.config.js

# Monitoreo
pm2 monit

# Guardar configuración
pm2 save

# Ver servicio systemd
systemctl status pm2-ubuntu

# Health check
curl http://localhost:3000/api/health
```

## Próximos Pasos (Mejoras Futuras)

1. **Base de datos persistente**: MongoDB, PostgreSQL, o SQLite
2. **HTTPS/SSL**: Certificado Let's Encrypt
3. **Nginx como reverse proxy**: Para mejor rendimiento y SSL
4. **Autenticación**: JWT o API keys
5. **Rate limiting**: Prevenir abuso de la API
6. **Backup automático**: Cron job para backups diarios
7. **Alertas**: Notificaciones si el servidor cae
8. **Dashboard de monitoreo**: Grafana + Prometheus
9. **Docker**: Containerización para deployment más fácil
10. **CI/CD**: GitHub Actions o similar para deployment automático

## Contacto y Soporte

Para más información, consultar:
- [README.md](README.md) - Documentación general
- [GUIA_PM2.md](GUIA_PM2.md) - Guía detallada de PM2
- [ESPECIFICACIONES.md](ESPECIFICACIONES.md) - Especificaciones técnicas
- [CONFIGURACION_MAPA.md](CONFIGURACION_MAPA.md) - Configuración del mapa

---

**Última actualización**: 2025-11-27
**Versión**: 1.0.0
**Servidor**: ESP32 Scanner Production
