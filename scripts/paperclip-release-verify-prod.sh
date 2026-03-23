#!/usr/bin/env bash
# After push to main, smoke-check production (adjust URL if your primary domain changes).
set -euo pipefail

URL="${PRODUCTION_URL:-https://www.sipenpaints.nl}"
echo "[paperclip-release] GET $URL …"
code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "$URL")
if [[ "$code" != "200" && "$code" != "304" ]]; then
  echo "[paperclip-release] Expected 200/304, got HTTP $code"
  exit 1
fi
echo "[paperclip-release] Production smoke check OK (HTTP $code)."
