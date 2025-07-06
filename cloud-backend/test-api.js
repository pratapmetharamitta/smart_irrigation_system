const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing Smart Irrigation System API...\n');
  
  try {
    // Test health endpoint
    console.log('Testing /health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test root endpoint
    console.log('\nTesting / endpoint...');
    const rootResponse = await axios.get(`${baseURL}/`);
    console.log('✅ Root endpoint:', rootResponse.data);
    
    // Test API status endpoint
    console.log('\nTesting /api/status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/api/status`);
    console.log('✅ API Status:', statusResponse.data);
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAPI();