cmake_minimum_required(VERSION 3.16)

# Set target chip
set(IDF_TARGET esp32)

# Set component search paths
set(EXTRA_COMPONENT_DIRS "components")

# Include ESP-IDF build system
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# Define the project
project(smart_irrigation_system)
