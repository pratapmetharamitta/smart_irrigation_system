#include "irrigation_controller.h"
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "esp_timer.h"

static const char *TAG = "IRRIGATION_CONTROLLER";

// GPIO pin definitions
#define PUMP_RELAY_PIN      GPIO_NUM_2
#define VALVE_RELAY_PIN     GPIO_NUM_15
#define STATUS_LED_PIN      GPIO_NUM_13

// Controller state
static irrigation_state_t s_current_state = IRRIGATION_STATE_IDLE;
static irrigation_config_t s_config = {
    .soil_moisture_threshold = CONFIG_SOIL_MOISTURE_THRESHOLD,
    .irrigation_duration = CONFIG_IRRIGATION_DURATION,
    .min_interval = 3600,  // 1 hour minimum interval
    .auto_mode = true
};

// Timers
static esp_timer_handle_t s_irrigation_timer;
static int64_t s_irrigation_start_time = 0;
static int64_t s_last_irrigation_time = 0;
static int s_remaining_time = 0;

// Function prototypes
static void irrigation_timer_callback(void *arg);
static esp_err_t start_irrigation(int duration);
static esp_err_t stop_irrigation(void);
static esp_err_t update_status_led(void);

esp_err_t irrigation_controller_init(void)
{
    ESP_LOGI(TAG, "Initializing irrigation controller...");
    
    // Configure GPIO pins
    gpio_config_t io_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pin_bit_mask = (1ULL << PUMP_RELAY_PIN) | (1ULL << VALVE_RELAY_PIN) | (1ULL << STATUS_LED_PIN),
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE
    };
    gpio_config(&io_conf);
    
    // Initialize pins to OFF state
    gpio_set_level(PUMP_RELAY_PIN, 0);
    gpio_set_level(VALVE_RELAY_PIN, 0);
    gpio_set_level(STATUS_LED_PIN, 0);
    
    // Create irrigation timer
    const esp_timer_create_args_t irrigation_timer_args = {
        .callback = &irrigation_timer_callback,
        .arg = NULL,
        .name = "irrigation_timer"
    };
    
    esp_err_t ret = esp_timer_create(&irrigation_timer_args, &s_irrigation_timer);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create irrigation timer: %s", esp_err_to_name(ret));
        return ret;
    }
    
    s_current_state = IRRIGATION_STATE_IDLE;
    
    ESP_LOGI(TAG, "Irrigation controller initialized successfully");
    return ESP_OK;
}

static void irrigation_timer_callback(void *arg)
{
    ESP_LOGI(TAG, "Irrigation timer expired, stopping irrigation");
    stop_irrigation();
}

static esp_err_t start_irrigation(int duration)
{
    if (s_current_state == IRRIGATION_STATE_WATERING) {
        ESP_LOGW(TAG, "Irrigation already running");
        return ESP_OK;
    }
    
    ESP_LOGI(TAG, "Starting irrigation for %d seconds", duration);
    
    // Turn on pump and valve
    gpio_set_level(PUMP_RELAY_PIN, 1);
    gpio_set_level(VALVE_RELAY_PIN, 1);
    
    // Start timer
    esp_timer_start_once(s_irrigation_timer, duration * 1000000ULL); // Convert to microseconds
    
    s_irrigation_start_time = esp_timer_get_time();
    s_remaining_time = duration;
    s_current_state = IRRIGATION_STATE_WATERING;
    
    update_status_led();
    
    return ESP_OK;
}

static esp_err_t stop_irrigation(void)
{
    ESP_LOGI(TAG, "Stopping irrigation");
    
    // Turn off pump and valve
    gpio_set_level(PUMP_RELAY_PIN, 0);
    gpio_set_level(VALVE_RELAY_PIN, 0);
    
    // Stop timer
    esp_timer_stop(s_irrigation_timer);
    
    s_last_irrigation_time = esp_timer_get_time();
    s_remaining_time = 0;
    s_current_state = IRRIGATION_STATE_IDLE;
    
    update_status_led();
    
    return ESP_OK;
}

static esp_err_t update_status_led(void)
{
    switch (s_current_state) {
        case IRRIGATION_STATE_IDLE:
            gpio_set_level(STATUS_LED_PIN, 0);
            break;
        case IRRIGATION_STATE_WATERING:
            gpio_set_level(STATUS_LED_PIN, 1);
            break;
        case IRRIGATION_STATE_PAUSED:
            // Blink LED for paused state (implement if needed)
            gpio_set_level(STATUS_LED_PIN, 0);
            break;
        case IRRIGATION_STATE_ERROR:
            // Blink LED rapidly for error state (implement if needed)
            gpio_set_level(STATUS_LED_PIN, 1);
            break;
    }
    
    return ESP_OK;
}

