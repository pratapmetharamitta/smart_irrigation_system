idf_component_register(
    SRCS "sensor_manager.c"
    INCLUDE_DIRS "include"
    REQUIRES driver esp_adc esp_timer
)