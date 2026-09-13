import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class LindoOAuth2Api implements ICredentialType {
  name = 'lindoOAuth2Api';
  displayName = 'Lindo OAuth2 API';
  documentationUrl = 'https://lindo.ai/docs/api';
  extends = ['oAuth2Api'];

  properties: INodeProperties[] = [
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'authorizationCode',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'hidden',
      default: 'https://api.lindo.ai/oauth/authorize',
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default: 'https://api.lindo.ai/oauth/token',
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'hidden',
      default: 'n8n',
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'hidden',
      default: 'not-required',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: 'workspace',
    },
    {
      displayName: 'Auth URI Query Parameters',
      name: 'authQueryParameters',
      type: 'hidden',
      default: 'client_name=n8n',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'body',
    },
  ];
}
