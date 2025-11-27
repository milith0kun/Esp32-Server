# Guía Rápida de PM2 - ESP32 Scanner

Esta es una guía de referencia rápida para gestionar el servidor ESP32 Scanner con PM2.

## Estado Actual

El servidor está ejecutándose con PM2 y configurado para iniciarse automáticamente al reiniciar el sistema.

```bash
# Ver estado actual
pm2 status
```

## Comandos Esenciales

### Gestión del Proceso

```bash
# Ver estado del servidor
pm2 status

# Ver información detallada
pm2 show esp32-scanner

# Reiniciar el servidor
pm2 restart esp32-scanner

# Detener el servidor
pm2 stop esp32-scanner

# Iniciar el servidor
pm2 start ecosystem.config.js

# Eliminar de PM2
pm2 delete esp32-scanner
```

### Logs

```bash
# Ver logs en tiempo real
pm2 logs esp32-scanner

# Ver logs sin streaming
pm2 logs esp32-scanner --nostream

# Ver últimas 100 líneas
pm2 logs esp32-scanner --lines 100

# Limpiar logs
pm2 flush

# Ver solo errores
pm2 logs esp32-scanner --err

# Ver solo salida estándar
pm2 logs esp32-scanner --out
```

### Monitoreo

```bash
# Monitor en tiempo real (CPU, memoria)
pm2 monit

# Ver métricas
pm2 describe esp32-scanner

# Información del sistema
pm2 info
```

### Configuración

```bash
# Guardar configuración actual
pm2 save

# Recargar configuración desde ecosystem.config.js
pm2 reload ecosystem.config.js

# Actualizar variables de entorno
pm2 restart esp32-scanner --update-env
```

## Ubicación de Archivos

### Logs
- **Combinados**: `/home/ubuntu/esp32-scanner/logs/combined.log`
- **Salida**: `/home/ubuntu/esp32-scanner/logs/out.log`
- **Errores**: `/home/ubuntu/esp32-scanner/logs/err.log`

```bash
# Ver logs directamente
tail -f ~/esp32-scanner/logs/combined.log
```

### Configuración PM2
- **Archivo principal**: `/home/ubuntu/esp32-scanner/ecosystem.config.js`
- **Configuración PM2**: `/home/ubuntu/.pm2/`
- **Dump de procesos**: `/home/ubuntu/.pm2/dump.pm2`

## Auto-inicio

El servidor está configurado para iniciarse automáticamente al reiniciar el sistema mediante systemd.

```bash
# Ver servicio de PM2
systemctl status pm2-ubuntu

# Deshabilitar auto-inicio
pm2 unstartup systemd

# Habilitar auto-inicio nuevamente
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

## Escenarios Comunes

### 1. Reiniciar después de cambios en el código

```bash
pm2 restart esp32-scanner
```

### 2. Ver qué está pasando en el servidor

```bash
pm2 logs esp32-scanner --lines 50
```

### 3. Verificar uso de recursos

```bash
pm2 monit
```

### 4. El servidor no responde

```bash
# Reiniciar con modo forzado
pm2 restart esp32-scanner --force

# O detener y volver a iniciar
pm2 stop esp32-scanner
pm2 start ecosystem.config.js
```

### 5. Liberar memoria

```bash
pm2 restart esp32-scanner
```

### 6. Ver errores recientes

```bash
pm2 logs esp32-scanner --err --lines 50
```

### 7. Actualizar configuración de PM2

```bash
# Editar ecosystem.config.js
nano ecosystem.config.js

# Recargar
pm2 delete esp32-scanner
pm2 start ecosystem.config.js
pm2 save
```

## Configuración Actual (ecosystem.config.js)

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

## Opciones de Configuración

### Principales parámetros en ecosystem.config.js

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `name` | esp32-scanner | Nombre del proceso en PM2 |
| `script` | ./server.js | Archivo principal a ejecutar |
| `instances` | 1 | Número de instancias (1 para app simple) |
| `autorestart` | true | Reinicio automático si el proceso falla |
| `watch` | false | No vigilar cambios en archivos (producción) |
| `max_memory_restart` | 500M | Reiniciar si usa más de 500MB de RAM |
| `time` | true | Agregar timestamps a los logs |

## Troubleshooting

### El proceso no aparece en PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

### Los logs no se ven

```bash
# Verificar que exista el directorio
ls -la ~/esp32-scanner/logs/

# Crear si no existe
mkdir -p ~/esp32-scanner/logs/

# Reiniciar
pm2 restart esp32-scanner
```

### El servidor no se inicia al reiniciar el sistema

```bash
# Verificar servicio systemd
systemctl status pm2-ubuntu

# Reconfigurar
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

### Alto uso de memoria

```bash
# Ver uso actual
pm2 monit

# Reiniciar para liberar memoria
pm2 restart esp32-scanner
```

## Comandos Útiles Adicionales

```bash
# Lista completa de procesos con detalles
pm2 list

# Información del sistema
pm2 info

# Actualizar PM2
sudo npm install -g pm2@latest

# Actualizar PM2 en memoria
pm2 update

# Reiniciar todos los procesos
pm2 restart all

# Detener todos los procesos
pm2 stop all

# Eliminar todos los procesos
pm2 delete all

# Limpiar todos los logs
pm2 flush
```

## URLs del Servidor

- **Local**: http://localhost:3000
- **Pública**: http://18.219.142.124:3000
- **Health Check**: http://18.219.142.124:3000/api/health
- **Stats**: http://18.219.142.124:3000/api/stats

## Recursos

- [Documentación oficial de PM2](https://pm2.keymetrics.io/)
- [PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
