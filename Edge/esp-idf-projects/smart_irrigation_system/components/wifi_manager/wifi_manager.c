/*
 * WiFi Manager Component Implementation
 */

#include "wifi_manager.h"
#include <string.h>
#include <esp_log.h>
#include <esp_netif.h>
#include <esp_event.h>
#include <nvs_flash.h>

static const char *TAG = "WIFI_MANAGER";

static esp_netif_t *s_wifi_netif = NULL;
static wifi_ap_record_t s_ap_info;
static bool s_wifi_connected = false;

esp_err_t wifi_manager_init(void)
{
    ESP_LOGI(TAG, "Initializing WiFi Manager");
    
    // Create default WiFi station
    s_wifi_netif = esp_netif_create_default_wifi_sta();
    if (s_wifi_netif == NULL) {
        ESP_LOGE(TAG, "Failed to create default WiFi station");
        return ESP_FAIL;
    }
    
    // Initialize WiFi with default config
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_err_t ret = esp_wifi_init(&cfg);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi init failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Set WiFi mode to station
    ret = esp_wifi_set_mode(WIFI_MODE_STA);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi set mode failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Start WiFi
    ret = esp_wifi_start();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi start failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "WiFi Manager initialized successfully");
    return ESP_OK;
}

esp_err_t wifi_manager_connect(void)
{
    ESP_LOGI(TAG, "Connecting to WiFi...");
    
    // Configure WiFi
    wifi_config_t wifi_config = {
        .sta = {
            .ssid = CONFIG_WIFI_SSID,
            .password = CONFIG_WIFI_PASSWORD,
        },
    };
    
    esp_err_t ret = esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi set config failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = esp_wifi_connect();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi connect failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "WiFi connection initiated");
    return ESP_OK;
}

esp_err_t wifi_manager_disconnect(void)
{
    ESP_LOGI(TAG, "Disconnecting from WiFi");
    
    esp_err_t ret = esp_wifi_disconnect();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi disconnect failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    s_wifi_connected = false;
    return ESP_OK;
}

bool wifi_manager_is_connected(void)
{
    return s_wifi_connected;
}

wifi_ap_record_t wifi_manager_get_ap_info(void)
{
    return s_ap_info;
}
