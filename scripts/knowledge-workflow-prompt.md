# Claude Knowledge Base Workflow

**Goal:** Save important strategy docs, meeting notes, research, and decisions directly from Claude conversations into the Radium Command Center knowledge base.

## Trigger Phrases

When Leo says any of these, treat it as a request to save to the knowledge base:
- "save this to the knowledge base"
- "add this to the kb"
- "remember this"
- "document this decision"
- "add to knowledge base"

## Workflow

1. **Determine content worth saving.** If the conversation contains:
   - A strategic decision or rationale
   - A prioritized list or action plan
   - Research findings or competitive analysis
   - Meeting notes with clear next steps
   - A definition of a key metric or term
   → It should be saved.

2. **Determine the best `source` value:**
   | Source | Use When |
   |--------|----------|
   | `claude` | Default. Strategy/planning generated in this conversation. |
   | `fireflies` | Meeting transcript (include `sourceUrl` with Fireflies link). |
   | `manual` | Leo explicitly typed or pasted content. |
   | `hubspot` | Content from HubSpot (pipeline notes, deal context). |
   | `linkedin` | LinkedIn post or campaign analysis. |
   | `google-ads` | Google Ads audit or performance notes. |
   | `contentsquare` | Analytics findings from Contentsquare. |

3. **Call `add_knowledge_doc` MCP tool.** Required fields:
   - `title`: Concise, searchable title
   - `content`: Full markdown body (clean up formatting, summarize if very long)
   - `source`: One of the above
   - `tags`: 2–5 relevant tags (e.g., `["strategy", "pricing", "september-goal"]`)
   - `linkedMilestoneIds`: Array of milestone IDs this doc is relevant to
   - `linkedEpicIds`: Array of epic IDs (optional but useful)
   - `author`: Usually "Claude" or Leo's name

4. **Prefer linking broadly over narrowly.** If a doc touches on distribution strategy, link it to `ms-01` (Distribution Strength), `ms-02` (Analytics), and `ms-03` (Accompany Customers). A doc that only applies to Google Ads should only link to the relevant milestone(s).

5. **Confirm successfully saved.** Tell Leo: "Saved to KB as kd-XXX. Linked to [milestones]."

6. **If a doc becomes relevant to new work later**, call `link_knowledge_doc` to update its links without rewriting the content.

## Example Call

```json
{
  "tool": "add_knowledge_doc",
  "arguments": {
    "title": "Pricing Strategy — Remove Freemium, Land at $120–160/mo",
    "content": "# Pricing Strategy Decision\n\n## Decision\nRemove freemium tier. Land pricing at $120–160/mo to signal premium value.\n\n## Rationale\n- Current $60/mo creates support burden from users who never convert\n- Competitor analysis shows mid-market landing at $140 average\n- PLG funnel data: users who pay within 7 days have 4× LTV\n\n## Open Questions\n- Whether to grandfather existing $60 users (Leo: discuss with finance)\n- How to position the "Teams" vs "Business" tier split\n\n## Next Step\nProposal draft by end of week.",
    "source": "claude",
    "tags": ["pricing", "strategy", "monetization"],
    "linkedMilestoneIds": ["ms-03", "ms-08"],
    "linkedEpicIds": ["ep-03-1"],
    "author": "Claude"
  }
}
```

## File Layout

- Index: `public/data/knowledge/index.json` (auto-maintained by MCP tools)
- Markdown files: `public/data/knowledge/docs/YYYY-MM-DD-slug.md` (auto-created by MCP tools)

Both are in Google Drive and will sync across devices.

## Retrieving Knowledge

When Leo asks questions like:
- "What did we decide about pricing?"
- "Find the meeting notes from the Google Ads call"
- "What was the analytics setup plan?"

Call `list_knowledge_docs` with filters:
- `tag`: to find by topic
- `milestoneId`: to find by pillar area

Then summarize the relevant doc(s) for Leo.
