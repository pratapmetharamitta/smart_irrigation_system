#include "EdgeLoRa.h"

EdgeLoRa::EdgeLoRa() {
    loraSPI = nullptr;
    initialized = false;
    spreadingFactor = 12;
    signalBandwidth = 125E3;
    codingRate = 5;
    syncWord = 0x12;
    txPower = 20;
    
    packetsReceived = 0;
    packetsSent = 0;
    lastPacketTime = 0;
    lastRSSI = 0;
    lastSNR = 0;
    
    packetReady = false;
}

EdgeLoRa::~EdgeLoRa() {
    end();
}

bool EdgeLoRa::begin(long frequency) {
    Serial.println("Initializing Edge LoRa...");
    
    // Initialize SPI for LoRa
    loraSPI = new SPIClass(VSPI);
    loraSPI->begin(CONFIG_CLK, CONFIG_MISO, CONFIG_MOSI, CONFIG_NSS);
    
    // Set LoRa pins
    LoRa.setSPI(*loraSPI);
    LoRa.setPins(CONFIG_NSS, CONFIG_RST, CONFIG_DIO0);
    
    // Initialize LoRa
    if (!LoRa.begin(frequency)) {
        Serial.println("LoRa initialization failed!");
        initialized = false;
        return false;
    }
    
    // Configure LoRa parameters for optimal performance
    LoRa.setSpreadingFactor(spreadingFactor);
    LoRa.setSignalBandwidth(signalBandwidth);
    LoRa.setCodingRate4(codingRate);
    LoRa.setSyncWord(syncWord);
    LoRa.setTxPower(txPower);
    LoRa.enableCrc();
    
    // Set receive mode (Edge device is primarily a receiver)
    LoRa.receive();
    
    initialized = true;
    Serial.println("Edge LoRa initialized successfully");
    Serial.printf("Frequency: %.1f MHz\n", frequency / 1E6);
    Serial.printf("Spreading Factor: %d\n", spreadingFactor);
    Serial.printf("Bandwidth: %.1f kHz\n", signalBandwidth / 1E3);
    Serial.printf("Coding Rate: 4/%d\n", codingRate);
    Serial.printf("Sync Word: 0x%02X\n", syncWord);
    Serial.printf("TX Power: %d dBm\n", txPower);
    
    return true;
}

void EdgeLoRa::end() {
    if (initialized) {
        LoRa.end();
        if (loraSPI) {
            delete loraSPI;
            loraSPI = nullptr;
        }
        initialized = false;
    }
}

void EdgeLoRa::setSpreadingFactor(uint8_t sf) {
    if (sf >= 6 && sf <= 12) {
        spreadingFactor = sf;
        if (initialized) {
            LoRa.setSpreadingFactor(sf);
        }
    }
}

void EdgeLoRa::setSignalBandwidth(long sbw) {
    signalBandwidth = sbw;
    if (initialized) {
        LoRa.setSignalBandwidth(sbw);
    }
}

void EdgeLoRa::setCodingRate4(uint8_t denominator) {
    if (denominator >= 5 && denominator <= 8) {
        codingRate = denominator;
        if (initialized) {
            LoRa.setCodingRate4(denominator);
        }
    }
}

void EdgeLoRa::setSyncWord(uint8_t sw) {
    syncWord = sw;
    if (initialized) {
        LoRa.setSyncWord(sw);
    }
}

void EdgeLoRa::setTxPower(uint8_t power) {
    if (power >= 2 && power <= 20) {
        txPower = power;
        if (initialized) {
            LoRa.setTxPower(power);
        }
    }
}

void EdgeLoRa::enableCrc() {
    if (initialized) {
        LoRa.enableCrc();
    }
}

void EdgeLoRa::disableCrc() {
    if (initialized) {
        LoRa.disableCrc();
    }
}

bool EdgeLoRa::sendPacket(const String& data) {
    if (!initialized) return false;
    
    // Create packet with header
    String packet = createPacketHeader(0, PACKET_TYPE_DATA) + data;
    
    Serial.println("Sending LoRa packet: " + packet);
    
    LoRa.beginPacket();
    LoRa.print(packet);
    bool success = LoRa.endPacket();
    
    if (success) {
        packetsSent++;
        Serial.println("Packet sent successfully");
    } else {
        Serial.println("Packet transmission failed");
    }
    
    // Return to receive mode
    LoRa.receive();
    
    return success;
}

bool EdgeLoRa::sendCommand(uint8_t nodeId, uint8_t commandType, uint8_t target, bool action) {
    if (!initialized) return false;
    
    String command = String(nodeId) + "," + String(commandType) + "," + 
                    String(target) + "," + String(action ? 1 : 0);
    
    String packet = createPacketHeader(nodeId, PACKET_TYPE_COMMAND) + command;
    
    Serial.println("Sending command to Node " + String(nodeId) + ": " + command);
    
    LoRa.beginPacket();
    LoRa.print(packet);
    bool success = LoRa.endPacket();
    
    if (success) {
        packetsSent++;
        Serial.println("Command sent successfully");
    } else {
        Serial.println("Command transmission failed");
    }
    
    // Return to receive mode
    LoRa.receive();
    
    return success;
}

