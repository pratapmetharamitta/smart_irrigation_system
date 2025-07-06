#ifndef EDGE_CELLULAR_H
#define EDGE_CELLULAR_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

// Cellular configuration structure
typedef struct {
    char apn[32];              // APN name
    char username[32];         // Username (optional)
    char password[32];         // Password (optional)
    uint32_t timeout_ms;       // Connection timeout
} cellular_config_t;

// Cellular connection info
typedef struct {
    bool connected;            // Connection status
    int8_t signal_strength;    // Signal strength in dBm
    char operator_name[32];    // Operator name
    char ip_address[16];       // IP address
    uint32_t bytes_sent;       // Bytes sent
    uint32_t bytes_received;   // Bytes received
} cellular_info_t;

// HTTP request structure
typedef struct {
    char url[256];             // Request URL
    char method[8];            // HTTP method (GET, POST, etc.)
    char headers[512];         // HTTP headers
    char body[1024];           // Request body
    int timeout_ms;            // Request timeout
} http_request_t;

// Function declarations
esp_err_t edge_cellular_init(cellular_config_t* config);
esp_err_t edge_cellular_deinit(void);
esp_err_t edge_cellular_connect(void);
esp_err_t edge_cellular_disconnect(void);
esp_err_t edge_cellular_get_info(cellular_info_t* info);
esp_err_t edge_cellular_send_http_request(http_request_t* request, char* response, size_t max_response_len);
esp_err_t edge_cellular_transmit_data(void);
bool edge_cellular_is_connected(void);
int8_t edge_cellular_get_signal_strength(void);

#ifdef __cplusplus
}
#endif

#endif // EDGE_CELLULAR_H
