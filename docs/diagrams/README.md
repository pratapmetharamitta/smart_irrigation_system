# Wireless Automation Irrigation & Fertigation System - PlantUML Diagrams (IRC2 Based)

This directory contains comprehensive PlantUML diagrams for the Wireless Automation Irrigation & Fertigation System architecture and implementation, based on the IRC2 Master Controller specifications.

## Diagram Files

### 1. System Architecture Diagram (IRC2 Based)
**File:** `wireless_fertigation_system_architecture.puml`
**Description:** High-level system architecture showing the IRC2 Master Controller and all major components.

**Key Components:**
- Mobile App Layer (React Native with multi-user support)
- Cloud Backend Layer (Node.js/Express/MongoDB with GSM gateway)
- IRC2 Master Controller (ESP32 + GSM/WiFi/LoRa + Solar power)
- Field Controllers (Motor, Valve, Fertigation, Backwash controllers)
- Sensor Systems (Weather station, soil sensors, water quality)
- Actuator Systems (Motors, valves, pumps, filtration)

### 2. IRC2 Master Controller Detailed Specifications
**File:** `irc2_master_controller_detailed.puml`
**Description:** Comprehensive breakdown of the IRC2 Master Controller with all subsystems.

**Key Sections:**
- IRC2 Core Processing (ESP32-S3, memory, RTOS)
- Communication Modules (GSM/WiFi/LoRa/Bluetooth)
- Power Management (Solar + 72h battery backup)
- Protection & Monitoring (Signal loss detection, health monitoring)
- Field Controller Interfaces (Motor, Valve, Fertigation, Sensor)
- Mobile App Features (Smart scheduling, user management, logging)
- Motor Controller Specifications (Protection systems, control features)
- Valve Controller Specifications (Multi-zone, scheduling)
- Fertigation Controller Specifications (4-valve system, EC/pH control)
- Backwash & Filter System (3-way valve, pressure monitoring)

### 3. IRC2 Operational Flow Diagram
**File:** `irc2_operational_flow.puml`
**Description:** Complete operational flow showing all control modes and protection systems.

**Key Flows:**
- System initialization and communication establishment
- User authentication and farmer input processing
- Three operation modes (Time-based, Volumetric-based, Sensor-based)
- Motor controller operations with protection systems
- Valve controller multi-zone operations
- Fertigation controller EC/pH control loops
- Backwash & filter automatic cleaning
- Weather station integration and overrides
- Real-time monitoring and alert management
- Manual override handling
- Signal loss and power management

### 4. Operation Sequence Diagram
**File:** `wireless_fertigation_sequence.puml`
**Description:** Detailed sequence diagram showing the complete flow of a fertigation operation.

**Key Flows:**
- System initialization and status checking
- Recipe selection and configuration
- Fertigation execution with real-time monitoring
- Alert handling and error management
- Data logging and analytics

### 5. Component Diagram
**File:** `wireless_fertigation_components.puml`
**Description:** Detailed component breakdown showing hardware and software components.

**Key Sections:**
- IRC2 Master Controller Components
- Field Controller Components
- Mobile App Components
- Cloud Backend Components

### 6. Deployment Diagram
**File:** `wireless_fertigation_deployment.puml`
**Description:** Physical deployment architecture showing real-world installation.

**Key Elements:**
- Cloud Infrastructure
- IRC2 Master Controller deployment
- Field controller installations
- Network topology and coverage areas

## IRC2 Master Controller Key Features

### **Basic Functions/Features:**
1. **Connectivity:** GSM/WiFi/LoRa with automatic failover
2. **Mobile Integration:** LoRa to mobile app communication
3. **Power System:** Solar + battery with 72+ hour backup operation
4. **Signal Monitoring:** Mobile signal/WiFi failure detection and alerts
5. **Control Modes:** Time-based, Volumetric-based, Sensor-based irrigation

### **Motor Controller Features:**
1. **Protection Systems:** Dry run, phase failure, voltage fluctuation, overload protection
2. **Motor Control:** Soft start/stop, speed control, direction control
3. **Monitoring:** Real-time status feedback and runtime tracking

### **Valve Controller Features:**
1. **Multi-Zone Control:** Independent zone management based on farmer inputs
2. **Scheduling:** Time/volume/sensor-based control modes
3. **Override Capability:** Weather-based and manual overrides

### **Mobile App Features:**
1. **Smart Scheduling:** Motor/valve ON/OFF programming
2. **Communication:** GSM call option integrated
3. **User Management:** Up to 10 users (5 control, 5 view-only)
4. **Logging:** Complete motor/valve operation logs
5. **Alerts:** GSM/WiFi signal loss notifications

### **Weather Station & Sensors:**
- Rain sensor, flow sensor, moisture sensor
- Humidity, temperature, wind speed monitoring
- Automatic irrigation adjustments based on weather data

### **Fertigation Controller:**
1. **4-Valve System:** Controls N tank, P tank, K tank, and spare connection
2. **EC/pH Control:** Automatic fertilizer control based on EC & pH values
3. **Proportional Control:** App/software-accessible valve proportions
4. **Dosing Pumps:** Precise nutrient injection control
5. **Safety Systems:** On/off valve controls and emergency stops

### **Backwash & Disc Filter:**
1. **3-Way Valve Operation:** Based on dual pressure sensor readings
2. **Automatic Cleaning:** Pressure differential triggers cleaning cycle
3. **Filter Monitoring:** Disc filter status and maintenance alerts

