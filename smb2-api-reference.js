// Working SMB2 API Reference for n8n Node Development
// Package: @marsaud/smb2
// Requires: node --openssl-legacy-provider flag

const SMB2 = require('@marsaud/smb2');

// Initialize client
const client = new SMB2({
    share: process.env.SMB_SHARE,     // '\\\\server\\share'
    domain: process.env.SMB_DOMAIN,   // 'DOMAIN'
    username: process.env.SMB_USERNAME, // 'user'
    password: process.env.SMB_PASSWORD, // 'password'
    timeout: 30000
});

// All operations use callbacks - promisify for n8n
function promisify(fn) {
    return (...args) => new Promise((resolve, reject) => {
        fn(...args, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

// Example operations for n8n node
const operations = {
    // List directory contents
    async listDirectory(path = '') {
        return promisify(client.readdir.bind(client))(path);
    },

    // Read file content
    async readFile(path) {
        const data = await promisify(client.readFile.bind(client))(path);
        return data.toString();
    },

    // Write file
    async writeFile(path, content) {
        return promisify(client.writeFile.bind(client))(path, content);
    },

    // Create directory
    async createDirectory(path) {
        return promisify(client.mkdir.bind(client))(path);
    },

    // Delete file
    async deleteFile(path) {
        return promisify(client.unlink.bind(client))(path);
    },

    // Delete directory
    async deleteDirectory(path) {
        return promisify(client.rmdir.bind(client))(path);
    },

    // Rename/move file
    async moveFile(oldPath, newPath) {
        return promisify(client.rename.bind(client))(oldPath, newPath);
    },

    // Get file size
    async getFileSize(path) {
        return promisify(client.getSize.bind(client))(path);
    },

    // Check if file/directory exists
    async exists(path) {
        return promisify(client.exists.bind(client))(path);
    }
};

// Path formatting helpers
const pathUtils = {
    // Convert forward slashes to backslashes for Windows
    toWindowsPath(path) {
        return path.replace(/\//g, '\\');
    },

    // Ensure relative path (remove leading slashes)
    toRelativePath(path) {
        return path.replace(/^[\\\/]+/, '');
    },

    // Combine directory and filename with Windows separator
    join(dir, filename) {
        if (!dir) return filename;
        return `${dir}\\${filename}`;
    }
};

module.exports = { operations, pathUtils };
