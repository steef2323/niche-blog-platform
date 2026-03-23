#!/usr/bin/env bash
# Preflight before pushing to main / relying on Vercel production deploy.
# Run from repo root: ./scripts/paperclip-release-preflight.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${PAPERCLIP_DEPLOY_FROZEN:-0}" == "1" ]]; then
  echo "[paperclip-release] PAPERCLIP_DEPLOY_FROZEN=1 — aborting."
  exit 1
fi

# Optional: restrict huge accidental diffs (override with ALLOW_LARGE_DIFF=1)
if [[ "${ALLOW_LARGE_DIFF:-0}" != "1" ]] && git rev-parse --verify origin/main >/dev/null 2>&1; then
  STAT=$(git diff --shortstat "origin/main...HEAD" 2>/dev/null || true)
  if [[ -n "$STAT" ]]; then
    FILES=$(echo "$STAT" | grep -oE '[0-9]+ file' | awk '{print $1}' || echo "0")
    if [[ "${FILES:-0}" -gt 40 ]]; then
      echo "[paperclip-release] Too many files changed ($FILES). Set ALLOW_LARGE_DIFF=1 to override."
      exit 1
    fi
  fi
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "[paperclip-release] npx not found. Add Node to PATH."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "[paperclip-release] git not found."
  exit 1
fi

echo "[paperclip-release] Linking Vercel project (if needed)…"
npx vercel link --yes --project niche-test-new >/dev/null

echo "[paperclip-release] Pulling production env to .env.local (required for Next build)…"
npx vercel env pull .env.local --yes --environment production

echo "[paperclip-release] npm ci…"
npm ci

echo "[paperclip-release] lint…"
npm run lint

echo "[paperclip-release] build…"
npm run build

echo "[paperclip-release] Preflight OK."
