# Claude "Add This as a Task" — MCP Setup

> This lets you create tasks in the Command Center **directly from Claude Desktop** by saying things like *“add this as a task”* or *“create a task to review the API docs under M05 Strategy”*.

## How it works

1. The dashboard now loads its data from `public/data/dashboard-data.json` instead of hard-coded TypeScript.
2. A local MCP server (`scripts/mcp-server.ts`) exposes three tools to Claude:
   - **`list_milestones`** — shows available pillars (e.g. `ms-01`, `ms-02`)
   - **`list_epics`** — shows epics inside a milestone
   - **`create_task`** — adds a task directly to the JSON file
3. When you create a task without specifying an epic, it lands in a **"Claude Inbox"** epic under that milestone.
4. Refresh the dashboard (⌘+R) to see the new task. Your existing completions (ticked-off tasks) are preserved via `localStorage`.

## One-time setup

1. **Install dependencies** (already done if you're reading this after the implementation):
   ```bash
   npm install
   ```

2. **Export the mock data to JSON** (already done once):
   ```bash
   npm run export:data
   # or manually: npx tsx scripts/export-data.ts
   ```

3. **Configure Claude Desktop** to talk to the MCP server.

   Open your Claude Desktop config:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

   Add this entry inside `mcpServers`:
   ```json
   {
     "mcpServers": {
       "radium-command-center": {
         "command": "npx",
         "args": [
           "tsx",
           "/Users/leoschwarz/Library/CloudStorage/GoogleDrive-leo@leoschwarz.ca/My Drive/01 External Clients/Radium/VS Build/radium-command-center/scripts/mcp-server.ts"
         ],
         "env": {}
       }
     }
   }
   ```
   > Replace the absolute path with the actual path to `scripts/mcp-server.ts` on your machine.

4. **Restart Claude Desktop** so it picks up the new server.

## Using it

In any Claude conversation, say something like:
- *"Add a task to review the LiteLLM integration under M05 Strategy"*
- *"List my milestones"*
- *"Create a high-priority task called 'Fix auth regression' for ms-01 with tag urgent"*

Claude will see the tools and either ask you clarifying questions or create the task immediately.

## Architecture

```
Claude Desktop (Mac App)
    ↓ stdio (MCP JSON-RPC)
scripts/mcp-server.ts
    ↓ read/write
public/data/dashboard-data.json
    ↑ fetch on page load
Dashboard (Vite/React)
```

- **No backend server required.** The MCP server talks directly to the JSON file.
- **Falls back safely.** If `dashboard-data.json` is missing, the dashboard loads the original `mockDashboardData`.
- **Toggle state is preserved.** `localStorage` stores which tasks you've completed, so refreshes don't lose your progress.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Claude doesn't see the tools | Restart Claude Desktop after editing the config. Check the MCP logs (⚙️ → Developer → MCP Logs). |
| "Not found" when creating task | Make sure the milestone ID exists. Use `list_milestones` first. |
| Task doesn't appear in dashboard | Refresh the browser (⌘+R). The dashboard loads the JSON once on startup. |
| MCP server crashes on startup | Ensure you ran `npm install` so `@modelcontextprotocol/sdk` is present. |

## Future ideas

- **Hot-reload**: Poll the JSON file every few seconds and auto-merge new tasks without a page refresh.
- **Bidirectional sync**: Persist dashboard toggle changes back to the JSON so the state survives across sessions.
- **Knowledge Hub**: Extend the MCP server with a *resource* that surfaces project docs so Claude can reference them while creating tasks.
