# Daily Claude Run — Radium PLG Tracker Refresh

End-of-day refresh of Leo's Radium PLG tracker. Standalone task — you have no memory of previous runs.

## THE TRACKER

The tracker is a local React app served from the repo below. It loads data at runtime from a JSON file and the MCP server writes directly to that same file.

- **Source repo:** `/Users/leoschwarz/Library/CloudStorage/GoogleDrive-leo@leoschwarz.ca/My Drive/01 External Clients/Radium/VS Build/radium-command-center/`
- **Data file (source of truth):** `public/data/dashboard-data.json` — runtime JSON with `{ lastUpdated, milestones[] }`
- **Milestone IDs:** `ms-01`, `ms-02`, `ms-03` (not M01, M02)
- **Milestones have:** id, title, description, targetDate, icon, status, epics[]
- **Epics have:** id, title, description, owner, status, tasks[]
- **Tasks have:** id (e.g. T001), title, description, completed boolean, assignee, priority (low/medium/high), dueDate (YYYY-MM-DD), tags (array: "blocked", "urgent", "week", etc.), channel, bucket

**Important:** Completions are ALSO stored in browser localStorage. The JSON `completed` flag may not match what Leo sees in his browser. If you find a discrepancy between JSON and meeting evidence, note it rather than blindly overriding.

---

## MCP TOOLS AVAILABLE

Try local MCPs first. Cloud scheduled tasks may NOT reach them — if they fail, fall back to native connectors.

- **filesystem** — Read/write the local repo. Try this FIRST to read `dashboard-data.json`.
- **radium-command-center** — List milestones/epics (`list_milestones`, `list_epics`), create tasks (`create_task`), manage knowledge docs (`list_knowledge_docs`, `add_knowledge_doc`, `link_knowledge_doc`), and manage marketing stats (`get_marketing_stats`, `update_marketing_stats`). Use `create_task` to safely add tasks without manual JSON editing. Use knowledge tools when Leo asks to save strategy docs or meeting notes. Use `update_marketing_stats` to push the latest numbers from HubSpot, Google Ads, LinkedIn, website, or product analytics into the Marketing Stats dashboard.
- **google-workspace** — Google Docs/Sheets/Gmail (requires uv + local Python; may fail in cloud).
- **google-ads-mcp** — Google Ads (local pipx; usually unreachable from cloud). Try once.
- **linkedin-ads** — LinkedIn campaigns (local node; usually unreachable from cloud). Try once.
- **sequential-thinking** — Multi-step reasoning for complex data comparison.
- **memory** — Cross-session memory (local file; may be unreachable).

**Native connectors (always work in cloud):**
- **Fireflies** — meeting transcripts.
- **HubSpot** — contacts, lifecycle stages, product events.
- **Contentsquare** — project 921964, Radium site analytics.

---

## CARDINAL RULE — RESPECT STRUCTURE, BE OPINIONATED ON PRIORITY

Leo edits the board directly throughout the day. Your job is to layer small, well-evidenced updates on top of whatever you find, never to restructure or second-guess it.

### Never touch without explicit evidence:
- Milestone, epic, or task titles (no rewording, reordering, deleting, merging).
- Assignee, channel, or bucket on existing tasks.
- The "urgent" or "week" tags — those are Leo's own flags.

### You may modify with evidence:
- **Tick done:** Only when evidence is unambiguous that the task was completed.
- **Blocked tag:** Add or remove "blocked" from the tags array when evidence clearly supports it. Explain why.
- **Description updates:** Append a dated line (e.g. "Update 2 Sep: conversation with Adam confirmed scope reduced, source: Fireflies"). Never overwrite existing text.
- **New tasks:** Add under an existing epic when a meeting surfaces a concrete, specific action item. Give it a plain title, assignee if stated, channel, and a description citing the source meeting and date. Do not invent tasks from vague discussion. When in doubt, leave it out.
- **PRIORITY REASSIGNMENT:** You MAY change the `priority` field (low/medium/high) when meeting outcomes, blocker resolution, or due-date pressure justify it. Explain every priority change in the digest.

### If nothing you found bears on a task, leave that task completely untouched.
---

## STEP 1 — READ THE CURRENT DASHBOARD STATE

Try to read the tracker data using the filesystem MCP:
- Read: `.../radium-command-center/public/data/dashboard-data.json`
- If filesystem is blocked: try `radium-command-center/list_milestones`. If both fail, note "Dashboard read blocked — running in cloud, local MCPs unavailable." Proceed to Steps 2 and 3, then produce the digest with a structured "Suggested changes" section for Leo to apply manually.
- If successful: parse the JSON. Note the milestone IDs (ms-01, ms-02, ms-03), epic IDs, and the highest task ID number. You'll need these for creating new tasks.

---

## STEP 2 — PULL THE NUMBERS FOR THE DIGEST

These go in the digest only, not on the board. Use whichever sources answer; skip any that fail rather than stopping.

