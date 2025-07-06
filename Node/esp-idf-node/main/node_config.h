/*
 * Node Configuration Header
 * Hardware and system configuration for Smart Irrigation Node
 */

#ifndef NODE_CONFIG_H
#define NODE_CONFIG_H

#include <esp_err.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// --- Board Version Selection ---
#define LORA_V1_0_OLED  0
#define LORA_V1_2_OLED  0  
#define LORA_V1_6_OLED  0
#define LORA_V2_0_OLED  1

// --- Node Configuration ---
#define NODE_IS_SENDER  0  // 0 = Receiver, 1 = Sender
#define LORA_FREQUENCY  433  // 433, 868, or 915 MHz

// --- Hardware Pin Definitions ---
#if LORA_V1_0_OLED
    #define OLED_SDA_PIN        GPIO_NUM_4
    #define OLED_SCL_PIN        GPIO_NUM_15
    #define OLED_RST_PIN        GPIO_NUM_16
    #define LORA_MOSI_PIN       GPIO_NUM_27
    #define LORA_MISO_PIN       GPIO_NUM_19
    #define LORA_CLK_PIN        GPIO_NUM_5
    #define LORA_CS_PIN         GPIO_NUM_18
    #define LORA_RST_PIN        GPIO_NUM_14
    #define LORA_DIO0_PIN       GPIO_NUM_26
    #define SDCARD_SUPPORT      0

#elif LORA_V1_2_OLED
    #define OLED_SDA_PIN        GPIO_NUM_21
    #define OLED_SCL_PIN        GPIO_NUM_22
    #define OLED_RST_PIN        GPIO_NUM_-1
    #define LORA_MOSI_PIN       GPIO_NUM_27
    #define LORA_MISO_PIN       GPIO_NUM_19
    #define LORA_CLK_PIN        GPIO_NUM_5
    #define LORA_CS_PIN         GPIO_NUM_18
    #define LORA_RST_PIN        GPIO_NUM_23
    #define LORA_DIO0_PIN       GPIO_NUM_26
    #define SDCARD_SUPPORT      0

#elif LORA_V1_6_OLED
    #define OLED_SDA_PIN        GPIO_NUM_21
    #define OLED_SCL_PIN        GPIO_NUM_22
    #define OLED_RST_PIN        GPIO_NUM_-1
    #define LORA_MOSI_PIN       GPIO_NUM_27
    #define LORA_MISO_PIN       GPIO_NUM_19
    #define LORA_CLK_PIN        GPIO_NUM_5
    #define LORA_CS_PIN         GPIO_NUM_18
    #define LORA_RST_PIN        GPIO_NUM_23
    #define LORA_DIO0_PIN       GPIO_NUM_26
    #define SDCARD_MOSI_PIN     GPIO_NUM_15
    #define SDCARD_MISO_PIN     GPIO_NUM_2
    #define SDCARD_CLK_PIN      GPIO_NUM_14
    #define SDCARD_CS_PIN       GPIO_NUM_13
    #define SDCARD_SUPPORT      1

#elif LORA_V2_0_OLED
    #define OLED_SDA_PIN        GPIO_NUM_21
    #define OLED_SCL_PIN        GPIO_NUM_22
    #define OLED_RST_PIN        GPIO_NUM_-1
    #define LORA_MOSI_PIN       GPIO_NUM_27
    #define LORA_MISO_PIN       GPIO_NUM_19
    #define LORA_CLK_PIN        GPIO_NUM_5
    #define LORA_CS_PIN         GPIO_NUM_18
    #define LORA_RST_PIN        GPIO_NUM_23
    #define LORA_DIO0_PIN       GPIO_NUM_26
    #define SDCARD_MOSI_PIN     GPIO_NUM_15
    #define SDCARD_MISO_PIN     GPIO_NUM_2
    #define SDCARD_CLK_PIN      GPIO_NUM_14
    #define SDCARD_CS_PIN       GPIO_NUM_13
    #define SDCARD_SUPPORT      1
#endif

// --- LoRa Frequency Settings ---
#if LORA_FREQUENCY == 433
    #define LORA_BAND           433E6
#elif LORA_FREQUENCY == 868
    #define LORA_BAND           868E6
#elif LORA_FREQUENCY == 915
    #define LORA_BAND           915E6
#else
    #define LORA_BAND           433E6  // Default
#endif

// --- System Configuration ---
#define MAX_VALVES              4
#define MAX_SENSORS             4
#define SENSOR_READ_INTERVAL    5000    // ms
#define LORA_TX_INTERVAL        10000   // ms
#define COMMAND_QUEUE_SIZE      10
#define MAX_COMMAND_LENGTH      256

// --- Network Configuration ---
#define WIFI_SSID_MAX_LEN       32
#define WIFI_PASSWORD_MAX_LEN   64
#define WIFI_RECONNECT_DELAY    5000    // ms

// --- Sensor Configuration ---
#define SOIL_MOISTURE_THRESHOLD_LOW     30  // %
#define SOIL_MOISTURE_THRESHOLD_HIGH    70  // %
#define TEMPERATURE_THRESHOLD_LOW       10  // °C
#define TEMPERATURE_THRESHOLD_HIGH      40  // °C

// --- Valve Configuration ---
#define VALVE_OPEN_DURATION_DEFAULT     30000   // ms (30 seconds)
#define VALVE_COOLDOWN_PERIOD          300000   // ms (5 minutes)

// --- Error Codes ---
#define NODE_ERR_LORA_INIT_FAILED       0x1001
#define NODE_ERR_WIFI_INIT_FAILED       0x1002
#define NODE_ERR_SENSOR_READ_FAILED     0x1003
#define NODE_ERR_VALVE_CONTROL_FAILED   0x1004
#define NODE_ERR_OLED_INIT_FAILED       0x1005

// --- Configuration Structure ---
typedef struct {
    char wifi_ssid[WIFI_SSID_MAX_LEN];
    char wifi_password[WIFI_PASSWORD_MAX_LEN];
    uint32_t sensor_read_interval_ms;
    uint32_t lora_tx_interval_ms;
    uint16_t soil_moisture_threshold_low;
    uint16_t soil_moisture_threshold_high;
    int16_t temperature_threshold_low;
    int16_t temperature_threshold_high;
    uint32_t valve_open_duration_ms;
    uint32_t valve_cooldown_period_ms;
    bool auto_irrigation_enabled;
    bool wifi_enabled;
    bool lora_enabled;
    bool oled_enabled;
} node_config_t;

// --- Function Prototypes ---
esp_err_t node_config_init(void);
esp_err_t node_config_load(node_config_t *config);
esp_err_t node_config_save(const node_config_t *config);
esp_err_t node_config_reset_to_defaults(void);
esp_err_t node_config_get_defaults(node_config_t *config);

#ifdef __cplusplus
}
#endif

#endif // NODE_CONFIG_H
