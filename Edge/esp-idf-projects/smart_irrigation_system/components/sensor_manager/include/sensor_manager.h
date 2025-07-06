#pragma once

#include "esp_err.h"
#include "esp_timer.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Sensor data structure
 */
typedef struct {
    float temperature;      // Temperature in Celsius
    float humidity;         // Humidity in percentage
    float soil_moisture;    // Soil moisture in percentage
    float water_level;      // Water level in percentage
    float light_level;      // Light level in percentage
    int64_t timestamp;      // Timestamp in seconds since epoch
} sensor_data_t;

/**
 * @brief Initialize sensor manager
 * 
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_init(void);

/**
 * @brief Read all sensor data
 * 
 * @param sensor_data Pointer to sensor data structure
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_read_all(sensor_data_t *sensor_data);

/**
 * @brief Read temperature sensor
 * 
 * @param temperature Pointer to temperature value
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_read_temperature(float *temperature);

/**
 * @brief Read humidity sensor
 * 
 * @param humidity Pointer to humidity value
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_read_humidity(float *humidity);

/**
 * @brief Read soil moisture sensor
 * 
 * @param soil_moisture Pointer to soil moisture value
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_read_soil_moisture(float *soil_moisture);

/**
 * @brief Read water level sensor
 * 
 * @param water_level Pointer to water level value
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_read_water_level(float *water_level);

/**
 * @brief Read light level sensor
 * 
 * @param light_level Pointer to light level value
 * @return ESP_OK on success
 */
esp_err_t sensor_manager_read_light_level(float *light_level);

#ifdef __cplusplus
}
#endif