## How to Use These Diagrams

### Prerequisites
1. Install PlantUML:
   ```bash
   # Using npm
   npm install -g node-plantuml
   
   # Using brew (macOS)
   brew install plantuml
   
   # Using apt (Ubuntu/Debian)
   sudo apt-get install plantuml
   ```

2. Install Java (required for PlantUML):
   ```bash
   # Check if Java is installed
   java -version
   
   # Install Java if needed
   sudo apt-get install openjdk-11-jdk  # Linux
   brew install openjdk@11              # macOS
   ```

### Generating Diagrams

#### Command Line Generation
```bash
# Generate PNG images
plantuml -tpng *.puml

# Generate SVG images
plantuml -tsvg *.puml

# Generate PDF documents
plantuml -tpdf *.puml

# Generate all formats
plantuml -tpng -tsvg -tpdf *.puml

# Generate with specific font configuration (to avoid font warnings)
plantuml -tpng -charset UTF-8 *.puml
```

#### Font Configuration
The diagrams are configured to use Arial font to avoid Java font warnings. If you encounter font-related warnings, you can:

1. **Install missing fonts (macOS):**
   ```bash
   # Install Microsoft fonts (includes Times)
   brew install --cask font-microsoft-office
   
   # Or install Times font specifically
   brew install font-times-new-roman
   ```

2. **Install missing fonts (Ubuntu/Debian):**
   ```bash
   # Install Microsoft fonts
   sudo apt-get install ttf-mscorefonts-installer
   
   # Update font cache
   sudo fc-cache -f -v
   ```

3. **Alternative: Use system fonts:**
   ```bash
   # Generate with system font fallback
   plantuml -tpng -Djava.awt.headless=true *.puml
   ```

#### Online Generation
1. Visit [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copy and paste the diagram code
3. Generate and download the image

#### VS Code Integration
1. Install the "PlantUML" extension
2. Open any `.puml` file
3. Press `Alt+D` to preview the diagram
4. Right-click and select "Export Current Diagram" to save

### Customization

#### Modifying Colors
```plantuml
!define CUSTOM_COLOR #FF6B6B
package "Custom Package" as custom_pkg <<CUSTOM_COLOR>> {
    [Component] as comp
}
```

#### Adding New Components
```plantuml
component "New Component" as new_comp {
    [Sub-component 1] as sub1
    [Sub-component 2] as sub2
}
```

#### Updating Relationships
```plantuml
comp1 --> comp2 : New Relationship
comp1 <--> comp3 : Bidirectional
comp1 ..> comp4 : Dotted Line
```

## Diagram Maintenance

### Regular Updates
- Update diagrams when system architecture changes
- Sync with implementation changes
- Review and validate with development team

### Version Control
- Keep diagrams in version control with code
- Use descriptive commit messages for diagram changes
- Tag diagram versions with releases

### Documentation Links
- Link diagrams to relevant documentation
- Include in system design documents
- Reference in API documentation

## Integration with Development

### Design Reviews
- Use diagrams in architecture review meetings
- Validate implementation against diagrams
- Update diagrams based on feedback

### Documentation Generation
- Include diagrams in technical documentation
- Generate architecture documents from diagrams
- Create presentation slides from diagrams

### Testing and Validation
- Use diagrams to plan integration tests
- Validate system behavior against sequence diagrams
- Test deployment scenarios against deployment diagrams

## Troubleshooting

### Common Issues

1. **PlantUML not found:**
   ```bash
   # Check PlantUML installation
   plantuml -version
   
   # Ensure Java is installed
   java -version
   ```

2. **Memory issues with large diagrams:**
   ```bash
   # Increase Java heap size
   export PLANTUML_LIMIT_SIZE=16384
   plantuml -Xmx2g -tpng diagram.puml
   ```

3. **Font issues/warnings:**
   ```bash
   # Install required fonts (macOS)
   brew install --cask font-microsoft-office
   
   # Install required fonts (Ubuntu/Debian)
   sudo apt-get install ttf-mscorefonts-installer
   
   # Alternative: Use Arial font configuration (already included in diagrams)
   # The diagrams are pre-configured with Arial to avoid font warnings
   ```

4. **Java font warnings:**
   ```bash
   # If you see "Times font not available" warnings, use:
   plantuml -tpng -Djava.awt.headless=true *.puml
   
   # Or generate with specific charset:
   plantuml -tpng -charset UTF-8 *.puml
   ```

### Performance Tips
- Split large diagrams into multiple files
- Use includes for common components
- Optimize diagram complexity for readability

## Contributing

### Adding New Diagrams
1. Create new `.puml` file with descriptive name
2. Follow existing naming conventions
3. Include comprehensive documentation
4. Test diagram generation
5. Update this README

### Modifying Existing Diagrams
1. Make changes to `.puml` files
2. Test diagram generation
3. Update documentation if needed
4. Validate with system architects

---

## Contact Information

For questions about these diagrams or the Wireless Automation Irrigation & Fertigation System:

- **System Architecture:** Review with development team
- **Implementation Details:** Check source code documentation
- **Deployment Questions:** Consult deployment guides

---

**Last Updated:** July 2025
**Version:** 1.0
**Maintained by:** Smart Irrigation System Team
