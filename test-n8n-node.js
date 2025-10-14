/**
 * Test n8n Windows Fileshare Node
 * Comprehensive test of the compiled n8n node using the same SMB2 patterns
 */

require('dotenv').config();

// Simulate n8n execution environment
const mockExecutionContext = {
    inputs: [{ json: { test: 'data' } }],
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

// Mock n8n workflow functions
function createMockThis(resource, operation, additionalParams = {}) {
    return {
        getInputData: () => mockExecutionContext.inputs,
        getCredentials: async (credName, itemIndex) => mockExecutionContext.credentials[credName],
        getNodeParameter: (paramName, itemIndex, defaultValue) => {
            if (paramName === 'resource') return resource;
            if (paramName === 'operation') return operation;
            return additionalParams[paramName] || defaultValue;
        },
        getNode: () => ({ name: 'Windows Fileshare Test' }),
        continueOnFail: () => false,
        helpers: {
            constructExecutionMetaData: (data, meta) => data,
            returnJsonArray: (data) => [{ json: data }]
        }
    };
}

async function testWindowsFileshareNode() {
    console.log('🚀 Testing n8n Windows Fileshare Node');
    console.log('=====================================');
    console.log('📋 Configuration:');
    console.log(`   Share: ${process.env.SMB_SHARE}`);
    console.log(`   Domain: ${process.env.SMB_DOMAIN}`);
    console.log(`   Username: ${process.env.SMB_USERNAME}`);
    console.log(`   Test Directory: Test_Node_Directory`);
    console.log('');

    let testCount = 0;
    let passedTests = 0;

    async function runTest(testName, testFunction) {
        testCount++;
        try {
            console.log(`${testCount}. ${testName}...`);
            const result = await testFunction();
            console.log(`✅ PASSED: ${testName}`);
            if (result) {
                console.log(`   📊 ${result}`);
            }
            passedTests++;
            console.log('');
        } catch (error) {
            console.log(`❌ FAILED: ${testName}`);
            console.log(`   🚨 Error: ${error.message}`);
            console.log('');
        }
    }

    // Import the compiled node
    const { WindowsFileshare } = require('./dist/nodes/WindowsFileshare/WindowsFileshare.node.js');

    await runTest('Initialize Windows Fileshare Node', async () => {
        const node = new WindowsFileshare();
        if (!node || !node.description) {
            throw new Error('Node initialization failed');
        }
        return `Node created: ${node.description.displayName}`;
    });

    await runTest('Test Directory List Operation', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('directory', 'list', {
            directoryPath: ''
        });

        const result = await node.execute.call(mockThis);
        if (!result || !result[0] || !result[0][0]) {
            throw new Error('No result returned');
        }

        const data = result[0][0].json;
        if (!data.files || !Array.isArray(data.files)) {
            throw new Error('Invalid file list returned');
        }

        return `Listed ${data.files.length} items in root directory`;
    });

    await runTest('Test Directory Create Operation', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('directory', 'create', {
            directoryPath: 'Test_Node_Directory'
        });

        const result = await node.execute.call(mockThis);
        const data = result[0][0].json;

        if (!data.created || !data.success) {
            throw new Error('Directory creation failed');
        }

        return `Created directory: ${data.directoryPath}`;
    });

    await runTest('Test File Write Operation', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('file', 'write', {
            filePath: 'Test_Node_Directory\\node-test.txt',
            fileContent: 'Hello from n8n Windows Fileshare Node!\nThis is a test file created by the node.\nTimestamp: ' + new Date().toISOString(),
            encoding: 'utf8'
        });

        const result = await node.execute.call(mockThis);
        const data = result[0][0].json;

        if (!data.success || data.size <= 0) {
            throw new Error('File write failed');
        }

        return `Written ${data.size} bytes to ${data.filePath}`;
    });

    await runTest('Test File Read Operation', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('file', 'read', {
            filePath: 'Test_Node_Directory\\node-test.txt'
        });

        const result = await node.execute.call(mockThis);
        const data = result[0][0].json;

        if (!data.content || data.size <= 0) {
            throw new Error('File read failed');
        }

        if (!data.content.includes('Hello from n8n')) {
            throw new Error('File content mismatch');
        }

        return `Read ${data.size} bytes, content verified`;
    });

    await runTest('Test File Metadata Operation', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('file', 'metadata', {
            filePath: 'Test_Node_Directory\\node-test.txt'
        });

        const result = await node.execute.call(mockThis);
        const data = result[0][0].json;

        if (!data.exists || data.size <= 0) {
            throw new Error('File metadata check failed');
        }

        return `File exists: ${data.exists}, Size: ${data.size} bytes`;
    });

    // Cleanup
    await runTest('Cleanup - Delete Test File', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('file', 'delete', {
            filePath: 'Test_Node_Directory\\node-test.txt'
        });

        const result = await node.execute.call(mockThis);
        const data = result[0][0].json;

        if (!data.deleted || !data.success) {
            throw new Error('File deletion failed');
        }

        return `Deleted file: ${data.filePath}`;
    });

    await runTest('Cleanup - Delete Test Directory', async () => {
        const node = new WindowsFileshare();
        const mockThis = createMockThis('directory', 'delete', {
            directoryPath: 'Test_Node_Directory'
        });

        const result = await node.execute.call(mockThis);
        const data = result[0][0].json;

        if (!data.deleted || !data.success) {
            throw new Error('Directory deletion failed');
        }

        return `Deleted directory: ${data.directoryPath}`;
    });

    console.log('=====================================');
    console.log('📊 Test Summary');
    console.log('=====================================');
    console.log(`✅ Passed: ${passedTests}/${testCount}`);
    console.log(`❌ Failed: ${testCount - passedTests}/${testCount}`);
    console.log(`📈 Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);
    console.log('');

    if (passedTests === testCount) {
        console.log('🎉 All n8n node tests passed! Node is ready for use.');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above.');
        process.exit(1);
    }
}

// Run the test
testWindowsFileshareNode().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});
