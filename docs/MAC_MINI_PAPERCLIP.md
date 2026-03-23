# Mac mini + Paperclip (autonomous deploy)

Execution host: Mac mini. Control UI: laptop browser to Paperclip on the Mac mini (or remote desktop).

## Paperclip agent (`claude_local`)

Set in Paperclip UI → agent configuration:

| Field | Value |
| --- | --- |
| **Working directory (`cwd`)** | `/Users/stefbrandman/Documents/niche-blog-platform` (use your Mac username if different) |
| **Env: `PATH`** | `/Users/stefbrandman/.local/bin:/usr/local/bin:/usr/bin:/bin` plus the directory containing `node`/`npx` if not system-wide (e.g. workspace Node: `.../Paperclip/.local/node-v22.22.1-darwin-arm64/bin`) |
| **Env: `HOME`** | Your macOS home (e.g. `/Users/yourname`) |

This repo uses SSH for GitHub (`git@github.com:steef2323/niche-blog-platform.git`). The Mac mini should have an SSH key added to GitHub with repo write access.

## Vercel on the Mac mini

1. One-time: `npx vercel login` (device flow).
2. One-time in repo root: `npx vercel link --yes --project niche-test-new` (creates local `.vercel/`, gitignored).
3. Before local `npm run build`, sync env (Airtable is required at build time):

   ```bash
   npx vercel env pull .env.local --yes --environment production
   ```

   `.env.local` is gitignored — never commit it.

Production URL for this project: `https://www.sipenpaints.nl` (Vercel project `niche-test-new`).

## Emergency stop

Set `PAPERCLIP_DEPLOY_FROZEN=1` in the environment (or export before running scripts). Preflight scripts exit immediately when this is set.
