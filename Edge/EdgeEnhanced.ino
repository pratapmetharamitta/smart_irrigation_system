/*
 * Enhanced Edge Firmware for Smart Irrigation System
 * Features:
 * - Dual LoRa and Cellular connectivity
 * - Receives sensor data from multiple Nodes via LoRa
 * - Forwards data to cloud via SIM7000G cellular
 * - Receives commands from cloud and forwards to specific Nodes
 * - Local pump and valve control
 * - OLED display for status monitoring
 * - Data logging to SD card
 * - Mesh networking support
 */

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SD.h>
#include "edge_board_def.h"

// Initialize OLED display
OLED_CLASS_OBJ display(OLED_ADDRESS, OLED_SDA, OLED_SCL);

// Cellular modem and MQTT client
#define SerialAT Serial1
TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
PubSubClient mqtt(client);

// LoRa SPI configuration
SPIClass loraRadio(VSPI);

// Global variables
NodeData receivedData[MAX_NODES];
uint8_t activeNodes = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastDataReceived = 0;
bool cellularConnected = false;
bool loraInitialized = false;

// Function prototypes
void initializeLoRa();
void initializeCellular();
void initializeDisplay();
void initializeSD();
void initializeRelays();
void handleLoRaReceive();
void handleMQTTMessages();
void forwardDataToCloud();
void processCloudCommand(const String& command);
void forwardCommandToNode(const EdgeCommand& cmd);
void updateDisplay();
void logDataToSD(const NodeData& data);
void sendHeartbeat();
void handleSystemStatus();
bool validateNodeData(const String& data);
NodeData parseNodeData(const String& data);
void controlLocalPump(bool state);
void controlLocalValve(uint8_t valve, bool state);

void setup() {
    Serial.begin(115200);
    while (!Serial);
    
    Serial.println("=== Smart Irrigation Edge Device ===");
    
    // Initialize all subsystems
    initializeDisplay();
    initializeRelays();
    initializeSD();
    initializeLoRa();
    initializeCellular();
    
    display.clear();
    display.drawString(0, 0, "Edge Device Ready");
    display.drawString(0, 16, "LoRa: " + String(loraInitialized ? "OK" : "FAIL"));
    display.drawString(0, 32, "Cellular: " + String(cellularConnected ? "OK" : "FAIL"));
    display.display();
    
    lastHeartbeat = millis();
    
    Serial.println("Edge device initialization complete");
}

void loop() {
    // Handle LoRa communication
    handleLoRaReceive();
    
    // Handle MQTT communication
    handleMQTTMessages();
    
    // Send heartbeat periodically
    if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
        sendHeartbeat();
        lastHeartbeat = millis();
    }
    
    // Update display
    updateDisplay();
    
    // Handle system status
    handleSystemStatus();
    
    delay(100); // Small delay to prevent watchdog timeout
}

void initializeLoRa() {
    Serial.println("Initializing LoRa...");
    
    // Configure LoRa SPI
    loraRadio.begin(CONFIG_CLK, CONFIG_MISO, CONFIG_MOSI, CONFIG_NSS);
    LoRa.setSPI(loraRadio);
    LoRa.setPins(CONFIG_NSS, CONFIG_RST, CONFIG_DIO0);
    
    if (!LoRa.begin(BAND)) {
        Serial.println("LoRa initialization failed!");
        loraInitialized = false;
        return;
    }
    
    // Configure LoRa parameters for better range and reliability
    LoRa.setSpreadingFactor(12);  // Higher SF for better range
    LoRa.setSignalBandwidth(125E3); // 125 kHz bandwidth
    LoRa.setCodingRate4(5);       // 4/5 coding rate
    LoRa.setPreambleLength(8);    // Preamble length
    LoRa.setSyncWord(0x12);       // Sync word for private network
    LoRa.enableCrc();             // Enable CRC
    
    loraInitialized = true;
    Serial.println("LoRa initialized successfully");
    Serial.println("Operating as LoRa Receiver");
    Serial.println("Frequency: " + String(LORA_PERIOD) + "MHz");
    
    // Turn on LoRa status LED
    digitalWrite(LED_LORA_RX, HIGH);
}

