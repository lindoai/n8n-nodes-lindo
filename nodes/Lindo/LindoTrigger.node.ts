import {
  IHookFunctions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
} from 'n8n-workflow';

import { lindoApiRequest } from './GenericFunctions';

export class LindoTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Lindo Trigger',
    name: 'lindoTrigger',
    icon: 'file:lindo.png',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Triggers when events occur in your Lindo workspace',
    defaults: {
      name: 'Lindo Trigger',
    },
    inputs: [],
    outputs: [{ type: 'main' }],
    credentials: [
      {
        name: 'lindoApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        required: true,
        default: 'website.created',
        options: [
          {
            name: 'New Website Created',
            value: 'website.created',
            description: 'Triggers when a new website is created',
          },
          {
            name: 'New Client Created',
            value: 'client.created',
            description: 'Triggers when a new client is created',
          },
        ],
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        // We always re-register to be safe
        return false;
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default') as string;
        const event = this.getNodeParameter('event') as string;

        await lindoApiRequest.call(this, 'POST', '/v1/workspace/automations/n8n/hooks', {
          target_url: webhookUrl,
          event_type: event,
        });

        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default') as string;

        try {
          await lindoApiRequest.call(this, 'DELETE', '/v1/workspace/automations/n8n/hooks', {
            target_url: webhookUrl,
          });
        } catch (error) {
          // Silently ignore — webhook may already be deleted
        }

        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData();

    return {
      workflowData: [this.helpers.returnJsonArray(bodyData)],
    };
  }
}
