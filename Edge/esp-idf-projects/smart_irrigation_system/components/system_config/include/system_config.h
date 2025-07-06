/*
 * System Configuration Component
 * Handles system configuration and NVS storage
 */

#ifndef SYSTEM_CONFIG_H
#define SYSTEM_CONFIG_H

#include <esp_err.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief System configuration structure
 */
typedef struct {
    uint32_t soil_moisture_threshold;
    uint32_t max_irrigation_time_minutes;
    uint32_t sensor_read_interval_seconds;
    uint32_t mqtt_publish_interval_seconds;
    uint32_t min_irrigation_interval_minutes;
    bool safety_timeout_enabled;
    bool auto_mode_enabled;
    uint16_t soil_moisture_calibration_dry;
    uint16_t soil_moisture_calibration_wet;
} system_config_t;

/**
 * @brief Initialize system configuration
 * @return ESP_OK on success
 */
esp_err_t system_config_init(void);

/**
 * @brief Load configuration from NVS
 * @param config Pointer to configuration structure
 * @return ESP_OK on success
 */
esp_err_t system_config_load(system_config_t *config);

/**
 * @brief Save configuration to NVS
 * @param config Pointer to configuration structure
 * @return ESP_OK on success
 */
esp_err_t system_config_save(const system_config_t *config);

/**
 * @brief Reset configuration to defaults
 * @return ESP_OK on success
 */
esp_err_t system_config_reset_to_defaults(void);

/**
 * @brief Get default configuration
 * @param config Pointer to configuration structure
 * @return ESP_OK on success
 */
esp_err_t system_config_get_defaults(system_config_t *config);

#ifdef __cplusplus
}
#endif

#endif // SYSTEM_CONFIG_H
