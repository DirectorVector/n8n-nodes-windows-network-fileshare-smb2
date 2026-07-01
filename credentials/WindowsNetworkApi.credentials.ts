import { ICredentialType, INodeProperties } from 'n8n-workflow';

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
			description:
				'UNC path to the share root, e.g. \\\\server\\ShareName. Use double backslashes and no trailing slash. Forward slashes are not supported. Put sub-folders in the node path, not here.',
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
			description: 'Windows username for authentication (without the domain prefix)',
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
			displayName: 'Connection Timeout (Ms)',
			name: 'timeout',
			type: 'number',
			default: 30000,
			description: 'Connection timeout in milliseconds',
			required: false,
		},
	];

	// SMB2 cannot be tested over HTTP, so the test is implemented as a real SMB2
	// connection in the node (see the windowsNetworkApiTest method in
	// WindowsFileshare.node.ts). It opens a session with these credentials and
	// lists the share root.
	testedBy = 'windowsNetworkApiTest';
}
