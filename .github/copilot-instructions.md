# n8n Windows Network Fileshare SMB2 Node Development Guide

## Project Overview
This is an n8n community node for Windows File Share access via SMB2 protocol. The project follows the standard n8n node template structure but will integrate the `smb2` npm package for Windows network file operations.

## Architecture & Key Components

### Core Structure
- `nodes/` - Node implementations (TypeScript classes implementing `INodeType`)
- `credentials/` - Authentication handling (TypeScript classes implementing `ICredentialType`)
- `dist/` - Compiled output (auto-generated, not committed)
- Build system: TypeScript + Gulp for icon copying

### Critical Files
- `package.json` - Defines n8n node registration in the `n8n` section
- `tsconfig.json` - TypeScript compilation targeting `dist/` with strict settings
- `gulpfile.js` - Handles icon/asset copying from source to dist

## Development Workflow

### Build Commands (use these specific patterns from Kraken reference)
```bash
npm run build          # Full build: clean, compile, copy icons
npm run dev            # Watch mode for development
npm run lint           # ESLint check
npm run lintfix        # Auto-fix lint issues
npm run format         # Prettier formatting
```

### Testing Strategy (adopt from Kraken standards)
Create test files following the pattern:
- `test-node.js` - Basic API connectivity tests
- `test-smb2-operations.js` - Direct SMB2 (node-smb2) package tests against a real Windows fileshare (certify package functionality)
- `test-comprehensive.js` - Full workflow tests using the n8n node against the same Windows fileshare
- Add to package.json: `"test": "npm run test:api && npm run test:operations && npm run test:comprehensive"`

## SMB2 Integration Patterns

### Prioritized SMB2 Operations
Implement the following core operations:
- **List Directory**: Enumerate files/folders in a share
- **Read File**: Download file contents
- **Write File**: Upload or overwrite files
- **Delete File**: Remove files
- **Create Directory**: Make new folders
- **Rename/Move File**: Change file/folder names or locations
- **Get File Metadata**: Retrieve file size, timestamps, permissions

### Recommended Dependency
Use [`node-smb2`](https://www.npmjs.com/package/node-smb2) (actively maintained) as the SMB2 client library:
```json
"dependencies": {
  "node-smb2": "^x.x.x"
}
```

### Node Structure Pattern
Follow the resource/operation pattern from HttpBin example:
- Resource: "File Operations"
- Operations: as listed above
- Use `requestDefaults` for common SMB2 connection settings

### Credentials Pattern  
Create `WindowsNetworkCredentials.credentials.ts`:
- Fields: domain, username, password, host/server, **connectionTimeout (ms)**
- Use `typeOptions: { password: true }` for sensitive fields
- Include credential test functionality

## n8n-Specific Conventions

### Node Registration
Update `package.json` n8n section:
```json
"n8n": {
  "credentials": ["dist/credentials/WindowsNetworkCredentials.credentials.js"],
  "nodes": ["dist/nodes/WindowsFileshare/WindowsFileshare.node.js"]
}
```

### Error Handling Pattern
Use `NodeOperationError` with `itemIndex` for workflow integration:
```typescript
throw new NodeOperationError(this.getNode(), error, { itemIndex });
```

### Input/Output Processing
- Process items with `this.getInputData()` 
- Use `this.getNodeParameter()` with itemIndex for dynamic parameters
- Return `INodeExecutionData[][]` arrays

## Security Considerations

### Credential Security
- Mark password fields with `typeOptions: { password: true }`
- Never log credentials in error messages
- Use proper SMB2 authentication methods

### File Operations Safety
- Validate file paths to prevent directory traversal
- Implement size limits for file operations
- Handle Windows-specific path formats and permissions

## Development Dependencies

### Required Tools
- Node.js >=20.15
- TypeScript for type safety
- ESLint with n8n-specific rules (`eslint-plugin-n8n-nodes-base`)
- Prettier for consistent formatting

### Icon Requirements
- Place `.svg` icons in node directories
- Gulp automatically copies to dist during build
- Use `icon: { light: 'file:filename.svg', dark: 'file:filename.svg' }`

## Testing & Quality Standards (from Kraken reference)

### Pre-publish Checklist
- `npm run lint` passes without errors
- `npm run format:check` passes
- `npm run build` completes successfully
- All test suites pass
- Update version in package.json
- Document breaking changes

### CI/CD Pattern
Add script: `"test:ci": "npm run lint && npm run format:check && npm run build && npm run test"`