- **HubSpot** (native connector): contacts created in the last 30 days grouped by lifecyclestage and hs_analytics_source, and the paid vs organic split. Critically: check whether any product events (api_key_created, first_request) have started arriving. As of 31 Aug nothing was linked to HubSpot yet, so the first run where these appear is the headline.
- **Contentsquare** (native connector, project 921964, Radium): homepage bounce and scroll rate, home-to-pricing rate, and whether any conversion goals have been configured yet.
- **Google Ads** (customer 529-156-7552): Try google-ads-mcp tools. If unavailable, say so in the digest and never guess the figures.
- **LinkedIn Ads:** Try linkedin-ads MCP. If unavailable, say so.

---

## STEP 3 — PULL AND ANALYZE TODAY'S FIREFLIES MEETINGS

Leo runs a creative agency (Runaway Studio) and also works on Radium, so he has meetings across many clients. **Filter carefully.**

Use the Fireflies tools to find meetings dated today. For each, check the title, participants, and summary for Radium relevance before digging deeper — skip anything clearly about another client. For Radium-relevant meetings, pull the summary and action items, and the transcript itself if the summary is too thin to tell what was decided.

Look for:
- Tasks completed (evidence to tick done in Step 4).
- Blockers appearing or resolving.
- Decisions that change scope or assignee.
- Concrete new action items (evidence to create tasks in Step 4).
- Anything that justifies a priority change.

If Fireflies returns zero meetings, or none are Radium-relevant, say so plainly in the digest and skip to Step 4.

---

## STEP 4 — APPLY UPDATES

If you successfully read the dashboard state AND an MCP is working:

Apply only the changes justified by Step 3, strictly following the Cardinal Rule. Keep every change minimal and traceable to a specific piece of evidence. Do not change the board based on Step 2 numbers alone.

### Preferred path: radium-command-center/create_task
- Use `create_task(milestoneId, title, assignee, priority, dueDate, tags)` for new tasks.
- Tasks land in the "Claude Inbox" epic under that milestone.
- Safer than manual JSON editing — the MCP server handles ID generation and JSON formatting.

### Fallback path: filesystem MCP
If you need to edit existing tasks (tick done, change priority, add/remove blocked tag, append description):
- Read → edit → write `dashboard-data.json`.
- To tick done: set `completed: true`.
- To reassign priority: change `priority` to "low", "medium", or "high".
- To add/remove "blocked": update the `tags` array.
- To append context: add a dated line to the `description` string.
- After any edit, update `lastUpdated` to today's date.

### If all MCPs are blocked (normal for cloud scheduled runs)
Write a Python patch script to the repo root instead. A local watcher on Leo's machine polls for these and auto-executes them within ~30 seconds of Drive sync.

**Patch script requirements:**
- **Filename:** `apply-YYYY-MM-DD.py` (e.g. `apply-2026-09-03.py`)
- **Location:** repo root
- **Flag:** Must support `--write` (dry-run without it, applies with it)
- **Idempotency:** Skip already-applied changes so it is safe to run twice
- **Backup:** Back up `dashboard-data.json` to `.bak` before modifying
- **Digest:** Print every change made, every skip, and a summary at the end
- **Verification:** SHA256 the final JSON and print it so Leo can diff-check

The script should perform the same surgical edits you would make via MCP: tick done, add/remove "blocked", append dated notes, change priority, and add new tasks in the correct epic. Use task IDs to anchor new tasks to existing epics (locate the epic by searching for a known anchor task ID, never by epic name).

---

## STEP 5 — VERIFY (only if you wrote changes)

Read back `dashboard-data.json` to confirm changes landed cleanly and nothing else moved. If you used `create_task`, call `list_epics` for that milestone to confirm the new task appears. If you made zero changes, skip this step.

---

## THEN REPORT

A digest structured as follows:

### 1. HEADLINE
The single most important thing that happened today (one sentence).

### 2. NUMBERS
One line each for any Step 2 metrics that moved or are newly available. Skip sources that failed.

### 3. MEETINGS
How many Radium-relevant meetings reviewed and what came out. One line each for: tasks ticked done, blockers added/removed, new tasks created, priority changes justified.

### 4. CHANGES MADE
Bulleted list of every change you wrote to the JSON or via `create_task`, with the evidence that justified it.

### 5. PRIORITY REASSIGNMENTS
Bulleted list of any priority changes with the reasoning.

### 6. WHAT TO DO NEXT
Ranked list of the top 3–5 actions Leo should take tomorrow. Be specific: name the task ID or epic, say why it matters now, and note any dependency or blocker.

### 7. SOURCES UNREACHABLE
Name any MCP or native connector that failed.

**If you wrote a patch script** (no MCP access): Add a "PATCH DELIVERED" section confirming:
- Filename and whether `create_file` reported success
- Byte size of the script
- SHA256 of the final script
- Expected execution time: the local watcher will pick it up within ~30 seconds of Drive sync and auto-apply it

**If filesystem was blocked:** Replace sections 4–5 with a structured "Suggested changes" section listing each proposed edit so Leo can apply it manually.

---

**Context:** The goal is a readable PLG signal by 15 September — measurement, real signups, and a live feedback loop, in that order.

