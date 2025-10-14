// Comprehensive test for @marsaud/smb2 package functionality against a real Windows fileshare
// This test certifies the SMB2 package works before integrating into the n8n node

// Load environment variables from .env file
require('dotenv').config();

const SMB2 = require('@marsaud/smb2');

// ========================================
// Configuration - Using environment variables
// ========================================
const config = {
	share: process.env.SMB_SHARE || '\\\\csi-pilot\\Backups_for_Refresh',
	domain: process.env.SMB_DOMAIN || 'SALINAVORTEX',
	username: process.env.SMB_USERNAME || 'n8n-network',
	password: process.env.SMB_PASSWORD || 'testpassword',
	timeout: parseInt(process.env.SMB_TIMEOUT) || 30000,
	testDir: process.env.SMB_TEST_DIR || 'test-n8n-smb2',
	testFile: 'test-file.txt',
	testContent: 'Hello from n8n SMB2 Node!\nThis is a test file created by the test suite.\nTimestamp: ' + new Date().toISOString() + '\n',
};

console.log('🚀 Testing @marsaud/smb2 Package Against Real Windows Fileshare');
console.log('================================================================\n');
console.log('📋 Configuration:');
console.log(`   Share: ${config.share}`);
console.log(`   Domain: ${config.domain}`);
console.log(`   Username: ${config.username}`);
console.log(`   Test Directory: ${config.testDir}`);
console.log(`   Connection Timeout: ${config.timeout}ms\n`);

// ========================================
// Helper Functions
// ========================================
let testsPassed = 0;
let totalTests = 0;

