idf_component_register(
    SRCS "smart_irrigation_node.c"
    INCLUDE_DIRS "."
    REQUIRES 
        driver
        esp_wifi
        esp_event
        esp_netif
        nvs_flash
        esp_system
        freertos
        esp_timer
        spi_flash
        esp_adc
)
