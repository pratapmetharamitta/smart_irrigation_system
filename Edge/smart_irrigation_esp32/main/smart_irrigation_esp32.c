/*
 * Smart Irrigation System - ESP-IDF Main Application
 * 
 * This is the main application for the Smart Irrigation System using ESP-IDF.
 * It provides automated irrigation control based on soil moisture sensors,
 * with WiFi connectivity and MQTT communication to cloud services.
 * 
 * Features:
 * - Soil moisture monitoring (analog sensor)
 * - Temperature and humidity sensing (DHT22)
 * - Soil temperature monitoring (DS18B20)
 * - WiFi connectivity with auto-reconnection
 * - MQTT communication with cloud backend
 * - Automated pump/valve control with safety features
 * - Manual override via button
 * - Real-time data logging and status reporting
 * - Persistent configuration storage
 * 
 * Hardware:
 * - ESP32 (T-SIM7000G board)
 * - Soil moisture sensor (analog)
 * - DHT22 temperature/humidity sensor
 * - DS18B20 soil temperature sensor
 * - Pump relay (GPIO5)
 * - Valve relay (GPIO18)
 * - Status LED (GPIO13)
 * - Manual button (GPIO0)
 * 
 * Author: Smart Irrigation Team
 * Date: 2025
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/event_groups.h>
#include <freertos/queue.h>
#include <esp_system.h>
#include <esp_wifi.h>
#include <esp_event.h>
#include <esp_log.h>
#include <nvs_flash.h>
#include <esp_timer.h>
#include <driver/gpio.h>
#include <driver/adc.h>
#include <mqtt_client.h>
#include <cJSON.h>
#include <esp_netif.h>
#include <esp_http_client.h>

// Configuration constants
#define WIFI_SSID               "YOUR_WIFI_SSID"
#define WIFI_PASSWORD           "YOUR_WIFI_PASSWORD"
#define MQTT_BROKER_URI         "mqtt://your-broker.com:1883"
#define MQTT_USERNAME           "your_mqtt_user"
#define MQTT_PASSWORD           "your_mqtt_password"
#define DEVICE_ID               "irrigation_system_001"

// Pin definitions
#define SOIL_MOISTURE_ADC_CH    ADC1_CHANNEL_0  // GPIO36
#define DHT22_PIN               GPIO_NUM_4
#define DS18B20_PIN             GPIO_NUM_2
#define PUMP_RELAY_PIN          GPIO_NUM_5
#define VALVE_RELAY_PIN         GPIO_NUM_18
#define STATUS_LED_PIN          GPIO_NUM_13
#define BUTTON_PIN              GPIO_NUM_0

// System configuration
#define SOIL_MOISTURE_THRESHOLD     30      // Percentage below which irrigation starts
#define MAX_IRRIGATION_TIME_MS      300000  // 5 minutes maximum irrigation time
#define SENSOR_READ_INTERVAL_MS     30000   // Read sensors every 30 seconds
#define MQTT_PUBLISH_INTERVAL_MS    60000   // Publish data every minute
#define MIN_IRRIGATION_INTERVAL_MS  1800000 // Minimum 30 minutes between irrigation cycles

// Event bits
#define WIFI_CONNECTED_BIT      BIT0
#define MQTT_CONNECTED_BIT      BIT1
#define SENSOR_READ_BIT         BIT2
#define IRRIGATION_STOP_BIT     BIT3
#define BUTTON_PRESSED_BIT      BIT4

// System state structure
typedef struct {
    float soil_moisture;
    float air_temperature;
    float air_humidity;
    float soil_temperature;
    bool pump_status;
    bool valve_status;
    bool manual_mode;
    bool irrigation_active;
    uint64_t last_irrigation_time;
    uint64_t irrigation_start_time;
    uint32_t irrigation_cycles;
    uint32_t total_irrigation_time;
    bool wifi_connected;
    bool mqtt_connected;
} system_state_t;

// Global variables
static const char *TAG = "SMART_IRRIGATION";
static system_state_t g_system_state = {0};
static EventGroupHandle_t s_event_group;
static QueueHandle_t s_sensor_queue;
static esp_mqtt_client_handle_t s_mqtt_client;
static esp_timer_handle_t s_sensor_timer;
static esp_timer_handle_t s_publish_timer;
static esp_timer_handle_t s_safety_timer;

// Function prototypes
static void system_init(void);
static void gpio_init(void);
static void adc_init(void);
static void wifi_init(void);
static void mqtt_init(void);
static void timer_init(void);
static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data);
static void mqtt_event_handler(void* handler_args, esp_event_base_t base, int32_t event_id, void* event_data);
static void sensor_timer_callback(void* arg);
static void publish_timer_callback(void* arg);
static void safety_timer_callback(void* arg);
static void sensor_task(void* pvParameters);
static void irrigation_task(void* pvParameters);
static void button_task(void* pvParameters);
static void mqtt_task(void* pvParameters);
static float read_soil_moisture(void);
static void read_dht22(float* temperature, float* humidity);
static float read_ds18b20_temperature(void);
static void start_irrigation(void);
static void stop_irrigation(void);
static void toggle_manual_mode(void);
static void publish_sensor_data(void);
static void publish_status(const char* status);
static void handle_mqtt_command(const char* topic, const char* data);
static void dht22_send_start_signal(void);
static bool dht22_wait_for_response(void);
static uint8_t dht22_read_byte(void);
static bool ds18b20_reset(void);
static void ds18b20_write_byte(uint8_t data);
static uint8_t ds18b20_read_byte(void);

// Main application entry point
void app_main(void) {
    ESP_LOGI(TAG, "Smart Irrigation System Starting...");
    
    // Initialize system
    system_init();
    
    // Initialize hardware
    gpio_init();
    adc_init();
    
    // Initialize connectivity
    wifi_init();
    mqtt_init();
    
    // Initialize timers
    timer_init();
    
    // Create tasks
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
    xTaskCreate(irrigation_task, "irrigation_task", 4096, NULL, 6, NULL);
    xTaskCreate(button_task, "button_task", 2048, NULL, 4, NULL);
    xTaskCreate(mqtt_task, "mqtt_task", 4096, NULL, 5, NULL);
    
    // Turn on status LED
    gpio_set_level(STATUS_LED_PIN, 1);
    
    ESP_LOGI(TAG, "System initialized successfully!");
    
    // Start timers
    esp_timer_start_periodic(s_sensor_timer, SENSOR_READ_INTERVAL_MS * 1000);
    esp_timer_start_periodic(s_publish_timer, MQTT_PUBLISH_INTERVAL_MS * 1000);
    
    // Main loop - monitor system health
    while (1) {
        // Blink status LED to show system is alive
        gpio_set_level(STATUS_LED_PIN, 0);
        vTaskDelay(pdMS_TO_TICKS(100));
        gpio_set_level(STATUS_LED_PIN, 1);
        vTaskDelay(pdMS_TO_TICKS(30000)); // Check every 30 seconds
    }
}

static void system_init(void) {
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    // Initialize system state
    memset(&g_system_state, 0, sizeof(system_state_t));
    g_system_state.manual_mode = false;
    g_system_state.irrigation_active = false;
    
    // Create event group and queue
    s_event_group = xEventGroupCreate();
    s_sensor_queue = xQueueCreate(10, sizeof(system_state_t));
    
    ESP_LOGI(TAG, "System core initialized");
}

static void gpio_init(void) {
    // Configure relay pins
    gpio_config_t relay_config = {
        .pin_bit_mask = (1ULL << PUMP_RELAY_PIN) | (1ULL << VALVE_RELAY_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&relay_config);
    
    // Configure status LED
    gpio_config_t led_config = {
        .pin_bit_mask = (1ULL << STATUS_LED_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&led_config);
    
    // Configure button
    gpio_config_t button_config = {
        .pin_bit_mask = (1ULL << BUTTON_PIN),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&button_config);
    
    // Configure DHT22 and DS18B20 pins
    gpio_config_t sensor_config = {
        .pin_bit_mask = (1ULL << DHT22_PIN) | (1ULL << DS18B20_PIN),
        .mode = GPIO_MODE_INPUT_OUTPUT_OD,
        .pull_up_en = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&sensor_config);
    
    // Set initial states
    gpio_set_level(PUMP_RELAY_PIN, 0);
    gpio_set_level(VALVE_RELAY_PIN, 0);
    gpio_set_level(STATUS_LED_PIN, 0);
    
    ESP_LOGI(TAG, "GPIO initialized");
}

static void adc_init(void) {
    // Configure ADC
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(SOIL_MOISTURE_ADC_CH, ADC_ATTEN_DB_11);
    
    ESP_LOGI(TAG, "ADC initialized");
}

static void wifi_init(void) {
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
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
            .pmf_cfg = {
                .capable = true,
                .required = false
            },
        },
    };
    
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    
    ESP_LOGI(TAG, "WiFi initialized");
}

static void mqtt_init(void) {
    esp_mqtt_client_config_t mqtt_cfg = {
        .uri = MQTT_BROKER_URI,
        .username = MQTT_USERNAME,
        .password = MQTT_PASSWORD,
        .client_id = DEVICE_ID,
    };
    
    s_mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_register_event(s_mqtt_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    
    ESP_LOGI(TAG, "MQTT initialized");
}

static void timer_init(void) {
    // Sensor read timer
    const esp_timer_create_args_t sensor_timer_args = {
        .callback = &sensor_timer_callback,
        .name = "sensor_timer"
    };
    ESP_ERROR_CHECK(esp_timer_create(&sensor_timer_args, &s_sensor_timer));
    
    // Publish timer
    const esp_timer_create_args_t publish_timer_args = {
        .callback = &publish_timer_callback,
        .name = "publish_timer"
    };
    ESP_ERROR_CHECK(esp_timer_create(&publish_timer_args, &s_publish_timer));
    
    // Safety timer
    const esp_timer_create_args_t safety_timer_args = {
        .callback = &safety_timer_callback,
        .name = "safety_timer"
    };
    ESP_ERROR_CHECK(esp_timer_create(&safety_timer_args, &s_safety_timer));
    
    ESP_LOGI(TAG, "Timers initialized");
}

static void wifi_event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        g_system_state.wifi_connected = false;
        xEventGroupClearBits(s_event_group, WIFI_CONNECTED_BIT);
        esp_wifi_connect();
        ESP_LOGI(TAG, "WiFi disconnected, trying to reconnect...");
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        g_system_state.wifi_connected = true;
        xEventGroupSetBits(s_event_group, WIFI_CONNECTED_BIT);
        
        // Start MQTT client when WiFi is connected
        esp_mqtt_client_start(s_mqtt_client);
    }
}

static void mqtt_event_handler(void* handler_args, esp_event_base_t base, int32_t event_id, void* event_data) {
    esp_mqtt_event_handle_t event = event_data;
    
    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT connected");
            g_system_state.mqtt_connected = true;
            xEventGroupSetBits(s_event_group, MQTT_CONNECTED_BIT);
            
            // Subscribe to command topics
            esp_mqtt_client_subscribe(s_mqtt_client, "irrigation/commands", 1);
            esp_mqtt_client_subscribe(s_mqtt_client, "irrigation/config", 1);
            
            // Publish online status
            publish_status("online");
            break;
            
        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "MQTT disconnected");
            g_system_state.mqtt_connected = false;
            xEventGroupClearBits(s_event_group, MQTT_CONNECTED_BIT);
            break;
            
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT data received");
            // Create null-terminated strings
            char topic[256];
            char data[1024];
            int topic_len = event->topic_len < sizeof(topic) - 1 ? event->topic_len : sizeof(topic) - 1;
            int data_len = event->data_len < sizeof(data) - 1 ? event->data_len : sizeof(data) - 1;
            
            memcpy(topic, event->topic, topic_len);
            memcpy(data, event->data, data_len);
            topic[topic_len] = '\0';
            data[data_len] = '\0';
            
            handle_mqtt_command(topic, data);
            break;
            
        case MQTT_EVENT_ERROR:
            ESP_LOGI(TAG, "MQTT error");
            break;
            
        default:
            break;
    }
}

static void sensor_timer_callback(void* arg) {
    xEventGroupSetBits(s_event_group, SENSOR_READ_BIT);
}

static void publish_timer_callback(void* arg) {
    if (g_system_state.mqtt_connected) {
        publish_sensor_data();
    }
}

static void safety_timer_callback(void* arg) {
    ESP_LOGW(TAG, "Safety timer triggered - stopping irrigation");
    xEventGroupSetBits(s_event_group, IRRIGATION_STOP_BIT);
}

static void sensor_task(void* pvParameters) {
    while (1) {
        EventBits_t bits = xEventGroupWaitBits(s_event_group, SENSOR_READ_BIT, pdTRUE, pdFALSE, portMAX_DELAY);
        
        if (bits & SENSOR_READ_BIT) {
            // Read all sensors
            g_system_state.soil_moisture = read_soil_moisture();
            read_dht22(&g_system_state.air_temperature, &g_system_state.air_humidity);
            g_system_state.soil_temperature = read_ds18b20_temperature();
            
            // Send data to irrigation task
            xQueueSend(s_sensor_queue, &g_system_state, pdMS_TO_TICKS(1000));
            
            ESP_LOGI(TAG, "Sensors - Soil: %.1f%%, Air: %.1f°C/%.1f%%, Soil Temp: %.1f°C", 
                g_system_state.soil_moisture, g_system_state.air_temperature, 
                g_system_state.air_humidity, g_system_state.soil_temperature);
        }
    }
}

static void irrigation_task(void* pvParameters) {
    system_state_t sensor_data;
    
    while (1) {
        // Wait for sensor data or stop irrigation event
        EventBits_t bits = xEventGroupWaitBits(s_event_group, IRRIGATION_STOP_BIT, pdTRUE, pdFALSE, pdMS_TO_TICKS(1000));
        
        if (bits & IRRIGATION_STOP_BIT) {
            stop_irrigation();
            continue;
        }
        
        // Check for new sensor data
        if (xQueueReceive(s_sensor_queue, &sensor_data, 0) == pdTRUE) {
            if (!g_system_state.manual_mode) {
                // Automatic irrigation control
                if (!g_system_state.irrigation_active && 
                    sensor_data.soil_moisture < SOIL_MOISTURE_THRESHOLD) {
                    
                    // Check minimum interval between irrigation cycles
                    uint64_t current_time = esp_timer_get_time();
                    if (current_time - g_system_state.last_irrigation_time > MIN_IRRIGATION_INTERVAL_MS * 1000) {
                        start_irrigation();
                    }
                }
                
                // Stop irrigation when moisture is adequate
                if (g_system_state.irrigation_active && 
                    sensor_data.soil_moisture > (SOIL_MOISTURE_THRESHOLD + 10)) {
                    stop_irrigation();
                }
            }
        }
        
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

static void button_task(void* pvParameters) {
    bool last_state = true;
    uint32_t last_change = 0;
    
    while (1) {
        bool current_state = gpio_get_level(BUTTON_PIN);
        uint32_t current_time = xTaskGetTickCount() * portTICK_PERIOD_MS;
        
        if (current_state != last_state) {
            last_change = current_time;
        }
        
        // Debounce button press
        if ((current_time - last_change) > 50 && current_state == false && last_state == true) {
            ESP_LOGI(TAG, "Button pressed - toggling manual mode");
            toggle_manual_mode();
            xEventGroupSetBits(s_event_group, BUTTON_PRESSED_BIT);
        }
        
        last_state = current_state;
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

static void mqtt_task(void* pvParameters) {
    while (1) {
        // Wait for WiFi connection
        xEventGroupWaitBits(s_event_group, WIFI_CONNECTED_BIT, pdFALSE, pdFALSE, portMAX_DELAY);
        
        // If MQTT is not connected, try to reconnect
        if (!g_system_state.mqtt_connected) {
            ESP_LOGI(TAG, "Attempting MQTT reconnection...");
            esp_mqtt_client_reconnect(s_mqtt_client);
        }
        
        vTaskDelay(pdMS_TO_TICKS(30000)); // Check every 30 seconds
    }
}

static float read_soil_moisture(void) {
    uint32_t adc_reading = 0;
    for (int i = 0; i < 10; i++) {
        adc_reading += adc1_get_raw(SOIL_MOISTURE_ADC_CH);
    }
    adc_reading /= 10;
    
    // Convert to percentage (adjust these values based on your sensor calibration)
    float moisture = 100.0 - ((float)adc_reading / 4095.0) * 100.0;
    return moisture > 0 ? moisture : 0;
}

static void read_dht22(float* temperature, float* humidity) {
    // Simplified DHT22 reading - in production, use proper bit-timing
    *temperature = 25.0; // Default values - implement proper DHT22 protocol
    *humidity = 60.0;
}

static float read_ds18b20_temperature(void) {
    // Simplified DS18B20 reading - in production, use proper 1-wire protocol
    return 20.0; // Default value - implement proper DS18B20 protocol
}

static void start_irrigation(void) {
    ESP_LOGI(TAG, "Starting irrigation");
    
    g_system_state.irrigation_active = true;
    g_system_state.irrigation_start_time = esp_timer_get_time();
    g_system_state.pump_status = true;
    g_system_state.valve_status = true;
    
    // Turn on relays
    gpio_set_level(PUMP_RELAY_PIN, 1);
    gpio_set_level(VALVE_RELAY_PIN, 1);
    
    // Start safety timer
    esp_timer_start_once(s_safety_timer, MAX_IRRIGATION_TIME_MS * 1000);
    
    publish_status("irrigating");
}

static void stop_irrigation(void) {
    ESP_LOGI(TAG, "Stopping irrigation");
    
    g_system_state.irrigation_active = false;
    g_system_state.last_irrigation_time = esp_timer_get_time();
    g_system_state.pump_status = false;
    g_system_state.valve_status = false;
    
    // Turn off relays
    gpio_set_level(PUMP_RELAY_PIN, 0);
    gpio_set_level(VALVE_RELAY_PIN, 0);
    
    // Stop safety timer
    esp_timer_stop(s_safety_timer);
    
    // Update statistics
    g_system_state.irrigation_cycles++;
    uint32_t duration = (uint32_t)((g_system_state.last_irrigation_time - g_system_state.irrigation_start_time) / 1000000);
    g_system_state.total_irrigation_time += duration;
    
    publish_status("idle");
}

static void toggle_manual_mode(void) {
    g_system_state.manual_mode = !g_system_state.manual_mode;
    
    if (g_system_state.manual_mode) {
        ESP_LOGI(TAG, "Manual mode activated");
        start_irrigation();
    } else {
        ESP_LOGI(TAG, "Automatic mode activated");
        stop_irrigation();
    }
    
    publish_status(g_system_state.manual_mode ? "manual" : "auto");
}

static void publish_sensor_data(void) {
    cJSON *json = cJSON_CreateObject();
    cJSON *device_id = cJSON_CreateString(DEVICE_ID);
    cJSON *timestamp = cJSON_CreateNumber(esp_timer_get_time() / 1000);
    cJSON *soil_moisture = cJSON_CreateNumber(g_system_state.soil_moisture);
    cJSON *air_temperature = cJSON_CreateNumber(g_system_state.air_temperature);
    cJSON *air_humidity = cJSON_CreateNumber(g_system_state.air_humidity);
    cJSON *soil_temperature = cJSON_CreateNumber(g_system_state.soil_temperature);
    cJSON *pump_status = cJSON_CreateBool(g_system_state.pump_status);
    cJSON *valve_status = cJSON_CreateBool(g_system_state.valve_status);
    cJSON *manual_mode = cJSON_CreateBool(g_system_state.manual_mode);
    cJSON *irrigation_active = cJSON_CreateBool(g_system_state.irrigation_active);
    
    cJSON_AddItemToObject(json, "device_id", device_id);
    cJSON_AddItemToObject(json, "timestamp", timestamp);
    cJSON_AddItemToObject(json, "soil_moisture", soil_moisture);
    cJSON_AddItemToObject(json, "air_temperature", air_temperature);
    cJSON_AddItemToObject(json, "air_humidity", air_humidity);
    cJSON_AddItemToObject(json, "soil_temperature", soil_temperature);
    cJSON_AddItemToObject(json, "pump_status", pump_status);
    cJSON_AddItemToObject(json, "valve_status", valve_status);
    cJSON_AddItemToObject(json, "manual_mode", manual_mode);
    cJSON_AddItemToObject(json, "irrigation_active", irrigation_active);
    
    char *json_string = cJSON_Print(json);
    esp_mqtt_client_publish(s_mqtt_client, "irrigation/data", json_string, 0, 0, 0);
    
    ESP_LOGI(TAG, "Sensor data published");
    
    free(json_string);
    cJSON_Delete(json);
}

static void publish_status(const char* status) {
    cJSON *json = cJSON_CreateObject();
    cJSON *device_id = cJSON_CreateString(DEVICE_ID);
    cJSON *status_json = cJSON_CreateString(status);
    cJSON *timestamp = cJSON_CreateNumber(esp_timer_get_time() / 1000);
    
    cJSON_AddItemToObject(json, "device_id", device_id);
    cJSON_AddItemToObject(json, "status", status_json);
    cJSON_AddItemToObject(json, "timestamp", timestamp);
    
    char *json_string = cJSON_Print(json);
    esp_mqtt_client_publish(s_mqtt_client, "irrigation/status", json_string, 0, 0, 0);
    
    ESP_LOGI(TAG, "Status published: %s", status);
    
    free(json_string);
    cJSON_Delete(json);
}

static void handle_mqtt_command(const char* topic, const char* data) {
    ESP_LOGI(TAG, "MQTT command received: %s", data);
    
    cJSON *json = cJSON_Parse(data);
    if (json == NULL) {
        ESP_LOGE(TAG, "Failed to parse JSON command");
        return;
    }
    
    if (strcmp(topic, "irrigation/commands") == 0) {
        cJSON *command = cJSON_GetObjectItem(json, "command");
        if (cJSON_IsString(command)) {
            const char *cmd = command->valuestring;
            
            if (strcmp(cmd, "start_irrigation") == 0) {
                g_system_state.manual_mode = true;
                start_irrigation();
            } else if (strcmp(cmd, "stop_irrigation") == 0) {
                stop_irrigation();
            } else if (strcmp(cmd, "set_manual_mode") == 0) {
                cJSON *value = cJSON_GetObjectItem(json, "value");
                if (cJSON_IsBool(value)) {
                    g_system_state.manual_mode = cJSON_IsTrue(value);
                }
            } else if (strcmp(cmd, "get_status") == 0) {
                publish_sensor_data();
            }
        }
    }
    
    cJSON_Delete(json);
}
