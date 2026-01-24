{
  "nodes": [
    {
      "parameters": {
        "pollTimes": {
          "item": [
            {
              "mode": "everyMinute"
            }
          ]
        },
        "event": "pagedUpdatedInDatabase",
        "databaseId": {
          "__rl": true,
          "value": "4b0feeeb-49ae-4154-9a1c-950d2b6680ac",
          "mode": "list",
          "cachedResultName": "Content Management",
          "cachedResultUrl": "https://www.notion.so/4b0feeeb49ae41549a1c950d2b6680ac"
        }
      },
      "id": "e9b38309-ed52-4735-a99d-f33a48f0499f",
      "name": "Notion Trigger",
      "type": "n8n-nodes-base.notionTrigger",
      "typeVersion": 1,
      "position": [
        256,
        -64
      ],
      "credentials": {
        "notionApi": {
          "id": "9tEsLc21iy7H3G83",
          "name": "Notion account"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Map Notion flat data to LearnInk structure\nconst item = $input.item.json;\n\n// Get fields from Notion (flat structure)\nconst title = item.Name || 'Untitled';\nconst status = item.Status || 'Draft';\nconst track = item.Track || 'General';\nconst summary = item.Summary || '';\nconst slug = item.Slug || '';\nconst level = item.Level || 'Pemula';\nconst sourceUrl = item.Source || '';\nconst notionPageId = item.id || '';\n\n// Handle Category (Multi-select)\n// n8n Notion node might return array or simpler content depending on version.\n// Assuming flat simple return or handling basic array if needed.\nlet category = 'Umum';\nif (Array.isArray(item.category)) {\n    category = item.category.map(c => c.name).join(', ');\n} else if (typeof item.category === 'string') {\n    category = item.category;\n}\n\n// Construct raw_content as JSONB object\n// This is the format that ContentApproval.tsx expects!\nconst raw_content = {\n  content: `# ${title}\\n\\n${summary}\\n\\n**Track:** ${track}\\n**Level:** ${level}\\n**Source:** ${sourceUrl}\\n**Status:** ${status}`,\n  tags: [track, status, category],\n  notion_url: `https://notion.so/${(notionPageId).replace(/-/g, '')}`,\n  source_url: sourceUrl,\n  summary: summary,\n  slug: slug,\n  track: track,\n  level: level,\n  category: category\n};\n\nreturn {\n  title: title,\n  summary: summary,\n  level: level,\n  track: track,\n  category: category,\n  raw_content: JSON.stringify(raw_content),\n  status: 'pending',\n  source: 'Notion'\n};"
      },
      "id": "544fc020-69fd-491a-9248-d11104fc46a0",
      "name": "Format Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        480,
        -64
      ]
    },
    {
      "parameters": {
        "tableId": "incoming_contents",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "title",
              "fieldValue": "={{ $json.title }}"
            },
            {
              "fieldId": "summary",
              "fieldValue": "={{ $json.summary }}"
            },
            {
              "fieldId": "level",
              "fieldValue": "={{ $json.level }}"
            },
            {
              "fieldId": "track",
              "fieldValue": "={{ $json.track }}"
            },
            {
              "fieldId": "category",
              "fieldValue": "={{ $json.category }}"
            },
            {
              "fieldId": "raw_content",
              "fieldValue": "={{ $json.raw_content }}"
            },
            {
              "fieldId": "source",
              "fieldValue": "={{ $json.source }}"
            },
            {
              "fieldId": "status",
              "fieldValue": "={{ $json.status }}"
            }
          ]
        }
      },
      "id": "e5039cb7-61b4-4b4b-814c-faf708c4599d",
      "name": "Supabase Insert",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        704,
        -64
      ],
      "credentials": {
        "supabaseApi": {
          "id": "ySWWe7uMMQ34AmNz",
          "name": "Supabase account"
        }
      }
    }
  ],
  "connections": {
    "Notion Trigger": {
      "main": [
        [
          {
            "node": "Format Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Data": {
      "main": [
        [
          {
            "node": "Supabase Insert",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "80cdf432ff0463d0ecd89cb8763722e72a7c355332cc14a84a97e2999b3569a3"
  }
}