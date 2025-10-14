# Testing Guide for n8n Windows Network Fileshare SMB2 Node

## Overview
This guide explains how to test the SMB2 functionality against a real Windows fileshare before integrating into the n8n node.

## Prerequisites

1. **Windows Fileshare Access**: You need access to a Windows network share with read/write permissions
2. **Node.js**: Version 20.15 or higher
3. **Network Connectivity**: Ability to reach the Windows fileshare from your development machine

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Test Credentials
Copy the example environment file and update with your actual credentials:
```bash
cp .env.example .env
```

Edit `.env` and update the following values:
- `SMB_SHARE`: Your Windows share UNC path (e.g., `\\192.168.1.100\shared`)
- `SMB_DOMAIN`: Windows domain or `WORKGROUP`
- `SMB_USERNAME`: Your Windows username
- `SMB_PASSWORD`: Your Windows password
- `SMB_TEST_DIR`: Test directory path (will be created/cleaned up)

**Note**: The `.env` file is in `.gitignore` to keep your credentials secure.

## Running Tests

### Direct SMB2 Package Tests
Test the `node-smb2` package directly against your Windows fileshare:
```bash
npm run test:operations
```

This test suite validates:
- ✅ SMB2 client initialization
- ✅ Connection to Windows fileshare
- ✅ List directory contents
- ✅ Create directory
- ✅ Write file
- ✅ Read file
- ✅ Get file metadata (size, timestamps)
- ✅ Rename/move file
- ✅ Delete file
- ✅ Create subdirectory
- ✅ Delete subdirectory
- ✅ Cleanup test directory

### Optional: Large File Test
To test with 1MB files (slower):
```bash
TEST_LARGE_FILE=true npm run test:operations
```

### Optional: Keep Test Directory
To preserve the test directory after tests:
```bash
CLEANUP_TEST_DIR=false npm run test:operations
```

## Expected Output

Successful test run:
```
🚀 Testing node-smb2 Package Against Real Windows Fileshare
===========================================================

📋 Configuration:
   Share: \\192.168.1.100\shared
   Domain: WORKGROUP
   Username: testuser
   Test Directory: \test-n8n-smb2
   Connection Timeout: 30000ms

✅ PASSED: Initialize SMB2 Client
✅ PASSED: Test Connection - List Root Directory
✅ PASSED: Create Test Directory
✅ PASSED: Write File
✅ PASSED: Read File
✅ PASSED: Get File Metadata
✅ PASSED: List Test Directory Contents
✅ PASSED: Rename File
✅ PASSED: Verify Renamed File Exists
✅ PASSED: Delete File
✅ PASSED: Verify File is Deleted
✅ PASSED: Create Subdirectory
✅ PASSED: Delete Subdirectory
✅ PASSED: Cleanup - Delete Test Directory

============================================================
📊 Test Summary
============================================================
✅ Passed: 14/14
❌ Failed: 0/14
📈 Success Rate: 100.0%

🎉 All tests passed! node-smb2 package is fully functional.
✅ Ready to integrate into n8n node implementation.
```

## Troubleshooting

### Connection Refused / Timeout
- Verify the share path is correct (UNC format: `\\server\share`)
- Check network connectivity: `ping <server-ip>`
- Ensure SMB ports are open (TCP 445)
- Verify Windows Firewall allows SMB traffic

### Authentication Failed
- Double-check username and password
- Verify domain name (use `WORKGROUP` for local accounts)
- Ensure the user has read/write permissions on the share

### Permission Denied
- Verify the user has write permissions on the share
- Check NTFS permissions on the target directory
- Ensure the share is not read-only

### STATUS_OBJECT_NAME_COLLISION
- This is normal if the test directory already exists
- The test will continue using the existing directory
- Set `CLEANUP_TEST_DIR=false` to inspect the directory after tests

## Next Steps

Once the SMB2 package tests pass:
1. ✅ Package functionality is certified
2. 🔨 Proceed to implement the n8n credential class
3. 🔨 Implement the n8n node with SMB2 operations
4. 🧪 Create comprehensive n8n workflow tests
5. 📦 Publish to npm

## Test File Structure

- `test-smb2-operations.js` - Direct SMB2 package tests (this runs first)
- `test-node.js` - Basic n8n node API tests (to be created)
- `test-comprehensive.js` - Full n8n workflow tests (to be created)
