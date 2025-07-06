#ifndef SENSORS_H
#define SENSORS_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

// Sensor types
typedef enum {
    SENSOR_TYPE_TEMPERATURE,
    SENSOR_TYPE_HUMIDITY,
    SENSOR_TYPE_SOIL_MOISTURE,
    SENSOR_TYPE_LIGHT,
    SENSOR_TYPE_PH,
    SENSOR_TYPE_CONDUCTIVITY,
    SENSOR_TYPE_PRESSURE,
    SENSOR_TYPE_BATTERY_VOLTAGE,
    SENSOR_TYPE_MAX
} sensor_type_t;

// Sensor data structure
typedef struct {
    float temperature;      // Temperature in Celsius
    float humidity;         // Humidity in percentage
    float soil_moisture;    // Soil moisture in percentage
    float light;           // Light intensity in lux
    float ph;              // pH value
    float conductivity;    // Electrical conductivity in µS/cm
    float pressure;        // Atmospheric pressure in hPa
    float battery_voltage; // Battery voltage in volts
    uint32_t timestamp;    // Timestamp in Unix epoch
} sensor_data_t;

// Sensor configuration
typedef struct {
    bool enabled[SENSOR_TYPE_MAX];     // Enable/disable sensors
    uint32_t read_interval_ms;         // Reading interval in milliseconds
    uint16_t calibration_samples;      // Number of samples for calibration
    float calibration_offsets[SENSOR_TYPE_MAX];  // Calibration offsets
    float calibration_scales[SENSOR_TYPE_MAX];   // Calibration scales
} sensor_config_t;

// Sensor status
typedef struct {
    bool initialized;
    bool last_read_success;
    uint32_t last_read_time;
    uint32_t read_count;
    uint32_t error_count;
    float min_value;
    float max_value;
    float avg_value;
} sensor_status_t;

// Function declarations
esp_err_t sensors_init(void);
esp_err_t sensors_deinit(void);
esp_err_t sensors_read_all(sensor_data_t* data);
esp_err_t sensors_read_single(sensor_type_t type, float* value);
esp_err_t sensors_calibrate(sensor_type_t type);
esp_err_t sensors_get_status(sensor_type_t type, sensor_status_t* status);
esp_err_t sensors_set_config(sensor_config_t* config);
esp_err_t sensors_get_config(sensor_config_t* config);
bool sensors_is_initialized(void);
const char* sensors_get_type_name(sensor_type_t type);

#ifdef __cplusplus
}
#endif

#endif // SENSORS_H
