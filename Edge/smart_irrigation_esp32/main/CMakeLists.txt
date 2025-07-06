idf_component_register(
    SRCS "smart_irrigation_esp32.c"
    INCLUDE_DIRS "."
    REQUIRES 
        driver
        esp_wifi
        esp_netif
        esp_event
        esp_timer
        mqtt
        json
        nvs_flash
        esp_http_client
        esp_adc
)
