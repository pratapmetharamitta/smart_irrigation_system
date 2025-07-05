/*
 * Edge Firmware Template for Smart Irrigation System
 * - Receives sensor data from Node via LoRa
 * - Controls pump via relay
 * - Forwards data to cloud via MQTT (SIM7000G)
 * - Receives commands from cloud and forwards to Node
 */

#include <SPI.h>
#include <LoRa.h>
#include <TinyGsmClient.h>
#include <PubSubClient.h>

// LoRa Pin Definitions (adjust as per your hardware)
#define LORA_RST    12
#define LORA_DI0    32
#define LORA_SS     5
#define LORA_MISO   19
#define LORA_MOSI   23
#define LORA_SCK    18
#define BAND        470E6

// Pump Relay Pin
#define PUMP_RELAY_PIN  14 // Example GPIO for pump relay

// SIM7000G Serial
#define SerialAT Serial1
#define UART_BAUD 115200
#define PIN_TX    27
#define PIN_RX    26
#define PWR_PIN   4

// MQTT Broker
const char* broker = "broker.hivemq.com";
const char* topicData = "SmartIrrigation/data";
const char* topicCmd  = "SmartIrrigation/cmd";

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
PubSubClient mqtt(client);
SPIClass SPIRadio(HSPI);

void setup() {
    Serial.begin(115200);
    while (!Serial);

    // Pump relay setup
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    digitalWrite(PUMP_RELAY_PIN, LOW); // Pump off by default

    // LoRa setup
    SPIRadio.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
    LoRa.setSPI(SPIRadio);
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DI0);
    if (!LoRa.begin(BAND)) {
        Serial.println("LORA Begin FAIL");
        while (1);
    }
    Serial.println("LORA Begin PASS");

    // SIM7000G setup
    SerialAT.begin(UART_BAUD, SERIAL_8N1, PIN_RX, PIN_TX);
    delay(3000);
    modem.restart();
    modem.gprsConnect("YourAPN", "", ""); // Set your APN
    mqtt.setServer(broker, 1883);
    mqtt.setCallback(mqttCallback);
}

void loop() {
    // LoRa receive
    if (LoRa.parsePacket()) {
        String recv = "";
        while (LoRa.available()) {
            recv += (char)LoRa.read();
        }
        Serial.print("Received from Node: ");
        Serial.println(recv);
        // Forward to cloud
        mqttPublishData(recv);
    }

    // MQTT loop
    if (!mqtt.connected()) {
        reconnectMQTT();
    }
    mqtt.loop();
}

void mqttPublishData(const String& data) {
    mqtt.publish(topicData, data.c_str());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String cmd = "";
    for (unsigned int i = 0; i < length; i++) {
        cmd += (char)payload[i];
    }
    Serial.print("MQTT Command: ");
    Serial.println(cmd);
    // Example: CMD,PUMP,ON or CMD,VALVE,1,ON
    if (cmd.startsWith("CMD,PUMP,")) {
        String action = cmd.substring(9);
        digitalWrite(PUMP_RELAY_PIN, action == "ON" ? HIGH : LOW);
    } else if (cmd.startsWith("CMD,VALVE,")) {
        // Forward valve command to Node
        LoRa.beginPacket();
        LoRa.print(cmd);
        LoRa.endPacket();
    }
}

void reconnectMQTT() {
    while (!mqtt.connected()) {
        Serial.print("Connecting to MQTT...");
        if (mqtt.connect("EdgeDevice")) {
            Serial.println("connected");
            mqtt.subscribe(topicCmd);
        } else {
            Serial.print("failed, rc=");
            Serial.print(mqtt.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}
