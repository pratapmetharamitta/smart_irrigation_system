/*
 * ESP32 Toolchain Test Program
 * Smart Irrigation System
 * 
 * This simple program tests basic ESP32 functionality:
 * - Serial communication
 * - WiFi scanning
 * - GPIO control (LED blink)
 * - Basic sensor simulation
 * 
 * Use this to verify your ESP32 toolchain is working correctly.
 */

#include <WiFi.h>
#include <ArduinoJson.h>

// Configuration
#define LED_PIN 2           // Built-in LED on most ESP32 boards
#define BAUD_RATE 115200    // Serial communication speed
#define LOOP_DELAY 1000     // Main loop delay in milliseconds

// Variables
unsigned long lastMillis = 0;
int ledState = LOW;
int loopCounter = 0;

void setup() {
  // Initialize serial communication
  Serial.begin(BAUD_RATE);
  delay(1000);
  
  Serial.println("==========================================");
  Serial.println("🌱 Smart Irrigation System - ESP32 Test");
  Serial.println("==========================================");
  
  // Initialize LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, ledState);
  
  // Print ESP32 information
  printESP32Info();
  
  // Test WiFi scanning
  testWiFiScan();
  
  // Test JSON functionality
  testJSON();
  
  Serial.println("✅ All tests completed successfully!");
  Serial.println("Your ESP32 toolchain is working correctly.");
  Serial.println("==========================================");
}

void loop() {
  // Blink LED every second
  if (millis() - lastMillis >= LOOP_DELAY) {
    lastMillis = millis();
    
    // Toggle LED
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    
    // Print status
    loopCounter++;
    Serial.printf("Loop %d: LED %s, Free Heap: %d bytes\n", 
                  loopCounter, 
                  ledState ? "ON" : "OFF", 
                  ESP.getFreeHeap());
    
    // Simulate sensor readings
    if (loopCounter % 5 == 0) {
      simulateSensorReadings();
    }
  }
}

void printESP32Info() {
  Serial.println("📋 ESP32 Information:");
  Serial.printf("  Chip Model: %s\n", ESP.getChipModel());
  Serial.printf("  Chip Revision: %d\n", ESP.getChipRevision());
  Serial.printf("  CPU Frequency: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("  Flash Size: %d MB\n", ESP.getFlashChipSize() / 1024 / 1024);
  Serial.printf("  Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("  MAC Address: %s\n", WiFi.macAddress().c_str());
  Serial.println();
}

void testWiFiScan() {
  Serial.println("📡 Testing WiFi Scanning...");
  
  // Set WiFi to station mode
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  // Scan for networks
  int networksFound = WiFi.scanNetworks();
  
  if (networksFound == 0) {
    Serial.println("  No WiFi networks found");
  } else {
    Serial.printf("  Found %d WiFi networks:\n", networksFound);
    for (int i = 0; i < networksFound && i < 5; i++) {
      Serial.printf("    %d. %s (RSSI: %d dBm)\n", 
                    i + 1, 
                    WiFi.SSID(i).c_str(), 
                    WiFi.RSSI(i));
    }
    if (networksFound > 5) {
      Serial.printf("    ... and %d more networks\n", networksFound - 5);
    }
  }
  
  // Clean up
  WiFi.scanDelete();
  Serial.println("  ✅ WiFi scanning test completed");
  Serial.println();
}

void testJSON() {
  Serial.println("📄 Testing JSON Functionality...");
  
  // Create a JSON document
  StaticJsonDocument<200> doc;
  doc["device"] = "ESP32";
  doc["project"] = "Smart Irrigation System";
  doc["test"] = true;
  doc["timestamp"] = millis();
  
  // Create sensor data array
  JsonArray sensors = doc.createNestedArray("sensors");
  JsonObject sensor1 = sensors.createNestedObject();
  sensor1["type"] = "temperature";
  sensor1["value"] = 25.6;
  sensor1["unit"] = "°C";
  
  JsonObject sensor2 = sensors.createNestedObject();
  sensor2["type"] = "humidity";
  sensor2["value"] = 65.2;
  sensor2["unit"] = "%";
  
  // Serialize to string
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("  Generated JSON:");
  Serial.printf("    %s\n", jsonString.c_str());
  
  // Parse the JSON back
  StaticJsonDocument<200> parsedDoc;
  DeserializationError error = deserializeJson(parsedDoc, jsonString);
  
  if (error) {
    Serial.printf("  ❌ JSON parsing failed: %s\n", error.c_str());
  } else {
    Serial.printf("  ✅ JSON parsing successful - Device: %s\n", 
                  parsedDoc["device"].as<const char*>());
  }
  
  Serial.println();
}

void simulateSensorReadings() {
  Serial.println("🌡️  Simulated Sensor Readings:");
  
  // Simulate temperature (20-30°C)
  float temperature = 20.0 + (random(1000) / 100.0);
  Serial.printf("  Temperature: %.1f°C\n", temperature);
  
  // Simulate humidity (40-80%)
  float humidity = 40.0 + (random(4000) / 100.0);
  Serial.printf("  Humidity: %.1f%%\n", humidity);
  
  // Simulate soil moisture (0-100%)
  int soilMoisture = random(101);
  Serial.printf("  Soil Moisture: %d%%\n", soilMoisture);
  
  // Simulate light level (0-1023)
  int lightLevel = random(1024);
  Serial.printf("  Light Level: %d\n", lightLevel);
  
  // Create status message
  String status = "Normal";
  if (temperature > 28.0) status = "Hot";
  else if (temperature < 22.0) status = "Cold";
  if (humidity < 50.0) status += " & Dry";
  else if (humidity > 70.0) status += " & Humid";
  
  Serial.printf("  Status: %s\n", status.c_str());
  Serial.println();
}
