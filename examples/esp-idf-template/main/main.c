#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_err.h"
#include "nvs_flash.h"
#include "esp_sleep.h"
#include "esp_timer.h"

#include "board_config.h"
#include "app_config.h"
#include "EdgeLoRa.h"
#include "EdgeCellular.h"
#include "Sensors.h"

static const char* TAG = "SMART_IRRIGATION";

// Global application state
static app_state_t app_state = APP_STATE_INIT;
static comm_mode_t comm_mode = COMM_MODE_HYBRID;
static power_mode_t power_mode = POWER_MODE_NORMAL;

// Task handles
static TaskHandle_t sensor_task_handle = NULL;
static TaskHandle_t communication_task_handle = NULL;
static TaskHandle_t system_monitor_task_handle = NULL;

// Event group for task synchronization
static EventGroupHandle_t app_event_group;

// Event bits
#define SENSOR_READY_BIT        BIT0
#define LORA_READY_BIT          BIT1
#define CELLULAR_READY_BIT      BIT2
#define DATA_READY_BIT          BIT3
#define TRANSMISSION_DONE_BIT   BIT4
#define ERROR_BIT               BIT5
#define SLEEP_BIT               BIT6

// Function prototypes
static void sensor_task(void *parameter);
static void communication_task(void *parameter);
static void system_monitor_task(void *parameter);
static void init_system(void);
static void init_hardware(void);
static void init_components(void);
static void handle_error(const char* error_msg);
static void enter_deep_sleep(void);
static void print_system_info(void);

