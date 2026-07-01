import {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	resources,
	operations,
	fileFields,
	directoryFields,
	commonFields,
} from './WindowsFileshareDescription';

declare const require: any;
declare const Buffer: any;
const SMB2 = require('@marsaud/smb2');

// Validate a UNC share path before handing it to @marsaud/smb2, which otherwise
// throws a cryptic "the share is not valid" for anything but \\server\share.
function validateShare(share: string): string | null {
	if (!share) return 'Share path is required (e.g. \\\\server\\ShareName).';
	if (!/^\\\\[^\\]+\\[^\\]+/.test(share)) {
		return 'Share must be a UNC path like \\\\server\\ShareName — use double backslashes, no forward slashes, and no trailing slash.';
	}
	if (/[\\/]$/.test(share)) {
		return 'Remove the trailing slash from the share path (use \\\\server\\ShareName, put sub-folders in the node path).';
	}
	return null;
}

export class WindowsFileshare implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Windows Fileshare (SMB2)',
		name: 'windowsFileshare',
		icon: { light: 'file:windowsfileshare.svg', dark: 'file:windowsfileshare.svg' },
		group: ['input', 'output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Access Windows network file shares via SMB2 protocol',
		defaults: {
			name: 'Windows Fileshare',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'windowsNetworkApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: resources,
				default: 'file',
			},
			...operations,
			...fileFields,
			...directoryFields,
			...commonFields,
		],
	};

	methods = {
		credentialTest: {
			async windowsNetworkApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const creds = (credential.data || {}) as any;
				const share = ((creds.share as string) || '').trim();

				const shareError = validateShare(share);
				if (shareError) {
					return { status: 'Error', message: shareError };
				}

				let client: any;
				try {
					client = new SMB2({
						share,
						domain: creds.domain,
						username: creds.username,
						password: creds.password,
						timeout: creds.timeout || 30000,
					});
				} catch (error) {
					return { status: 'Error', message: (error as Error).message };
				}

				try {
					const files: string[] = await new Promise((resolve, reject) => {
						client.readdir('', (err: any, result: any) => {
							if (err) reject(err);
							else resolve(result);
						});
					});
					return {
						status: 'OK',
						message: `Connection successful — ${files.length} item(s) in the share root.`,
					};
				} catch (error) {
					const message = (error as Error).message || 'SMB2 connection failed.';
					const hint = /digital envelope routines|unsupported/i.test(message)
						? ' (start n8n with NODE_OPTIONS=--openssl-legacy-provider)'
						: '';
					return { status: 'Error', message: message + hint };
				} finally {
					try {
						if (typeof client.disconnect === 'function') client.disconnect();
						else if (typeof client.close === 'function') client.close();
					} catch (disconnectError) {
						// Best-effort cleanup.
					}
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let responseData;

		for (let i = 0; i < items.length; i++) {
			// Track the SMB2 client for this item so it can always be torn down.
			// @marsaud/smb2 opens a TCP socket + NTLM session per client; leaving it
			// open leaks sessions/handles in n8n's long-running process.
			let client: any = null;
			// Optional binary payload to attach to this item's output.
			let itemBinary: any = null;

			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Get credentials
				const credentials = await this.getCredentials('windowsNetworkApi', i);

				// Helper function to create SMB2 client
				const createSMB2Client = () => {
					const options = this.getNodeParameter('options', i, {}) as any;
					return new SMB2({
						share: credentials.share,
						domain: credentials.domain,
						username: credentials.username,
						password: credentials.password,
						timeout: options.timeout || credentials.timeout || 30000,
					});
				};

				// Helper function to promisify SMB2 operations
				const promisify = (fn: Function, ...args: any[]) => {
					return new Promise((resolve, reject) => {
						fn(...args, (err: any, result: any) => {
							if (err) reject(err);
							else resolve(result);
						});
					});
				};

				// Helper function to normalize Windows paths
				const normalizePath = (path: string) => {
					if (!path) return '';
					return path.replace(/\//g, '\\').replace(/^\\+/, '');
				};

				if (resource === 'connection') {
					if (operation === 'test') {
						client = createSMB2Client();

						// Test connection by listing root directory
						const files = (await promisify(client.readdir.bind(client), '')) as string[];

						responseData = {
							connectionTest: 'success',
							message: 'SMB2 connection successful',
							rootDirectoryFiles: files.length,
							sampleFiles: files.slice(0, 5),
							timestamp: new Date().toISOString(),
							credentials: {
								share: credentials.share,
								domain: credentials.domain,
								username: credentials.username,
								timeout: credentials.timeout,
							},
						};
					}
				} else if (resource === 'file') {
					client = createSMB2Client();

					if (operation === 'read') {
						const filePath = normalizePath(this.getNodeParameter('filePath', i) as string);
						const readAs = this.getNodeParameter('readAs', i, 'text') as string;

						const data = (await promisify(client.readFile.bind(client), filePath)) as any;

						if (readAs === 'binary') {
							const binaryPropertyName = this.getNodeParameter(
								'readBinaryPropertyName',
								i,
								'data',
							) as string;
							const fileName = filePath.split('\\').pop() || filePath;
							const prepared = await this.helpers.prepareBinaryData(data, fileName);

							responseData = {
								filePath,
								fileName,
								size: data.length,
								mimeType: prepared.mimeType,
							};
							itemBinary = { [binaryPropertyName]: prepared };
						} else {
							const readEncoding = this.getNodeParameter('readEncoding', i, 'utf8') as string;
							const content = data.toString(readEncoding);

							responseData = {
								filePath,
								content,
								size: data.length,
								encoding: readEncoding,
							};
						}
					} else if (operation === 'write') {
						const filePath = normalizePath(this.getNodeParameter('filePath', i) as string);
						const writeInputType = this.getNodeParameter('writeInputType', i, 'text') as string;

						let buffer: any;
						let encoding = 'binary';
						if (writeInputType === 'binary') {
							const binaryPropertyName = this.getNodeParameter(
								'writeBinaryPropertyName',
								i,
								'data',
							) as string;
							buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						} else {
							const fileContent = this.getNodeParameter('fileContent', i) as string;
							encoding = this.getNodeParameter('encoding', i, 'utf8') as string;
							buffer = Buffer.from(fileContent, encoding as any);
						}

						await promisify(client.writeFile.bind(client), filePath, buffer);

						responseData = {
							filePath,
							size: buffer.length,
							input: writeInputType,
							encoding: writeInputType === 'text' ? encoding : undefined,
							success: true,
						};
					} else if (operation === 'delete') {
						const filePath = normalizePath(this.getNodeParameter('filePath', i) as string);

						await promisify(client.unlink.bind(client), filePath);

						responseData = {
							filePath,
							deleted: true,
							success: true,
						};
					} else if (operation === 'move') {
						const sourceFilePath = normalizePath(
							this.getNodeParameter('sourceFilePath', i) as string,
						);
						const destinationFilePath = normalizePath(
							this.getNodeParameter('destinationFilePath', i) as string,
						);

						await promisify(client.rename.bind(client), sourceFilePath, destinationFilePath);

						responseData = {
							sourceFilePath,
							destinationFilePath,
							moved: true,
							success: true,
						};
					} else if (operation === 'metadata') {
						const filePath = normalizePath(this.getNodeParameter('filePath', i) as string);

						const [size, exists] = await Promise.all([
							promisify(client.getSize.bind(client), filePath) as Promise<number>,
							promisify(client.exists.bind(client), filePath) as Promise<boolean>,
						]);

						responseData = {
							filePath,
							exists,
							size: exists ? size : 0,
						};
					}
				} else if (resource === 'directory') {
					client = createSMB2Client();

					if (operation === 'list') {
						const directoryPath = normalizePath(
							this.getNodeParameter('directoryPath', i, '') as string,
						);

						const files = (await promisify(client.readdir.bind(client), directoryPath)) as string[];

						responseData = {
							directoryPath: directoryPath || '/',
							files,
							count: files.length,
						};
					} else if (operation === 'create') {
						const directoryPath = normalizePath(
							this.getNodeParameter('directoryPath', i) as string,
						);

						await promisify(client.mkdir.bind(client), directoryPath);

						responseData = {
							directoryPath,
							created: true,
							success: true,
						};
					} else if (operation === 'delete') {
						const directoryPath = normalizePath(
							this.getNodeParameter('directoryPath', i) as string,
						);

						await promisify(client.rmdir.bind(client), directoryPath);

						responseData = {
							directoryPath,
							deleted: true,
							success: true,
						};
					}
				}

				const newItem: INodeExecutionData = {
					json: (responseData as any) || {},
					pairedItem: { item: i },
				};
				if (itemBinary) {
					newItem.binary = itemBinary;
				}

				returnData.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			} finally {
				// Always tear down the SMB2 connection for this item. Without this the
				// underlying socket/NTLM session leaks across executions.
				if (client) {
					try {
						if (typeof client.disconnect === 'function') {
							client.disconnect();
						} else if (typeof client.close === 'function') {
							client.close();
						}
					} catch (disconnectError) {
						// Best-effort cleanup; ignore errors from an already-closed socket.
					}
					client = null;
				}
			}
		}

		return [returnData];
	}
}
