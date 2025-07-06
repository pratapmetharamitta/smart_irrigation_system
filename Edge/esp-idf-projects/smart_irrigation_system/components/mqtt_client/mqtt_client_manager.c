/*
 * MQTT Client Manager Component Implementation
 */

#include "mqtt_client_manager.h"
#include <string.h>
#include <esp_log.h>
#include <cJSON.h>
#include <sys/time.h>

static const char *TAG = "MQTT_CLIENT_MANAGER";

static esp_mqtt_client_handle_t s_mqtt_client = NULL;
static bool s_mqtt_connected = false;

static esp_err_t mqtt_event_handler_cb(esp_mqtt_event_handle_t event)
{
    switch (event->event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
            s_mqtt_connected = true;
            break;
        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
            s_mqtt_connected = false;
            break;
        case MQTT_EVENT_SUBSCRIBED:
            ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_UNSUBSCRIBED:
            ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_PUBLISHED:
            ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT_EVENT_DATA");
            break;
        case MQTT_EVENT_ERROR:
            ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
            break;
        default:
            ESP_LOGI(TAG, "Other event id:%d", event->event_id);
            break;
    }
    return ESP_OK;
}

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    mqtt_event_handler_cb(event_data);
}

esp_err_t mqtt_client_init(void)
{
    ESP_LOGI(TAG, "Initializing MQTT Client");
    
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = CONFIG_MQTT_BROKER_URL,
        .credentials.username = CONFIG_MQTT_USERNAME,
        .credentials.authentication.password = CONFIG_MQTT_PASSWORD,
    };
    
    s_mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    if (s_mqtt_client == NULL) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return ESP_FAIL;
    }
    
    esp_err_t ret = esp_mqtt_client_register_event(s_mqtt_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register MQTT event handler: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "MQTT Client initialized successfully");
    return ESP_OK;
}

esp_err_t mqtt_client_connect(void)
{
    ESP_LOGI(TAG, "Connecting to MQTT broker");
    
    if (s_mqtt_client == NULL) {
        ESP_LOGE(TAG, "MQTT client not initialized");
        return ESP_FAIL;
    }
    
    esp_err_t ret = esp_mqtt_client_start(s_mqtt_client);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start MQTT client: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "MQTT client started");
    return ESP_OK;
}

esp_err_t mqtt_client_disconnect(void)
{
    ESP_LOGI(TAG, "Disconnecting from MQTT broker");
    
    if (s_mqtt_client == NULL) {
        ESP_LOGE(TAG, "MQTT client not initialized");
        return ESP_FAIL;
    }
    
    esp_err_t ret = esp_mqtt_client_stop(s_mqtt_client);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to stop MQTT client: %s", esp_err_to_name(ret));
        return ret;
    }
    
    s_mqtt_connected = false;
    return ESP_OK;
}

esp_err_t mqtt_client_handle_events(void)
{
    // Events are handled asynchronously, this is just a placeholder
    return ESP_OK;
}

esp_err_t mqtt_client_publish_sensor_data(const sensor_data_t *data)
{
    if (s_mqtt_client == NULL || !s_mqtt_connected) {
        ESP_LOGW(TAG, "MQTT client not connected");
        return ESP_FAIL;
    }
    
    // Create JSON payload
    cJSON *json = cJSON_CreateObject();
    if (json == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        return ESP_FAIL;
    }
    
    cJSON_AddNumberToObject(json, "temperature", data->temperature);
    cJSON_AddNumberToObject(json, "humidity", data->humidity);
    cJSON_AddNumberToObject(json, "soil_moisture", data->soil_moisture);
    cJSON_AddNumberToObject(json, "water_level", data->water_level);
    cJSON_AddNumberToObject(json, "light_level", data->light_level);
    cJSON_AddNumberToObject(json, "timestamp", (double)data->timestamp);
    
    char *json_string = cJSON_Print(json);
    if (json_string == NULL) {
        ESP_LOGE(TAG, "Failed to print JSON");
        cJSON_Delete(json);
        return ESP_FAIL;
    }
    
    // Publish to topic
    char topic[64];
    snprintf(topic, sizeof(topic), "irrigation/%s/sensors", CONFIG_DEVICE_ID);
    
    int msg_id = esp_mqtt_client_publish(s_mqtt_client, topic, json_string, 0, 1, 0);
    if (msg_id == -1) {
        ESP_LOGE(TAG, "Failed to publish sensor data");
        free(json_string);
        cJSON_Delete(json);
        return ESP_FAIL;
    }
    
    ESP_LOGI(TAG, "Published sensor data, msg_id=%d", msg_id);
    
    free(json_string);
    cJSON_Delete(json);
    return ESP_OK;
}

esp_err_t mqtt_client_subscribe(const char *topic)
{
    if (s_mqtt_client == NULL || !s_mqtt_connected) {
        ESP_LOGW(TAG, "MQTT client not connected");
        return ESP_FAIL;
    }
    
    esp_mqtt_topic_t topic_info = {
        .filter = topic,
        .qos = 0
    };
    
    int msg_id = esp_mqtt_client_subscribe_multiple(s_mqtt_client, &topic_info, 1);
    if (msg_id == -1) {
        ESP_LOGE(TAG, "Failed to subscribe to topic: %s", topic);
        return ESP_FAIL;
    }
    
    ESP_LOGI(TAG, "Subscribed to topic: %s, msg_id=%d", topic, msg_id);
    return ESP_OK;
}

bool mqtt_client_is_connected(void)
{
    return s_mqtt_connected;
}
