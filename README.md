# Radium Command Center

A React + Vite dashboard for tracking milestones, tasks, hiring, marketing stats, and sales opportunities.

## Quick start

```bash
# Install dependencies
npm install

# Start the dev server (port 5173)
npm run dev

# Build for production
npm run build
```

## Environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `FIREFLIES_API_KEY` | Fireflies meeting transcription sync |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot CRM sync |
| `VITE_LINKEDIN_CLIENT_ID` | LinkedIn OAuth (client-side) |
| `VITE_LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth (client-side) |

## Key scripts

| Script | What it does |
|--------|--------------|
| `npm run sync:fireflies` | Pull latest meeting transcripts from Fireflies |
| `npm run sync:hubspot` | Sync HubSpot contacts & engagements |
| `npm run sync:daily` | Run all daily syncs (Fireflies + HubSpot) |
| `npm run watch:patches` | Watch for patch files and auto-apply them |
| `npm run mcp` | Start the local MCP server |

## Project structure

```
src/
  App.tsx              # Main dashboard shell
  components/          # React components (tabs, cards, modals)
  contexts/            # ThemeContext
  data/                # Static data (milestones, hiring roles, opportunities)
  hooks/               # useDashboardState
  types/               # TypeScript interfaces
  utils/               # linkedinAuth helpers
public/data/           # Dashboard JSON (live data + backups)
scripts/               # Sync scripts, batch tasks, MCP server
```

## Notes

- Dashboard data lives in `public/data/dashboard-data.json`. The dev server exposes `POST /api/save-dashboard` to persist edits made in the UI.
- Patch files dropped in `scripts/` are picked up by `watch-patches` and applied automatically.
- The repo auto-pushes uncommitted changes every hour via `scripts/auto-push.sh`.
