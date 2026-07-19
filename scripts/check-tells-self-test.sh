#!/usr/bin/env bash
#
# check-tells-self-test.sh — proves that check-tells.sh actually discriminates.
#
# A guard nobody has watched fail is not a guard. The website's version of this
# script passed green for weeks with a lost exit code in a subshell, and later
# with a regex whose noun list was too short to match the phrasing that was
# actually in the copy. Both were invisible precisely because the guard was only
# ever run against a clean tree, where "ok" and "broken" look identical.
#
# So: for each category, copy the repo to a temp dir, inject that category's
# tell, run the guard, and require BOTH that it exits non-zero AND that the
# failure is attributed to the expected category. A mutation that trips some
# other rule proves nothing about the rule under test.
#
#     pnpm check:tells:self-test
#
# Exits non-zero if any category fails to detect its own tell.

set -uo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; DIM=$'\033[2m'; RESET=$'\033[0m'
FAILURES=0

TMPROOT=$(mktemp -d)
trap 'rm -rf "$TMPROOT"' EXIT

# expect_caught <category-substring> <description> <mutation-shell>
#
# The mutation runs with CWD at a throwaway copy of the repo.
expect_caught() {
  local category="$1" description="$2" mutation="$3"
  local work="$TMPROOT/case-$((++CASE_N))"

  mkdir -p "$work"
  # Copy only what the guard reads. Cheap, and keeps each case isolated.
  ( cd "$REPO" && tar cf - src docs scripts static/fonts docusaurus.config.ts sidebars.ts ) \
    | ( cd "$work" && tar xf - )

  ( cd "$work" && eval "$mutation" ) || {
    printf '%sERROR%s %s — mutation itself failed to apply\n' "$RED" "$RESET" "$description"
    FAILURES=$((FAILURES + 1))
    return
  }

  local output status
  output=$(cd "$work" && ./scripts/check-tells.sh 2>&1)
  status=$?

  if [ "$status" -eq 0 ]; then
    printf '%sFAIL%s  %s\n' "$RED" "$RESET" "$description"
    printf '%s      guard exited 0 with the tell present — this category does NOT protect%s\n' "$DIM" "$RESET"
    FAILURES=$((FAILURES + 1))
    return
  fi

  if ! printf '%s' "$output" | grep -q "FAIL.*$category"; then
    printf '%sFAIL%s  %s\n' "$RED" "$RESET" "$description"
    printf '%s      guard failed, but not on "%s" — something else caught it%s\n' "$DIM" "$category" "$RESET"
    FAILURES=$((FAILURES + 1))
    return
  fi

  printf '%sok%s    %s\n' "$GREEN" "$RESET" "$description"
}

CASE_N=0

printf 'Injecting one tell per category into a throwaway copy of the tree.\n\n'

expect_caught "emoji or entity glyphs" \
  "emoji as a category icon" \
  "perl -CSD -i -pe 's/\"icon\": \"dashboard\"/\"icon\": \"\x{1F9ED}\"/' docs/products/dashboard/_category_.json"

expect_caught "emoji or entity glyphs" \
  "emoji hidden as an HTML entity" \
  "printf 'export const x = \"&#128640;\";\n' >> src/components/Icon/icons.ts"

expect_caught "hardcoded brand colours" \
  "a palette hex in a module stylesheet" \
  "printf '.leak { color: #2563eb; }\n' >> src/components/HomeCards/styles.module.css"

expect_caught "retired palette as rgba" \
  "the old accent as an rgba triplet" \
  "printf '.leak { box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }\n' >> src/components/HomeCards/styles.module.css"

expect_caught "literal value" \
  "an --ifm-* colour given a hex" \
  "printf ':root {\n  --ifm-background-color: #f8fafc;\n}\n' >> src/css/custom.css"

expect_caught "literal value" \
  "an --ifm-* colour given a hex, written inline on one line" \
  "printf ':root { --ifm-navbar-background-color: #f1f5f9; }\n' >> src/css/custom.css"

expect_caught "var(--token, #fallback)" \
  "a token with a hex fallback" \
  "printf '.leak { color: var(--color-text, #0f172a); }\n' >> src/components/HomeCards/styles.module.css"

