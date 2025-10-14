/**
 * Test the new Connection Test functionality
 */

require('dotenv').config();

// Simulate n8n execution environment for connection test
const mockExecutionContext = {
    inputs: [{ json: { test: 'connection' } }],
    credentials: {
        windowsNetworkApi: {
            share: process.env.SMB_SHARE,
            domain: process.env.SMB_DOMAIN,
            username: process.env.SMB_USERNAME,
            password: process.env.SMB_PASSWORD,
            timeout: 30000
        }
    },
    parameters: {}
};

// Mock n8n workflow functions for connection test
function createMockThis() {
    return {
        getInputData: () => mockExecutionContext.inputs,
        getCredentials: async (credName, itemIndex) => mockExecutionContext.credentials[credName],
        getNodeParameter: (paramName, itemIndex, defaultValue) => {
            if (paramName === 'resource') return 'connection';
            if (paramName === 'operation') return 'test';
            return defaultValue;
        },
        getNode: () => ({ name: 'Windows Fileshare Connection Test' }),
        continueOnFail: () => false,
        helpers: {
            constructExecutionMetaData: (data, meta) => data,
            returnJsonArray: (data) => [{ json: data }]
        }
    };
}

async function testConnectionTest() {
    console.log('🧪 Testing Windows Fileshare Connection Test Operation');
    console.log('==================================================');
    console.log('📋 Configuration:');
    console.log(`   Share: ${process.env.SMB_SHARE}`);
    console.log(`   Domain: ${process.env.SMB_DOMAIN}`);
    console.log(`   Username: ${process.env.SMB_USERNAME}`);
    console.log('');

    try {
        // Import the compiled node
        const { WindowsFileshare } = require('./dist/nodes/WindowsFileshare/WindowsFileshare.node.js');

        console.log('1. Initializing Windows Fileshare Node...');
        const node = new WindowsFileshare();
        console.log('✅ Node initialized successfully');

        console.log('\n2. Testing Connection Test Operation...');
        const mockThis = createMockThis();

        const result = await node.execute.call(mockThis);

        if (!result || !result[0] || !result[0][0]) {
            throw new Error('No result returned from connection test');
        }

        const data = result[0][0].json;

        console.log('✅ Connection test completed successfully');
        console.log('\n📊 Connection Test Results:');
        console.log(`   Status: ${data.connectionTest}`);
        console.log(`   Message: ${data.message}`);
        console.log(`   Root Directory Files: ${data.rootDirectoryFiles}`);
        console.log(`   Sample Files: ${data.sampleFiles?.join(', ') || 'None'}`);
        console.log(`   Test Timestamp: ${data.timestamp}`);
        console.log('\n📋 Credential Configuration:');
        console.log(`   Share: ${data.credentials.share}`);
        console.log(`   Domain: ${data.credentials.domain}`);
        console.log(`   Username: ${data.credentials.username}`);
        console.log(`   Timeout: ${data.credentials.timeout}ms`);

        if (data.connectionTest === 'success') {
            console.log('\n🎉 Connection test PASSED! Credentials are valid and working.');
        } else {
            console.log('\n❌ Connection test FAILED! Check your credentials.');
        }

    } catch (error) {
        console.log('❌ Connection test FAILED!');
        console.log(`   Error: ${error.message}`);
        console.log('\n💡 Troubleshooting:');
        console.log('   - Check your .env file has correct SMB credentials');
        console.log('   - Verify the SMB share is accessible from this machine');
        console.log('   - Ensure the domain and username are correct');
        console.log('   - Try increasing the timeout value');
        process.exit(1);
    }
}

// Run the connection test
testConnectionTest().catch(error => {
    console.error('💥 Connection test suite failed:', error);
    process.exit(1);
});
