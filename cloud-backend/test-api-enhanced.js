const axios = require('axios');

class SmartIrrigationAPITester {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.timeout = 5000; // 5 second timeout
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async checkServerConnectivity() {
    try {
      console.log(`🔍 Checking server connectivity at ${this.baseURL}...`);
      const response = await this.axios.get('/health');
      console.log('✅ Server is reachable');
      return true;
    } catch (error) {
      console.error('❌ Server connectivity check failed:');
      
      if (error.code === 'ECONNREFUSED') {
        console.error('   🔌 Connection refused - Server is not running');
        console.error('   💡 Please start the server with: node src/server-debug.js');
      } else if (error.code === 'ENOTFOUND') {
        console.error('   🌐 Host not found - Check the server URL');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('   ⏱️  Request timed out - Server may be overloaded');
      } else {
        console.error(`   ❓ ${error.message}`);
      }
      
      return false;
    }
  }

  async testHealthEndpoint() {
    console.log('🧪 Testing /health endpoint...');
    
    try {
      const response = await this.axios.get('/health');
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const data = response.data;
      console.log('✅ Health check response:', {
        status: data.status,
        environment: data.environment,
        uptime: data.uptime,
        version: data.version
      });
      
      return true;
    } catch (error) {
      console.error('❌ Health endpoint test failed:', error.message);
      return false;
    }
  }

  async testRootEndpoint() {
    console.log('🧪 Testing / endpoint...');
    
    try {
      const response = await this.axios.get('/');
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const data = response.data;
      console.log('✅ Root endpoint response:', {
        message: data.message,
        version: data.version,
        endpoints: data.endpoints
      });
      
      return true;
    } catch (error) {
      console.error('❌ Root endpoint test failed:', error.message);
      return false;
    }
  }

  async testAPIStatusEndpoint() {
    console.log('🧪 Testing /api/status endpoint...');
    
    try {
      const response = await this.axios.get('/api/status');
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const data = response.data;
      console.log('✅ API Status response:', {
        success: data.success,
        server: data.server,
        services: data.services
      });
      
      return true;
    } catch (error) {
      console.error('❌ API Status endpoint test failed:', error.message);
      return false;
    }
  }

  async testDeviceDataEndpoint() {
    console.log('🧪 Testing /api/devices/data endpoint...');
    
    try {
      const mockDeviceData = {
        deviceId: 'test-device-001',
        timestamp: new Date().toISOString(),
        temperature: 25.5,
        humidity: 60.2,
        soilMoisture: 35.8,
        batteryLevel: 85,
        rssi: -65
      };
      
      const response = await this.axios.post('/api/devices/data', mockDeviceData);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const data = response.data;
      console.log('✅ Device data endpoint response:', {
        success: data.success,
        deviceId: data.deviceId,
        message: data.message
      });
      
      return true;
    } catch (error) {
      console.error('❌ Device data endpoint test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Smart Irrigation System API Testing Suite');
    console.log('=' .repeat(60));
    console.log(`📍 Testing API at: ${this.baseURL}`);
    console.log(`⏱️  Timeout: ${this.timeout}ms\n`);

    // Check server connectivity first
    const isConnected = await this.checkServerConnectivity();
    if (!isConnected) {
      console.log('\n❌ Cannot proceed with tests - Server is not reachable');
      console.log('💡 Please ensure the server is running and try again');
      return false;
    }

    console.log('\n🧪 Running API endpoint tests...\n');

    let testResults = [];
    
    // Run individual tests
    testResults.push(await this.testHealthEndpoint());
    testResults.push(await this.testRootEndpoint());
    testResults.push(await this.testAPIStatusEndpoint());
    testResults.push(await this.testDeviceDataEndpoint());

    // Generate summary
    const passedTests = testResults.filter(result => result === true).length;
    const totalTests = testResults.length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n📊 Test Summary');
    console.log('=' .repeat(30));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (successRate === 100) {
      console.log('\n🎉 All API tests passed! Backend is ready.');
      return true;
    } else {
      console.log('\n⚠️  Some API tests failed. Please review the errors above.');
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new SmartIrrigationAPITester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = SmartIrrigationAPITester;