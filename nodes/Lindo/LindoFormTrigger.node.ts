import { createHmac, timingSafeEqual } from 'crypto';
import type { IHookFunctions, INodeType, INodeTypeDescription, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';

import { lindoApiRequest } from './GenericFunctions';

export class LindoFormTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Form Submission Trigger', name: 'lindoFormTrigger', subtitle: '={{$parameter["websiteId"]}}',
    icon: { light: 'file:lindo.svg', dark: 'file:lindo.dark.svg' },
    group: ['trigger'], version: 1, description: 'Receive and verify website form submission webhooks',
    defaults: { name: 'Form Submission Trigger' }, inputs: [], outputs: [{ type: 'main' }],
    credentials: [{ name: 'lindoFormWebhookApi', required: true }],
    webhooks: [{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'form-submission' }],
    properties: [
      { displayName: 'Authentication', name: 'authentication', type: 'hidden', default: 'formWebhook' },
      { displayName: 'Website ID', name: 'websiteId', type: 'string', default: '', required: true,
        description: 'The website whose form submissions should trigger this workflow' },
      { displayName: 'Activating this workflow automatically registers its webhook for the selected website. Existing website and form webhook URLs are preserved. Test and spam submissions do not trigger workflows.', name: 'setup', type: 'notice', default: '' },
      { displayName: 'Form Slug (Optional)', name: 'formSlug', type: 'string', default: '', description: 'Leave empty to receive all forms on the website. Other slugs are acknowledged without starting this workflow.' },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const result = await lindoApiRequest.call(this, 'GET', '/v1/workspace/automations/n8n/hooks', {}, {
          target_url: this.getNodeWebhookUrl('default') as string,
          event_type: 'form.submitted', website_id: this.getNodeParameter('websiteId') as string,
        });
        return result.success === true && result.result?.exists === true;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        await lindoApiRequest.call(this, 'POST', '/v1/workspace/automations/n8n/hooks', {
          target_url: this.getNodeWebhookUrl('default'), event_type: 'form.submitted',
          website_id: this.getNodeParameter('websiteId'),
        });
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        await lindoApiRequest.call(this, 'DELETE', '/v1/workspace/automations/n8n/hooks', {
          target_url: this.getNodeWebhookUrl('default'), event_type: 'form.submitted',
          website_id: this.getNodeParameter('websiteId'),
        });
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const request = this.getRequestObject();
    const response = this.getResponseObject();
    const reject = (code: number) => {
      response.status(code).json({ success: false });
      return { noWebhookResponse: true };
    };
    const credentials = await this.getCredentials('lindoFormWebhookApi');
    const secret = credentials.signingSecret;
    const timestamp = request.headers['x-lindo-timestamp'];
    const signature = request.headers['x-lindo-signature'];
    if (typeof secret !== 'string' || !secret || typeof timestamp !== 'string' || !/^\d+$/.test(timestamp)
      || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/.test(signature)) return reject(401);
    if (!Buffer.isBuffer(request.rawBody)) await request.readRawBody();
    if (!Buffer.isBuffer(request.rawBody) || request.rawBody.length > 262144) return reject(400);
    const expected = createHmac('sha256', secret).update(timestamp + '.').update(request.rawBody).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) return reject(401);
    let body;
    try { body = JSON.parse(request.rawBody.toString('utf8')); } catch { return reject(400); }
    if (!body || body.type !== 'form.submitted' || typeof body.id !== 'string' || typeof body.form?.slug !== 'string'
      || !body.data || typeof body.data !== 'object' || Array.isArray(body.data) || body.id !== request.headers['x-lindo-delivery-id']) return reject(400);
    if (body.website_id !== this.getNodeParameter('websiteId')) return reject(401);
    const slug = this.getNodeParameter('formSlug') as string;
    // Acknowledge after verification, before downstream work (sender has a five-second timeout).
    response.status(200).json({ success: true });
    return { noWebhookResponse: true, ...(slug && slug !== body.form.slug ? {} : { workflowData: [this.helpers.returnJsonArray(body)] }) };
  }
}
