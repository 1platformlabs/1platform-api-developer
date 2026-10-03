#!/usr/bin/env bash
# Portal-only adapter. The verified, unchanged Core activator is its backup.
set -euo pipefail
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
ROOT="${CPANEL_DEPLOY_ROOT:-$SCRIPT_ROOT}"
if [[ "$(cd "$ROOT" && pwd -P)" != "$SCRIPT_ROOT" ]]; then
  echo 'docs-health: rejected foreign deployment root'
  exit 1
fi
URL="$(head -n1 "$ROOT/.health_url" | tr -d '[:space:]')"
MARKER="$(head -n1 "$ROOT/.health_marker")"
if [[ "$URL" != 'https://developer-qa.1platform.pro/index.html' || -z "$MARKER" ]]; then
  echo 'docs-health: rejected URL or empty marker'
  exit 1
fi
URL_OVERRIDE=false; URL_MATCH=false; MARKER_OVERRIDE=false; MARKER_MATCH=false
[[ -n "${CPANEL_HEALTH_URL:-}" ]] && URL_OVERRIDE=true
[[ "${CPANEL_HEALTH_URL:-}" == "$URL" ]] && URL_MATCH=true
[[ -n "${CPANEL_HEALTH_MARKER:-}" ]] && MARKER_OVERRIDE=true
[[ "${CPANEL_HEALTH_MARKER:-}" == "$MARKER" ]] && MARKER_MATCH=true
echo "docs-health: source=docroot-files url_env_present=$URL_OVERRIDE url_env_matches_file=$URL_MATCH marker_env_present=$MARKER_OVERRIDE marker_env_matches_file=$MARKER_MATCH"
export CPANEL_DEPLOY_ROOT="$SCRIPT_ROOT"
export CPANEL_HEALTH_URL="$URL"
export CPANEL_HEALTH_MARKER="$MARKER"
exec bash "$SCRIPT_ROOT/bin/activate-core.fa5d955390006396e9070a4d653b83f3d9d5bc3536a4111b26d93f1b16524c83.sh"