void initializeCellular() {
    Serial.println("Initializing SIM7000G...");
    
    // Power on SIM7000G
    pinMode(MODEM_PWRKEY, OUTPUT);
    pinMode(MODEM_POWER_ON, OUTPUT);
    digitalWrite(MODEM_POWER_ON, HIGH);
    
    // Initialize serial communication with modem
    SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
    delay(3000);
    
    // Restart modem
    Serial.println("Restarting modem...");
    modem.restart();
    
    // Wait for network registration
    Serial.println("Waiting for network registration...");
    while (!modem.waitForNetwork()) {
        Serial.print(".");
        delay(1000);
    }
    Serial.println("Network registered");
    
    // Connect to GPRS
    Serial.println("Connecting to GPRS...");
    if (!modem.gprsConnect(APN_NAME, APN_USER, APN_PASS)) {
        Serial.println("GPRS connection failed");
        cellularConnected = false;
        return;
    }
    Serial.println("GPRS connected");
    
    // Configure MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback([](char* topic, byte* payload, unsigned int length) {
        String message = "";
        for (unsigned int i = 0; i < length; i++) {
            message += (char)payload[i];
        }
        processCloudCommand(message);
    });
    
    cellularConnected = true;
    Serial.println("Cellular initialized successfully");
    
    // Turn on cellular status LED
    digitalWrite(LED_CELLULAR_TX, HIGH);
}

void initializeDisplay() {
    Serial.println("Initializing display...");
    
    Wire.begin(I2C_SDA, I2C_SCL);
    display.init();
    display.flipScreenVertically();
    display.setFont(ArialMT_Plain_10);
    display.clear();
    display.drawString(0, 0, "Initializing...");
    display.display();
    
    Serial.println("Display initialized");
}

void initializeSD() {
    Serial.println("Initializing SD card...");
    
    if (!SD.begin(SDCARD_CS)) {
        Serial.println("SD card initialization failed");
        return;
    }
    
    Serial.println("SD card initialized");
}

void initializeRelays() {
    Serial.println("Initializing relay controls...");
    
    // Initialize pump relay
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    digitalWrite(PUMP_RELAY_PIN, LOW);
    
    // Initialize valve relays
    pinMode(VALVE_RELAY_1, OUTPUT);
    pinMode(VALVE_RELAY_2, OUTPUT);
    pinMode(VALVE_RELAY_3, OUTPUT);
    pinMode(VALVE_RELAY_4, OUTPUT);
    
    digitalWrite(VALVE_RELAY_1, LOW);
    digitalWrite(VALVE_RELAY_2, LOW);
    digitalWrite(VALVE_RELAY_3, LOW);
    digitalWrite(VALVE_RELAY_4, LOW);
    
    // Initialize status LEDs
    pinMode(LED_LORA_RX, OUTPUT);
    pinMode(LED_CELLULAR_TX, OUTPUT);
    pinMode(LED_SYSTEM_STATUS, OUTPUT);
    
    digitalWrite(LED_LORA_RX, LOW);
    digitalWrite(LED_CELLULAR_TX, LOW);
    digitalWrite(LED_SYSTEM_STATUS, HIGH); // System status on
    
    Serial.println("Relay controls initialized");
}

void handleLoRaReceive() {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
        // Blink LoRa RX LED
        digitalWrite(LED_LORA_RX, LOW);
        delay(50);
        digitalWrite(LED_LORA_RX, HIGH);
        
        // Read packet
        String receivedString = "";
        while (LoRa.available()) {
            receivedString += (char)LoRa.read();
        }
        
        Serial.println("LoRa packet received: " + receivedString);
        Serial.println("RSSI: " + String(LoRa.packetRssi()));
        Serial.println("SNR: " + String(LoRa.packetSnr()));
        
        // Validate and parse data
        if (validateNodeData(receivedString)) {
            NodeData data = parseNodeData(receivedString);
            
            // Store data
            bool nodeFound = false;
            for (int i = 0; i < activeNodes; i++) {
                if (receivedData[i].nodeId == data.nodeId) {
                    receivedData[i] = data;
                    nodeFound = true;
                    break;
                }
            }
            
            if (!nodeFound && activeNodes < MAX_NODES) {
                receivedData[activeNodes] = data;
                activeNodes++;
            }
            
            // Log to SD card
            logDataToSD(data);
            
            // Forward to cloud
            forwardDataToCloud();
            
            lastDataReceived = millis();
        } else {
            Serial.println("Invalid data format received");
        }
    }
}

