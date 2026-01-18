/**
 * Workflow Templates for Integration Hub
 * ========================================
 * Pre-built templates for n8n and setup guides for other integrations.
 */

import { IntegrationSource } from "@/types/staging";

// ============================================
// TYPES
// ============================================

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    source: IntegrationSource;
    type: "n8n_workflow" | "setup_guide";
    content: string;  // JSON for n8n, markdown for guides
}

// ============================================
// N8N WORKFLOW TEMPLATES
// ============================================

const n8nNotionTemplate = {
    name: "LearnInk - Notion Page Sync",
    nodes: [
        {
            parameters: {
                event: "pageCreated",
                databaseId: "{{ YOUR_NOTION_DATABASE_ID }}"
            },
            id: "notion-trigger",
            name: "Notion Trigger",
            type: "n8n-nodes-base.notionTrigger",
            typeVersion: 1,
            position: [250, 300]
        },
        {
            parameters: {
                url: "={{ $env.LEARNINK_WEBHOOK_URL }}",
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        {
                            name: "Authorization",
                            value: "Bearer {{ YOUR_API_KEY }}"
                        }
                    ]
                },
                sendBody: true,
                bodyParameters: {
                    parameters: [
                        {
                            name: "title",
                            value: "={{ $json.properties.Name.title[0].plain_text }}"
                        },
                        {
                            name: "content",
                            value: "={{ $json.content || '' }}"
                        },
                        {
                            name: "tags",
                            value: "=['notion', 'auto-sync']"
                        }
                    ]
                }
            },
            id: "http-request",
            name: "Send to LearnInk",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4,
            position: [500, 300]
        }
    ],
    connections: {
        "Notion Trigger": {
            main: [[{ node: "Send to LearnInk", type: "main", index: 0 }]]
        }
    }
};

const n8nRssTemplate = {
    name: "LearnInk - RSS Feed Sync",
    nodes: [
        {
            parameters: {
                pollTimes: {
                    item: [{ mode: "everyHour" }]
                },
                feedUrl: "{{ YOUR_RSS_FEED_URL }}"
            },
            id: "rss-trigger",
            name: "RSS Trigger",
            type: "n8n-nodes-base.rssFeedRead",
            typeVersion: 1,
            position: [250, 300]
        },
        {
            parameters: {
                url: "={{ $env.LEARNINK_WEBHOOK_URL }}",
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        {
                            name: "Authorization",
                            value: "Bearer {{ YOUR_API_KEY }}"
                        }
                    ]
                },
                sendBody: true,
                bodyParameters: {
                    parameters: [
                        {
                            name: "title",
                            value: "={{ $json.title }}"
                        },
                        {
                            name: "content",
                            value: "={{ $json.content || $json.description }}"
                        },
                        {
                            name: "tags",
                            value: "=['rss', 'auto-sync']"
                        }
                    ]
                }
            },
            id: "http-request",
            name: "Send to LearnInk",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4,
            position: [500, 300]
        }
    ],
    connections: {
        "RSS Trigger": {
            main: [[{ node: "Send to LearnInk", type: "main", index: 0 }]]
        }
    }
};

// ============================================
// SETUP GUIDES
// ============================================

const notionSetupGuide = `
# Setup Notion Direct Webhook

## Overview
Integrate Notion directly with LearnInk to automatically sync new pages.

## Prerequisites
- Notion account with a database
- LearnInk admin access

## Steps

### 1. Create Notion Integration
1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Click "New Integration"
3. Name it "LearnInk Sync"
4. Grant access to your target database

### 2. Share Database with Integration
1. Open your Notion database
2. Click "..." → "Connections" → Add your integration

### 3. Configure Webhook (via n8n or Make)
Since Notion doesn't have native webhooks, use n8n:
1. Import the "LearnInk - Notion Page Sync" workflow
2. Replace placeholders with your values:
   - \`YOUR_NOTION_DATABASE_ID\`
   - \`YOUR_API_KEY\` (from Integration Manager)

### 4. Test
1. Create a new page in Notion
2. Check LearnInk's Inbox Review for the new content

## Payload Format
\`\`\`json
{
  "title": "Page title from Notion",
  "content": "Page content (markdown)",
  "tags": ["notion", "auto-sync"]
}
\`\`\`
`;

