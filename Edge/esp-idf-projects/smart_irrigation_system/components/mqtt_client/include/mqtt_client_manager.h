/*
 * MQTT Client Manager Component
 * Handles MQTT client connections and messaging
 */

#ifndef MQTT_CLIENT_MANAGER_H
#define MQTT_CLIENT_MANAGER_H

#include <esp_err.h>
#include <mqtt_client.h>
#include "sensor_manager.h"  // Use sensor_data_t from sensor_manager

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize MQTT client
 * @return ESP_OK on success
 */
esp_err_t mqtt_client_init(void);

/**
 * @brief Connect to MQTT broker
 * @return ESP_OK on success
 */
esp_err_t mqtt_client_connect(void);

/**
 * @brief Disconnect from MQTT broker
 * @return ESP_OK on success
 */
esp_err_t mqtt_client_disconnect(void);

/**
 * @brief Handle MQTT events
 * @return ESP_OK on success
 */
esp_err_t mqtt_client_handle_events(void);

/**
 * @brief Publish sensor data to MQTT broker
 * @param data Sensor data to publish
 * @return ESP_OK on success
 */
esp_err_t mqtt_client_publish_sensor_data(const sensor_data_t *data);

/**
 * @brief Subscribe to MQTT topic
 * @param topic Topic to subscribe to
 * @return ESP_OK on success
 */
esp_err_t mqtt_client_subscribe(const char *topic);

/**
 * @brief Check if MQTT client is connected
 * @return true if connected, false otherwise
 */
bool mqtt_client_is_connected(void);

#ifdef __cplusplus
}
#endif

#endif // MQTT_CLIENT_MANAGER_H
