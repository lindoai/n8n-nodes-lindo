import {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';

/**
 * Make an authenticated API request to Lindo.
 * Auth is handled by the credential's authenticate property via httpRequestWithAuthentication.
 */
export async function lindoApiRequest(
  this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: object = {},
  query: Record<string, string> = {},
  baseUrl: string = 'https://api.lindo.ai',
) {
  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${endpoint}`,
    json: true,
  };

  if (Object.keys(query).length > 0) {
    options.qs = query;
  }

  if (method !== 'GET' && Object.keys(body).length > 0) {
    options.body = body;
  }

  return this.helpers.httpRequestWithAuthentication.call(this, 'lindoApi', options);
}