void app_main(void)
{
    ESP_LOGI(TAG, "=== Smart Irrigation System Edge Device ===");
    ESP_LOGI(TAG, "Version: %s", APP_VERSION);
    ESP_LOGI(TAG, "Board: T-SIM7000G");
    ESP_LOGI(TAG, "Starting system initialization...");

    // Initialize system
    init_system();
    
    // Initialize hardware
    init_hardware();
    
    // Initialize components
    init_components();
    
    // Print system information
    print_system_info();
    
    // Create event group
    app_event_group = xEventGroupCreate();
    if (app_event_group == NULL) {
        ESP_LOGE(TAG, "Failed to create event group");
        handle_error("Event group creation failed");
        return;
    }
    
    // Create tasks
    ESP_LOGI(TAG, "Creating application tasks...");
    
    // Sensor reading task
    xTaskCreate(sensor_task, 
                "sensor_task", 
                4096, 
                NULL, 
                5, 
                &sensor_task_handle);
    
    // Communication task
    xTaskCreate(communication_task, 
                "comm_task", 
                8192, 
                NULL, 
                4, 
                &communication_task_handle);
    
    // System monitor task
    xTaskCreate(system_monitor_task, 
                "monitor_task", 
                2048, 
                NULL, 
                3, 
                &system_monitor_task_handle);
    
    ESP_LOGI(TAG, "System initialization complete");
    app_state = APP_STATE_IDLE;
    
    // Main application loop
    while (1) {
        switch (app_state) {
            case APP_STATE_IDLE:
                // Wait for sensor data or communication events
                vTaskDelay(pdMS_TO_TICKS(1000));
                break;
                
            case APP_STATE_READING_SENSORS:
                ESP_LOGI(TAG, "Reading sensors...");
                // Sensor reading is handled by sensor task
                vTaskDelay(pdMS_TO_TICKS(100));
                break;
                
            case APP_STATE_TRANSMITTING:
                ESP_LOGI(TAG, "Transmitting data...");
                // Transmission is handled by communication task
                vTaskDelay(pdMS_TO_TICKS(100));
                break;
                
            case APP_STATE_SLEEPING:
                ESP_LOGI(TAG, "Entering sleep mode...");
                enter_deep_sleep();
                break;
                
            case APP_STATE_ERROR:
                ESP_LOGE(TAG, "System in error state");
                vTaskDelay(pdMS_TO_TICKS(5000));
                // Try to recover
                app_state = APP_STATE_IDLE;
                break;
                
            default:
                ESP_LOGW(TAG, "Unknown application state: %d", app_state);
                app_state = APP_STATE_IDLE;
                break;
        }
        
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

static void sensor_task(void *parameter)
{
    ESP_LOGI(TAG, "Sensor task started");
    
    sensor_data_t sensor_data;
    TickType_t last_reading_time = 0;
    
    while (1) {
        TickType_t current_time = xTaskGetTickCount();
        
        // Check if it's time to read sensors
        if (current_time - last_reading_time >= pdMS_TO_TICKS(SENSOR_READING_INTERVAL_MS)) {
            app_state = APP_STATE_READING_SENSORS;
            
            // Read all sensors
            esp_err_t ret = sensors_read_all(&sensor_data);
            if (ret == ESP_OK) {
                ESP_LOGI(TAG, "Sensor readings: Temp=%.2f°C, Humidity=%.2f%%, Soil=%.2f%%",
                         sensor_data.temperature, 
                         sensor_data.humidity, 
                         sensor_data.soil_moisture);
                
                // Set data ready bit
                xEventGroupSetBits(app_event_group, DATA_READY_BIT);
            } else {
                ESP_LOGE(TAG, "Failed to read sensors: %s", esp_err_to_name(ret));
                xEventGroupSetBits(app_event_group, ERROR_BIT);
            }
            
            last_reading_time = current_time;
            app_state = APP_STATE_IDLE;
        }
        
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

static void communication_task(void *parameter)
{
    ESP_LOGI(TAG, "Communication task started");
    
    EventBits_t bits;
    
    while (1) {
        // Wait for data ready event
        bits = xEventGroupWaitBits(app_event_group,
                                   DATA_READY_BIT | ERROR_BIT,
                                   pdTRUE,
                                   pdFALSE,
                                   portMAX_DELAY);
        
        if (bits & DATA_READY_BIT) {
            app_state = APP_STATE_TRANSMITTING;
            
            // Transmit data based on communication mode
            esp_err_t ret = ESP_OK;
            
            switch (comm_mode) {
                case COMM_MODE_LORA_ONLY:
                    ret = edge_lora_transmit_data();
                    break;
                    
                case COMM_MODE_CELLULAR_ONLY:
                    ret = edge_cellular_transmit_data();
                    break;
                    
                case COMM_MODE_HYBRID:
                    // Try LoRa first, then cellular as backup
                    ret = edge_lora_transmit_data();
                    if (ret != ESP_OK) {
                        ESP_LOGW(TAG, "LoRa transmission failed, trying cellular...");
                        ret = edge_cellular_transmit_data();
                    }
                    break;
                    
                case COMM_MODE_AUTO:
                    // Auto-select based on conditions
                    // TODO: Implement auto-selection logic
                    ret = edge_lora_transmit_data();
                    break;
            }
            
            if (ret == ESP_OK) {
                ESP_LOGI(TAG, "Data transmitted successfully");
                xEventGroupSetBits(app_event_group, TRANSMISSION_DONE_BIT);
            } else {
                ESP_LOGE(TAG, "Data transmission failed: %s", esp_err_to_name(ret));
                xEventGroupSetBits(app_event_group, ERROR_BIT);
            }
            
            app_state = APP_STATE_IDLE;
        }
        
        if (bits & ERROR_BIT) {
            ESP_LOGE(TAG, "Error detected in communication task");
            // Handle error
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

static void system_monitor_task(void *parameter)
{
    ESP_LOGI(TAG, "System monitor task started");
    
    while (1) {
        // Monitor system health
        size_t free_heap = esp_get_free_heap_size();
        size_t min_free_heap = esp_get_minimum_free_heap_size();
        
        ESP_LOGI(TAG, "Free heap: %d bytes, Min free heap: %d bytes", 
                 free_heap, min_free_heap);
        
        // Check if we need to enter power saving mode
        if (power_mode == POWER_MODE_LOW_POWER && free_heap < 10000) {
            ESP_LOGW(TAG, "Low memory detected, entering deep sleep");
            xEventGroupSetBits(app_event_group, SLEEP_BIT);
            app_state = APP_STATE_SLEEPING;
        }
        
        // Monitor for 30 seconds
        vTaskDelay(pdMS_TO_TICKS(30000));
    }
}

static void init_system(void)
{
    ESP_LOGI(TAG, "Initializing system...");
    
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    ESP_LOGI(TAG, "NVS initialized");
}

static void init_hardware(void)
{
    ESP_LOGI(TAG, "Initializing hardware...");
    
    // Initialize GPIOs
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << LED_PIN) | (1ULL << SENSOR_POWER_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&io_conf);
    
    // Initialize button
    io_conf.pin_bit_mask = (1ULL << BUTTON_PIN);
    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_up_en = GPIO_PULLUP_ENABLE;
    gpio_config(&io_conf);
    
    // Turn on sensor power
    gpio_set_level(SENSOR_POWER_PIN, 1);
    
    ESP_LOGI(TAG, "Hardware initialized");
}

static void init_components(void)
{
    ESP_LOGI(TAG, "Initializing components...");
    
    // Initialize sensors
    esp_err_t ret = sensors_init();
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "Sensors initialized");
        xEventGroupSetBits(app_event_group, SENSOR_READY_BIT);
    } else {
        ESP_LOGE(TAG, "Failed to initialize sensors: %s", esp_err_to_name(ret));
    }
    
    // Initialize LoRa
    lora_config_t lora_config = {
        .frequency = DEFAULT_LORA_FREQUENCY,
        .spreading_factor = DEFAULT_LORA_SPREADING_FACTOR,
        .bandwidth = DEFAULT_LORA_BANDWIDTH,
        .coding_rate = DEFAULT_LORA_CODING_RATE,
        .tx_power = DEFAULT_LORA_TX_POWER
    };
    
    ret = edge_lora_init(&lora_config);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "LoRa initialized");
        xEventGroupSetBits(app_event_group, LORA_READY_BIT);
    } else {
        ESP_LOGE(TAG, "Failed to initialize LoRa: %s", esp_err_to_name(ret));
    }
    
    // Initialize cellular
    cellular_config_t cellular_config = {
        .apn = "internet",
        .username = "",
        .password = ""
    };
    
    ret = edge_cellular_init(&cellular_config);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "Cellular initialized");
        xEventGroupSetBits(app_event_group, CELLULAR_READY_BIT);
    } else {
        ESP_LOGE(TAG, "Failed to initialize cellular: %s", esp_err_to_name(ret));
    }
    
    ESP_LOGI(TAG, "Components initialized");
}

