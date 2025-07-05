#include <Arduino.h>

// Edge Device Configuration
#define EDGE_SIM7000G_V1    0
#define EDGE_SIM7000G_V2    1
#define EDGE_CUSTOM         0

// LoRa Operation Mode
#define LORA_RECEIVER 1
#define LORA_SENDER   0

// LoRa Frequency Configuration
// #define LORA_PERIOD 868  
// #define LORA_PERIOD 915     
#define LORA_PERIOD 433  

// Edge Device with SIM7000G V1
#if EDGE_SIM7000G_V1
#include <Wire.h> 
#include "SSD1306Wire.h" 
#define OLED_CLASS_OBJ  SSD1306Wire
#define OLED_ADDRESS    0x3C
#define OLED_SDA    21
#define OLED_SCL    22
#define OLED_RST    -1

// LoRa Pin Configuration for SIM7000G V1
#define CONFIG_MOSI 27
#define CONFIG_MISO 19
#define CONFIG_CLK  5
#define CONFIG_NSS  18
#define CONFIG_RST  14
#define CONFIG_DIO0 26

// SIM7000G Pin Configuration
#define MODEM_RST           5
#define MODEM_PWRKEY        4
#define MODEM_POWER_ON      23
#define MODEM_TX            27
#define MODEM_RX            26
#define I2C_SDA             21
#define I2C_SCL             22

// SD Card Configuration
#define SDCARD_MOSI     15
#define SDCARD_MISO     2
#define SDCARD_SCLK     14
#define SDCARD_CS       13

// Pump and Valve Control
#define PUMP_RELAY_PIN      12
#define VALVE_RELAY_1       32
#define VALVE_RELAY_2       33
#define VALVE_RELAY_3       25
#define VALVE_RELAY_4       26

// Status LEDs
#define LED_LORA_RX         16
#define LED_CELLULAR_TX     17
#define LED_SYSTEM_STATUS   2

#elif EDGE_SIM7000G_V2
// Edge Device with SIM7000G V2
#include <Wire.h> 
#include "SSD1306Wire.h" 
#define OLED_CLASS_OBJ  SSD1306Wire
#define OLED_ADDRESS    0x3C
#define OLED_SDA    21
#define OLED_SCL    22
#define OLED_RST    16

// LoRa Pin Configuration for SIM7000G V2
#define CONFIG_MOSI 27
#define CONFIG_MISO 19
#define CONFIG_CLK  5
#define CONFIG_NSS  18
#define CONFIG_RST  23
#define CONFIG_DIO0 26

// SIM7000G Pin Configuration V2
#define MODEM_RST           5
#define MODEM_PWRKEY        4
#define MODEM_POWER_ON      23
#define MODEM_TX            27
#define MODEM_RX            26
#define I2C_SDA             21
#define I2C_SCL             22

// SD Card Configuration
#define SDCARD_MOSI     15
#define SDCARD_MISO     2
#define SDCARD_SCLK     14
#define SDCARD_CS       13

// Pump and Valve Control
#define PUMP_RELAY_PIN      12
#define VALVE_RELAY_1       32
#define VALVE_RELAY_2       33
#define VALVE_RELAY_3       25
#define VALVE_RELAY_4       26

// Status LEDs
#define LED_LORA_RX         16
#define LED_CELLULAR_TX     17
#define LED_SYSTEM_STATUS   2

#elif EDGE_CUSTOM
// Custom Edge Device Configuration
#include <Wire.h> 
#include "SSD1306Wire.h" 
#define OLED_CLASS_OBJ  SSD1306Wire
#define OLED_ADDRESS    0x3C
#define OLED_SDA    21
#define OLED_SCL    22
#define OLED_RST    -1

// Custom LoRa Pin Configuration
#define CONFIG_MOSI 27
#define CONFIG_MISO 19
#define CONFIG_CLK  5
#define CONFIG_NSS  18
#define CONFIG_RST  14
#define CONFIG_DIO0 26

// Custom SIM7000G Pin Configuration
#define MODEM_RST           5
#define MODEM_PWRKEY        4
#define MODEM_POWER_ON      23
#define MODEM_TX            27
#define MODEM_RX            26
#define I2C_SDA             21
#define I2C_SCL             22

// Custom Control Pins
#define PUMP_RELAY_PIN      12
#define VALVE_RELAY_1       32
#define VALVE_RELAY_2       33
#define VALVE_RELAY_3       25
#define VALVE_RELAY_4       26

#endif

// LoRa Frequency Settings
#if LORA_PERIOD == 433
#define BAND    433E6
#elif LORA_PERIOD == 868
#define BAND    868E6
#elif LORA_PERIOD == 915
#define BAND    915E6
#endif

// MQTT Configuration
#define MQTT_BROKER         "broker.hivemq.com"
#define MQTT_PORT           1883
#define MQTT_TOPIC_DATA     "SmartIrrigation/data"
#define MQTT_TOPIC_CMD      "SmartIrrigation/cmd"
#define MQTT_TOPIC_STATUS   "SmartIrrigation/status"
#define MQTT_TOPIC_ALERT    "SmartIrrigation/alert"

// Data Structure for Node Communication
struct NodeData {
    uint8_t nodeId;
    float soilMoisture[4];
    float temperature;
    float humidity;
    float batteryLevel;
    bool valveStatus[4];
    unsigned long timestamp;
};

struct EdgeCommand {
    uint8_t nodeId;
    uint8_t commandType;  // 0=valve, 1=pump, 2=config
    uint8_t targetDevice; // valve number, pump number, etc.
    bool action;          // on/off
    unsigned long timestamp;
};

// System Configuration
#define MAX_NODES           10
#define DATA_BUFFER_SIZE    256
#define COMMAND_TIMEOUT     30000  // 30 seconds
#define HEARTBEAT_INTERVAL  60000  // 1 minute
#define RETRY_ATTEMPTS      3
#define LORA_PACKET_SIZE    64

// APN Configuration (customize for your carrier)
#define APN_NAME            "your.apn.here"
#define APN_USER            ""
#define APN_PASS            ""