void handleMQTTMessages() {
    if (!mqtt.connected() && cellularConnected) {
        Serial.println("Reconnecting to MQTT...");
        if (mqtt.connect("EdgeDevice")) {
            Serial.println("MQTT connected");
            mqtt.subscribe(MQTT_TOPIC_CMD);
            mqtt.subscribe(MQTT_TOPIC_STATUS);
        } else {
            Serial.println("MQTT connection failed");
        }
    }
    
    if (mqtt.connected()) {
        mqtt.loop();
    }
}

void forwardDataToCloud() {
    if (!mqtt.connected()) return;
    
    // Create JSON payload with all node data
    DynamicJsonDocument doc(1024);
    JsonArray nodes = doc.createNestedArray("nodes");
    
    for (int i = 0; i < activeNodes; i++) {
        JsonObject node = nodes.createNestedObject();
        node["nodeId"] = receivedData[i].nodeId;
        node["timestamp"] = receivedData[i].timestamp;
        node["temperature"] = receivedData[i].temperature;
        node["humidity"] = receivedData[i].humidity;
        node["batteryLevel"] = receivedData[i].batteryLevel;
        
        JsonArray moisture = node.createNestedArray("soilMoisture");
        JsonArray valves = node.createNestedArray("valveStatus");
        
        for (int j = 0; j < 4; j++) {
            moisture.add(receivedData[i].soilMoisture[j]);
            valves.add(receivedData[i].valveStatus[j]);
        }
    }
    
    doc["edgeId"] = "EDGE_001";
    doc["timestamp"] = millis();
    doc["rssi"] = LoRa.packetRssi();
    doc["snr"] = LoRa.packetSnr();
    
    String payload;
    serializeJson(doc, payload);
    
    if (mqtt.publish(MQTT_TOPIC_DATA, payload.c_str())) {
        Serial.println("Data forwarded to cloud");
        // Blink cellular TX LED
        digitalWrite(LED_CELLULAR_TX, LOW);
        delay(50);
        digitalWrite(LED_CELLULAR_TX, HIGH);
    } else {
        Serial.println("Failed to forward data to cloud");
    }
}

void processCloudCommand(const String& command) {
    Serial.println("Processing cloud command: " + command);
    
    DynamicJsonDocument doc(256);
    deserializeJson(doc, command);
    
    String cmdType = doc["type"];
    uint8_t nodeId = doc["nodeId"];
    
    if (cmdType == "pump") {
        bool state = doc["state"];
        controlLocalPump(state);
    } else if (cmdType == "valve") {
        uint8_t valveNum = doc["valve"];
        bool state = doc["state"];
        
        if (nodeId == 0) {
            // Local valve control
            controlLocalValve(valveNum, state);
        } else {
            // Forward to specific node
            EdgeCommand cmd;
            cmd.nodeId = nodeId;
            cmd.commandType = 0; // valve
            cmd.targetDevice = valveNum;
            cmd.action = state;
            cmd.timestamp = millis();
            
            forwardCommandToNode(cmd);
        }
    }
}

void forwardCommandToNode(const EdgeCommand& cmd) {
    // Create command packet for LoRa transmission
    String packet = "CMD," + String(cmd.nodeId) + "," + String(cmd.commandType) + 
                   "," + String(cmd.targetDevice) + "," + String(cmd.action ? 1 : 0);
    
    LoRa.beginPacket();
    LoRa.print(packet);
    LoRa.endPacket();
    
    Serial.println("Command forwarded to Node " + String(cmd.nodeId) + ": " + packet);
}

void updateDisplay() {
    static unsigned long lastUpdate = 0;
    if (millis() - lastUpdate < 1000) return; // Update every second
    
    display.clear();
    
    // Header
    display.drawString(0, 0, "Smart Irrigation Edge");
    
    // Connection status
    display.drawString(0, 12, "LoRa: " + String(loraInitialized ? "OK" : "FAIL"));
    display.drawString(64, 12, "Cell: " + String(cellularConnected ? "OK" : "FAIL"));
    
    // Active nodes
    display.drawString(0, 24, "Nodes: " + String(activeNodes));
    
    // Last data received
    if (lastDataReceived > 0) {
        unsigned long timeSince = (millis() - lastDataReceived) / 1000;
        display.drawString(0, 36, "Last RX: " + String(timeSince) + "s ago");
    }
    
    // RSSI and SNR
    display.drawString(0, 48, "RSSI: " + String(LoRa.packetRssi()) + " dBm");
    display.drawString(0, 56, "SNR: " + String(LoRa.packetSnr()) + " dB");
    
    display.display();
    lastUpdate = millis();
}

