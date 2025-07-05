#include <SPI.h>
#include <LoRa.h>
#include "ds3231.h"
#include <WiFi.h>
#include <SD.h>

OLED_CLASS_OBJ display(OLED_ADDRESS, OLED_SDA, OLED_SCL);

#define WIFI_SSID       "Irregation"
#define WIFI_PASSWORD   "9866370727"


// --- Valve and Sensor Pin Definitions ---
#define NUM_VALVES 4
const int valvePins[NUM_VALVES] = {16, 17, 18, 19}; // Example GPIOs for valves
const int soilMoisturePins[NUM_VALVES] = {32, 33, 34, 35}; // Example analog pins for soil sensors
const int tempSensorPin = 36; // Example analog pin for temperature sensor

void setup()
{
    Serial.begin(115200);
    while (!Serial);

    // Initialize valve pins
    for (int i = 0; i < NUM_VALVES; i++) {
        pinMode(valvePins[i], OUTPUT);
        digitalWrite(valvePins[i], LOW); // Valves off by default
    }

    // ...existing code for OLED, SD card, and WiFi setup...

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    if (WiFi.waitForConnectResult() != WL_CONNECTED) {
        display.clear();
        Serial.println("WiFi Connect Fail");
        display.drawString(display.getWidth() / 2, display.getHeight() / 2, "WiFi Connect Fail");
        display.display();
        delay(2000);
        esp_restart();
    }
    Serial.print("Connected : ");
    Serial.println(WiFi.SSID());
    Serial.print("IP:");
    Serial.println(WiFi.localIP().toString());
    display.clear();
    display.drawString(display.getWidth() / 2, display.getHeight() / 2, "IP:" + WiFi.localIP().toString());
    display.display();
    delay(2000);

    SPI.begin(CONFIG_CLK, CONFIG_MISO, CONFIG_MOSI, CONFIG_NSS);
    LoRa.setPins(CONFIG_NSS, CONFIG_RST, CONFIG_DIO0);
    if (!LoRa.begin(BAND)) {
        Serial.println("Starting LoRa failed!");
        while (1);
    }
    if (!LORA_SENDER) {
        display.clear();
        display.drawString(display.getWidth() / 2, display.getHeight() / 2, "LoraRecv Ready");
        display.display();
    }
}

int count = 0;


// --- Helper Functions ---
void readSensors(int* soilMoisture, int& temperature) {
    for (int i = 0; i < NUM_VALVES; i++) {
        soilMoisture[i] = analogRead(soilMoisturePins[i]);
    }
    temperature = analogRead(tempSensorPin); // Replace with actual temp sensor logic if needed
}

void controlValve(int valveIndex, bool open) {
    if (valveIndex >= 0 && valveIndex < NUM_VALVES) {
        digitalWrite(valvePins[valveIndex], open ? HIGH : LOW);
    }
}

void sendSensorData() {
    int soilMoisture[NUM_VALVES];
    int temperature;
    readSensors(soilMoisture, temperature);
    LoRa.beginPacket();
    LoRa.print("DATA,");
    for (int i = 0; i < NUM_VALVES; i++) {
        LoRa.print(soilMoisture[i]);
        LoRa.print(i < NUM_VALVES - 1 ? "," : "");
    }
    LoRa.print(",");
    LoRa.print(temperature);
    LoRa.endPacket();
}

void parseCommand(String cmd) {
    // Example: CMD,VALVE,1,ON
    if (cmd.startsWith("CMD,VALVE,")) {
        int idx1 = cmd.indexOf(',', 10);
        int idx2 = cmd.indexOf(',', idx1 + 1);
        int valve = cmd.substring(10, idx1).toInt();
        String action = cmd.substring(idx1 + 1, idx2 > 0 ? idx2 : cmd.length());
        controlValve(valve, action == "ON");
    }
}

void loop()
{
    // Send sensor data periodically
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 5000) { // Every 5 seconds
        sendSensorData();
        lastSend = millis();
    }

    // Listen for commands from Edge
    if (LoRa.parsePacket()) {
        String recv = "";
        while (LoRa.available()) {
            recv += (char)LoRa.read();
        }
        parseCommand(recv);
    }
}