expect_caught "unreachable dark-mode" \
  "dark-mode CSS creeping back" \
  "printf \"[data-theme='dark'] .leak { color: var(--color-text); }\n\" >> src/css/custom.css"

expect_caught "retired template kit" \
  "transition: all" \
  "printf '.leak { transition: all 0.2s ease; }\n' >> src/components/HomeCards/styles.module.css"

expect_caught "retired template kit" \
  "frosted glass returning to the navbar" \
  "printf '.leak { backdrop-filter: saturate(180%%) blur(12px); }\n' >> src/css/custom.css"

expect_caught "retired template kit" \
  "a hover lift" \
  "printf '.leak:hover { transform: translateY(-2px); }\n' >> src/components/HomeCards/styles.module.css"

expect_caught "decorative gradients" \
  "a decorative gradient" \
  "printf '.leak { background: linear-gradient(135deg, var(--cobalt), var(--signal)); }\n' >> src/components/HomeCards/styles.module.css"

expect_caught "pastel product tiles" \
  "a pastel tint class" \
  "printf '.tint_blue { background: var(--cobalt-wash); }\n' >> src/theme/DocSidebarItem/Category/styles.module.css"

expect_caught "pastel product tiles" \
  "customProps.tint returning to a category config" \
  "perl -i -pe 's/(\"icon\": \"dashboard\")/\$1, \"tint\": \"blue\"/' docs/products/dashboard/_category_.json"

expect_caught "fonts are self-hosted" \
  "a font file going missing while its @font-face stays" \
  "rm static/fonts/inter-latin-400-normal.woff2"

expect_caught "fonts are self-hosted" \
  "the OFL licence not travelling with the files" \
  "rm static/fonts/LICENSE-inter.txt"

expect_caught "fonts are self-hosted" \
  "the preload tags being dropped" \
  "perl -i -pe \"s/rel: 'preload'/rel: 'prefetch'/g\" docusaurus.config.ts"

expect_caught "third-party font requests" \
  "a Google Fonts @import returning" \
  "perl -i -pe \"s|^/\\*\\*|\\@import url('https://fonts.googleapis.com/css2?family=Inter');\\n/**|\" src/css/custom.css"

expect_caught "external provider names" \
  "a provider named in the chrome" \
  "printf 'export const paymentProvider = \"Stripe\";\n' >> src/components/Icon/icons.ts"

# ── Control: the guard must be sensitive to comments in the RIGHT direction ──
# Documentation that names a retired pattern must NOT be a finding, or the guard
# becomes something people silence instead of fix.
CONTROL="$TMPROOT/control"
mkdir -p "$CONTROL"
( cd "$REPO" && tar cf - src docs scripts static/fonts docusaurus.config.ts sidebars.ts ) \
  | ( cd "$CONTROL" && tar xf - )
printf '/* We removed transition: all and backdrop-filter: saturate() here. */\n' \
  >> "$CONTROL/src/css/custom.css"
printf '/* Do not reintroduce #2563eb or rgba(37, 99, 235, 0.25). */\n' \
  >> "$CONTROL/src/css/custom.css"
if ( cd "$CONTROL" && ./scripts/check-tells.sh >/dev/null 2>&1 ); then
  printf '%sok%s    a comment naming a retired pattern is not a finding\n' "$GREEN" "$RESET"
else
  printf '%sFAIL%s  a comment naming a retired pattern was reported as a finding\n' "$RED" "$RESET"
  printf '%s      the guard would push people to stop documenting their decisions%s\n' "$DIM" "$RESET"
  FAILURES=$((FAILURES + 1))
fi

echo
if [ "$FAILURES" -ne 0 ]; then
  printf '%s%s categor%s failed to detect its own tell.%s\n' \
    "$RED" "$FAILURES" "$([ "$FAILURES" -eq 1 ] && echo y || echo ies)" "$RESET"
  exit 1
fi
printf '%sEvery category detects its own tell, and documentation stays allowed.%s\n' "$GREEN" "$RESET"