static void handle_error(const char* error_msg)
{
    ESP_LOGE(TAG, "System error: %s", error_msg);
    
    // Flash LED to indicate error
    for (int i = 0; i < 10; i++) {
        gpio_set_level(LED_PIN, 1);
        vTaskDelay(pdMS_TO_TICKS(100));
        gpio_set_level(LED_PIN, 0);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
    
    // Set error state
    app_state = APP_STATE_ERROR;
}

static void enter_deep_sleep(void)
{
    ESP_LOGI(TAG, "Preparing for deep sleep...");
    
    // Clean up resources
    if (sensor_task_handle) {
        vTaskDelete(sensor_task_handle);
    }
    if (communication_task_handle) {
        vTaskDelete(communication_task_handle);
    }
    if (system_monitor_task_handle) {
        vTaskDelete(system_monitor_task_handle);
    }
    
    // Deinitialize components
    edge_lora_deinit();
    edge_cellular_deinit();
    sensors_deinit();
    
    // Configure wake up source
    esp_sleep_enable_timer_wakeup(DEEP_SLEEP_DURATION_MS * 1000);
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 0);
    
    ESP_LOGI(TAG, "Entering deep sleep for %d ms", DEEP_SLEEP_DURATION_MS);
    esp_deep_sleep_start();
}

static void print_system_info(void)
{
    ESP_LOGI(TAG, "=== System Information ===");
    ESP_LOGI(TAG, "Chip: %s", CONFIG_IDF_TARGET);
    ESP_LOGI(TAG, "IDF Version: %s", esp_get_idf_version());
    
    esp_chip_info_t chip_info;
    esp_chip_info(&chip_info);
    ESP_LOGI(TAG, "Chip cores: %d", chip_info.cores);
    ESP_LOGI(TAG, "Chip revision: %d", chip_info.revision);
    ESP_LOGI(TAG, "Flash size: %dMB", spi_flash_get_chip_size() / (1024 * 1024));
    
    ESP_LOGI(TAG, "Free heap: %d bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "========================");
}
