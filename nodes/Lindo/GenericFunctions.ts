import {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';

/**
 * Resolve which credential name to use based on the authentication parameter.
 */
function getCredentialName(
  ctx: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
): string {
  try {
    const auth = (ctx as any).getNodeParameter('authentication', 0) as string;
    if (auth === 'oAuth2') return 'lindoOAuth2Api';
  } catch {
    // Fallback — older workflows without the authentication param
  }
  return 'lindoApi';
}

/**
 * Make an authenticated API request to Lindo.
 * Automatically picks the correct credential (API Key or OAuth2).
 */
export async function lindoApiRequest(
  this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: object = {},
  query: Record<string, string> = {},
) {
  const options: IHttpRequestOptions = {
    method,
    url: `https://api.lindo.ai${endpoint}`,
    json: true,
  };

  if (Object.keys(query).length > 0) {
    options.qs = query;
  }

  if (method !== 'GET' && Object.keys(body).length > 0) {
    options.body = body;
  }

  const credentialName = getCredentialName(this);
  return this.helpers.httpRequestWithAuthentication.call(this, credentialName, options);
}
