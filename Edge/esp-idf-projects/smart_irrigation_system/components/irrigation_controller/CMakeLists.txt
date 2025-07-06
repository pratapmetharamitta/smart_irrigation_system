idf_component_register(
    SRCS "irrigation_controller.c"
    INCLUDE_DIRS "include"
    REQUIRES driver esp_timer sensor_manager
)