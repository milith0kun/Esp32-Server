#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <ArduinoJson.h>

// ========================================
// CONFIGURACIÓN - MODIFICAR ESTOS VALORES
// ========================================

// Credenciales WiFi
const char* ssid = "jrdev";
const char* password = "123456ed";

// URL del servidor AWS EC2
const char* serverUrl = "http://18.219.142.124:3000/api/scan";

// UBICACIÓN DEL ESP32 (COORDENADAS GPS)
// Puedes obtenerlas desde Google Maps: clic derecho -> copiar coordenadas
const float ESP32_LATITUDE = -13.5226;   // Ejemplo: Cusco, Perú
const float ESP32_LONGITUDE = -71.9674;  // Cambiar por tu ubicación real

// Nombre/descripción de este ESP32
const char* ESP32_LOCATION_NAME = "ESP32 - Oficina Principal";

// Intervalo de escaneo en milisegundos
const unsigned long SCAN_INTERVAL = 10000;

// ========================================
// CONSTANTES PARA CÁLCULO DE DISTANCIA
// ========================================

const float RSSI_1M = -59.0;
const float PATH_LOSS_EXPONENT = 2.5;

// ========================================
// VARIABLES GLOBALES
// ========================================

String deviceId = "";
BLEScan* pBLEScan;
unsigned long lastScan = 0;
int scanCount = 0;

// ========================================
// CALLBACK PARA DISPOSITIVOS BLE
// ========================================

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {}
};

// ========================================
// FUNCIÓN: CALCULAR DISTANCIA
// ========================================

float calcularDistancia(int rssi) {
  if (rssi >= 0) {
    return -1.0;
  }
  
  float distancia = pow(10.0, (RSSI_1M - rssi) / (10.0 * PATH_LOSS_EXPONENT));
  
  if (distancia > 100.0) {
    distancia = 100.0;
  }
  
  return round(distancia * 100.0) / 100.0;
}

// ========================================
// FUNCIÓN: CALCULAR COORDENADAS APROXIMADAS
// ========================================

void calcularCoordenadas(float distancia, float* lat, float* lon) {
  // Aproximación simple: 1 grado ≈ 111 km
  // Distribución aleatoria en círculo alrededor del ESP32
  
  float angle = random(0, 360) * (PI / 180.0);
  float distKm = distancia / 1000.0;
  
  *lat = ESP32_LATITUDE + (distKm / 111.0) * cos(angle);
  *lon = ESP32_LONGITUDE + (distKm / (111.0 * cos(ESP32_LATITUDE * PI / 180.0))) * sin(angle);
}

// ========================================
// FUNCIÓN: CLASIFICAR TIPO DE DISPOSITIVO
// ========================================

String obtenerTipoDispositivo(String nombre) {
  nombre.toLowerCase();
  
  if (nombre.indexOf("phone") >= 0 || nombre.indexOf("galaxy") >= 0 || 
      nombre.indexOf("xiaomi") >= 0 || nombre.indexOf("redmi") >= 0 ||
      nombre.indexOf("iphone") >= 0 || nombre.indexOf("android") >= 0) {
    return "Celular";
  }
  else if (nombre.indexOf("watch") >= 0 || nombre.indexOf("band") >= 0) {
    return "Reloj";
  }
  else if (nombre.indexOf("buds") >= 0 || nombre.indexOf("airpods") >= 0 ||
           nombre.indexOf("speaker") >= 0) {
    return "Audio";
  }
  else if (nombre.indexOf("tv") >= 0 || nombre.indexOf("chromecast") >= 0) {
    return "TV";
  }
  else if (nombre.indexOf("laptop") >= 0 || nombre.indexOf("pc") >= 0) {
    return "Computadora";
  }
  
  return "Generico";
}

// ========================================
// FUNCIÓN: ENVIAR DATOS AL SERVIDOR
// ========================================

