# n8n-nodes-windows-network-fileshare-smb2

This is an n8n community node. It lets you use Windows Network File Shares (SMB2) in your n8n workflows.

Windows Network File Shares allow you to access files and directories on Windows servers and network-attached storage devices using the SMB2 protocol. This node enables seamless file operations across your network infrastructure.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Troubleshooting](#troubleshooting)  
[Resources](#resources)  
[Development](#development)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Install using the package name:
```
n8n-nodes-windows-network-fileshare-smb2
```

> **Important:** the underlying SMB2 library uses legacy crypto (NTLM), so n8n must be started with the `--openssl-legacy-provider` Node.js flag. See [Troubleshooting](#troubleshooting).

## Operations

This node supports comprehensive file and directory operations on Windows network shares:

### File Operations
- **Read File** - Read file contents from the share, as **Text** (UTF-8 string) or **Binary** (n8n binary data — use for images, PDFs, any non-text file)
- **Write File** - Write a file from **Text** (string + encoding) or **Binary** (an incoming binary property, lossless for any file type)
- **Delete File** - Remove files from the network share
- **Move File** - Rename or relocate files within the share
- **File Metadata** - Get file size, existence, and other metadata

### Directory Operations
- **List Directory** - Enumerate files and folders in a directory
- **Create Directory** - Create new folders on the network share
- **Delete Directory** - Remove empty directories from the share

### Connection
- **Test Connection** - Open an SMB2 session with the configured credentials and list the share root

## Credentials

To use this node, you need access to a Windows network file share with appropriate permissions.

### Prerequisites
- Access to a Windows file share (SMB2 compatible)
- Valid Windows domain or local user credentials
- Network connectivity to the target share

### Authentication Setup
1. In n8n, create new credentials of type "Windows Network (SMB2) API"
2. Configure the following fields:
   - **UNC Share Path** - UNC path to the **share root**, e.g. `\\server\ShareName`. Use double backslashes, no trailing slash, and no forward slashes. Put sub-folders in the node's path field, not here.
   - **Domain** - Windows domain name (use `WORKGROUP` for local accounts)
   - **Username** - Windows username with share access (without the domain prefix)
   - **Password** - User password
   - **Connection Timeout** - Timeout in milliseconds (default: 30000)
3. Click **Test** — the credential test opens a real SMB2 connection and lists the share root. A green result means the share, domain, username, and password are all valid.

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
- Requires the `--openssl-legacy-provider` Node.js flag on the **n8n process** (see [Troubleshooting](#troubleshooting))
- Large file operations may require timeout adjustments
- SMB1-only shares are not supported

## Usage

### Basic File Operations
1. Add the "Windows Fileshare (SMB2)" node to your workflow
2. Configure your Windows Network (SMB2) credentials
3. Select the desired resource and operation (File, Directory, or Connection)
4. Specify the file/directory path relative to your share root
5. Configure operation-specific parameters

### Reading and writing binary files
Text mode decodes bytes as UTF-8, which **corrupts** any non-text file (images, PDFs, archives). For those:
- **Read File** → set **Output** to **Binary**. The file is returned as n8n binary data (with filename and MIME type) on the chosen binary property.
- **Write File** → set **Input** to **Binary** and point it at the incoming binary property. The raw bytes are written verbatim.

This round-trips binary files byte-for-byte and plugs straight into other n8n nodes (HTTP, email attachments, etc.).

### Path Format
- The **share root** goes in the credential's UNC Share Path (`\\server\ShareName`).
- File/directory paths in the node are **relative to the share root** — e.g. `folder/subfolder/file.txt`. Forward or backslashes both work here; leading slashes are stripped automatically.

### Error Handling
Enable **Continue On Fail** on the node to capture errors as data instead of stopping the workflow.

## Troubleshooting

### "Invalid URL" or "Couldn't connect with these settings" on the credentials screen
Older versions used a placeholder HTTP request as the credential test, which could report `Invalid URL` (and always failed on hosts without internet access). As of `0.1.0-beta.6` the credential test is a real SMB2 connection. Update the community node to the latest version. A failing test now shows the actual SMB error message.

### `error:0308010C:digital envelope routines::unsupported`
The SMB2 library uses legacy crypto that Node.js 17+/OpenSSL 3 disables by default. Start the **n8n process** with the `--openssl-legacy-provider` flag — not just the dev test scripts. In Docker/Compose set it as an environment variable (note: no quotes in the list form):
```yaml
environment:
  - NODE_OPTIONS=--openssl-legacy-provider
```
For a bare install: `NODE_OPTIONS=--openssl-legacy-provider n8n start`.

### "the share is not valid"
The UNC Share Path must be `\\server\ShareName` with **double backslashes**. Forward slashes (`//server/share`), single backslashes, and trailing slashes are rejected by the SMB2 library. Put sub-folders in the node's path field, not in the credential.

### `STATUS_LOGON_FAILURE (0xC000006D)`
Wrong username, password, or domain. Use the domain in the Domain field and the bare username (no `DOMAIN\` prefix) in Username.

### `STATUS_BAD_NETWORK_NAME (0xC00000CC)`
The share name can't be found on the server — usually a trailing slash on the UNC path or a share that doesn't exist. Use `\\server\ShareName` exactly.

### Binary file comes out corrupted / different size / won't open
You're reading/writing it as Text. Switch Read to **Output: Binary** and Write to **Input: Binary** (see [Reading and writing binary files](#reading-and-writing-binary-files)).

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
