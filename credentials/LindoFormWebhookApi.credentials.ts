import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class LindoFormWebhookApi implements ICredentialType {
  name = 'lindoFormWebhookApi';
  displayName = 'Website Form Webhook API';
  icon = { light: 'file:lindo.svg', dark: 'file:lindo.dark.svg' } as const;
  documentationUrl = 'https://docs.lindo.ai/automations/n8n';
  authenticate: IAuthenticateGeneric = {
    type: 'generic', properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
  };
  test: ICredentialTestRequest = {
    request: { baseURL: '={{$credentials.baseUrl}}', url: '/v1/workspace/automations/workspaces', method: 'GET' },
  };
  properties: INodeProperties[] = [
    { displayName: 'API Key', name: 'apiKey', type: 'string', typeOptions: { password: true }, default: '', required: true,
      description: 'Workspace API key used to register and remove this workflow’s webhook subscription' },
    { displayName: 'Base URL', name: 'baseUrl', type: 'string', default: 'https://api.lindo.ai',
      description: 'The Lindo API base URL' },
    { displayName: 'Website Signing Secret', name: 'signingSecret', type: 'string', typeOptions: { password: true }, default: '', required: true,
      description: 'Copy from Website Settings → Integrations → Form webhooks. Shared by all forms on that website.' },
  ];
}
