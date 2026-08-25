import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
  NodeApiError,
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
    usableAsTool: {
      replacements: {
        displayName: 'Lindo AI',
        description: 'Use Lindo.ai tools to create and list websites, pages, blogs, clients, and credits.',
      },
    },
    credentials: [
      {
        name: 'lindoApi',
        required: true,
        displayOptions: { show: { authentication: ['apiKey'] } },
      },
      {
        name: 'lindoOAuth2Api',
        required: true,
        displayOptions: { show: { authentication: ['oAuth2'] } },
      },
    ],
    properties: [
      // Authentication selector
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          { name: 'OAuth2', value: 'oAuth2' },
          { name: 'API Key', value: 'apiKey' },
        ],
        default: 'oAuth2',
      },
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        default: 'website',
        options: [
          { name: 'Website', value: 'website' },
          { name: 'Page', value: 'page' },
          { name: 'Blog', value: 'blog' },
          { name: 'Client', value: 'client' },
          { name: 'Credits', value: 'credits' },
          { name: 'Workflow Status', value: 'workflow' },
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
        displayOptions: { show: { resource: ['website'] } },
        default: 'create',
        options: [
          {
            name: 'Create Website (AI)',
            value: 'create',
            description: 'Create a new website using AI',
            action: 'Create a website using AI',
          },
          {
            name: 'Edit Website (AI)',
            value: 'edit',
            description: 'Edit an existing website (across its pages) using AI',
            action: 'Edit a website using AI',
          },
          {
            name: 'Batch Create Websites (AI)',
            value: 'batchCreate',
            description: 'Create up to 25 websites at once using AI',
            action: 'Batch create websites using AI',
          },
          {
            name: 'List Websites',
            value: 'list',
            description: 'List websites in the workspace',
            action: 'List websites',
          },
        ],
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: '',
        placeholder: 'Create a modern restaurant website with menu, gallery, and contact page',
        displayOptions: { show: { resource: ['website'], operation: ['create'] } },
        description: 'Describe the website you want to create',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 1,
        displayOptions: { show: { resource: ['website'], operation: ['list'] } },
        description: 'Page number for paginated website results',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['list'] } },
        description: 'Optional search term to filter websites',
      },
      {
        displayName: 'Schedule At',
        name: 'scheduleAt',
        type: 'dateTime',
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['create'] } },
        description: 'Optional. Schedule the creation for a future time (ISO 8601).',
      },
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['create'] } },
        description: 'Optional. Existing client ID to assign the website to.',
      },
      {
        displayName: 'Client Email',
        name: 'clientEmail',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['create'] } },
        description: 'Optional. Client email — looks up existing client or creates a new one and assigns the website.',
      },
      {
        displayName: 'Client Name',
        name: 'clientName',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['create'] } },
        description: 'Optional. Client name, used when creating a new client with Client Email.',
      },
      {
        displayName: 'Items (JSON)',
        name: 'items',
        type: 'json',
        required: true,
        default: '[\n  { "prompt": "Modern landing page for a coffee shop" }\n]',
        displayOptions: { show: { resource: ['website'], operation: ['batchCreate'] } },
        description:
          'JSON array of up to 25 website creation items. Each item must have a `prompt` (min 10 chars). Optional fields: `schedule_at` (ISO 8601), `client` (`{ client_id }` or `{ email, name? }`).',
      },
      // Website — Edit fields
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['edit'] } },
        description: 'The unique identifier of the website to edit',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: '',
        placeholder: 'Update the hero copy across all pages and add a contact CTA',
        displayOptions: { show: { resource: ['website'], operation: ['edit'] } },
        description: 'Describe the change you want the AI to make to the website',
      },
      {
        displayName: 'Publish to Live Site',
        name: 'publish',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['website'], operation: ['edit'] } },
        description: 'Whether to publish the edited page(s) to the live website. When off (default), the changes are saved as drafts to review and publish from the editor.',
      },
      {
        displayName: 'Schedule At',
        name: 'scheduleAt',
        type: 'dateTime',
        default: '',
        displayOptions: { show: { resource: ['website'], operation: ['edit'] } },
        description: 'Optional. Schedule the edit for a future time (ISO 8601).',
      },
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['page'] } },
        default: 'list',
        options: [
          {
            name: 'List Pages',
            value: 'list',
            description: 'List pages for a website',
            action: 'List pages',
          },
        ],
      },
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['page'], operation: ['list'] } },
        description: 'The unique identifier of the website',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 1,
        displayOptions: { show: { resource: ['page'], operation: ['list'] } },
        description: 'Page number for paginated page results',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['page'], operation: ['list'] } },
        description: 'Optional search term to filter pages by name or path',
      },

      // ============================================================
      // Blog operations
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['blog'] } },
        default: 'create',
        options: [
          {
            name: 'Create Blog (AI)',
            value: 'create',
            description: 'Create a new blog post using AI',
            action: 'Create a blog post using AI',
          },
          {
            name: 'Batch Create Blogs (AI)',
            value: 'batchCreate',
            description: 'Create up to 25 blog posts on a website at once using AI',
            action: 'Batch create blogs using AI',
          },
          {
            name: 'List Blogs',
            value: 'list',
            description: 'List blog posts for a website',
            action: 'List blogs',
          },
          {
            name: 'Publish Blog',
            value: 'publish',
            description: 'Publish a static blog post with markdown content',
            action: 'Publish a blog post',
          },
        ],
      },
      // Blog Create fields
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['create'] } },
        description: 'The unique identifier of the website',
      },
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['list'] } },
        description: 'The unique identifier of the website',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: '',
        placeholder: 'Write a blog post about SEO tips for small businesses',
        displayOptions: { show: { resource: ['blog'], operation: ['create'] } },
        description: 'Describe the blog post you want to create',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 1,
        displayOptions: { show: { resource: ['blog'], operation: ['list'] } },
        description: 'Page number for paginated blog results',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['list'] } },
        description: 'Optional search term to filter blogs by name or path',
      },
      {
        displayName: 'Schedule At',
        name: 'scheduleAt',
        type: 'dateTime',
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['create'] } },
        description: 'Optional. Schedule the creation for a future time (ISO 8601).',
      },
      // Blog — Batch Create fields
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['batchCreate'] } },
        description: 'The unique identifier of the website',
      },
      {
        displayName: 'Items (JSON)',
        name: 'items',
        type: 'json',
        required: true,
        default: '[\n  { "prompt": "Write a post about SEO tips for small businesses" }\n]',
        displayOptions: { show: { resource: ['blog'], operation: ['batchCreate'] } },
        description:
          'JSON array of up to 25 blog creation items. Each item must have a `prompt` (min 10 chars). Optional: `schedule_at` (ISO 8601).',
      },
      // Blog Publish fields
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['publish'] } },
        description: 'The unique identifier of the website',
      },
      {
        displayName: 'URL Path',
        name: 'path',
        type: 'string',
        required: true,
        default: '',
        placeholder: '/blog/my-first-post',
        displayOptions: { show: { resource: ['blog'], operation: ['publish'] } },
        description: 'URL path for the blog post',
      },
      {
        displayName: 'Blog Content (Markdown)',
        name: 'blogContent',
        type: 'string',
        typeOptions: { rows: 10 },
        required: true,
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['publish'] } },
        description: 'The blog post content in Markdown format',
      },
      {
        displayName: 'Page Title',
        name: 'pageTitle',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['blog'], operation: ['publish'] } },
        description: 'The title of the blog post (used for SEO and display)',
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['blog'], operation: ['publish'] } },
        options: [
          {
            displayName: 'Author',
            name: 'author',
            type: 'string',
            default: '',
            description: 'Author name for the blog post',
          },
          {
            displayName: 'Excerpt',
            name: 'excerpt',
            type: 'string',
            default: '',
            description: 'A brief summary of the blog post',
          },
          {
            displayName: 'Category',
            name: 'category',
            type: 'string',
            default: '',
            description: 'Blog category (e.g. Technology, Marketing)',
          },
          {
            displayName: 'Publish Date',
            name: 'publishDate',
            type: 'string',
            default: '',
            description: 'Display date for the blog post (e.g. "January 15, 2025")',
          },
        ],
      },

      // ============================================================
      // Client operations
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['client'] } },
        default: 'create',
        options: [
          {
            name: 'Create Client',
            value: 'create',
            description: 'Create a new client in the workspace',
            action: 'Create a client',
          },
          {
            name: 'List Clients',
            value: 'list',
            description: 'List clients in the workspace',
            action: 'List clients',
          },
          {
            name: 'Assign Website',
            value: 'assignWebsite',
            description: 'Assign a website to a client',
            action: 'Assign a website to a client',
          },
          {
            name: 'Generate Magic Link',
            value: 'generateMagicLink',
            description: 'Generate a magic link for client login',
            action: 'Generate a magic link',
          },
        ],
      },
      // Client Create fields
      {
        displayName: 'Name',
        name: 'clientName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['create'] } },
        description: 'The name of the new client',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['create'] } },
        description: 'The email address of the new client',
      },
      {
        displayName: 'Phone',
        name: 'phone',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['create'] } },
        description: 'The phone number of the client (optional)',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 1,
        displayOptions: { show: { resource: ['client'], operation: ['list'] } },
        description: 'Page number for paginated client results',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['list'] } },
        description: 'Optional search term to filter clients',
      },
      {
        displayName: 'Send Invitation Email',
        name: 'sendInvitation',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['client'], operation: ['create'] } },
        description: 'Whether to send an invitation email to the client',
      },
      // Assign Website fields
      {
        displayName: 'Website ID',
        name: 'websiteId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['assignWebsite'] } },
        description: 'The unique identifier of the website to assign',
      },
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['assignWebsite'] } },
        description: 'The unique identifier of the client',
      },
      // Generate Magic Link fields
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['client'], operation: ['generateMagicLink'] } },
        description: 'The unique identifier of the client',
      },

      // ============================================================
      // Credits operations
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['credits'] } },
        default: 'allocate',
        options: [
          {
            name: 'Get Workspace Credits',
            value: 'get',
            description: 'Get the credit balance for the workspace',
            action: 'Get workspace credits',
          },
          {
            name: 'Get Client Credits',
            value: 'getClient',
            description: 'Get the credit balance for a specific client',
            action: 'Get client credits',
          },
          {
            name: 'Allocate Credits',
            value: 'allocate',
            description: 'Allocate credits to a client',
            action: 'Allocate credits to a client',
          },
        ],
      },
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['credits'], operation: ['allocate', 'getClient'] } },
        description: 'The unique identifier of the client',
      },
      {
        displayName: 'Credit Type',
        name: 'creditType',
        type: 'options',
        required: true,
        default: 'purchased',
        displayOptions: { show: { resource: ['credits'], operation: ['allocate'] } },
        options: [
          { name: 'Monthly', value: 'monthly' },
          { name: 'Purchased', value: 'purchased' },
          { name: 'Daily', value: 'daily' },
        ],
        description: 'Type of credits to allocate',
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
        default: 1,
        displayOptions: { show: { resource: ['credits'], operation: ['allocate'] } },
        description: 'Number of credits to allocate',
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['credits'], operation: ['allocate'] } },
        options: [
          {
            displayName: 'Source',
            name: 'source',
            type: 'string',
            default: 'bonus',
            description: 'Source of the allocation (e.g. bonus, purchase, promotion)',
          },
          {
            displayName: 'Notes',
            name: 'notes',
            type: 'string',
            default: '',
            description: 'Optional notes for the allocation record',
          },
        ],
      },
      // ============================================================
      // Workflow Status operations
      // ============================================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['workflow'] } },
        default: 'checkWebsite',
        options: [
          {
            name: 'Check Website Status',
            value: 'checkWebsite',
            description: 'Check the status of a website-creation workflow',
            action: 'Check website workflow status',
          },
          {
            name: 'Check Edit Status',
            value: 'checkEdit',
            description: 'Check the status of a website-edit workflow',
            action: 'Check website edit workflow status',
          },
          {
            name: 'Check Blog Status',
            value: 'checkBlog',
            description: 'Check the status of a blog-creation workflow',
            action: 'Check blog workflow status',
          },
          {
            name: 'Batch Check Website Status',
            value: 'batchCheckWebsite',
            description: 'Check up to 25 website-creation workflows at once',
            action: 'Batch check website workflow status',
          },
          {
            name: 'Batch Check Blog Status',
            value: 'batchCheckBlog',
            description: 'Check up to 25 blog-creation workflows at once',
            action: 'Batch check blog workflow status',
          },
        ],
      },
      {
        displayName: 'Workflow ID',
        name: 'workflowId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['workflow'], operation: ['checkWebsite', 'checkEdit', 'checkBlog'] } },
        description: 'The workflow_id returned by the matching create operation',
      },
      {
        displayName: 'Workflow IDs (JSON)',
        name: 'workflowIds',
        type: 'json',
        required: true,
        default: '[\n  "wf_abc",\n  "wf_def"\n]',
        displayOptions: { show: { resource: ['workflow'], operation: ['batchCheckWebsite', 'batchCheckBlog'] } },
        description:
          'JSON array of up to 25 workflow_ids to poll.',
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
        let responseData: any;

        // ============================================================
        // Website — Create (AI)
        // ============================================================
        if (resource === 'website' && operation === 'create') {
          const body: Record<string, unknown> = {
            prompt: this.getNodeParameter('prompt', i) as string,
          };
          const scheduleAt = this.getNodeParameter('scheduleAt', i, '') as string;
          if (scheduleAt) body.schedule_at = scheduleAt;

          const clientIdParam = this.getNodeParameter('clientId', i, '') as string;
          const clientEmailParam = this.getNodeParameter('clientEmail', i, '') as string;
          const clientNameParam = this.getNodeParameter('clientName', i, '') as string;
          if (clientIdParam || clientEmailParam) {
            const client: Record<string, string> = {};
            if (clientIdParam) client.client_id = clientIdParam;
            if (clientEmailParam) client.email = clientEmailParam;
            if (clientNameParam) client.name = clientNameParam;
            body.client = client;
          }

          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/ai/workspace/website', body,
          );
        }

        if (resource === 'website' && operation === 'list') {
          const page = this.getNodeParameter('page', i, 1) as number;
          const search = this.getNodeParameter('search', i, '') as string;
          const query: Record<string, string> = {
            page: String(page),
          };
          if (search) query.search = search;

          responseData = await lindoApiRequest.call(
            this, 'GET', '/v1/workspace/website/list', {}, query,
          );
        }

        // ============================================================
        // Website — Edit (AI)
        // ============================================================
        if (resource === 'website' && operation === 'edit') {
          const websiteId = this.getNodeParameter('websiteId', i) as string;
          const body: Record<string, unknown> = {
            prompt: this.getNodeParameter('prompt', i) as string,
          };
          const publish = this.getNodeParameter('publish', i, false) as boolean;
          if (publish) body.publish = true;
          const scheduleAt = this.getNodeParameter('scheduleAt', i, '') as string;
          if (scheduleAt) body.schedule_at = scheduleAt;

          responseData = await lindoApiRequest.call(
            this, 'POST', `/v1/ai/workspace/website/${websiteId}/edit`, body,
          );
        }

        if (resource === 'page' && operation === 'list') {
          const websiteId = this.getNodeParameter('websiteId', i) as string;
          const page = this.getNodeParameter('page', i, 1) as number;
          const search = this.getNodeParameter('search', i, '') as string;
          const query: Record<string, string> = {
            page: String(page),
          };
          if (search) query.search = search;

          responseData = await lindoApiRequest.call(
            this, 'GET', `/v1/workspace/website/${websiteId}/pages/list`, {}, query,
          );
        }

        // ============================================================
        // Blog — Create (AI)
        // ============================================================
        if (resource === 'blog' && operation === 'create') {
          const websiteId = this.getNodeParameter('websiteId', i) as string;
          const body: Record<string, unknown> = {
            prompt: this.getNodeParameter('prompt', i) as string,
          };
          const scheduleAt = this.getNodeParameter('scheduleAt', i, '') as string;
          if (scheduleAt) body.schedule_at = scheduleAt;

          responseData = await lindoApiRequest.call(
            this, 'POST', `/v1/ai/workspace/website/${websiteId}/blog`, body,
          );
        }

        if (resource === 'blog' && operation === 'list') {
          const websiteId = this.getNodeParameter('websiteId', i) as string;
          const page = this.getNodeParameter('page', i, 1) as number;
          const search = this.getNodeParameter('search', i, '') as string;
          const query: Record<string, string> = {
            page: String(page),
          };
          if (search) query.search = search;

          responseData = await lindoApiRequest.call(
            this, 'GET', `/v1/workspace/website/${websiteId}/blogs/list`, {}, query,
          );
        }

        // ============================================================
        // Blog — Publish
        // ============================================================
        if (resource === 'blog' && operation === 'publish') {
          const websiteId = this.getNodeParameter('websiteId', i) as string;
          const additionalFields = this.getNodeParameter('additionalFields', i, {}) as Record<string, string>;

          const body: Record<string, unknown> = {
            path: this.getNodeParameter('path', i) as string,
            blog_content: this.getNodeParameter('blogContent', i) as string,
            seo: {
              page_title: this.getNodeParameter('pageTitle', i) as string,
            },
            blog_settings: {} as Record<string, string>,
          };

          const blogSettings = body.blog_settings as Record<string, string>;
          if (additionalFields.author) blogSettings.author = additionalFields.author;
          if (additionalFields.excerpt) blogSettings.excerpt = additionalFields.excerpt;
          if (additionalFields.category) blogSettings.category = additionalFields.category;
          if (additionalFields.publishDate) blogSettings.publish_date = additionalFields.publishDate;

          responseData = await lindoApiRequest.call(
            this, 'POST', `/v1/workspace/website/${websiteId}/blogs/create`, body,
          );
        }

        // ============================================================
        // Client — Create
        // ============================================================
        if (resource === 'client' && operation === 'create') {
          const body: Record<string, unknown> = {
            name: this.getNodeParameter('clientName', i) as string,
            email: this.getNodeParameter('email', i) as string,
          };
          const phone = this.getNodeParameter('phone', i, '') as string;
          if (phone) body.phone = phone;
          const sendInvitation = this.getNodeParameter('sendInvitation', i, false) as boolean;
          if (sendInvitation) body.send_invitation = true;

          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/workspace/client/create', body,
          );
        }

        if (resource === 'client' && operation === 'list') {
          const page = this.getNodeParameter('page', i, 1) as number;
          const search = this.getNodeParameter('search', i, '') as string;
          const query: Record<string, string> = {
            page: String(page),
          };
          if (search) query.search = search;

          responseData = await lindoApiRequest.call(
            this, 'GET', '/v1/workspace/client/list', {}, query,
          );
        }

        // ============================================================
        // Client — Assign Website
        // ============================================================
        if (resource === 'client' && operation === 'assignWebsite') {
          const body = {
            website_id: this.getNodeParameter('websiteId', i) as string,
            client_id: this.getNodeParameter('clientId', i) as string,
          };

          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/workspace/website/assign', body,
          );
        }

        // ============================================================
        // Client — Generate Magic Link
        // ============================================================
        if (resource === 'client' && operation === 'generateMagicLink') {
          const body = {
            client_id: this.getNodeParameter('clientId', i) as string,
          };

          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/workspace/client/magic-link', body,
          );
        }

        // ============================================================
        // Credits — Allocate
        // ============================================================
        if (resource === 'credits' && operation === 'allocate') {
          const additionalFields = this.getNodeParameter('additionalFields', i, {}) as Record<string, string>;

          const body: Record<string, unknown> = {
            client_id: this.getNodeParameter('clientId', i) as string,
            credit_type: this.getNodeParameter('creditType', i) as string,
            amount: this.getNodeParameter('amount', i) as number,
          };

          if (additionalFields.source) body.source = additionalFields.source;
          if (additionalFields.notes) body.notes = additionalFields.notes;

          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/ai/credits/client/allocate', body,
          );
        }

        // ============================================================
        // Credits — Get Workspace
        // ============================================================
        if (resource === 'credits' && operation === 'get') {
          responseData = await lindoApiRequest.call(this, 'GET', '/v1/ai/credits');
        }

        // ============================================================
        // Credits — Get Client
        // ============================================================
        if (resource === 'credits' && operation === 'getClient') {
          const clientId = this.getNodeParameter('clientId', i) as string;
          responseData = await lindoApiRequest.call(
            this,
            'GET',
            '/v1/ai/credits/client',
            {},
            { client_id: clientId },
          );
        }

        // ============================================================
        // Workflow Status — Check Website / Edit / Blog
        // ============================================================
        if (resource === 'workflow' && operation === 'checkWebsite') {
          const workflowId = this.getNodeParameter('workflowId', i) as string;
          responseData = await lindoApiRequest.call(
            this, 'GET', `/v1/ai/workspace/website/status/${workflowId}`,
          );
        }

        if (resource === 'workflow' && operation === 'checkEdit') {
          const workflowId = this.getNodeParameter('workflowId', i) as string;
          responseData = await lindoApiRequest.call(
            this, 'GET', `/v1/ai/workspace/website/edit/status/${workflowId}`,
          );
        }

        if (resource === 'workflow' && operation === 'checkBlog') {
          const workflowId = this.getNodeParameter('workflowId', i) as string;
          responseData = await lindoApiRequest.call(
            this, 'GET', `/v1/ai/workspace/blog/status/${workflowId}`,
          );
        }

        // ============================================================
        // Batch Create — Website / Page / Blog
        // ============================================================
        if (resource === 'website' && operation === 'batchCreate') {
          const itemsParam = this.getNodeParameter('items', i);
          const items = typeof itemsParam === 'string'
            ? JSON.parse(itemsParam as string)
            : itemsParam;
          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/ai/workspace/website/batch', { items },
          );
        }

        if (resource === 'blog' && operation === 'batchCreate') {
          const websiteId = this.getNodeParameter('websiteId', i) as string;
          const itemsParam = this.getNodeParameter('items', i);
          const items = typeof itemsParam === 'string'
            ? JSON.parse(itemsParam as string)
            : itemsParam;
          responseData = await lindoApiRequest.call(
            this, 'POST', `/v1/ai/workspace/website/${websiteId}/blog/batch`, { items },
          );
        }

        // ============================================================
        // Batch Status — Website / Blog
        // ============================================================
        if (resource === 'workflow' && operation === 'batchCheckWebsite') {
          const widsParam = this.getNodeParameter('workflowIds', i);
          const workflow_ids = typeof widsParam === 'string'
            ? JSON.parse(widsParam as string)
            : widsParam;
          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/ai/workspace/website/status/batch', { workflow_ids },
          );
        }

        if (resource === 'workflow' && operation === 'batchCheckBlog') {
          const widsParam = this.getNodeParameter('workflowIds', i);
          const workflow_ids = typeof widsParam === 'string'
            ? JSON.parse(widsParam as string)
            : widsParam;
          responseData = await lindoApiRequest.call(
            this, 'POST', '/v1/ai/workspace/blog/status/batch', { workflow_ids },
          );
        }

        // Push result
        if (responseData) {
          const json = responseData?.result || responseData?.data || responseData;
          returnData.push({ json });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}