const n8nSetupGuide = `
# Setup n8n Integration

## Overview
Connect n8n workflows to automatically send content to LearnInk.

## Prerequisites
- n8n instance (self-hosted or cloud)
- LearnInk admin access

## Steps

### 1. Generate API Key
1. Go to LearnInk → Dashboard → Integrations
2. Click "Add Integration"
3. Name: "My n8n Workflow"
4. Source: "n8n"
5. **Save the API key immediately** - it won't be shown again!

### 2. Import Workflow Template
1. In n8n, go to Workflows → Import
2. Paste the JSON template from LearnInk
3. Activate the workflow

### 3. Configure Environment Variables (Recommended)
\`\`\`
LEARNINK_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/ingest-content
LEARNINK_API_KEY=sk_live_xxxxx
\`\`\`

### 4. Test
1. Trigger your workflow manually
2. Check LearnInk's Inbox Review

## Troubleshooting

### "Unauthorized" Error
- Check your API key is correct
- Verify the integration is active in LearnInk

### "Invalid JSON body" Error  
- Ensure payload has \`title\` and \`content\` fields
- Check for proper JSON formatting
`;

const chatgptSetupGuide = `
# Setup ChatGPT Integration (Coming Soon)

## Overview
Use ChatGPT (via API) to generate learning materials and send them to LearnInk.

## Status: 🚧 Under Development

This integration will allow you to:
- Generate learning modules from prompts
- Auto-summarize long content
- Create quiz questions

*Check back soon for updates!*
`;

// ============================================
// EXPORTED TEMPLATES
// ============================================

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: "n8n-notion",
        name: "n8n + Notion Sync",
        description: "Automatically sync new Notion pages to LearnInk via n8n",
        source: "n8n",
        type: "n8n_workflow",
        content: JSON.stringify(n8nNotionTemplate, null, 2),
    },
    {
        id: "n8n-rss",
        name: "n8n + RSS Feed",
        description: "Import articles from RSS feeds to LearnInk",
        source: "n8n",
        type: "n8n_workflow",
        content: JSON.stringify(n8nRssTemplate, null, 2),
    },
    {
        id: "notion-guide",
        name: "Notion Setup Guide",
        description: "Step-by-step guide to connect Notion with LearnInk",
        source: "notion",
        type: "setup_guide",
        content: notionSetupGuide,
    },
    {
        id: "n8n-guide",
        name: "n8n Setup Guide",
        description: "Complete guide for n8n integration",
        source: "n8n",
        type: "setup_guide",
        content: n8nSetupGuide,
    },
    {
        id: "chatgpt-guide",
        name: "ChatGPT Integration",
        description: "AI-powered content generation (Coming Soon)",
        source: "chatgpt",
        type: "setup_guide",
        content: chatgptSetupGuide,
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTemplatesBySource(source: IntegrationSource): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(t => t.source === source);
}

export function getN8nWorkflows(): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(t => t.type === "n8n_workflow");
}

export function getSetupGuideForSource(source: IntegrationSource): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES.find(t => t.source === source && t.type === "setup_guide");
}

// Source display info
export const SOURCE_INFO: Record<IntegrationSource, { label: string; icon: string; color: string }> = {
    n8n: { label: "n8n", icon: "Workflow", color: "bg-orange-500/10 text-orange-500" },
    notion: { label: "Notion", icon: "FileText", color: "bg-neutral-500/10 text-neutral-500" },
    chatgpt: { label: "ChatGPT", icon: "Bot", color: "bg-green-500/10 text-green-500" },
    zapier: { label: "Zapier", icon: "Zap", color: "bg-orange-400/10 text-orange-400" },
    custom: { label: "Custom", icon: "Code", color: "bg-blue-500/10 text-blue-500" },
};
