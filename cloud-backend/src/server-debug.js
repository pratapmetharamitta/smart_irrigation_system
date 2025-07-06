const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced logging middleware
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(logRequest);

// Health check endpoint with comprehensive system info
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: 'not_connected',
      mqtt: 'not_connected',
      api: 'running'
    }
  };
  
  console.log('✅ Health check requested:', healthData);
  res.json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
  const rootData = {
    message: 'Smart Irrigation System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      status: '/api/status',
      documentation: '/api-docs'
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('🏠 Root endpoint accessed:', rootData);
  res.json(rootData);
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  const statusData = {
    success: true,
    message: 'Smart Irrigation System API is running',
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      uptime: `${Math.floor(process.uptime())}s`
    },
    services: {
      database: 'checking...',
      mqtt: 'checking...',
      auth: 'ready',
      devices: 'ready'
    }
  };
  
  console.log('📡 API Status requested:', statusData);
  res.json(statusData);
});

// IoT Device simulation endpoint for testing
app.post('/api/devices/data', (req, res) => {
  const deviceData = req.body;
  console.log('📊 Device data received:', deviceData);
  
  res.json({
    success: true,
    message: 'Device data received successfully',
    timestamp: new Date().toISOString(),
    deviceId: deviceData.deviceId || 'unknown'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced error handling
const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log('🚀 Smart Irrigation System API Server started');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });

    // Enhanced error handling
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error.message);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📴 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();