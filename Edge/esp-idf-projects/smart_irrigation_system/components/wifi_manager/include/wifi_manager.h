/*
 * WiFi Manager Component
 * Handles WiFi connection and management
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <esp_err.h>
#include <esp_wifi.h>
#include <esp_event.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize WiFi manager
 * @return ESP_OK on success
 */
esp_err_t wifi_manager_init(void);

/**
 * @brief Connect to WiFi network
 * @return ESP_OK on success
 */
esp_err_t wifi_manager_connect(void);

/**
 * @brief Disconnect from WiFi network
 * @return ESP_OK on success
 */
esp_err_t wifi_manager_disconnect(void);

/**
 * @brief Check if WiFi is connected
 * @return true if connected, false otherwise
 */
bool wifi_manager_is_connected(void);

/**
 * @brief Get WiFi status
 * @return WiFi status
 */
wifi_ap_record_t wifi_manager_get_ap_info(void);

#ifdef __cplusplus
}
#endif

#endif // WIFI_MANAGER_H
