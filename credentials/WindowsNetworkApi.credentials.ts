import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class WindowsNetworkApi implements ICredentialType {
	name = 'windowsNetworkApi';
	displayName = 'Windows Network (SMB2) API';
	documentationUrl = 'https://github.com/DirectorVector/n8n-nodes-windows-network-fileshare-smb2';
	properties: INodeProperties[] = [
		{
			displayName: 'UNC Share Path',
			name: 'share',
			type: 'string',
			default: '',
			placeholder: '\\\\server\\ShareName',
			description: 'The UNC path to the Windows network share (e.g., \\\\server\\ShareName)',
			required: true,
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'DOMAIN',
			description: 'Windows domain name. Use WORKGROUP for local accounts.',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			placeholder: 'username',
			description: 'Windows username for authentication',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			description: 'Windows password for authentication',
			required: true,
		},
		{
			displayName: 'Connection Timeout (ms)',
			name: 'timeout',
			type: 'number',
			default: 30000,
			description: 'Connection timeout in milliseconds',
			required: false,
		},
	];

	// Test the credential by attempting to list the root directory
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.share}}',
			url: '',
			method: 'GET',
		},
	};
}