void logDataToSD(const NodeData& data) {
    File dataFile = SD.open("/irrigation_data.csv", FILE_APPEND);
    if (dataFile) {
        String logEntry = String(data.timestamp) + "," + String(data.nodeId) + "," +
                         String(data.temperature) + "," + String(data.humidity) + "," +
                         String(data.batteryLevel);
        
        for (int i = 0; i < 4; i++) {
            logEntry += "," + String(data.soilMoisture[i]);
        }
        
        for (int i = 0; i < 4; i++) {
            logEntry += "," + String(data.valveStatus[i] ? 1 : 0);
        }
        
        dataFile.println(logEntry);
        dataFile.close();
    }
}

void sendHeartbeat() {
    if (!mqtt.connected()) return;
    
    DynamicJsonDocument doc(256);
    doc["edgeId"] = "EDGE_001";
    doc["timestamp"] = millis();
    doc["activeNodes"] = activeNodes;
    doc["loraStatus"] = loraInitialized;
    doc["cellularStatus"] = cellularConnected;
    doc["freeHeap"] = ESP.getFreeHeap();
    
    String payload;
    serializeJson(doc, payload);
    
    mqtt.publish(MQTT_TOPIC_STATUS, payload.c_str());
}

void handleSystemStatus() {
    // System health monitoring
    static unsigned long lastStatusCheck = 0;
    if (millis() - lastStatusCheck < 10000) return; // Check every 10 seconds
    
    // Check if we're receiving data
    if (millis() - lastDataReceived > 300000) { // 5 minutes without data
        Serial.println("WARNING: No data received for 5 minutes");
    }
    
    // Check memory usage
    if (ESP.getFreeHeap() < 10000) { // Less than 10KB free
        Serial.println("WARNING: Low memory");
    }
    
    lastStatusCheck = millis();
}

bool validateNodeData(const String& data) {
    // Basic validation - check if data contains expected delimiters
    return data.indexOf(',') > 0 && data.length() > 10 && data.length() < 200;
}

NodeData parseNodeData(const String& data) {
    NodeData nodeData;
    
    // Parse CSV format: nodeId,temp,humidity,battery,moisture1,moisture2,moisture3,moisture4,valve1,valve2,valve3,valve4
    int startIndex = 0;
    int commaIndex = 0;
    int fieldIndex = 0;
    
    while (commaIndex != -1 && fieldIndex < 12) {
        commaIndex = data.indexOf(',', startIndex);
        String field = commaIndex != -1 ? data.substring(startIndex, commaIndex) : data.substring(startIndex);
        
        switch (fieldIndex) {
            case 0: nodeData.nodeId = field.toInt(); break;
            case 1: nodeData.temperature = field.toFloat(); break;
            case 2: nodeData.humidity = field.toFloat(); break;
            case 3: nodeData.batteryLevel = field.toFloat(); break;
            case 4: case 5: case 6: case 7:
                nodeData.soilMoisture[fieldIndex - 4] = field.toFloat(); break;
            case 8: case 9: case 10: case 11:
                nodeData.valveStatus[fieldIndex - 8] = field.toInt() == 1; break;
        }
        
        startIndex = commaIndex + 1;
        fieldIndex++;
    }
    
    nodeData.timestamp = millis();
    return nodeData;
}

void controlLocalPump(bool state) {
    digitalWrite(PUMP_RELAY_PIN, state ? HIGH : LOW);
    Serial.println("Local pump " + String(state ? "ON" : "OFF"));
}

void controlLocalValve(uint8_t valve, bool state) {
    int pin = -1;
    switch (valve) {
        case 1: pin = VALVE_RELAY_1; break;
        case 2: pin = VALVE_RELAY_2; break;
        case 3: pin = VALVE_RELAY_3; break;
        case 4: pin = VALVE_RELAY_4; break;
    }
    
    if (pin != -1) {
        digitalWrite(pin, state ? HIGH : LOW);
        Serial.println("Local valve " + String(valve) + " " + String(state ? "ON" : "OFF"));
    }
}
