/*
 * Smart Irrigation System - ESP32 Firmware
 * 
 * This firmware provides a complete IoT-based irrigation control system
 * with sensor monitoring, cloud connectivity, and automated watering control.
 * 
 * Features:
 * - Soil moisture monitoring
 * - Temperature and humidity sensing
 * - WiFi connectivity for cloud integration
 * - MQTT communication with cloud backend
 * - Automated pump/valve control
 * - Manual override capabilities
 * - Real-time data logging
 * 
 * Author: Smart Irrigation Team
 * Date: 2025
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ===== CONFIGURATION =====
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "your-mqtt-broker.com";
const int mqtt_port = 1883;
const char* mqtt_user = "your_mqtt_user";
const char* mqtt_password = "your_mqtt_password";
const char* device_id = "irrigation_system_001";

// Pin Definitions
#define SOIL_MOISTURE_PIN A0
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define TEMP_SENSOR_PIN 2
#define PUMP_RELAY_PIN 5
#define VALVE_RELAY_PIN 6
#define LED_STATUS_PIN 13
#define BUTTON_PIN 7

// Sensor Thresholds
#define SOIL_MOISTURE_THRESHOLD 30  // Percentage below which irrigation starts
#define MAX_IRRIGATION_TIME 300000  // Maximum irrigation time in milliseconds (5 minutes)

// ===== GLOBAL VARIABLES =====
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensor(&oneWire);

// System State
struct SystemState {
  float soilMoisture;
  float airTemperature;
  float airHumidity;
  float soilTemperature;
  bool pumpStatus;
  bool valveStatus;
  bool manualMode;
  unsigned long lastIrrigationTime;
  unsigned long irrigationStartTime;
  bool irrigationActive;
};

SystemState systemState = {0};

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastMqttPublish = 0;
unsigned long lastWiFiCheck = 0;
const unsigned long sensorInterval = 30000;    // Read sensors every 30 seconds
const unsigned long publishInterval = 60000;   // Publish data every minute
const unsigned long wifiCheckInterval = 300000; // Check WiFi every 5 minutes

// ===== SETUP FUNCTION =====
void setup() {
  Serial.begin(115200);
  Serial.println("Smart Irrigation System Starting...");
  
  // Initialize pins
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(VALVE_RELAY_PIN, OUTPUT);
  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize relays to OFF state
  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(VALVE_RELAY_PIN, LOW);
  digitalWrite(LED_STATUS_PIN, LOW);
  
  // Initialize sensors
  dht.begin();
  temperatureSensor.begin();
  
  // Connect to WiFi
  connectWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  connectMQTT();
  
  // Initialize system state
  systemState.manualMode = false;
  systemState.irrigationActive = false;
  systemState.lastIrrigationTime = 0;
  
  Serial.println("System initialized successfully!");
  digitalWrite(LED_STATUS_PIN, HIGH); // Indicate system ready
}

// ===== MAIN LOOP =====
void loop() {
  unsigned long currentTime = millis();
  
  // Maintain MQTT connection
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  // Check WiFi connection periodically
  if (currentTime - lastWiFiCheck >= wifiCheckInterval) {
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }
    lastWiFiCheck = currentTime;
  }
  
  // Read sensors
  if (currentTime - lastSensorRead >= sensorInterval) {
    readSensors();
    lastSensorRead = currentTime;
  }
  
  // Publish data to cloud
  if (currentTime - lastMqttPublish >= publishInterval) {
    publishSensorData();
    lastMqttPublish = currentTime;
  }
  
  // Handle manual button press
  handleManualButton();
  
  // Irrigation control logic
  handleIrrigation();
  
  // Safety check - prevent over-irrigation
  if (systemState.irrigationActive && 
      (currentTime - systemState.irrigationStartTime >= MAX_IRRIGATION_TIME)) {
    stopIrrigation();
    Serial.println("Safety stop: Maximum irrigation time reached");
  }
  
  delay(1000); // Main loop delay
}

// ===== WIFI CONNECTION =====
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

// ===== MQTT CONNECTION =====
void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("connected");
      
      // Subscribe to control topics
      client.subscribe("irrigation/commands");
      client.subscribe("irrigation/config");
      
      // Publish online status
      publishStatus("online");
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// ===== MQTT CALLBACK =====
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(message);
  
  // Parse JSON command
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  if (strcmp(topic, "irrigation/commands") == 0) {
    handleCommand(doc);
  } else if (strcmp(topic, "irrigation/config") == 0) {
    handleConfigUpdate(doc);
  }
}

// ===== SENSOR READING =====
void readSensors() {
  // Read soil moisture (0-1023 raw, convert to percentage)
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  systemState.soilMoisture = map(soilRaw, 0, 1023, 100, 0); // Invert: wet=100%, dry=0%
  
  // Read air temperature and humidity
  systemState.airTemperature = dht.readTemperature();
  systemState.airHumidity = dht.readHumidity();
  
  // Read soil temperature
  temperatureSensor.requestTemperatures();
  systemState.soilTemperature = temperatureSensor.getTempCByIndex(0);
  
  // Validate readings
  if (isnan(systemState.airTemperature) || isnan(systemState.airHumidity)) {
    Serial.println("Failed to read from DHT sensor!");
  }
  
  // Debug output
  Serial.println("=== Sensor Readings ===");
  Serial.printf("Soil Moisture: %.1f%%\n", systemState.soilMoisture);
  Serial.printf("Air Temperature: %.1f°C\n", systemState.airTemperature);
  Serial.printf("Air Humidity: %.1f%%\n", systemState.airHumidity);
  Serial.printf("Soil Temperature: %.1f°C\n", systemState.soilTemperature);
}

// ===== IRRIGATION CONTROL =====
void handleIrrigation() {
  if (systemState.manualMode) {
    return; // Skip automatic control in manual mode
  }
  
  // Check if irrigation is needed
  if (!systemState.irrigationActive && 
      systemState.soilMoisture < SOIL_MOISTURE_THRESHOLD) {
    
    // Prevent too frequent irrigation (minimum 30 minutes between cycles)
    if (millis() - systemState.lastIrrigationTime > 1800000) {
      startIrrigation();
    }
  }
  
  // Stop irrigation when soil moisture is adequate
  if (systemState.irrigationActive && 
      systemState.soilMoisture > (SOIL_MOISTURE_THRESHOLD + 10)) {
    stopIrrigation();
  }
}

void startIrrigation() {
  Serial.println("Starting irrigation...");
  systemState.irrigationActive = true;
  systemState.irrigationStartTime = millis();
  systemState.pumpStatus = true;
  systemState.valveStatus = true;
  
  digitalWrite(PUMP_RELAY_PIN, HIGH);
  digitalWrite(VALVE_RELAY_PIN, HIGH);
  
  publishStatus("irrigating");
}

void stopIrrigation() {
  Serial.println("Stopping irrigation...");
  systemState.irrigationActive = false;
  systemState.lastIrrigationTime = millis();
  systemState.pumpStatus = false;
  systemState.valveStatus = false;
  
  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(VALVE_RELAY_PIN, LOW);
  
  publishStatus("idle");
}

// ===== MANUAL CONTROL =====
void handleManualButton() {
  static bool lastButtonState = HIGH;
  static unsigned long lastDebounce = 0;
  
  bool buttonState = digitalRead(BUTTON_PIN);
  
  if (buttonState != lastButtonState) {
    lastDebounce = millis();
  }
  
  if ((millis() - lastDebounce) > 50) { // 50ms debounce
    if (buttonState == LOW && lastButtonState == HIGH) {
      // Button pressed
      toggleManualMode();
    }
  }
  
  lastButtonState = buttonState;
}

void toggleManualMode() {
  systemState.manualMode = !systemState.manualMode;
  
  if (systemState.manualMode) {
    Serial.println("Manual mode activated");
    startIrrigation();
  } else {
    Serial.println("Automatic mode activated");
    stopIrrigation();
  }
  
  publishStatus(systemState.manualMode ? "manual" : "auto");
}

// ===== COMMAND HANDLING =====
void handleCommand(DynamicJsonDocument& doc) {
  String command = doc["command"];
  
  if (command == "start_irrigation") {
    systemState.manualMode = true;
    startIrrigation();
  } else if (command == "stop_irrigation") {
    stopIrrigation();
  } else if (command == "set_manual_mode") {
    systemState.manualMode = doc["value"];
  } else if (command == "get_status") {
    publishSensorData();
  }
}

void handleConfigUpdate(DynamicJsonDocument& doc) {
  // Handle configuration updates from cloud
  if (doc.containsKey("moisture_threshold")) {
    // Update threshold (would need to make it non-const)
    Serial.printf("Config update: moisture_threshold = %d\n", (int)doc["moisture_threshold"]);
  }
}

// ===== DATA PUBLISHING =====
void publishSensorData() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = device_id;
  doc["timestamp"] = millis();
  doc["soil_moisture"] = systemState.soilMoisture;
  doc["air_temperature"] = systemState.airTemperature;
  doc["air_humidity"] = systemState.airHumidity;
  doc["soil_temperature"] = systemState.soilTemperature;
  doc["pump_status"] = systemState.pumpStatus;
  doc["valve_status"] = systemState.valveStatus;
  doc["manual_mode"] = systemState.manualMode;
  doc["irrigation_active"] = systemState.irrigationActive;
  
  String payload;
  serializeJson(doc, payload);
  
  client.publish("irrigation/data", payload.c_str());
  Serial.println("Sensor data published to cloud");
}

void publishStatus(const char* status) {
  DynamicJsonDocument doc(256);
  doc["device_id"] = device_id;
  doc["status"] = status;
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  client.publish("irrigation/status", payload.c_str());
}
