import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class LindoApi implements ICredentialType {
  name = 'lindoApi';
  displayName = 'Lindo API';
  documentationUrl = 'https://docs.lindo.ai/api';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      placeholder: 'lindo_sk_...',
      description: 'Your Lindo.ai API key. Find it in your workspace settings.',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.lindo.ai',
      description: 'The Lindo API base URL. Change only if using a staging environment.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/v1/workspace/automations/workspaces',
      method: 'GET',
    },
  };
}