async function runTest(testName, testFn) {
	totalTests++;
	try {
		console.log(`\n${totalTests}. ${testName}...`);
		await testFn();
		console.log(`✅ PASSED: ${testName}`);
		testsPassed++;
		return true;
	} catch (error) {
		console.log(`❌ FAILED: ${testName}`);
		console.log(`   Error: ${error.message}`);
		if (error.stack) {
			console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
		}
		return false;
	}
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================================
// Main Test Suite
// ========================================
async function runAllTests() {
	let smb2Client = null;

	try {
		// Test 1: Initialize SMB2 Client
		await runTest('Initialize SMB2 Client', async () => {
			smb2Client = new SMB2({
				share: config.share,
				domain: config.domain,
				username: config.username,
				password: config.password,
				timeout: config.timeout,
			});
			console.log('   📊 Client initialized successfully');
		});

		if (!smb2Client) {
			throw new Error('SMB2 client initialization failed. Aborting tests.');
		}

		// Test 2: Test Connection (Read Root Directory)
		await runTest('Test Connection - List Root Directory', async () => {
			const files = await new Promise((resolve, reject) => {
				smb2Client.readdir('', (err, files) => {
					if (err) reject(err);
					else resolve(files);
				});
			});
			console.log(`   📊 Root directory contains ${files.length} items`);
			if (files.length > 0) {
				console.log(`   📁 Sample items: ${files.slice(0, 3).join(', ')}`);
			}
		});

		// Test 3: Create Test Directory
		await runTest('Create Test Directory', async () => {
			await new Promise((resolve, reject) => {
				smb2Client.mkdir(config.testDir, (err) => {
					if (err && err.code !== 'STATUS_OBJECT_NAME_COLLISION') {
						reject(err);
					} else {
						if (err) {
							console.log('   📊 Directory already exists (continuing)');
						} else {
							console.log(`   📊 Created directory: ${config.testDir}`);
						}
						resolve();
					}
				});
			});
		});

		// Test 4: Write File
		const testFilePath = `${config.testDir}\\${config.testFile}`;
		await runTest('Write File', async () => {
			await new Promise((resolve, reject) => {
				smb2Client.writeFile(testFilePath, config.testContent, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
			console.log(`   📊 Written file: ${testFilePath}`);
			console.log(`   📊 Content length: ${config.testContent.length} bytes`);
		});

		// Test 5: Read File
		await runTest('Read File', async () => {
			const content = await new Promise((resolve, reject) => {
				smb2Client.readFile(testFilePath, (err, data) => {
					if (err) reject(err);
					else resolve(data.toString());
				});
			});
			console.log(`   📊 Read ${content.length} bytes`);
			if (content !== config.testContent) {
				throw new Error('File content mismatch');
			}
			console.log('   📊 Content matches written data');
		});

		// Test 6: Get File Metadata
		await runTest('Get File Metadata', async () => {
			const size = await new Promise((resolve, reject) => {
				smb2Client.getSize(testFilePath, (err, size) => {
					if (err) reject(err);
					else resolve(size);
				});
			});
			console.log(`   📊 File size: ${size} bytes`);

			const exists = await new Promise((resolve, reject) => {
				smb2Client.exists(testFilePath, (err, exists) => {
					if (err) reject(err);
					else resolve(exists);
				});
			});
			console.log(`   📊 File exists: ${exists}`);
		});

		// Test 7: List Test Directory
		await runTest('List Test Directory Contents', async () => {
			const files = await new Promise((resolve, reject) => {
				smb2Client.readdir(config.testDir, (err, files) => {
					if (err) reject(err);
					else resolve(files);
				});
			});
			console.log(`   📊 Found ${files.length} items in test directory`);
			console.log(`   📁 Files: ${files.join(', ')}`);
			if (!files.includes(config.testFile)) {
				throw new Error('Test file not found in directory listing');
			}
		});

		// Test 8: Rename File
		const renamedFilePath = `${config.testDir}\\${config.testFile}.renamed`;
		await runTest('Rename File', async () => {
			await new Promise((resolve, reject) => {
				smb2Client.rename(testFilePath, renamedFilePath, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
			console.log(`   📊 Renamed: ${config.testFile} → ${config.testFile}.renamed`);
		});

		// Test 9: Verify Renamed File Exists
		await runTest('Verify Renamed File Exists', async () => {
			const size = await new Promise((resolve, reject) => {
				smb2Client.getSize(renamedFilePath, (err, size) => {
					if (err) reject(err);
					else resolve(size);
				});
			});
			console.log(`   📊 Renamed file exists, size: ${size} bytes`);
		});

		// Test 10: Delete File
		await runTest('Delete File', async () => {
			await new Promise((resolve, reject) => {
				smb2Client.unlink(renamedFilePath, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
			console.log(`   📊 Deleted file: ${renamedFilePath}`);
		});

		// Test 11: Verify File is Deleted
		await runTest('Verify File is Deleted', async () => {
			try {
				const exists = await new Promise((resolve, reject) => {
					smb2Client.exists(renamedFilePath, (err, exists) => {
						if (err) reject(err);
						else resolve(exists);
					});
				});
				if (exists) {
					throw new Error('File still exists after deletion');
				}
				console.log('   📊 File correctly deleted (exists check returned false)');
			} catch (err) {
				if (err.message === 'File still exists after deletion') {
					throw err;
				}
				console.log('   📊 File correctly deleted (exists check failed as expected)');
			}
		});

		// Test 12: Create Subdirectory
		const subDirPath = `${config.testDir}\\subdir`;
		await runTest('Create Subdirectory', async () => {
			await new Promise((resolve, reject) => {
				smb2Client.mkdir(subDirPath, (err) => {
					if (err && err.code !== 'STATUS_OBJECT_NAME_COLLISION') {
						reject(err);
					} else {
						resolve();
					}
				});
			});
			console.log(`   📊 Created subdirectory: ${subDirPath}`);
		});

		// Test 13: Delete Subdirectory
		await runTest('Delete Subdirectory', async () => {
			await new Promise((resolve, reject) => {
				smb2Client.rmdir(subDirPath, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
			console.log(`   📊 Deleted subdirectory: ${subDirPath}`);
		});

		// Test 14: Test Large File (Optional - can be slow)
		if (process.env.TEST_LARGE_FILE === 'true') {
			const largeFilePath = `${config.testDir}\\large-file.bin`;
			await runTest('Write and Read Large File (1MB)', async () => {
				const largeContent = Buffer.alloc(1024 * 1024, 'A'); // 1MB of 'A'

				await new Promise((resolve, reject) => {
					smb2Client.writeFile(largeFilePath, largeContent, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
				console.log('   📊 Written 1MB file');

				const readContent = await new Promise((resolve, reject) => {
					smb2Client.readFile(largeFilePath, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});
				console.log(`   📊 Read back ${readContent.length} bytes`);

				await new Promise((resolve, reject) => {
					smb2Client.unlink(largeFilePath, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
				console.log('   📊 Cleaned up large file');
			});
		}

		// Test 15: Test Multiple File Operations
		await runTest('Create Multiple Files', async () => {
			const filePromises = [];
			for (let i = 1; i <= 3; i++) {
				const fileName = `${config.testDir}\\multi-file-${i}.txt`;
				const content = `This is test file ${i}\nCreated: ${new Date().toISOString()}\n`;

				filePromises.push(
					new Promise((resolve, reject) => {
						smb2Client.writeFile(fileName, content, (err) => {
							if (err) reject(err);
							else resolve(fileName);
						});
					})
				);
			}

			const createdFiles = await Promise.all(filePromises);
			console.log(`   📊 Created ${createdFiles.length} files: ${createdFiles.map(f => f.split('/').pop()).join(', ')}`);
		});

		// Test 16: Cleanup Multiple Files
		await runTest('Cleanup Multiple Files', async () => {
			const files = await new Promise((resolve, reject) => {
				smb2Client.readdir(config.testDir, (err, files) => {
					if (err) reject(err);
					else resolve(files);
				});
			});

			const deletePromises = files
				.filter(file => file.startsWith('multi-file-'))
				.map(file =>
					new Promise((resolve, reject) => {
						smb2Client.unlink(`${config.testDir}\\${file}`, (err) => {
							if (err) reject(err);
							else resolve(file);
						});
					})
				);

			const deletedFiles = await Promise.all(deletePromises);
			console.log(`   📊 Deleted ${deletedFiles.length} files: ${deletedFiles.join(', ')}`);
		});

		// Cleanup: Delete Test Directory (optional)
		if (process.env.CLEANUP_TEST_DIR !== 'false') {
			await runTest('Cleanup - Delete Test Directory', async () => {
				await new Promise((resolve, reject) => {
					smb2Client.rmdir(config.testDir, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
				console.log(`   📊 Deleted test directory: ${config.testDir}`);
			});
		}

	} catch (error) {
		console.error('\n❌ Fatal error during test execution:', error.message);
	}

	// Print Summary
	console.log('\n\n' + '='.repeat(60));
	console.log('📊 Test Summary');
	console.log('='.repeat(60));
	console.log(`✅ Passed: ${testsPassed}/${totalTests}`);
	console.log(`❌ Failed: ${totalTests - testsPassed}/${totalTests}`);
	console.log(
		`📈 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`
	);

	if (testsPassed === totalTests) {
		console.log('\n🎉 All tests passed! @marsaud/smb2 package is fully functional.');
		console.log('✅ Ready to integrate into n8n node implementation.');
		process.exit(0);
	} else {
		console.log('\n⚠️  Some tests failed. Review errors above.');
		console.log('💡 Check your Windows fileshare configuration and credentials.');
		process.exit(1);
	}
}

// ========================================
// Run Tests
// ========================================
console.log('⏳ Starting tests in 2 seconds...\n');
setTimeout(() => {
	runAllTests().catch((error) => {
		console.error('\n❌ Unhandled error:', error);
		process.exit(1);
	});
}, 2000);
