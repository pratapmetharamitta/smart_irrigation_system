/*
 * Sensor Manager Component Implementation
 */

#include "sensor_manager.h"
#include <esp_log.h>
#include <esp_adc/adc_oneshot.h>
#include <esp_timer.h>
#include <esp_random.h>
#include <sys/time.h>

static const char *TAG = "SENSOR_MANAGER";

// ADC handles
static adc_oneshot_unit_handle_t s_adc1_handle;
static adc_oneshot_unit_handle_t s_adc2_handle;

// ADC channels
#define ADC_SOIL_MOISTURE_CHANNEL   ADC_CHANNEL_6  // GPIO34
#define ADC_LIGHT_LEVEL_CHANNEL     ADC_CHANNEL_7  // GPIO35
#define ADC_WATER_LEVEL_CHANNEL     ADC_CHANNEL_0  // GPIO36

// Sensor calibration values
static const int SOIL_MOISTURE_DRY = 4095;    // ADC value when dry
static const int SOIL_MOISTURE_WET = 1500;    // ADC value when wet

esp_err_t sensor_manager_init(void)
{
    ESP_LOGI(TAG, "Initializing Sensor Manager");
    
    // Initialize ADC1
    adc_oneshot_unit_init_cfg_t init_config1 = {
        .unit_id = ADC_UNIT_1,
    };
    esp_err_t ret = adc_oneshot_new_unit(&init_config1, &s_adc1_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize ADC1: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Initialize ADC2
    adc_oneshot_unit_init_cfg_t init_config2 = {
        .unit_id = ADC_UNIT_2,
    };
    ret = adc_oneshot_new_unit(&init_config2, &s_adc2_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize ADC2: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Configure ADC channels
    adc_oneshot_chan_cfg_t config = {
        .bitwidth = ADC_BITWIDTH_DEFAULT,
        .atten = ADC_ATTEN_DB_11,
    };
    
    ret = adc_oneshot_config_channel(s_adc1_handle, ADC_SOIL_MOISTURE_CHANNEL, &config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure soil moisture channel: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = adc_oneshot_config_channel(s_adc1_handle, ADC_LIGHT_LEVEL_CHANNEL, &config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure light level channel: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = adc_oneshot_config_channel(s_adc1_handle, ADC_WATER_LEVEL_CHANNEL, &config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure water level channel: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "Sensor Manager initialized successfully");
    return ESP_OK;
}

esp_err_t sensor_manager_read_all(sensor_data_t *sensor_data)
{
    if (sensor_data == NULL) {
        ESP_LOGE(TAG, "Sensor data pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    esp_err_t ret;
    
    // Read temperature (simulated - replace with actual sensor reading)
    ret = sensor_manager_read_temperature(&sensor_data->temperature);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read temperature");
        return ret;
    }
    
    // Read humidity (simulated - replace with actual sensor reading)
    ret = sensor_manager_read_humidity(&sensor_data->humidity);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read humidity");
        return ret;
    }
    
    // Read soil moisture
    ret = sensor_manager_read_soil_moisture(&sensor_data->soil_moisture);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read soil moisture");
        return ret;
    }
    
    // Read water level
    ret = sensor_manager_read_water_level(&sensor_data->water_level);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read water level");
        return ret;
    }
    
    // Read light level
    ret = sensor_manager_read_light_level(&sensor_data->light_level);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read light level");
        return ret;
    }
    
    // Set timestamp
    struct timeval tv;
    gettimeofday(&tv, NULL);
    sensor_data->timestamp = tv.tv_sec;
    
    ESP_LOGI(TAG, "All sensors read successfully");
    return ESP_OK;
}

esp_err_t sensor_manager_read_temperature(float *temperature)
{
    if (temperature == NULL) {
        ESP_LOGE(TAG, "Temperature pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    // Simulate temperature reading (replace with actual sensor code)
    // For DHT22 or similar, you would read from the sensor here
    *temperature = 25.5f + ((float)(esp_random() % 100) / 10.0f - 5.0f);
    
    ESP_LOGD(TAG, "Temperature: %.2f°C", *temperature);
    return ESP_OK;
}

esp_err_t sensor_manager_read_humidity(float *humidity)
{
    if (humidity == NULL) {
        ESP_LOGE(TAG, "Humidity pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    // Simulate humidity reading (replace with actual sensor code)
    // For DHT22 or similar, you would read from the sensor here
    *humidity = 60.0f + ((float)(esp_random() % 400) / 10.0f - 20.0f);
    
    // Clamp to valid range
    if (*humidity < 0.0f) *humidity = 0.0f;
    if (*humidity > 100.0f) *humidity = 100.0f;
    
    ESP_LOGD(TAG, "Humidity: %.2f%%", *humidity);
    return ESP_OK;
}

esp_err_t sensor_manager_read_soil_moisture(float *soil_moisture)
{
    if (soil_moisture == NULL) {
        ESP_LOGE(TAG, "Soil moisture pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    int adc_raw;
    esp_err_t ret = adc_oneshot_read(s_adc1_handle, ADC_SOIL_MOISTURE_CHANNEL, &adc_raw);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read soil moisture ADC: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Convert ADC reading to percentage (0-100%)
    // Higher ADC value means drier soil, so we invert the calculation
    *soil_moisture = 100.0f - ((float)(adc_raw - SOIL_MOISTURE_WET) / (SOIL_MOISTURE_DRY - SOIL_MOISTURE_WET) * 100.0f);
    
    // Clamp to valid range
    if (*soil_moisture < 0.0f) *soil_moisture = 0.0f;
    if (*soil_moisture > 100.0f) *soil_moisture = 100.0f;
    
    ESP_LOGD(TAG, "Soil moisture: %.2f%% (ADC: %d)", *soil_moisture, adc_raw);
    return ESP_OK;
}

esp_err_t sensor_manager_read_water_level(float *water_level)
{
    if (water_level == NULL) {
        ESP_LOGE(TAG, "Water level pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    int adc_raw;
    esp_err_t ret = adc_oneshot_read(s_adc1_handle, ADC_WATER_LEVEL_CHANNEL, &adc_raw);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read water level ADC: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Convert ADC reading to percentage (0-100%)
    *water_level = (float)adc_raw / 4095.0f * 100.0f;
    
    // Clamp to valid range
    if (*water_level < 0.0f) *water_level = 0.0f;
    if (*water_level > 100.0f) *water_level = 100.0f;
    
    ESP_LOGD(TAG, "Water level: %.2f%% (ADC: %d)", *water_level, adc_raw);
    return ESP_OK;
}

esp_err_t sensor_manager_read_light_level(float *light_level)
{
    if (light_level == NULL) {
        ESP_LOGE(TAG, "Light level pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    int adc_raw;
    esp_err_t ret = adc_oneshot_read(s_adc1_handle, ADC_LIGHT_LEVEL_CHANNEL, &adc_raw);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read light level ADC: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Convert ADC reading to percentage (0-100%)
    *light_level = (float)adc_raw / 4095.0f * 100.0f;
    
    // Clamp to valid range
    if (*light_level < 0.0f) *light_level = 0.0f;
    if (*light_level > 100.0f) *light_level = 100.0f;
    
    ESP_LOGD(TAG, "Light level: %.2f%% (ADC: %d)", *light_level, adc_raw);
    return ESP_OK;
}
