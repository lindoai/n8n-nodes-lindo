# n8n-nodes-lindo

This is an [n8n](https://n8n.io/) community node for [Lindo.ai](https://lindo.ai), a website builder platform. It lets you automate website and client management directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-lindo`
4. Agree to the risks and click **Install**

## Credentials

Select **OAuth2** (default) or **API Key** on either node.

- **OAuth2:** Create a **Lindo OAuth2 API** credential, connect your account, and authorize your Lindo workspace.
- **API Key:** Copy your workspace API key from Lindo settings and create a **Lindo API** credential in n8n. Select **API Key** on the node. API requests use `https://api.lindo.ai`.

## Nodes

### Lindo Trigger

Starts a workflow when one of these events occurs in your workspace:

| Event | Description |
| --- | --- |
| Blog AI Build Completed | A standalone AI blog creation workflow finishes |
| New Client Created | A new client is created |
| New Website Created | A website record is created; its AI build may still be running |
| Page AI Build Completed | A standalone AI page creation workflow finishes |
| Website AI Build Completed | An AI website creation workflow finishes |

### Lindo

All six resources and their operations:

| Resource | Operations |
| --- | --- |
| Blog | Batch Create Blogs (AI), Create Blog (AI), List Blogs, Publish Blog |
| Client | Assign Website, Create Client, Generate Magic Link, List Clients |
| Credit | Allocate Credits, Get Client Credits, Get Workspace Credits |
| Page | List Pages |
| Website | Batch Create Websites (AI), Create Website (AI), Edit Website (AI), List Websites |
| Workflow Status | Batch Check Blog Status, Batch Check Website Status, Check Blog Status, Check Edit Status, Check Website Status |

#### Website

**Create Website (AI)** requires **Prompt**. Describe the business, content, design, and desired language in the prompt. Optional fields are **Schedule At**, **Client ID**, **Client Email**, and **Client Name**. Client Email can look up or create a client to assign the website to.

**Edit Website (AI)** requires **Website ID** and **Prompt**. Optionally enable **Publish to Live Site** or set **Schedule At**.

**Batch Create Websites (AI)** accepts **Items (JSON)**: up to 25 objects containing `prompt`, optionally `schedule_at` and `client`.

#### Blog

**Create Blog (AI)** requires **Website ID** and **Prompt**. **Language** is optional (for example `de-CH`); leave it blank to use the prompt or website language. **Schedule At** is optional.

**Batch Create Blogs (AI)** requires **Website ID** and **Items (JSON)**: up to 25 objects containing `prompt`, optionally `language` and `schedule_at`.

**Publish Blog** publishes supplied content rather than generating it. Required fields: **Website ID**, **URL Path**, **Blog Content (Markdown)**, and **Page Title**. Additional fields: **Author**, **Category**, **Excerpt**, and **Publish Date**.

#### Client

**Create Client** requires **Name** and **Email**. **Phone** and **Send Invitation Email** are optional.

**Assign Website** requires **Website ID** and **Client ID**. **Generate Magic Link** requires **Client ID** and returns a client login link; treat that link as sensitive.

#### Credit

**Get Workspace Credits** returns the workspace balance. **Get Client Credits** requires **Client ID**.

**Allocate Credits** requires **Client ID**, **Credit Type** (Daily, Monthly, or Purchased), and **Amount**. Optional additional fields: **Notes** and **Source**.

#### Lists and workflow status

List operations accept **Page** and optional **Search**. **List Pages** and **List Blogs** also require **Website ID**.

AI creation and editing run asynchronously. Use the returned `workflow_id` with the matching **Workflow Status** operation, or use a completion trigger. Single checks require **Workflow ID**; batch checks accept **Workflow IDs (JSON)**, an array of up to 25 IDs. Page creation is not an action exposed by this node, but page completion events can trigger it.

## Workflow Templates

Ready-to-use workflow templates are included in the `templates/` folder:

| Template | Description |
| -------- | ----------- |
| [New website → Slack](templates/new-website-to-slack.json) | Post a Slack message when a website is created |
| [New client → Google Sheets](templates/new-client-to-google-sheets.json) | Log new clients to a spreadsheet |
| [New client → Welcome email](templates/new-client-to-email.json) | Send a welcome email to new clients |
| [Google Sheets → Create websites](templates/create-website-from-google-sheets.json) | Bulk-create websites from spreadsheet rows |

To use a template: copy the JSON, go to your n8n instance, click **Import from file**, and paste.

## Resources

- [Lindo.ai](https://lindo.ai)
- [Lindo API Documentation](https://lindo.ai/docs/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)

## Website form submissions (1.5.1)

Add **Form Submission Trigger**, select a website by its Website ID, and create a **Website Form Webhook API** credential with your workspace API key and that website’s signing secret (Website Settings → Integrations → Form webhooks). Activating the workflow automatically registers a website-scoped subscription; deactivating it removes only that subscription. Existing website defaults and form overrides are preserved.

The trigger verifies the raw-body signature, timestamp, delivery ID and website before emitting `form.submitted` payloads. An optional slug filter selects one form. Spam and test submissions (`?test=1`) do not trigger workflows. Deduplicate submission `id` before side effects. This feature requires the matching form automation API update.
