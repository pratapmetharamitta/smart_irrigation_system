#include <stdio.h>
#include <string.h>
#include "esp_log.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "system_config.h"

static const char *TAG = "SYSTEM_CONFIG";

// Default configuration values
static const system_config_t default_config = {
    .soil_moisture_threshold = 30,
    .max_irrigation_time_minutes = 10,
    .sensor_read_interval_seconds = 30,
    .mqtt_publish_interval_seconds = 60,
    .min_irrigation_interval_minutes = 60,
    .safety_timeout_enabled = true,
    .auto_mode_enabled = true,
    .soil_moisture_calibration_dry = 4095,
    .soil_moisture_calibration_wet = 1500
};

esp_err_t system_config_init(void)
{
    ESP_LOGI(TAG, "System configuration initialized");
    return ESP_OK;
}

esp_err_t system_config_load(system_config_t *config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open("system_config", NVS_READONLY, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Error opening NVS handle: %s, using defaults", esp_err_to_name(err));
        *config = default_config;
        return ESP_OK;
    }
    
    size_t required_size = sizeof(system_config_t);
    err = nvs_get_blob(nvs_handle, "config", config, &required_size);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Error getting config: %s, using defaults", esp_err_to_name(err));
        *config = default_config;
    }
    
    nvs_close(nvs_handle);
    return ESP_OK;
}

esp_err_t system_config_save(const system_config_t *config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open("system_config", NVS_READWRITE, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Error opening NVS handle: %s", esp_err_to_name(err));
        return err;
    }
    
    err = nvs_set_blob(nvs_handle, "config", config, sizeof(system_config_t));
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Error setting config: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }
    
    err = nvs_commit(nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Error committing NVS: %s", esp_err_to_name(err));
    }
    
    nvs_close(nvs_handle);
    return err;
}

esp_err_t system_config_reset_to_defaults(void)
{
    ESP_LOGI(TAG, "Resetting configuration to defaults");
    return system_config_save(&default_config);
}

esp_err_t system_config_get_defaults(system_config_t *config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }
    
    *config = default_config;
    return ESP_OK;
}
