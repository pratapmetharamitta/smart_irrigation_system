#include "Sensors.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/adc.h"
#include "esp_adc_cal.h"
#include <string.h>
#include <time.h>

static const char* TAG = "Sensors";
static bool sensors_initialized = false;
static sensor_config_t sensor_config;
static sensor_status_t sensor_status[SENSOR_TYPE_MAX];

// Sensor type names
static const char* sensor_type_names[SENSOR_TYPE_MAX] = {
    "Temperature",
    "Humidity",
    "Soil Moisture",
    "Light",
    "pH",
    "Conductivity",
    "Pressure",
    "Battery Voltage"
};

// Private function declarations
static esp_err_t init_adc(void);
static float read_temperature(void);
static float read_humidity(void);
static float read_soil_moisture(void);
static float read_light(void);
static float read_ph(void);
static float read_conductivity(void);
static float read_pressure(void);
static float read_battery_voltage(void);
static void update_sensor_statistics(sensor_type_t type, float value);

esp_err_t sensors_init(void)
{
    ESP_LOGI(TAG, "Initializing sensors...");
    
    if (sensors_initialized) {
        ESP_LOGW(TAG, "Sensors already initialized");
        return ESP_OK;
    }
    
    // Initialize default configuration
    memset(&sensor_config, 0, sizeof(sensor_config_t));
    sensor_config.read_interval_ms = 5000;  // 5 seconds
    sensor_config.calibration_samples = 10;
    
    // Enable all sensors by default
    for (int i = 0; i < SENSOR_TYPE_MAX; i++) {
        sensor_config.enabled[i] = true;
        sensor_config.calibration_offsets[i] = 0.0f;
        sensor_config.calibration_scales[i] = 1.0f;
        
        // Initialize sensor status
        memset(&sensor_status[i], 0, sizeof(sensor_status_t));
        sensor_status[i].min_value = 999999.0f;
        sensor_status[i].max_value = -999999.0f;
    }
    
    // Initialize ADC
    esp_err_t ret = init_adc();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize ADC: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // TODO: Initialize I2C for digital sensors
    // TODO: Initialize specific sensor ICs (DHT22, etc.)
    
    sensors_initialized = true;
    ESP_LOGI(TAG, "Sensors initialized successfully");
    
    return ESP_OK;
}

esp_err_t sensors_deinit(void)
{
    ESP_LOGI(TAG, "Deinitializing sensors...");
    
    if (!sensors_initialized) {
        ESP_LOGW(TAG, "Sensors not initialized");
        return ESP_ERR_INVALID_STATE;
    }
    
    // TODO: Deinitialize sensor hardware
    
    sensors_initialized = false;
    ESP_LOGI(TAG, "Sensors deinitialized");
    
    return ESP_OK;
}

