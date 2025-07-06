#!/bin/bash

# Smart Irrigation System - Cloud Backend Startup Script

echo "🌱 Starting Smart Irrigation System Cloud Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "✅ Node.js version: $NODE_VERSION"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        echo "❌ Please start MongoDB manually"
        exit 1
    fi
else
    echo "✅ MongoDB is running"
fi

# Check if MQTT broker is running
if ! pgrep -x "mosquitto" > /dev/null; then
    echo "⚠️  MQTT broker is not running. Starting Mosquitto..."
    if command -v brew &> /dev/null; then
        brew services start mosquitto
    else
        echo "❌ Please start Mosquitto MQTT broker manually"
        exit 1
    fi
else
    echo "✅ MQTT broker is running"
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Create logs directory
mkdir -p logs

# Start the backend
echo "🚀 Starting the backend server..."
echo "📊 Dashboard will be available at: http://localhost:3000"
echo "📖 API Documentation: http://localhost:3000/api-docs"
echo "🔍 Health Check: http://localhost:3000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
