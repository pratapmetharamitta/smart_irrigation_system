#ifndef BOARD_CONFIG_H
#define BOARD_CONFIG_H

#include "driver/gpio.h"
#include "driver/uart.h"

// Board identification
#define BOARD_T_SIM7000G 1

// T-SIM7000G Pin Definitions
#define MODEM_RST_PIN     GPIO_NUM_5
#define MODEM_PWKEY_PIN   GPIO_NUM_4
#define MODEM_DTR_PIN     GPIO_NUM_25
#define MODEM_UART_TXD    GPIO_NUM_26
#define MODEM_UART_RXD    GPIO_NUM_27
#define MODEM_UART_NUM    UART_NUM_1
#define MODEM_UART_BAUD   115200

// I2C Configuration
#define I2C_MASTER_SCL_IO GPIO_NUM_22
#define I2C_MASTER_SDA_IO GPIO_NUM_21
#define I2C_MASTER_NUM    I2C_NUM_0
#define I2C_MASTER_FREQ_HZ 400000
#define I2C_MASTER_TX_BUF_DISABLE 0
#define I2C_MASTER_RX_BUF_DISABLE 0

// LoRa SPI Configuration
#define LORA_SCK_PIN      GPIO_NUM_18
#define LORA_MISO_PIN     GPIO_NUM_19
#define LORA_MOSI_PIN     GPIO_NUM_23
#define LORA_CS_PIN       GPIO_NUM_16
#define LORA_RST_PIN      GPIO_NUM_14
#define LORA_DIO0_PIN     GPIO_NUM_32
#define LORA_DIO1_PIN     GPIO_NUM_33
#define LORA_DIO2_PIN     GPIO_NUM_34

// SPI Host for LoRa
#define LORA_SPI_HOST     SPI2_HOST

// Additional GPIOs
#define LED_PIN           GPIO_NUM_12
#define BUTTON_PIN        GPIO_NUM_35
#define BATTERY_ADC_PIN   GPIO_NUM_36

// Power management
#define POWER_ON_PIN      GPIO_NUM_4
#define POWER_OFF_PIN     GPIO_NUM_5

// Sensor power control
#define SENSOR_POWER_PIN  GPIO_NUM_13

// Status indicators
#define STATUS_LED_RED    GPIO_NUM_12
#define STATUS_LED_GREEN  GPIO_NUM_15
#define STATUS_LED_BLUE   GPIO_NUM_2

// Communication timeouts (milliseconds)
#define MODEM_TIMEOUT_MS  10000
#define LORA_TIMEOUT_MS   5000
#define SENSOR_TIMEOUT_MS 2000

// Default frequencies
#define LORA_FREQUENCY    915000000  // 915 MHz for North America
#define LORA_BANDWIDTH    125000     // 125 kHz
#define LORA_SPREADING_FACTOR 7      // SF7
#define LORA_CODING_RATE  5          // 4/5
#define LORA_TX_POWER     14         // 14 dBm

// Deep sleep configuration
#define DEEP_SLEEP_DURATION_MS (30 * 60 * 1000)  // 30 minutes

#endif // BOARD_CONFIG_H
