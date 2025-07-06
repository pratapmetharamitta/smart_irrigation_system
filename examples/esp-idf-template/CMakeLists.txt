cmake_minimum_required(VERSION 3.16)

# Set the project name
set(PROJECT_NAME "smart_irrigation_edge")

# Include ESP-IDF CMake
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# Define the project
project(${PROJECT_NAME})

# Set C standard
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Add custom compile definitions
target_compile_definitions(${PROJECT_NAME}.elf PRIVATE
    -DPROJECT_NAME=\"${PROJECT_NAME}\"
    -DPROJECT_VERSION=\"1.0.0\"
    -DBOARD_T_SIM7000G=1
)

# Add custom compile options for optimization
target_compile_options(${PROJECT_NAME}.elf PRIVATE
    -Wall
    -Wextra
    -Wno-unused-parameter
    -Wno-missing-field-initializers
)

# Print build information
message(STATUS "Building ${PROJECT_NAME} v1.0.0")
message(STATUS "Target: ${IDF_TARGET}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
