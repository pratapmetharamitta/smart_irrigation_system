idf_component_register(
    SRCS "mqtt_client_manager.c"
    INCLUDE_DIRS "include"
    REQUIRES mqtt json sensor_manager
)