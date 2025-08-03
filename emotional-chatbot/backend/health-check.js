#!/usr/bin/env node

/**
 * Quick Server Health Check
 * Validates that the STAN backend is running and responsive
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function checkHealth() {
    console.log('🔍 Checking STAN Backend Health...\n');

    const checks = [
        {
            name: 'Server Connectivity',
            test: async () => {
                const response = await axios.get(`${BASE_URL}/api/health`);
                return response.status === 200;
            }
        },
        {
            name: 'User Creation Endpoint',
            test: async () => {
                const testUser = {
                    userId: `health_check_${Date.now()}`,
                    profile: { name: 'HealthCheck', age: 25 }
                };
                const response = await axios.post(`${BASE_URL}/api/users`, testUser);
                return response.status === 201;
            }
        },
        {
            name: 'Chat Endpoint Response',
            test: async () => {
                const testMessage = {
                    userId: `health_check_${Date.now()}`,
                    sessionId: `session_${Date.now()}`,
                    message: "Hello, are you Stan?"
                };
                const response = await axios.post(`${BASE_URL}/api/chat`, testMessage);
                return response.status === 200 &&
                    response.data.response &&
                    response.data.response.toLowerCase().includes('stan');
            }
        }
    ];

    let allPassed = true;

    for (const check of checks) {
        try {
            const result = await check.test();
            if (result) {
                console.log(`✅ ${check.name}: PASSED`);
            } else {
                console.log(`❌ ${check.name}: FAILED (unexpected response)`);
                allPassed = false;
            }
        } catch (error) {
            console.log(`❌ ${check.name}: FAILED (${error.message})`);
            allPassed = false;
        }
    }

    console.log('\n' + '='.repeat(40));
    if (allPassed) {
        console.log('🎉 All health checks passed! Server is ready for testing.');
        process.exit(0);
    } else {
        console.log('⚠️  Some health checks failed. Please check the server.');
        process.exit(1);
    }
}

if (require.main === module) {
    checkHealth().catch(error => {
        console.error('❌ Health check failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Ensure the backend server is running: npm run dev');
        console.log('2. Check if the server is accessible at', BASE_URL);
        console.log('3. Verify MongoDB connection is working');
        console.log('4. Check for any error logs in the server console');
        process.exit(1);
    });
}

module.exports = { checkHealth };