esp_err_t sensors_read_all(sensor_data_t* data)
{
    if (!sensors_initialized) {
        ESP_LOGE(TAG, "Sensors not initialized");
        return ESP_ERR_INVALID_STATE;
    }
    
    if (data == NULL) {
        ESP_LOGE(TAG, "Data is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    ESP_LOGI(TAG, "Reading all sensors...");
    
    // Clear data structure
    memset(data, 0, sizeof(sensor_data_t));
    
    // Read each sensor
    data->temperature = read_temperature();
    data->humidity = read_humidity();
    data->soil_moisture = read_soil_moisture();
    data->light = read_light();
    data->ph = read_ph();
    data->conductivity = read_conductivity();
    data->pressure = read_pressure();
    data->battery_voltage = read_battery_voltage();
    
    // Set timestamp
    data->timestamp = time(NULL);
    
    // Update statistics
    update_sensor_statistics(SENSOR_TYPE_TEMPERATURE, data->temperature);
    update_sensor_statistics(SENSOR_TYPE_HUMIDITY, data->humidity);
    update_sensor_statistics(SENSOR_TYPE_SOIL_MOISTURE, data->soil_moisture);
    update_sensor_statistics(SENSOR_TYPE_LIGHT, data->light);
    update_sensor_statistics(SENSOR_TYPE_PH, data->ph);
    update_sensor_statistics(SENSOR_TYPE_CONDUCTIVITY, data->conductivity);
    update_sensor_statistics(SENSOR_TYPE_PRESSURE, data->pressure);
    update_sensor_statistics(SENSOR_TYPE_BATTERY_VOLTAGE, data->battery_voltage);
    
    ESP_LOGI(TAG, "All sensors read successfully");
    
    return ESP_OK;
}

esp_err_t sensors_read_single(sensor_type_t type, float* value)
{
    if (!sensors_initialized) {
        ESP_LOGE(TAG, "Sensors not initialized");
        return ESP_ERR_INVALID_STATE;
    }
    
    if (value == NULL) {
        ESP_LOGE(TAG, "Value is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    if (type >= SENSOR_TYPE_MAX) {
        ESP_LOGE(TAG, "Invalid sensor type: %d", type);
        return ESP_ERR_INVALID_ARG;
    }
    
    if (!sensor_config.enabled[type]) {
        ESP_LOGW(TAG, "Sensor %s is disabled", sensor_type_names[type]);
        return ESP_ERR_INVALID_STATE;
    }
    
    ESP_LOGI(TAG, "Reading sensor: %s", sensor_type_names[type]);
    
    switch (type) {
        case SENSOR_TYPE_TEMPERATURE:
            *value = read_temperature();
            break;
        case SENSOR_TYPE_HUMIDITY:
            *value = read_humidity();
            break;
        case SENSOR_TYPE_SOIL_MOISTURE:
            *value = read_soil_moisture();
            break;
        case SENSOR_TYPE_LIGHT:
            *value = read_light();
            break;
        case SENSOR_TYPE_PH:
            *value = read_ph();
            break;
        case SENSOR_TYPE_CONDUCTIVITY:
            *value = read_conductivity();
            break;
        case SENSOR_TYPE_PRESSURE:
            *value = read_pressure();
            break;
        case SENSOR_TYPE_BATTERY_VOLTAGE:
            *value = read_battery_voltage();
            break;
        default:
            ESP_LOGE(TAG, "Unknown sensor type: %d", type);
            return ESP_ERR_INVALID_ARG;
    }
    
    update_sensor_statistics(type, *value);
    
    ESP_LOGI(TAG, "Sensor %s read: %.2f", sensor_type_names[type], *value);
    
    return ESP_OK;
}

esp_err_t sensors_calibrate(sensor_type_t type)
{
    if (!sensors_initialized) {
        ESP_LOGE(TAG, "Sensors not initialized");
        return ESP_ERR_INVALID_STATE;
    }
    
    if (type >= SENSOR_TYPE_MAX) {
        ESP_LOGE(TAG, "Invalid sensor type: %d", type);
        return ESP_ERR_INVALID_ARG;
    }
    
    ESP_LOGI(TAG, "Calibrating sensor: %s", sensor_type_names[type]);
    
    // TODO: Implement sensor calibration
    // This is a placeholder implementation
    
    ESP_LOGI(TAG, "Sensor %s calibrated", sensor_type_names[type]);
    
    return ESP_OK;
}

esp_err_t sensors_get_status(sensor_type_t type, sensor_status_t* status)
{
    if (!sensors_initialized) {
        ESP_LOGE(TAG, "Sensors not initialized");
        return ESP_ERR_INVALID_STATE;
    }
    
    if (type >= SENSOR_TYPE_MAX || status == NULL) {
        ESP_LOGE(TAG, "Invalid sensor type or status is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    *status = sensor_status[type];
    
    return ESP_OK;
}

esp_err_t sensors_set_config(sensor_config_t* config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    sensor_config = *config;
    ESP_LOGI(TAG, "Sensor configuration updated");
    
    return ESP_OK;
}

esp_err_t sensors_get_config(sensor_config_t* config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    *config = sensor_config;
    
    return ESP_OK;
}

bool sensors_is_initialized(void)
{
    return sensors_initialized;
}

const char* sensors_get_type_name(sensor_type_t type)
{
    if (type >= SENSOR_TYPE_MAX) {
        return "Unknown";
    }
    
    return sensor_type_names[type];
}

// Private function implementations
static esp_err_t init_adc(void)
{
    ESP_LOGI(TAG, "Initializing ADC...");
    
    // Configure ADC
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11);  // GPIO34 for soil moisture
    adc1_config_channel_atten(ADC1_CHANNEL_7, ADC_ATTEN_DB_11);  // GPIO35 for battery voltage
    
    ESP_LOGI(TAG, "ADC initialized");
    
    return ESP_OK;
}

static float read_temperature(void)
{
    // TODO: Implement actual temperature reading (DHT22, DS18B20, etc.)
    // This is a placeholder implementation
    
    // Simulate temperature reading
    return 25.0f + (float)(esp_random() % 100) / 10.0f;  // 25.0 to 35.0°C
}

static float read_humidity(void)
{
    // TODO: Implement actual humidity reading (DHT22, etc.)
    // This is a placeholder implementation
    
    // Simulate humidity reading
    return 50.0f + (float)(esp_random() % 300) / 10.0f;  // 50.0 to 80.0%
}

static float read_soil_moisture(void)
{
    // Read soil moisture from ADC
    int adc_value = adc1_get_raw(ADC1_CHANNEL_6);
    
    // Convert ADC value to percentage (0-100%)
    // Assuming dry soil = 4095 (0%) and wet soil = 0 (100%)
    float moisture_percent = 100.0f - ((float)adc_value / 4095.0f) * 100.0f;
    
    // Apply calibration
    moisture_percent = moisture_percent * sensor_config.calibration_scales[SENSOR_TYPE_SOIL_MOISTURE] + 
                      sensor_config.calibration_offsets[SENSOR_TYPE_SOIL_MOISTURE];
    
    return moisture_percent;
}

static float read_light(void)
{
    // TODO: Implement actual light reading (BH1750, etc.)
    // This is a placeholder implementation
    
    // Simulate light reading
    return 1000.0f + (float)(esp_random() % 50000);  // 1000 to 51000 lux
}

static float read_ph(void)
{
    // TODO: Implement actual pH reading
    // This is a placeholder implementation
    
    // Simulate pH reading
    return 6.0f + (float)(esp_random() % 20) / 10.0f;  // 6.0 to 8.0 pH
}

static float read_conductivity(void)
{
    // TODO: Implement actual conductivity reading
    // This is a placeholder implementation
    
    // Simulate conductivity reading
    return 500.0f + (float)(esp_random() % 1000);  // 500 to 1500 µS/cm
}

static float read_pressure(void)
{
    // TODO: Implement actual pressure reading (BMP280, etc.)
    // This is a placeholder implementation
    
    // Simulate pressure reading
    return 1013.25f + (float)(esp_random() % 50) - 25.0f;  // 988.25 to 1038.25 hPa
}

static float read_battery_voltage(void)
{
    // Read battery voltage from ADC
    int adc_value = adc1_get_raw(ADC1_CHANNEL_7);
    
    // Convert ADC value to voltage
    // Assuming voltage divider with 3.3V reference
    float voltage = ((float)adc_value / 4095.0f) * 3.3f * 2.0f;  // *2 for voltage divider
    
    return voltage;
}

static void update_sensor_statistics(sensor_type_t type, float value)
{
    sensor_status_t* status = &sensor_status[type];
    
    status->last_read_success = true;
    status->last_read_time = time(NULL);
    status->read_count++;
    
    // Update min/max values
    if (value < status->min_value) {
        status->min_value = value;
    }
    if (value > status->max_value) {
        status->max_value = value;
    }
    
    // Update average (simple moving average)
    status->avg_value = ((status->avg_value * (status->read_count - 1)) + value) / status->read_count;
}
