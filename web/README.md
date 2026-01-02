## n8n WhatsApp Automation Agent

Vercel-ready dashboard that collects structured WhatsApp automation payloads and dispatches them to an n8n workflow. Use it to launch broadcasts, transactional messaging, or CRM-triggered nudges through the WhatsApp Cloud API.

### 1. Prerequisites

- Node.js 18+
- n8n instance with HTTPS access
- WhatsApp Cloud API token (or Twilio WhatsApp credentials)

### 2. Environment variables

Create a `.env.local` file and set:

```env
N8N_WEBHOOK_URL=https://your-n8n-host/webhook/whatsapp-relay
N8N_API_KEY= # optional, supply if your webhook is protected
```

Optional helpers consumed by the bundled n8n workflow:

```env
WHATSAPP_PHONE_NUMBER_ID= # fallback if payload omitted phoneNumberId
```

### 3. Install & run locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the launchpad. Submit the form to send a test payload into n8n.

### 4. Import the n8n workflow

1. Download [`/workflows/whatsapp-automation.json`](./public/workflows/whatsapp-automation.json).
2. In n8n, go to **Workflows → Import from file**, pick the JSON export, and save.
3. Attach a `HTTP Header Auth` credential named **“WhatsApp Cloud Token”** with the header `Authorization: Bearer <YOUR_TOKEN>`.
4. Deploy the workflow and copy the generated production webhook URL into `N8N_WEBHOOK_URL`.

The flow normalizes the payload, optionally waits until `sendAt`, fan-outs recipients, and sends messages via the WhatsApp Cloud API. Responses are aggregated and returned to the dashboard for user feedback.

### 5. Build & deploy

```bash
npm run build
npm run start   # optional sanity check before deploying
```

Deploy to Vercel with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-68da2ec6
```

After deployment, smoke test with:

```bash
curl https://agentic-68da2ec6.vercel.app
```

### 6. Extending the agent

- Add CRM enrichment by posting additional `workflowVars` and branching in n8n.
- Switch to a Twilio-compatible branch by inspecting `workflowTag` in n8n and forwarding to a different HTTP node.
- Hook a “mark as delivered” callback by appending the `Respond to Webhook` node with a call into your datastore.
