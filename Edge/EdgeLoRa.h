#ifndef EDGE_LORA_H
#define EDGE_LORA_H

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include "edge_board_def.h"

class EdgeLoRa {
private:
    SPIClass* loraSPI;
    bool initialized;
    uint8_t spreadingFactor;
    long signalBandwidth;
    uint8_t codingRate;
    uint8_t syncWord;
    uint8_t txPower;
    
    // Statistics
    unsigned long packetsReceived;
    unsigned long packetsSent;
    unsigned long lastPacketTime;
    int lastRSSI;
    float lastSNR;
    
    // Packet handling
    String packetBuffer;
    bool packetReady;
    
public:
    EdgeLoRa();
    ~EdgeLoRa();
    
    // Initialization
    bool begin(long frequency = BAND);
    void end();
    bool isInitialized() { return initialized; }
    
    // Configuration
    void setSpreadingFactor(uint8_t sf);
    void setSignalBandwidth(long sbw);
    void setCodingRate4(uint8_t denominator);
    void setSyncWord(uint8_t sw);
    void setTxPower(uint8_t power);
    void enableCrc();
    void disableCrc();
    
    // Transmission
    bool sendPacket(const String& data);
    bool sendCommand(uint8_t nodeId, uint8_t commandType, uint8_t target, bool action);
    bool sendBroadcast(const String& message);
    
    // Reception
    bool available();
    String readPacket();
    int getPacketRSSI();
    float getPacketSNR();
    
    // Statistics
    unsigned long getPacketsReceived() { return packetsReceived; }
    unsigned long getPacketsSent() { return packetsSent; }
    unsigned long getLastPacketTime() { return lastPacketTime; }
    int getLastRSSI() { return lastRSSI; }
    float getLastSNR() { return lastSNR; }
    
    // Utility
    void printStatus();
    String getStatusString();
    
    // Mesh networking support
    bool forwardPacket(const String& packet, uint8_t hopCount = 0);
    bool isForMe(const String& packet);
    
private:
    void updateStatistics();
    String createPacketHeader(uint8_t nodeId, uint8_t packetType);
    bool validatePacket(const String& packet);
    void onReceive(int packetSize);
};

// Packet types
#define PACKET_TYPE_DATA        0x01
#define PACKET_TYPE_COMMAND     0x02
#define PACKET_TYPE_ACK         0x03
#define PACKET_TYPE_HEARTBEAT   0x04
#define PACKET_TYPE_BROADCAST   0x05
#define PACKET_TYPE_MESH        0x06

// Command types
#define CMD_TYPE_VALVE          0x01
#define CMD_TYPE_PUMP           0x02
#define CMD_TYPE_SENSOR         0x03
#define CMD_TYPE_CONFIG         0x04
#define CMD_TYPE_RESET          0x05

#endif // EDGE_LORA_H
