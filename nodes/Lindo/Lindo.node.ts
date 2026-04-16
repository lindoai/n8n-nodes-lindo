import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import { lindoApiRequest } from './GenericFunctions';

export class Lindo implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Lindo',
    name: 'lindo',
    icon: 'file:lindo.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + " " + $parameter["resource"]}}',
    description: 'Interact with the Lindo.ai API',
    defaults: {
      name: 'Lindo',
    },
    inputs: [{ type: 'main' }],
    outputs: [{ type: 'main' }],
    credentials: [
      {
        name: 'lindoApi',
        required: true,
      },
    ],
    properties: [
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        default: 'website',
        options: [
          {
            name: 'Website',
            value: 'website',
          },
          {
            name: 'Client',
            value: 'client',
          },
        ],
      },

      // ============================================================
      // Website operations
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['website'],
          },
        },
        default: 'create',
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create a new website in the workspace',
            action: 'Create a website',
          },
        ],
      },

      // Website Create fields
      {
        displayName: 'Business Name',
        name: 'businessName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            resource: ['website'],
            operation: ['create'],
          },
        },
        description: 'The name of the business or website',
      },
      {
        displayName: 'Business Description',
        name: 'businessDescription',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['website'],
            operation: ['create'],
          },
        },
        description: 'A short description of the business',
      },
      {
        displayName: 'Language',
        name: 'language',
        type: 'string',
        default: 'en',
        displayOptions: {
          show: {
            resource: ['website'],
            operation: ['create'],
          },
        },
        description: 'Language code for the website (e.g. en, fr, ar)',
      },

      // ============================================================
      // Client operations
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['client'],
          },
        },
        default: 'create',
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create a new client in the workspace',
            action: 'Create a client',
          },
        ],
      },

      // Client Create fields
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'client@example.com',
        displayOptions: {
          show: {
            resource: ['client'],
            operation: ['create'],
          },
        },
        description: 'The email address of the new client',
      },
      {
        displayName: 'Full Name',
        name: 'fullName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['client'],
            operation: ['create'],
          },
        },
        description: 'The full name of the client',
      },
      {
        displayName: 'Website Limit',
        name: 'websiteLimit',
        type: 'number',
        default: 1,
        displayOptions: {
          show: {
            resource: ['client'],
            operation: ['create'],
          },
        },
        description: 'Maximum number of websites this client can have',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData;

        // ============================================================
        // Website
        // ============================================================
        if (resource === 'website') {
          if (operation === 'create') {
            const businessName = this.getNodeParameter('businessName', i) as string;
            const businessDescription = this.getNodeParameter('businessDescription', i, '') as string;
            const language = this.getNodeParameter('language', i, 'en') as string;

            responseData = await lindoApiRequest.call(
              this,
              'POST',
              '/v1/workspace/website/create',
              {
                business_name: businessName,
                business_description: businessDescription,
                language,
              },
            );

            returnData.push({ json: responseData?.result || responseData });
            continue;
          }
        }

        // ============================================================
        // Client
        // ============================================================
        if (resource === 'client') {
          if (operation === 'create') {
            const email = this.getNodeParameter('email', i) as string;
            const fullName = this.getNodeParameter('fullName', i, '') as string;
            const websiteLimit = this.getNodeParameter('websiteLimit', i, 1) as number;

            const body: Record<string, unknown> = { email };
            if (fullName) body.full_name = fullName;
            if (websiteLimit) body.website_limit = websiteLimit;

            responseData = await lindoApiRequest.call(
              this,
              'POST',
              '/v1/workspace/client/create',
              body,
            );

            returnData.push({ json: responseData?.result || responseData });
            continue;
          }
        }

        // Fallback
        if (responseData) {
          returnData.push({ json: responseData });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
