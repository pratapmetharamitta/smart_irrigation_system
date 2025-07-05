#ifndef EDGE_CELLULAR_H
#define EDGE_CELLULAR_H

#include <Arduino.h>
#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "edge_board_def.h"

class EdgeCellular {
private:
    TinyGsm* modem;
    TinyGsmClient* client;
    PubSubClient* mqtt;
    HardwareSerial* serialAT;
    
    bool initialized;
    bool networkConnected;
    bool gprsConnected;
    bool mqttConnected;
    
    String apnName;
    String apnUser;
    String apnPass;
    String mqttBroker;
    int mqttPort;
    String deviceId;
    
    // Statistics
    unsigned long messagesPublished;
    unsigned long messagesReceived;
    unsigned long lastMessageTime;
    unsigned long connectionStartTime;
    unsigned long totalConnectedTime;
    
    // Callback function pointer
    void (*messageCallback)(const String& topic, const String& message);
    
    // Connection retry
    uint8_t retryCount;
    unsigned long lastRetryTime;
    
public:
    EdgeCellular(const String& deviceId = "EDGE_001");
    ~EdgeCellular();
    
    // Initialization
    bool begin(const String& apn, const String& user = "", const String& pass = "");
    void end();
    bool isInitialized() { return initialized; }
    
    // Network management
    bool connectNetwork();
    bool connectGPRS();
    bool disconnectGPRS();
    bool isNetworkConnected() { return networkConnected; }
    bool isGPRSConnected() { return gprsConnected; }
    
    // MQTT management
    bool connectMQTT(const String& broker, int port = 1883);
    bool disconnectMQTT();
    bool isMQTTConnected() { return mqttConnected; }
    void loop(); // Call this in main loop
    
    // Message handling
    bool publish(const String& topic, const String& message, bool retain = false);
    bool subscribe(const String& topic);
    bool unsubscribe(const String& topic);
    void setMessageCallback(void (*callback)(const String& topic, const String& message));
    
    // Data publishing helpers
    bool publishSensorData(const String& nodeData);
    bool publishStatus();
    bool publishAlert(const String& alertType, const String& message);
    bool publishHeartbeat();
    
    // System information
    String getNetworkInfo();
    String getSignalQuality();
    int getSignalStrength();
    String getIMEI();
    String getIMSI();
    String getOperator();
    
    // Statistics
    unsigned long getMessagesPublished() { return messagesPublished; }
    unsigned long getMessagesReceived() { return messagesReceived; }
    unsigned long getLastMessageTime() { return lastMessageTime; }
    unsigned long getTotalConnectedTime() { return totalConnectedTime; }
    
    // Power management
    bool powerOn();
    bool powerOff();
    bool restart();
    bool sleep();
    bool wakeup();
    
    // Utility
    void printStatus();
    String getStatusString();
    bool testConnection();
    
private:
    void setupModem();
    void onMqttMessage(char* topic, byte* payload, unsigned int length);
    bool waitForNetwork(unsigned long timeout = 60000);
    bool reconnectMQTT();
    void updateConnectionTime();
    String createStatusJson();
};

// MQTT Topics
#define TOPIC_DATA          "SmartIrrigation/data"
#define TOPIC_STATUS        "SmartIrrigation/status"
#define TOPIC_ALERT         "SmartIrrigation/alert"
#define TOPIC_HEARTBEAT     "SmartIrrigation/heartbeat"
#define TOPIC_COMMAND       "SmartIrrigation/command"
#define TOPIC_CONFIG        "SmartIrrigation/config"

// Alert types
#define ALERT_LOW_BATTERY   "LOW_BATTERY"
#define ALERT_SENSOR_FAIL   "SENSOR_FAIL"
#define ALERT_COMM_FAIL     "COMM_FAIL"
#define ALERT_HIGH_TEMP     "HIGH_TEMP"
#define ALERT_LOW_MOISTURE  "LOW_MOISTURE"
#define ALERT_PUMP_FAIL     "PUMP_FAIL"

#endif // EDGE_CELLULAR_H
