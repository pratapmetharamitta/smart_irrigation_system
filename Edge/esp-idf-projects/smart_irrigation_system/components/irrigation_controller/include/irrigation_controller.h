#pragma once

#include "esp_err.h"
#include "sensor_manager.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Irrigation controller state
 */
typedef enum {
    IRRIGATION_STATE_IDLE,
    IRRIGATION_STATE_WATERING,
    IRRIGATION_STATE_PAUSED,
    IRRIGATION_STATE_ERROR
} irrigation_state_t;

/**
 * @brief Irrigation controller configuration
 */
typedef struct {
    float soil_moisture_threshold;  // Threshold below which irrigation starts
    int irrigation_duration;        // Duration in seconds
    int min_interval;              // Minimum interval between irrigations (seconds)
    bool auto_mode;                // Auto mode enabled
} irrigation_config_t;

/**
 * @brief Initialize irrigation controller
 * 
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_init(void);

/**
 * @brief Update irrigation controller (call regularly)
 * 
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_update(void);

/**
 * @brief Check irrigation conditions based on sensor data
 * 
 * @param sensor_data Sensor data to check
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_check_conditions(const sensor_data_t *sensor_data);

/**
 * @brief Start irrigation manually
 * 
 * @param duration Duration in seconds (0 for default)
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_start_manual(int duration);

/**
 * @brief Stop irrigation
 * 
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_stop(void);

/**
 * @brief Pause irrigation
 * 
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_pause(void);

/**
 * @brief Resume irrigation
 * 
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_resume(void);

/**
 * @brief Get current irrigation state
 * 
 * @return Current irrigation state
 */
irrigation_state_t irrigation_controller_get_state(void);

/**
 * @brief Set irrigation configuration
 * 
 * @param config Configuration to set
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_set_config(const irrigation_config_t *config);

/**
 * @brief Get irrigation configuration
 * 
 * @param config Pointer to configuration structure
 * @return ESP_OK on success
 */
esp_err_t irrigation_controller_get_config(irrigation_config_t *config);

/**
 * @brief Get remaining irrigation time
 * 
 * @return Remaining time in seconds
 */
int irrigation_controller_get_remaining_time(void);

#ifdef __cplusplus
}
#endif
