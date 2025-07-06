#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <sys/time.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_sntp.h"
#include "esp_netif.h"

#include "wifi_manager.h"
#include "mqtt_client_manager.h"
#include "sensor_manager.h"
#include "irrigation_controller.h"

static const char *TAG = "SMART_IRRIGATION_MAIN";

// Configuration
#define WIFI_SSID CONFIG_WIFI_SSID
#define WIFI_PASSWORD CONFIG_WIFI_PASSWORD
#define MQTT_BROKER_URL CONFIG_MQTT_BROKER_URL
#define MQTT_USERNAME CONFIG_MQTT_USERNAME
#define MQTT_PASSWORD CONFIG_MQTT_PASSWORD
#define DEVICE_ID CONFIG_DEVICE_ID

// Task handles
TaskHandle_t xSensorTaskHandle = NULL;
TaskHandle_t xIrrigationTaskHandle = NULL;
TaskHandle_t xMqttTaskHandle = NULL;

// Event group for coordination
static EventGroupHandle_t s_wifi_event_group;
static EventGroupHandle_t s_mqtt_event_group;

#define WIFI_CONNECTED_BIT BIT0
#define MQTT_CONNECTED_BIT BIT0

static void time_sync_notification_cb(struct timeval *tv)
{
    ESP_LOGI(TAG, "Notification of a time synchronization event");
}

static void initialize_sntp(void)
{
    ESP_LOGI(TAG, "Initializing SNTP");
    sntp_setoperatingmode(SNTP_OPMODE_POLL);
    sntp_setservername(0, "pool.ntp.org");
    sntp_set_time_sync_notification_cb(time_sync_notification_cb);
    sntp_init();
}

static void sensor_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Starting sensor task");
    
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(30000); // 30 seconds
    
    while (1) {
        // Wait for WiFi connection
        xEventGroupWaitBits(s_wifi_event_group, WIFI_CONNECTED_BIT,
                           false, true, portMAX_DELAY);
        
        // Read sensors
        sensor_data_t sensor_data;
        esp_err_t ret = sensor_manager_read_all(&sensor_data);
        
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Sensor readings - Temp: %.2f°C, Humidity: %.2f%%, Soil: %.2f%%, Water: %.2f%%, Light: %.2f%%",
                     sensor_data.temperature, sensor_data.humidity, sensor_data.soil_moisture, 
                     sensor_data.water_level, sensor_data.light_level);
            
            // Send to MQTT if connected
            if (xEventGroupGetBits(s_mqtt_event_group) & MQTT_CONNECTED_BIT) {
                mqtt_client_publish_sensor_data(&sensor_data);
            }
            
            // Check if irrigation is needed
            irrigation_controller_check_conditions(&sensor_data);
        } else {
            ESP_LOGE(TAG, "Failed to read sensors: %s", esp_err_to_name(ret));
        }
        
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

static void irrigation_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Starting irrigation task");
    
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(10000); // 10 seconds
    
    while (1) {
        // Update irrigation controller
        irrigation_controller_update();
        
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

static void mqtt_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Starting MQTT task");
    
    while (1) {
        // Wait for WiFi connection
        xEventGroupWaitBits(s_wifi_event_group, WIFI_CONNECTED_BIT,
                           false, true, portMAX_DELAY);
        
        if (!(xEventGroupGetBits(s_mqtt_event_group) & MQTT_CONNECTED_BIT)) {
            ESP_LOGI(TAG, "Attempting to connect to MQTT broker");
            esp_err_t ret = mqtt_client_connect();
            if (ret == ESP_OK) {
                xEventGroupSetBits(s_mqtt_event_group, MQTT_CONNECTED_BIT);
                ESP_LOGI(TAG, "Connected to MQTT broker");
            } else {
                ESP_LOGE(TAG, "Failed to connect to MQTT broker: %s", esp_err_to_name(ret));
                vTaskDelay(pdMS_TO_TICKS(5000)); // Wait 5 seconds before retry
            }
        } else {
            // Handle MQTT events
            mqtt_client_handle_events();
        }
        
        vTaskDelay(pdMS_TO_TICKS(1000)); // 1 second delay
    }
}

static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                              int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT) {
        switch (event_id) {
            case WIFI_EVENT_STA_START:
                ESP_LOGI(TAG, "WiFi started, connecting...");
                break;
            case WIFI_EVENT_STA_CONNECTED:
                ESP_LOGI(TAG, "WiFi connected");
                break;
            case WIFI_EVENT_STA_DISCONNECTED:
                ESP_LOGI(TAG, "WiFi disconnected, reconnecting...");
                xEventGroupClearBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
                xEventGroupClearBits(s_mqtt_event_group, MQTT_CONNECTED_BIT);
                wifi_manager_connect();
                break;
            default:
                break;
        }
    } else if (event_base == IP_EVENT) {
        switch (event_id) {
            case IP_EVENT_STA_GOT_IP:
                ESP_LOGI(TAG, "Got IP address, starting time sync");
                xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
                initialize_sntp();
                break;
            default:
                break;
        }
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "Smart Irrigation System Starting...");
    
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    // Initialize network interface
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    
    // Create event groups
    s_wifi_event_group = xEventGroupCreate();
    s_mqtt_event_group = xEventGroupCreate();
    
    // Register event handlers
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL));
    
    // Initialize components
    ESP_LOGI(TAG, "Initializing WiFi manager...");
    ret = wifi_manager_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize WiFi manager: %s", esp_err_to_name(ret));
        return;
    }
    
    ESP_LOGI(TAG, "Initializing sensor manager...");
    ret = sensor_manager_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize sensor manager: %s", esp_err_to_name(ret));
        return;
    }
    
    ESP_LOGI(TAG, "Initializing irrigation controller...");
    ret = irrigation_controller_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize irrigation controller: %s", esp_err_to_name(ret));
        return;
    }
    
    ESP_LOGI(TAG, "Initializing MQTT client...");
    ret = mqtt_client_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client: %s", esp_err_to_name(ret));
        return;
    }
    
    // Connect to WiFi
    ESP_LOGI(TAG, "Connecting to WiFi...");
    ret = wifi_manager_connect();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start WiFi connection: %s", esp_err_to_name(ret));
        return;
    }
    
    // Create application tasks
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, &xSensorTaskHandle);
    xTaskCreate(irrigation_task, "irrigation_task", 4096, NULL, 5, &xIrrigationTaskHandle);
    xTaskCreate(mqtt_task, "mqtt_task", 4096, NULL, 5, &xMqttTaskHandle);
    
    ESP_LOGI(TAG, "Smart Irrigation System initialized successfully");
    
    // Main loop
    while (1) {
        // System status monitoring
        ESP_LOGI(TAG, "System Status - Free heap: %d bytes", 
                 (int)esp_get_free_heap_size());
        
        vTaskDelay(pdMS_TO_TICKS(60000)); // Status every minute
    }
}
