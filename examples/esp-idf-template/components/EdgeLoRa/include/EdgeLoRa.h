#ifndef EDGE_LORA_H
#define EDGE_LORA_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

// LoRa configuration structure
typedef struct {
    uint32_t frequency;        // Frequency in Hz
    uint8_t spreading_factor;  // Spreading factor (6-12)
    uint32_t bandwidth;        // Bandwidth in Hz
    uint8_t coding_rate;       // Coding rate (5-8)
    uint8_t tx_power;          // TX power in dBm
} lora_config_t;

// LoRa packet structure
typedef struct {
    uint8_t node_id;           // Source node ID
    uint8_t destination_id;    // Destination node ID
    uint8_t packet_type;       // Packet type
    uint8_t sequence_number;   // Sequence number
    uint8_t payload_length;    // Payload length
    uint8_t payload[255];      // Payload data
    uint16_t checksum;         // Checksum
} lora_packet_t;

// Packet types
#define LORA_PACKET_TYPE_DATA     0x01
#define LORA_PACKET_TYPE_ACK      0x02
#define LORA_PACKET_TYPE_PING     0x03
#define LORA_PACKET_TYPE_CONFIG   0x04
#define LORA_PACKET_TYPE_EMERGENCY 0x05

// Function declarations
esp_err_t edge_lora_init(lora_config_t* config);
esp_err_t edge_lora_deinit(void);
esp_err_t edge_lora_send_packet(lora_packet_t* packet);
esp_err_t edge_lora_receive_packet(lora_packet_t* packet, uint32_t timeout_ms);
esp_err_t edge_lora_send_data(uint8_t destination_id, const uint8_t* data, size_t length);
esp_err_t edge_lora_transmit_data(void);
bool edge_lora_is_initialized(void);
int8_t edge_lora_get_rssi(void);
float edge_lora_get_snr(void);

#ifdef __cplusplus
}
#endif

#endif // EDGE_LORA_H
