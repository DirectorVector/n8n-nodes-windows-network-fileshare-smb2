import { INodePropertyOptions, INodeProperties } from 'n8n-workflow';

// Resources
export const resources: INodePropertyOptions[] = [
	{
		name: 'Connection',
		value: 'connection',
	},
	{
		name: 'File',
		value: 'file',
	},
	{
		name: 'Directory',
		value: 'directory',
	},
];

// Operations
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['connection'],
			},
		},
		options: [
			{
				name: 'Test Connection',
				value: 'test',
				description: 'Test the SMB2 connection and credentials',
				action: 'Test the SMB2 connection',
			},
		],
		default: 'test',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a file from network share',
				action: 'Delete a file',
			},
			{
				name: 'Get Metadata',
				value: 'metadata',
				description: 'Get file size and existence information',
				action: 'Get file metadata',
			},
			{
				name: 'Move/Rename',
				value: 'move',
				description: 'Move or rename a file on network share',
				action: 'Move or rename a file',
			},
			{
				name: 'Read',
				value: 'read',
				description: 'Read file content from network share',
				action: 'Read a file',
			},
			{
				name: 'Write',
				value: 'write',
				description: 'Write content to a file on network share',
				action: 'Write a file',
			},
		],
		default: 'read',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['directory'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				description: 'List contents of a directory',
				action: 'List directory contents',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new directory',
				action: 'Create a directory',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a directory',
				action: 'Delete a directory',
			},
		],
		default: 'list',
	},
];

// Fields for File operations
export const fileFields: INodeProperties[] = [
	// File Read
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'path/to/file.txt',
		description: 'Path to the file relative to the share root',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['read', 'delete', 'metadata'],
			},
		},
	},

	// Read: output as text or binary
	{
		displayName: 'Output',
		name: 'readAs',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Text',
				value: 'text',
				description: 'Decode the file as a UTF-8 string (only safe for text files)',
			},
			{
				name: 'Binary',
				value: 'binary',
				description: 'Return the raw bytes as n8n binary data (use for images, PDFs, any non-text file)',
			},
		],
		default: 'text',
		description: 'How to return the file contents',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['read'],
			},
		},
	},
	{
		displayName: 'Put Output in Field',
		name: 'readBinaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Name of the binary property to write the file bytes to',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['read'],
				readAs: ['binary'],
			},
		},
	},

	// File Write
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'path/to/file.txt',
		description: 'Path to the file relative to the share root',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['write'],
			},
		},
	},
	// Write: input from text or binary
	{
		displayName: 'Input',
		name: 'writeInputType',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Text',
				value: 'text',
				description: 'Write a string from the File Content field',
			},
			{
				name: 'Binary',
				value: 'binary',
				description: 'Write the raw bytes from an incoming binary property (lossless for any file type)',
			},
		],
		default: 'text',
		description: 'Where the file content comes from',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['write'],
			},
		},
	},
	{
		displayName: 'Input Binary Field',
		name: 'writeBinaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Name of the incoming binary property that holds the bytes to write',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['write'],
				writeInputType: ['binary'],
			},
		},
	},
	{
		displayName: 'File Content',
		name: 'fileContent',
		type: 'string',
		required: true,
		default: '',
		typeOptions: {
			rows: 4,
		},
		description: 'Content to write to the file',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['write'],
				writeInputType: ['text'],
			},
		},
	},
	{
		displayName: 'Encoding',
		name: 'encoding',
		type: 'options',
		options: [
			{
				name: 'UTF-8',
				value: 'utf8',
			},
			{
				name: 'ASCII',
				value: 'ascii',
			},
			{
				name: 'Binary',
				value: 'binary',
			},
		],
		default: 'utf8',
		description: 'Encoding for file content',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['write'],
				writeInputType: ['text'],
			},
		},
	},

	// File Move/Rename
	{
		displayName: 'Source File Path',
		name: 'sourceFilePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'path/to/source.txt',
		description: 'Current path to the file relative to the share root',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['move'],
			},
		},
	},
	{
		displayName: 'Destination File Path',
		name: 'destinationFilePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'path/to/destination.txt',
		description: 'New path for the file relative to the share root',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['move'],
			},
		},
	},
];

// Fields for Directory operations
export const directoryFields: INodeProperties[] = [
	// Directory List
	{
		displayName: 'Directory Path',
		name: 'directoryPath',
		type: 'string',
		default: '',
		placeholder: 'path/to/directory',
		description:
			'Path to the directory relative to the share root. Leave empty for root directory.',
		displayOptions: {
			show: {
				resource: ['directory'],
				operation: ['list'],
			},
		},
	},

	// Directory Create/Delete
	{
		displayName: 'Directory Path',
		name: 'directoryPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'path/to/directory',
		description: 'Path to the directory relative to the share root',
		displayOptions: {
			show: {
				resource: ['directory'],
				operation: ['create', 'delete'],
			},
		},
	},
];

// Common options
export const commonFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Timeout (Ms)',
				name: 'timeout',
				type: 'number',
				default: 30000,
				description: 'Timeout for the SMB operation in milliseconds',
			},
		],
	},
];