void enviarDatosAlServidor() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ ERROR: WiFi desconectado");
    return;
  }

  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.printf("║   ESCANEO #%-3d                        ║\n", scanCount + 1);
  Serial.println("╚════════════════════════════════════════╝");

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);

  DynamicJsonDocument doc(10240); // Aumentado para coordenadas
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["scanNumber"] = ++scanCount;
  
  // AGREGAR UBICACIÓN DEL ESP32
  JsonObject location = doc.createNestedObject("esp32Location");
  location["latitude"] = ESP32_LATITUDE;
  location["longitude"] = ESP32_LONGITUDE;
  location["name"] = ESP32_LOCATION_NAME;
  
  // ========================================
  // ESCANEO DE REDES WIFI CON UBICACIÓN
  // ========================================
  
  Serial.println("\n📡 [WiFi] Escaneando redes...");
  int numRedes = WiFi.scanNetworks();
  JsonArray redesWifi = doc.createNestedArray("wifi");
  
  Serial.printf("✅ [WiFi] Redes encontradas: %d\n", numRedes);
  
  for (int i = 0; i < numRedes && i < 30; i++) {
    JsonObject red = redesWifi.createNestedObject();
    
    String ssidNombre = WiFi.SSID(i);
    if (ssidNombre.length() == 0) {
      ssidNombre = "(Oculta)";
    }
    
    int rssi = WiFi.RSSI(i);
    float distancia = calcularDistancia(rssi);
    String bssid = WiFi.BSSIDstr(i);
    
    // Calcular coordenadas aproximadas
    float lat, lon;
    calcularCoordenadas(distancia, &lat, &lon);
    
    red["ssid"] = ssidNombre;
    red["bssid"] = bssid;
    red["rssi"] = rssi;
    red["channel"] = WiFi.channel(i);
    red["distance"] = String(distancia, 2);
    red["encryption"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Abierta" : "Segura";
    red["latitude"] = String(lat, 6);
    red["longitude"] = String(lon, 6);
    
    Serial.printf("  %2d. %-20s | %4d dBm | %.2fm | %.6f,%.6f\n", 
                  i+1, ssidNombre.c_str(), rssi, distancia, lat, lon);
  }
  
  WiFi.scanDelete();
  
  // ========================================
  // ESCANEO DE DISPOSITIVOS BLE CON UBICACIÓN
  // ========================================
  
  Serial.println("\n🔵 [BLE] Escaneando dispositivos (5 segundos)...");
  BLEScanResults* foundDevices = pBLEScan->start(5, false);
  int numDispositivos = foundDevices->getCount();
  
  JsonArray dispositivosBLE = doc.createNestedArray("ble");
  
  Serial.printf("✅ [BLE] Dispositivos encontrados: %d\n", numDispositivos);
  
  for (int i = 0; i < numDispositivos && i < 30; i++) {
    BLEAdvertisedDevice device = foundDevices->getDevice(i);
    
    JsonObject disp = dispositivosBLE.createNestedObject();
    
    String nombre = device.getName().c_str();
    if (nombre.length() == 0) {
      nombre = "(Desconocido)";
    }
    
    String tipo = obtenerTipoDispositivo(nombre);
    int rssi = device.getRSSI();
    float distancia = calcularDistancia(rssi);
    String address = String(device.getAddress().toString().c_str());
    
    // Calcular coordenadas aproximadas
    float lat, lon;
    calcularCoordenadas(distancia, &lat, &lon);
    
    disp["name"] = nombre;
    disp["address"] = address;
    disp["rssi"] = rssi;
    disp["type"] = tipo;
    disp["distance"] = String(distancia, 2);
    disp["latitude"] = String(lat, 6);
    disp["longitude"] = String(lon, 6);
    
    Serial.printf("  %2d. %-20s | %4d dBm | %.2fm | %.6f,%.6f\n", 
                  i+1, nombre.c_str(), rssi, distancia, lat, lon);
  }
  
  pBLEScan->clearResults();
  
  // ========================================
  // ENVIAR DATOS POR HTTP POST
  // ========================================
  
  Serial.println("\n🌐 [HTTP] Enviando datos al servidor...");
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.printf("📦 [HTTP] Tamaño: %d bytes\n", jsonString.length());
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.printf("📨 [HTTP] Respuesta: %d\n", httpResponseCode);
    
    if (httpResponseCode == 200) {
      Serial.println("✅ [OK] Datos enviados exitosamente");
    }
  } else {
    Serial.printf("❌ [ERROR] Fallo HTTP: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.printf("║   Próximo escaneo en %ds              ║\n", SCAN_INTERVAL / 1000);
  Serial.println("╚════════════════════════════════════════╝\n");
}

// ========================================
// FUNCIÓN: CONECTAR A WIFI
// ========================================

bool conectarWiFi() {
  Serial.println("\n📶 [WiFi] Conectando a: " + String(ssid));
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ [WiFi] Conectado");
    Serial.print("🌐 [WiFi] IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("\n❌ [ERROR] No se pudo conectar");
    return false;
  }
}

// ========================================
// SETUP
// ========================================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║  ESP32 SCANNER - Con Geolocalización  ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.printf("📍 Ubicación: %.6f, %.6f\n", ESP32_LATITUDE, ESP32_LONGITUDE);
  Serial.println("🗺️  Mapa: http://18.219.142.124:3000/mapa");
  Serial.println("════════════════════════════════════════\n");
  
  deviceId = WiFi.macAddress();
  Serial.println("🆔 ID: " + deviceId);
  
  Serial.println("🔵 [BLE] Inicializando...");
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);
  Serial.println("✅ [BLE] Listo");
  
  if (!conectarWiFi()) {
    Serial.println("❌ Sistema detenido");
    while(1) delay(1000);
  }
  
  Serial.println("\n🚀 Sistema listo\n");
  
  lastScan = millis() - SCAN_INTERVAL;
}

// ========================================
// LOOP
// ========================================

void loop() {
  if (millis() - lastScan >= SCAN_INTERVAL) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️  Reconectando WiFi...");
      conectarWiFi();
    }
    
    enviarDatosAlServidor();
    lastScan = millis();
  }
  
  delay(100);
}