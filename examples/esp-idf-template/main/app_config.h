#ifndef APP_CONFIG_H
#define APP_CONFIG_H

// Application version
#define APP_VERSION "1.0.0"
#define APP_NAME "Smart Irrigation Edge"

// Network configuration
#define WIFI_SSID_MAX_LEN 32
#define WIFI_PASSWORD_MAX_LEN 64
#define APN_MAX_LEN 32
#define APN_USER_MAX_LEN 32
#define APN_PASS_MAX_LEN 32

// MQTT configuration
#define MQTT_BROKER_MAX_LEN 128
#define MQTT_PORT_DEFAULT 1883
#define MQTT_TOPIC_MAX_LEN 128
#define MQTT_CLIENT_ID_MAX_LEN 64

// Sensor configuration
#define MAX_SENSORS 8
#define SENSOR_READING_INTERVAL_MS (5 * 60 * 1000)  // 5 minutes
#define SENSOR_CALIBRATION_SAMPLES 10

// LoRa Network configuration
#define LORA_NODE_ID_MAX 255
#define LORA_NETWORK_ID 0x12
#define LORA_MAX_PAYLOAD_SIZE 255
#define LORA_RETRY_COUNT 3
#define LORA_ACK_TIMEOUT_MS 2000

// Data logging configuration
#define LOG_BUFFER_SIZE 1024
#define LOG_ENTRY_MAX_SIZE 256
#define LOG_RETENTION_DAYS 7

// Power management
#define BATTERY_LOW_THRESHOLD_MV 3300
#define BATTERY_CRITICAL_THRESHOLD_MV 3000
#define SOLAR_PANEL_PRESENT 1

// OTA update configuration
#define OTA_UPDATE_CHECK_INTERVAL_MS (24 * 60 * 60 * 1000)  // 24 hours
#define OTA_UPDATE_URL_MAX_LEN 256

// Security configuration
#define DEVICE_ID_MAX_LEN 32
#define API_KEY_MAX_LEN 64
#define CERTIFICATE_MAX_LEN 2048

// Error handling
#define MAX_ERROR_COUNT 10
#define ERROR_RESET_THRESHOLD 5

// Default values
#define DEFAULT_SENSOR_READING_INTERVAL_S 300
#define DEFAULT_TRANSMISSION_INTERVAL_S 900
#define DEFAULT_LORA_FREQUENCY 915000000
#define DEFAULT_LORA_SPREADING_FACTOR 7
#define DEFAULT_LORA_BANDWIDTH 125000
#define DEFAULT_LORA_TX_POWER 14

// Application states
typedef enum {
    APP_STATE_INIT,
    APP_STATE_IDLE,
    APP_STATE_READING_SENSORS,
    APP_STATE_TRANSMITTING,
    APP_STATE_RECEIVING,
    APP_STATE_SLEEPING,
    APP_STATE_ERROR,
    APP_STATE_OTA_UPDATE
} app_state_t;

// Communication modes
typedef enum {
    COMM_MODE_LORA_ONLY,
    COMM_MODE_CELLULAR_ONLY,
    COMM_MODE_HYBRID,
    COMM_MODE_AUTO
} comm_mode_t;

// Power modes
typedef enum {
    POWER_MODE_NORMAL,
    POWER_MODE_LOW_POWER,
    POWER_MODE_DEEP_SLEEP,
    POWER_MODE_HIBERNATE
} power_mode_t;

#endif // APP_CONFIG_H
