cmake_minimum_required(VERSION 3.16)

# Set target chip
set(IDF_TARGET esp32)

# Include ESP-IDF build system
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# Set project name
project(smart_irrigation_node)