esp_err_t irrigation_controller_update(void)
{
    // Update remaining time
    if (s_current_state == IRRIGATION_STATE_WATERING && s_irrigation_start_time > 0) {
        int64_t elapsed = (esp_timer_get_time() - s_irrigation_start_time) / 1000000;
        s_remaining_time = s_config.irrigation_duration - elapsed;
        if (s_remaining_time < 0) {
            s_remaining_time = 0;
        }
    }
    
    return ESP_OK;
}

esp_err_t irrigation_controller_check_conditions(const sensor_data_t *sensor_data)
{
    if (!s_config.auto_mode) {
        return ESP_OK;
    }
    
    if (s_current_state != IRRIGATION_STATE_IDLE) {
        return ESP_OK;
    }
    
    // Check if enough time has passed since last irrigation
    int64_t current_time = esp_timer_get_time();
    int64_t time_since_last = (current_time - s_last_irrigation_time) / 1000000;
    
    if (time_since_last < s_config.min_interval) {
        ESP_LOGD(TAG, "Not enough time since last irrigation: %lld seconds", time_since_last);
        return ESP_OK;
    }
    
    // Check soil moisture
    if (sensor_data->soil_moisture < s_config.soil_moisture_threshold) {
        ESP_LOGI(TAG, "Soil moisture (%.2f%%) below threshold (%.2f%%), starting irrigation",
                 sensor_data->soil_moisture, s_config.soil_moisture_threshold);
        
        return start_irrigation(s_config.irrigation_duration);
    }
    
    return ESP_OK;
}

esp_err_t irrigation_controller_start_manual(int duration)
{
    if (duration <= 0) {
        duration = s_config.irrigation_duration;
    }
    
    ESP_LOGI(TAG, "Starting manual irrigation for %d seconds", duration);
    return start_irrigation(duration);
}

esp_err_t irrigation_controller_stop(void)
{
    return stop_irrigation();
}

esp_err_t irrigation_controller_pause(void)
{
    if (s_current_state != IRRIGATION_STATE_WATERING) {
        ESP_LOGW(TAG, "Cannot pause: irrigation not running");
        return ESP_FAIL;
    }
    
    ESP_LOGI(TAG, "Pausing irrigation");
    
    // Turn off pump and valve
    gpio_set_level(PUMP_RELAY_PIN, 0);
    gpio_set_level(VALVE_RELAY_PIN, 0);
    
    // Stop timer
    esp_timer_stop(s_irrigation_timer);
    
    s_current_state = IRRIGATION_STATE_PAUSED;
    update_status_led();
    
    return ESP_OK;
}

esp_err_t irrigation_controller_resume(void)
{
    if (s_current_state != IRRIGATION_STATE_PAUSED) {
        ESP_LOGW(TAG, "Cannot resume: irrigation not paused");
        return ESP_FAIL;
    }
    
    ESP_LOGI(TAG, "Resuming irrigation");
    
    // Turn on pump and valve
    gpio_set_level(PUMP_RELAY_PIN, 1);
    gpio_set_level(VALVE_RELAY_PIN, 1);
    
    // Restart timer with remaining time
    if (s_remaining_time > 0) {
        esp_timer_start_once(s_irrigation_timer, s_remaining_time * 1000000ULL);
    }
    
    s_current_state = IRRIGATION_STATE_WATERING;
    update_status_led();
    
    return ESP_OK;
}

irrigation_state_t irrigation_controller_get_state(void)
{
    return s_current_state;
}

esp_err_t irrigation_controller_set_config(const irrigation_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }
    
    memcpy(&s_config, config, sizeof(irrigation_config_t));
    
    ESP_LOGI(TAG, "Configuration updated - Threshold: %.2f%%, Duration: %d seconds, Auto: %s",
             s_config.soil_moisture_threshold, s_config.irrigation_duration,
             s_config.auto_mode ? "enabled" : "disabled");
    
    return ESP_OK;
}

esp_err_t irrigation_controller_get_config(irrigation_config_t *config)
{
    if (config == NULL) {
        return ESP_ERR_INVALID_ARG;
    }
    
    memcpy(config, &s_config, sizeof(irrigation_config_t));
    return ESP_OK;
}

int irrigation_controller_get_remaining_time(void)
{
    return s_remaining_time;
}
