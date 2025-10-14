# n8n-nodes-windows-network-fileshare-smb2

This is an n8n community node. It lets you use Windows Network File Shares (SMB2) in your n8n workflows.

Windows Network File Shares allow you to access files and directories on Windows servers and network-attached storage devices using the SMB2 protocol. This node enables seamless file operations across your network infrastructure.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Development](#development)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Install using the package name:
```
n8n-nodes-windows-network-fileshare-smb2
```

## Operations

This node supports comprehensive file and directory operations on Windows network shares:

### File Operations
- **Read File** - Download and read file contents from the network share
- **Write File** - Upload or create files with specified content
- **Delete File** - Remove files from the network share
- **Move File** - Rename or relocate files within the share
- **File Metadata** - Get file size, existence, and other metadata

### Directory Operations
- **List Directory** - Enumerate files and folders in a directory
- **Create Directory** - Create new folders on the network share
- **Delete Directory** - Remove empty directories from the share

## Credentials

To use this node, you need access to a Windows network file share with appropriate permissions.

### Prerequisites
- Access to a Windows file share (SMB2 compatible)
- Valid Windows domain or local user credentials
- Network connectivity to the target share

### Authentication Setup
1. In n8n, create new credentials of type "Windows Network API"
2. Configure the following fields:
   - **Share Path** - UNC path to your network share (e.g., `\\server\sharename`)
   - **Domain** - Windows domain name (leave empty for local accounts)
   - **Username** - Windows username with share access
   - **Password** - User password
   - **Connection Timeout** - Timeout in milliseconds (default: 30000)

### Required Permissions
Your user account needs the following permissions on the target share:
- **Read** permissions for file read and directory list operations
- **Write** permissions for file write and directory create operations
- **Delete** permissions for file and directory deletion operations

## Compatibility

- **Minimum n8n version:** 1.0.0
- **Tested with:** n8n 1.x
- **Node.js requirement:** 20.15 or higher
- **SMB Protocol:** SMB2 and SMB3 compatible shares
- **Operating Systems:** Windows, Linux, macOS (client-side)

### Known Limitations
- Requires `--openssl-legacy-provider` flag for Node.js compatibility
- Large file operations may require timeout adjustments
- Some legacy SMB1 shares may not be supported

## Usage

### Basic File Operations
1. Add the "Windows Fileshare (SMB2)" node to your workflow
2. Configure your Windows Network credentials
3. Select the desired operation (File or Directory)
4. Specify the file/directory path relative to your share root
5. Configure operation-specific parameters

### Path Format
- Use forward slashes `/` or backslashes `\` in paths
- Paths are relative to your configured share root
- Example: `folder/subfolder/file.txt` or `folder\subfolder\file.txt`

### Error Handling
The node provides detailed error messages for common issues:
- Authentication failures
- Network connectivity problems
- File not found errors
- Permission denied errors

Configure error handling in your workflow using n8n's built-in error handling features.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Microsoft SMB Protocol Documentation](https://docs.microsoft.com/en-us/windows/win32/fileio/microsoft-smb-protocol-and-cifs-protocol-overview)
* [Windows File Sharing Documentation](https://docs.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview)

## Development

This section contains information for developers who want to contribute to or modify this node.

### Prerequisites
- Node.js 20.15 or higher
- npm or yarn package manager
- TypeScript knowledge
- Basic understanding of n8n node development

### Setup Development Environment
1. Clone the repository:
   ```bash
   git clone https://github.com/DirectorVector/n8n-nodes-windows-network-fileshare-smb2.git
   cd n8n-nodes-windows-network-fileshare-smb2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables for testing:
   ```bash
   # Create .env file with your test credentials
   SMB_SHARE=\\\\server\\sharename
   SMB_DOMAIN=YOURDOMAIN
   SMB_USERNAME=testuser
   SMB_PASSWORD=testpass
   ```

### Development Commands
```bash
# Build the node
npm run build

# Development mode with watch
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lintfix

# Format code
npm run format

# Run tests
npm run test

# Run full CI pipeline
npm run test:ci
```

### Testing
The project includes comprehensive testing:

- **SMB2 Package Tests** - Direct testing of the @marsaud/smb2 package functionality
- **n8n Node Tests** - Integration tests for the complete node implementation

Run tests with:
```bash
npm run test:operations  # Test SMB2 package directly
npm run test:node        # Test n8n node implementation
npm run test            # Run both test suites
```

### Project Structure
```
├── credentials/
│   └── WindowsNetworkApi.credentials.ts  # Authentication configuration
├── nodes/
│   └── WindowsFileshare/
│       ├── WindowsFileshare.node.ts      # Main node implementation
│       ├── WindowsFileshareDescription.ts # Node UI configuration
│       └── windowsfileshare.svg          # Node icon
├── test-smb2-operations.js               # SMB2 package tests
├── test-n8n-node.js                      # Node integration tests
└── dist/                                 # Compiled output
```

### Key Dependencies
- **@marsaud/smb2** - SMB2 client library for network file operations
- **n8n-workflow** - n8n workflow types and utilities
- **TypeScript** - Type-safe development
- **ESLint** - Code quality and consistency

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests as needed
5. Ensure all tests pass: `npm run test:ci`
6. Submit a pull request

### Debugging
For development debugging:
1. Enable verbose logging in your test environment
2. Use the included test files to validate functionality
3. Check network connectivity and credentials
4. Verify SMB2 protocol compatibility on target shares