bool EdgeLoRa::sendBroadcast(const String& message) {
    if (!initialized) return false;
    
    String packet = createPacketHeader(0xFF, PACKET_TYPE_BROADCAST) + message;
    
    Serial.println("Broadcasting message: " + message);
    
    LoRa.beginPacket();
    LoRa.print(packet);
    bool success = LoRa.endPacket();
    
    if (success) {
        packetsSent++;
        Serial.println("Broadcast sent successfully");
    } else {
        Serial.println("Broadcast transmission failed");
    }
    
    // Return to receive mode
    LoRa.receive();
    
    return success;
}

bool EdgeLoRa::available() {
    if (!initialized) return false;
    
    int packetSize = LoRa.parsePacket();
    if (packetSize > 0) {
        // Read the packet
        packetBuffer = "";
        while (LoRa.available()) {
            packetBuffer += (char)LoRa.read();
        }
        
        updateStatistics();
        
        // Validate packet
        if (validatePacket(packetBuffer)) {
            packetReady = true;
            packetsReceived++;
            lastPacketTime = millis();
            
            Serial.println("Valid packet received: " + packetBuffer);
            Serial.printf("RSSI: %d dBm, SNR: %.2f dB\n", lastRSSI, lastSNR);
            
            return true;
        } else {
            Serial.println("Invalid packet received: " + packetBuffer);
            packetReady = false;
        }
    }
    
    return false;
}

String EdgeLoRa::readPacket() {
    if (packetReady) {
        packetReady = false;
        return packetBuffer;
    }
    return "";
}

int EdgeLoRa::getPacketRSSI() {
    return lastRSSI;
}

float EdgeLoRa::getPacketSNR() {
    return lastSNR;
}

void EdgeLoRa::printStatus() {
    Serial.println("=== Edge LoRa Status ===");
    Serial.printf("Initialized: %s\n", initialized ? "YES" : "NO");
    Serial.printf("Frequency: %.1f MHz\n", BAND / 1E6);
    Serial.printf("Spreading Factor: %d\n", spreadingFactor);
    Serial.printf("Bandwidth: %.1f kHz\n", signalBandwidth / 1E3);
    Serial.printf("Coding Rate: 4/%d\n", codingRate);
    Serial.printf("Sync Word: 0x%02X\n", syncWord);
    Serial.printf("TX Power: %d dBm\n", txPower);
    Serial.printf("Packets Received: %lu\n", packetsReceived);
    Serial.printf("Packets Sent: %lu\n", packetsSent);
    Serial.printf("Last RSSI: %d dBm\n", lastRSSI);
    Serial.printf("Last SNR: %.2f dB\n", lastSNR);
    Serial.println("======================");
}

String EdgeLoRa::getStatusString() {
    return "LoRa: " + String(initialized ? "OK" : "FAIL") + 
           " | RX: " + String(packetsReceived) + 
           " | TX: " + String(packetsSent) + 
           " | RSSI: " + String(lastRSSI) + " dBm" +
           " | SNR: " + String(lastSNR, 1) + " dB";
}

bool EdgeLoRa::forwardPacket(const String& packet, uint8_t hopCount) {
    if (!initialized || hopCount > 5) return false; // Limit hop count
    
    // Add mesh header
    String meshPacket = createPacketHeader(0, PACKET_TYPE_MESH) + 
                       String(hopCount + 1) + "," + packet;
    
    Serial.println("Forwarding packet (hop " + String(hopCount + 1) + "): " + packet);
    
    LoRa.beginPacket();
    LoRa.print(meshPacket);
    bool success = LoRa.endPacket();
    
    if (success) {
        packetsSent++;
    }
    
    // Return to receive mode
    LoRa.receive();
    
    return success;
}

bool EdgeLoRa::isForMe(const String& packet) {
    // Extract target from packet header
    if (packet.length() < 4) return false;
    
    // Check if it's a broadcast or addressed to this edge device
    uint8_t target = packet.charAt(2) - '0';
    return (target == 0 || target == 0xFF); // 0 = Edge, 0xFF = Broadcast
}

void EdgeLoRa::updateStatistics() {
    lastRSSI = LoRa.packetRssi();
    lastSNR = LoRa.packetSnr();
}

String EdgeLoRa::createPacketHeader(uint8_t nodeId, uint8_t packetType) {
    // Header format: [PacketType][NodeId][EdgeId]
    return String((char)packetType) + String((char)nodeId) + String((char)0) + ",";
}

bool EdgeLoRa::validatePacket(const String& packet) {
    // Basic validation
    if (packet.length() < 4) return false;
    if (packet.indexOf(',') < 3) return false;
    
    // Check packet type
    uint8_t packetType = packet.charAt(0);
    if (packetType < PACKET_TYPE_DATA || packetType > PACKET_TYPE_MESH) {
        return false;
    }
    
    return true;
}
