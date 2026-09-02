#!/usr/bin/env npx tsx
/*
 * MCP Server for Radium Command Center.
 *
 * Add to Claude Desktop config (macOS):
 * ~/Library/Application Support/Claude/claude_desktop_config.json
 *
 * {
 *   "mcpServers": {
 *     "radium-command-center": {
 *       "command": "npx",
 *       "args": ["tsx", "/absolute/path/to/scripts/mcp-server.ts"],
 *       "env": {}
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH =
  process.env.DASHBOARD_DATA_PATH ||
  join(__dirname, "..", "public", "data", "dashboard-data.json");
const KNOWLEDGE_DIR = join(__dirname, "..", "public", "data", "knowledge");
const KNOWLEDGE_INDEX_PATH = join(KNOWLEDGE_DIR, "index.json");
const MARKETING_STATS_PATH = join(__dirname, "..", "public", "data", "marketing-stats.json");

type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignee: string;
  priority: string;
  dueDate: string;
  tags: string[];
  channel?: string;
  bucket?: string;
};

type Epic = {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: string;
  tasks: Task[];
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  icon: string;
  status: string;
  epics: Epic[];
};

type DashboardData = {
  lastUpdated: string;
  milestones: Milestone[];
};

// ─── Knowledge Base Types ───

type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  tags: string[];
  linkedMilestoneIds: string[];
  linkedEpicIds: string[];
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
  author?: string;
};

type KnowledgeIndex = {
  docs: KnowledgeDoc[];
  lastUpdated: string;
};

function loadData(): DashboardData {
  return JSON.parse(readFileSync(DATA_PATH, "utf8"));
}

function loadKnowledgeIndex(): KnowledgeIndex {
  if (!existsSync(KNOWLEDGE_INDEX_PATH)) {
    return { docs: [], lastUpdated: new Date().toISOString().split("T")[0] };
  }
  return JSON.parse(readFileSync(KNOWLEDGE_INDEX_PATH, "utf8"));
}

function saveKnowledgeIndex(index: KnowledgeIndex) {
  if (!existsSync(KNOWLEDGE_DIR)) {
    mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  index.lastUpdated = new Date().toISOString().split("T")[0];
  writeFileSync(KNOWLEDGE_INDEX_PATH, JSON.stringify(index, null, 2));
}

function nextKnowledgeId(index: KnowledgeIndex): string {
  let maxNum = 0;
  for (const doc of index.docs) {
    const match = doc.id.match(/^kd-(\d+)$/);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }
  return `kd-${String(maxNum + 1).padStart(3, "0")}`;
}

function sanitizeFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function saveData(data: DashboardData) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function nextTaskId(data: DashboardData): string {
  let maxNum = 0;
  for (const ms of data.milestones) {
    for (const ep of ms.epics) {
      for (const t of ep.tasks) {
        const match = t.id.match(/^T(\d+)$/);
        if (match) {
          maxNum = Math.max(maxNum, parseInt(match[1], 10));
        }
      }
    }
  }
  return `T${String(maxNum + 1).padStart(3, "0")}`;
}

function defaultDueDate(): string {
  return new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
}

const server = new Server(
  { name: "radium-command-center", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_milestones",
      description: "List all pillars/milestones in the dashboard.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_epics",
      description: "List all epics within a milestone.",
      inputSchema: {
        type: "object",
        properties: {
          milestoneId: { type: "string", description: "Milestone ID. Use list_milestones to find it." },
        },
        required: ["milestoneId"],
      },
    },
    {
      name: "create_task",
      description: "Add a new task to the dashboard. Appears after a page refresh.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short, clear task title",
          },
          description: {
            type: "string",
            description: "Longer explanation (optional)",
          },
          milestoneId: {
            type: "string",
            description: "Milestone ID (e.g. ms-01). Use list_milestones if unsure.",
          },
          epicId: {
            type: "string",
            description: "Epic ID. If omitted, a 'Claude Inbox' epic is created under the milestone.",
          },
          assignee: {
            type: "string",
            description: "Owner (default: Unassigned)",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Priority (default: medium)",
          },
          dueDate: {
            type: "string",
            description: "YYYY-MM-DD (default: 7 days from now)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags like ['urgent', 'week'] (optional)",
          },
        },
        required: ["title", "milestoneId"],
      },
    },
    {
      name: "list_knowledge_docs",
      description: "List all knowledge documents in the knowledge base, with optional filtering by milestone, epic, or tag.",
      inputSchema: {
        type: "object",
        properties: {
          milestoneId: { type: "string", description: "Filter by linked milestone ID (optional)" },
          epicId: { type: "string", description: "Filter by linked epic ID (optional)" },
          tag: { type: "string", description: "Filter by tag (optional)" },
        },
      },
    },
    {
      name: "add_knowledge_doc",
      description: "Save a document to the knowledge base. Creates a markdown file and updates the index. The document is linked to milestones/epics so it appears in the dashboard.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Document title" },
          content: { type: "string", description: "Full document content in markdown" },
          source: { type: "string", description: "Source: claude, fireflies, manual, hubspot, linkedin, google-ads, contentsquare, other" },
          sourceUrl: { type: "string", description: "Optional URL to original source" },
          tags: { type: "array", items: { type: "string" }, description: "Tags for filtering e.g. ['strategy', 'pricing']" },
          linkedMilestoneIds: { type: "array", items: { type: "string" }, description: "Milestone IDs to link this doc to, e.g. ['ms-01', 'ms-02']" },
          linkedEpicIds: { type: "array", items: { type: "string" }, description: "Epic IDs to link this doc to, e.g. ['ep-01-1']" },
          linkedTaskIds: { type: "array", items: { type: "string" }, description: "Task IDs to link this doc to, e.g. ['T001']" },
          author: { type: "string", description: "Author name (optional)" },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "link_knowledge_doc",
      description: "Link an existing knowledge document to milestones, epics, or tasks. Use this when a doc becomes relevant to new work.",
      inputSchema: {
        type: "object",
        properties: {
          docId: { type: "string", description: "Knowledge doc ID, e.g. kd-001" },
          addMilestoneIds: { type: "array", items: { type: "string" }, description: "Milestone IDs to add" },
          addEpicIds: { type: "array", items: { type: "string" }, description: "Epic IDs to add" },
          addTaskIds: { type: "array", items: { type: "string" }, description: "Task IDs to add" },
        },
        required: ["docId"],
      },
    },
    {
      name: "get_marketing_stats",
      description: "Read the latest marketing stats snapshot from the dashboard. Returns KPIs, HubSpot pipeline, Google Ads, LinkedIn, website, and product metrics.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "update_marketing_stats",
      description: "Update the marketing stats snapshot. Pass any partial or full JSON object with KPIs, HubSpot, Google Ads, LinkedIn, website, or product data. Missing fields are preserved from the existing snapshot. A new dateRange may be set.",
      inputSchema: {
        type: "object",
        properties: {
          snapshot: {
            type: "object",
            description: "Partial or full MarketingStats JSON object. Any provided keys overwrite existing values.",
          },
        },
        required: ["snapshot"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_milestones") {
    const data = loadData();
    const text = data.milestones
      .map((m) => `- ${m.id}: "${m.title}" (${m.status}) — target: ${m.targetDate}`)
      .join("\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "list_epics") {
    const data = loadData();
    const ms = data.milestones.find((m) => m.id === args.milestoneId);
    if (!ms) {
      return {
        content: [{ type: "text", text: `Milestone "${args.milestoneId}" not found.` }],
        isError: true,
      };
    }
    const text = ms.epics
      .map((ep) => `- ${ep.id}: "${ep.title}" (${ep.tasks.length} tasks)`)
      .join("\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "create_task") {
    const data = loadData();
    const ms = data.milestones.find((m) => m.id === args.milestoneId);
    if (!ms) {
      return {
        content: [{ type: "text", text: `Milestone "${args.milestoneId}" not found. Use list_milestones first.` }],
        isError: true,
      };
    }

    let epic = ms.epics.find((ep) => ep.id === args.epicId);
    if (!epic) {
      const inboxId = `ep-${args.milestoneId}-claude`;
      epic = ms.epics.find((ep) => ep.id === inboxId);
      if (!epic) {
        epic = {
          id: inboxId,
          title: "Claude Inbox",
          description: "Tasks created from Claude conversations",
          owner: "Claude",
          status: "in_progress",
          tasks: [],
        };
        ms.epics.push(epic);
      }
    }

    const newTask: Task = {
      id: nextTaskId(data),
      title: String(args.title),
      description: args.description ? String(args.description) : "",
      completed: false,
      assignee: args.assignee ? String(args.assignee) : "Unassigned",
      priority: args.priority ? String(args.priority) : "medium",
      dueDate: args.dueDate ? String(args.dueDate) : defaultDueDate(),
      tags: Array.isArray(args.tags) ? args.tags.map((t: unknown) => String(t)) : [],
      channel: "Claude",
      bucket: "now",
    };

    epic.tasks.push(newTask);
    epic.description = `${epic.tasks.length} task(s)`;
    data.lastUpdated = new Date().toISOString().split("T")[0];

    saveData(data);

    return {
      content: [{
        type: "text",
        text: `Created task ${newTask.id} "${newTask.title}" in "${epic.title}" under "${ms.title}". Refresh the dashboard (⌘+R) to see it.`,
      }],
    };
  }

  if (name === "list_knowledge_docs") {
    const index = loadKnowledgeIndex();
    let docs = index.docs;
    const filterMs = args.milestoneId ? String(args.milestoneId) : null;
    const filterEp = args.epicId ? String(args.epicId) : null;
    const filterTag = args.tag ? String(args.tag) : null;

    if (filterMs) {
      docs = docs.filter((d) => d.linkedMilestoneIds.includes(filterMs));
    }
    if (filterEp) {
      docs = docs.filter((d) => d.linkedEpicIds.includes(filterEp));
    }
    if (filterTag) {
      docs = docs.filter((d) => d.tags.includes(filterTag));
    }

    if (docs.length === 0) {
      return { content: [{ type: "text", text: "No knowledge documents found." }] };
    }

    const text = docs
      .map((d) => {
        const links = [
          d.linkedMilestoneIds.length ? `milestones: ${d.linkedMilestoneIds.join(", ")}` : "",
          d.linkedEpicIds.length ? `epics: ${d.linkedEpicIds.join(", ")}` : "",
          d.linkedTaskIds.length ? `tasks: ${d.linkedTaskIds.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return `- ${d.id}: "${d.title}" — ${d.source}${d.author ? ` · by ${d.author}` : ""}${d.tags.length ? ` · tags: ${d.tags.join(", ")}` : ""}${links ? ` · ${links}` : ""}`;
      })
      .join("\n");

    return { content: [{ type: "text", text }] };
  }

  if (name === "add_knowledge_doc") {
    const index = loadKnowledgeIndex();
    const today = new Date().toISOString().split("T")[0];
    const docId = nextKnowledgeId(index);
    const title = String(args.title);
    const content = String(args.content);

    const newDoc: KnowledgeDoc = {
      id: docId,
      title,
      content,
      source: args.source ? String(args.source) : "claude",
      sourceUrl: args.sourceUrl ? String(args.sourceUrl) : undefined,
      tags: Array.isArray(args.tags) ? args.tags.map((t: unknown) => String(t)) : [],
      linkedMilestoneIds: Array.isArray(args.linkedMilestoneIds)
        ? args.linkedMilestoneIds.map((t: unknown) => String(t))
        : [],
      linkedEpicIds: Array.isArray(args.linkedEpicIds)
        ? args.linkedEpicIds.map((t: unknown) => String(t))
        : [],
      linkedTaskIds: Array.isArray(args.linkedTaskIds)
        ? args.linkedTaskIds.map((t: unknown) => String(t))
        : [],
      createdAt: today,
      updatedAt: today,
      author: args.author ? String(args.author) : undefined,
    };

    // Write markdown file
    const fileName = `${today}-${sanitizeFileName(title)}.md`;
    const filePath = join(KNOWLEDGE_DIR, "docs", fileName);
    if (!existsSync(join(KNOWLEDGE_DIR, "docs"))) {
      mkdirSync(join(KNOWLEDGE_DIR, "docs"), { recursive: true });
    }

    const frontMatter = `---
id: ${docId}
title: ${title}
source: ${newDoc.source}${newDoc.sourceUrl ? `\nsourceUrl: ${newDoc.sourceUrl}` : ""}${newDoc.author ? `\nauthor: ${newDoc.author}` : ""}
tags: [${newDoc.tags.map((t) => `"${t}"`).join(", ")}]
linkedMilestones: [${newDoc.linkedMilestoneIds.map((t) => `"${t}"`).join(", ")}]
linkedEpics: [${newDoc.linkedEpicIds.map((t) => `"${t}"`).join(", ")}]
linkedTasks: [${newDoc.linkedTaskIds.map((t) => `"${t}"`).join(", ")}]
createdAt: ${today}
---

`;
    writeFileSync(filePath, frontMatter + content);

    // Update index
    index.docs.push(newDoc);
    saveKnowledgeIndex(index);

    return {
      content: [{
        type: "text",
        text: `Saved knowledge doc ${docId} "${title}". File: knowledge/docs/${fileName}. Linked to ${newDoc.linkedMilestoneIds.length} milestone(s), ${newDoc.linkedEpicIds.length} epic(s), ${newDoc.linkedTaskIds.length} task(s). Refresh dashboard (⌘+R) to see it.`,
      }],
    };
  }

  if (name === "link_knowledge_doc") {
    const index = loadKnowledgeIndex();
    const doc = index.docs.find((d) => d.id === args.docId);
    if (!doc) {
      return {
        content: [{ type: "text", text: `Knowledge doc "${args.docId}" not found. Use list_knowledge_docs to find the ID.` }],
        isError: true,
      };
    }

    const addMs = Array.isArray(args.addMilestoneIds)
      ? args.addMilestoneIds.map((t: unknown) => String(t))
      : [];
    const addEp = Array.isArray(args.addEpicIds)
      ? args.addEpicIds.map((t: unknown) => String(t))
      : [];
    const addTk = Array.isArray(args.addTaskIds)
      ? args.addTaskIds.map((t: unknown) => String(t))
      : [];

    doc.linkedMilestoneIds = [...new Set([...doc.linkedMilestoneIds, ...addMs])];
    doc.linkedEpicIds = [...new Set([...doc.linkedEpicIds, ...addEp])];
    doc.linkedTaskIds = [...new Set([...doc.linkedTaskIds, ...addTk])];
    doc.updatedAt = new Date().toISOString().split("T")[0];

    saveKnowledgeIndex(index);

    return {
      content: [{
        type: "text",
        text: `Updated ${doc.id} "${doc.title}". Now linked to ${doc.linkedMilestoneIds.length} milestone(s), ${doc.linkedEpicIds.length} epic(s), ${doc.linkedTaskIds.length} task(s).`,
      }],
    };
  }

  if (name === "get_marketing_stats") {
    if (!existsSync(MARKETING_STATS_PATH)) {
      return {
        content: [{ type: "text", text: "No marketing stats snapshot found." }],
        isError: true,
      };
    }
    const raw = readFileSync(MARKETING_STATS_PATH, "utf-8");
    return { content: [{ type: "text", text: raw }] };
  }

  if (name === "update_marketing_stats") {
    let existing: Record<string, unknown> = {};
    if (existsSync(MARKETING_STATS_PATH)) {
      try {
        existing = JSON.parse(readFileSync(MARKETING_STATS_PATH, "utf-8"));
      } catch { /* ignore parse errors */ }
    }
    const incoming = (args.snapshot ?? {}) as Record<string, unknown>;
    const merged = { ...existing, ...incoming, lastSyncAt: new Date().toISOString() };
    writeFileSync(MARKETING_STATS_PATH, JSON.stringify(merged, null, 2));
    return {
      content: [{
        type: "text",
        text: `Marketing stats snapshot updated. Keys written: ${Object.keys(incoming).join(", ")}.`,
      }],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Radium Command Center MCP server running on stdio");
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});

