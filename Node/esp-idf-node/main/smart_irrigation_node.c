/*
 * Smart Irrigation Node - ESP-IDF Implementation
 * Handles LoRa communication, sensors, and valve control
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <inttypes.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/event_groups.h"
#include "freertos/semphr.h"

#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_err.h"
#include "nvs_flash.h"

#include "driver/gpio.h"
#include "driver/spi_master.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_timer.h"

#include "node_config.h"

static const char *TAG = "IRRIGATION_NODE";

// --- Hardware Configuration ---
#define NUM_VALVES 4
#define VALVE_PINS {GPIO_NUM_16, GPIO_NUM_17, GPIO_NUM_18, GPIO_NUM_19}
#define SOIL_MOISTURE_CHANNELS {ADC_CHANNEL_4, ADC_CHANNEL_5, ADC_CHANNEL_6, ADC_CHANNEL_7}
#define TEMP_SENSOR_CHANNEL ADC_CHANNEL_0

// --- LoRa Configuration ---
#define LORA_MOSI_PIN       GPIO_NUM_27
#define LORA_MISO_PIN       GPIO_NUM_19
#define LORA_CLK_PIN        GPIO_NUM_5
#define LORA_CS_PIN         GPIO_NUM_18
#define LORA_RST_PIN        GPIO_NUM_23
#define LORA_DIO0_PIN       GPIO_NUM_26

// --- OLED Configuration ---
#define OLED_SDA_PIN        GPIO_NUM_21
#define OLED_SCL_PIN        GPIO_NUM_22
#define OLED_RST_PIN        GPIO_NUM_-1
#define OLED_ADDRESS        0x3C

// --- WiFi Configuration ---
#define WIFI_SSID           "Irregation"
#define WIFI_PASSWORD       "9866370727"

// --- Timing Configuration ---
#define SENSOR_READ_INTERVAL_MS     5000
#define LORA_RECEIVE_TIMEOUT_MS     100

// --- System State ---
typedef struct {
    int soil_moisture[NUM_VALVES];
    int temperature;
    bool valve_states[NUM_VALVES];
    bool wifi_connected;
    bool lora_initialized;
} node_state_t;

// --- Global Variables ---
static node_state_t g_node_state = {0};
static adc_oneshot_unit_handle_t adc1_handle = NULL;
static spi_device_handle_t lora_spi_handle = NULL;
static QueueHandle_t lora_command_queue = NULL;
static EventGroupHandle_t wifi_event_group = NULL;
static const int WIFI_CONNECTED_BIT = BIT0;

// --- Function Prototypes ---
static void gpio_init(void);
static void adc_init(void);
static void spi_init(void);
static void wifi_init(void);
static void lora_init(void);
static void oled_init(void);

static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data);
static void sensor_task(void* pvParameters);
static void lora_task(void* pvParameters);
static void valve_control_task(void* pvParameters);

static void read_sensors(void);
static void send_sensor_data(void);
static void control_valve(int valve_index, bool open);
static void parse_lora_command(const char* command);

// --- Main Application ---
void app_main(void)
{
    ESP_LOGI(TAG, "Smart Irrigation Node starting...");

    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize hardware
    gpio_init();
    adc_init();
    spi_init();
    wifi_init();
    lora_init();
    oled_init();

    // Create queues and event groups
    lora_command_queue = xQueueCreate(10, sizeof(char[256]));
    wifi_event_group = xEventGroupCreate();

    // Create tasks
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
    xTaskCreate(lora_task, "lora_task", 4096, NULL, 5, NULL);
    xTaskCreate(valve_control_task, "valve_task", 2048, NULL, 5, NULL);

    ESP_LOGI(TAG, "Smart Irrigation Node initialized successfully");
}

// --- Hardware Initialization ---
static void gpio_init(void)
{
    ESP_LOGI(TAG, "Initializing GPIO...");
    
    // Configure valve pins as outputs
    const int valve_pins[] = VALVE_PINS;
    for (int i = 0; i < NUM_VALVES; i++) {
        gpio_config_t io_conf = {
            .pin_bit_mask = (1ULL << valve_pins[i]),
            .mode = GPIO_MODE_OUTPUT,
            .pull_up_en = GPIO_PULLUP_DISABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type = GPIO_INTR_DISABLE
        };
        gpio_config(&io_conf);
        gpio_set_level(valve_pins[i], 0); // Initially closed
        g_node_state.valve_states[i] = false;
    }

    // Configure LoRa control pins
    gpio_config_t lora_io_conf = {
        .pin_bit_mask = (1ULL << LORA_RST_PIN) | (1ULL << LORA_DIO0_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&lora_io_conf);

    ESP_LOGI(TAG, "GPIO initialized");
}

static void adc_init(void)
{
    ESP_LOGI(TAG, "Initializing ADC...");
    
    // Configure ADC
    adc_oneshot_unit_init_cfg_t init_config = {
        .unit_id = ADC_UNIT_1,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config, &adc1_handle));

    // Configure ADC channels
    adc_oneshot_chan_cfg_t config = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten = ADC_ATTEN_DB_11,
    };
    
    const adc_channel_t channels[] = SOIL_MOISTURE_CHANNELS;
    for (int i = 0; i < NUM_VALVES; i++) {
        ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, channels[i], &config));
    }
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, TEMP_SENSOR_CHANNEL, &config));

    ESP_LOGI(TAG, "ADC initialized");
}

static void spi_init(void)
{
    ESP_LOGI(TAG, "Initializing SPI for LoRa...");
    
    spi_bus_config_t buscfg = {
        .miso_io_num = LORA_MISO_PIN,
        .mosi_io_num = LORA_MOSI_PIN,
        .sclk_io_num = LORA_CLK_PIN,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 4096,
    };

    spi_device_interface_config_t devcfg = {
        .clock_speed_hz = 1000000,  // 1 MHz
        .mode = 0,
        .spics_io_num = LORA_CS_PIN,
        .queue_size = 7,
    };

    // Initialize the SPI bus
    ESP_ERROR_CHECK(spi_bus_initialize(SPI2_HOST, &buscfg, SPI_DMA_CH_AUTO));
    ESP_ERROR_CHECK(spi_bus_add_device(SPI2_HOST, &devcfg, &lora_spi_handle));

    ESP_LOGI(TAG, "SPI initialized for LoRa");
}

static void wifi_init(void)
{
    ESP_LOGI(TAG, "Initializing WiFi...");
    
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASSWORD,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "WiFi initialization complete");
}

static void lora_init(void)
{
    ESP_LOGI(TAG, "Initializing LoRa...");
    
    // Reset LoRa module
    gpio_set_level(LORA_RST_PIN, 0);
    vTaskDelay(pdMS_TO_TICKS(10));
    gpio_set_level(LORA_RST_PIN, 1);
    vTaskDelay(pdMS_TO_TICKS(10));

    // TODO: Initialize LoRa module via SPI
    // This would involve implementing the LoRa protocol
    // For now, just mark as initialized
    g_node_state.lora_initialized = true;

    ESP_LOGI(TAG, "LoRa initialized");
}

static void oled_init(void)
{
    ESP_LOGI(TAG, "Initializing OLED...");
    
    // TODO: Initialize OLED display via I2C
    // This would involve implementing the SSD1306 driver
    
    ESP_LOGI(TAG, "OLED initialized");
}

// --- Event Handlers ---
static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        esp_wifi_connect();
        g_node_state.wifi_connected = false;
        ESP_LOGI(TAG, "WiFi disconnected, trying to reconnect...");
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "WiFi connected, IP: " IPSTR, IP2STR(&event->ip_info.ip));
        g_node_state.wifi_connected = true;
        xEventGroupSetBits(wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

// --- Tasks ---
static void sensor_task(void* pvParameters)
{
    ESP_LOGI(TAG, "Sensor task started");
    
    while (1) {
        read_sensors();
        send_sensor_data();
        vTaskDelay(pdMS_TO_TICKS(SENSOR_READ_INTERVAL_MS));
    }
}

static void lora_task(void* pvParameters)
{
    ESP_LOGI(TAG, "LoRa task started");
    
    char command[256];
    while (1) {
        // TODO: Check for incoming LoRa messages
        // For now, just check the command queue
        if (xQueueReceive(lora_command_queue, command, pdMS_TO_TICKS(LORA_RECEIVE_TIMEOUT_MS)) == pdTRUE) {
            parse_lora_command(command);
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

static void valve_control_task(void* pvParameters)
{
    ESP_LOGI(TAG, "Valve control task started");
    
    while (1) {
        // TODO: Implement automatic valve control logic based on sensor readings
        // For now, just wait
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

// --- Sensor Functions ---
static void read_sensors(void)
{
    const adc_channel_t soil_channels[] = SOIL_MOISTURE_CHANNELS;
    
    // Read soil moisture sensors
    for (int i = 0; i < NUM_VALVES; i++) {
        int raw_value;
        if (adc_oneshot_read(adc1_handle, soil_channels[i], &raw_value) == ESP_OK) {
            g_node_state.soil_moisture[i] = raw_value;
        }
    }
    
    // Read temperature sensor
    int temp_raw;
    if (adc_oneshot_read(adc1_handle, TEMP_SENSOR_CHANNEL, &temp_raw) == ESP_OK) {
        g_node_state.temperature = temp_raw;
    }
    
    ESP_LOGD(TAG, "Sensors read - Soil: [%d,%d,%d,%d], Temp: %d", 
             g_node_state.soil_moisture[0], g_node_state.soil_moisture[1],
             g_node_state.soil_moisture[2], g_node_state.soil_moisture[3],
             g_node_state.temperature);
}

static void send_sensor_data(void)
{
    if (!g_node_state.lora_initialized) {
        return;
    }
    
    // TODO: Implement LoRa transmission
    // Format: "DATA,soil1,soil2,soil3,soil4,temperature"
    char data_packet[256];
    snprintf(data_packet, sizeof(data_packet), "DATA,%d,%d,%d,%d,%d",
             g_node_state.soil_moisture[0], g_node_state.soil_moisture[1],
             g_node_state.soil_moisture[2], g_node_state.soil_moisture[3],
             g_node_state.temperature);
    
    ESP_LOGI(TAG, "Sending sensor data: %s", data_packet);
    // TODO: Actually send via LoRa
}

// --- Control Functions ---
static void control_valve(int valve_index, bool open)
{
    if (valve_index < 0 || valve_index >= NUM_VALVES) {
        ESP_LOGW(TAG, "Invalid valve index: %d", valve_index);
        return;
    }
    
    const int valve_pins[] = VALVE_PINS;
    gpio_set_level(valve_pins[valve_index], open ? 1 : 0);
    g_node_state.valve_states[valve_index] = open;
    
    ESP_LOGI(TAG, "Valve %d %s", valve_index, open ? "OPENED" : "CLOSED");
}

static void parse_lora_command(const char* command)
{
    ESP_LOGI(TAG, "Received command: %s", command);
    
    // Parse command format: "CMD,VALVE,index,action"
    if (strncmp(command, "CMD,VALVE,", 10) == 0) {
        const char* params = command + 10;
        int valve_index = atoi(params);
        
        const char* action_start = strchr(params, ',');
        if (action_start) {
            action_start++; // Skip comma
            bool open = (strcmp(action_start, "ON") == 0);
            control_valve(valve_index, open);
        }
    }
}
