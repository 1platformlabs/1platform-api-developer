#!/usr/bin/env bash
#
# check-contract-drift-self-test.sh — proves that check-contract-drift.sh
# actually discriminates.
#
# A guard nobody has watched fail is not a guard. Cloned from
# check-tells-self-test.sh, with the same discipline: for each category, inject
# that category's tell, run the guard, and require BOTH that it exits non-zero
# AND that the failure is attributed to the expected category. A mutation that
# trips some other rule proves nothing about the rule under test.
#
# It also runs the inverse cases, which matter just as much here: a
# contract-drift gate that rejects a legitimate curl, or a page that documents
# the shape of the envelope, is a gate someone switches off after the second
# time it blocks a good PR. Those are `expect_clean`.
#
# ── Why the fixture is synthetic, not a copy of docs/ ────────────────────────
#
# The first version of this script copied the repo's real docs/ tree. That makes
# every `expect_clean` case a hostage to whatever else happens to be in the tree:
# during the migration that removed the 23 legacy flow pages, the clean cases all
# failed on pre-existing violations in files the case never touched, telling us
# nothing about the rule under test. The guard's job on the real tree is
# `pnpm check:contract`; this script's job is the guard itself, so it builds the
# smallest tree that exercises each rule and nothing else.
#
#     pnpm check:contract:self-test
#
# Exits non-zero if any case does not behave as declared.

set -uo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; DIM=$'\033[2m'; RESET=$'\033[0m'
FAILURES=0
CASE_N=0

TMPROOT=$(mktemp -d)
trap 'rm -rf "$TMPROOT"' EXIT

JOURNEY_DIR="docs/saas/1platform-api/journeys"
REFERENCE_DIR="docs/saas/1platform-api/reference"
SUBJECT="$JOURNEY_DIR/_selftest.mdx"

# fixture — the smallest tree the guard can run against.
#
# Five clean .mdx files (the D-7 preflight requires a real surface), the real
# spec (citations are checked against it), and the guard itself.
fixture() {
  local work="$TMPROOT/case-$((++CASE_N))"
  mkdir -p "$work/$JOURNEY_DIR" "$work/$REFERENCE_DIR" "$work/scripts" "$work/static/openapi"

  cp "$REPO/scripts/check-contract-drift.sh" "$work/scripts/"
  cp "$REPO/static/openapi/1platform-api.json" "$work/static/openapi/"

  local i
  for i in 1 2 3 4 5; do
    printf -- '---\ntitle: filler %s\n---\n\nProsa que enlaza a la referencia y no copia nada.\n' \
      "$i" > "$work/$JOURNEY_DIR/filler-$i.mdx"
  done

  printf '%s' "$work"
}

# expect_caught <category-substring> <description> <mutation-shell>
expect_caught() {
  local category="$1" description="$2" mutation="$3"
  local work; work=$(fixture)

  ( cd "$work" && eval "$mutation" ) || {
    printf '%sERROR%s %s — mutation itself failed to apply\n' "$RED" "$RESET" "$description"
    FAILURES=$((FAILURES + 1))
    return
  }

  local output status
  output=$(cd "$work" && ./scripts/check-contract-drift.sh 2>&1)
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
    printf '%s\n' "$output" | sed 's/^/        /'
    FAILURES=$((FAILURES + 1))
    return
  fi

  printf '%sok%s    %s\n' "$GREEN" "$RESET" "$description"
}

# expect_clean <description> <mutation-shell>
#
# The inverse control: legitimate content must NOT trip the guard.
expect_clean() {
  local description="$1" mutation="$2"
  local work; work=$(fixture)

  ( cd "$work" && eval "$mutation" ) || {
    printf '%sERROR%s %s — mutation itself failed to apply\n' "$RED" "$RESET" "$description"
    FAILURES=$((FAILURES + 1))
    return
  }

  local output status
  output=$(cd "$work" && ./scripts/check-contract-drift.sh 2>&1)
  status=$?

  if [ "$status" -ne 0 ]; then
    printf '%sFAIL%s  %s\n' "$RED" "$RESET" "$description"
    printf '%s      guard rejected legitimate content — it has a false positive%s\n' "$DIM" "$RESET"
    printf '%s\n' "$output" | sed 's/^/        /'
    FAILURES=$((FAILURES + 1))
    return
  fi

  printf '%sok%s    %s\n' "$GREEN" "$RESET" "$description"
}

# Heredocs keep the fixtures readable; quoting the delimiter stops the shell
# from touching $VARIABLES inside the sample content.
write_subject() { cat > "$SUBJECT"; }

printf '\n%s— the guard must catch these —%s\n' "$DIM" "$RESET"

expect_caught "response body pasted" \
  "a response envelope pasted into a journey" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

Respuesta:

\`\`\`json
{ \"success\": true, \"data\": { \"id\": \"x\" }, \"msg\": \"OK\" }
\`\`\`
EOF"

expect_caught "response body pasted" \
  "a schema body of 3+ fields pasted into a journey" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

Respuesta:

\`\`\`json
{ \"id\": \"a\", \"status\": \"paid\", \"amount\": 10, \"currency\": \"USD\" }
\`\`\`
EOF"

# The same payload, hidden in a non-json fence. An implementation that only
# looks at \`\`\`json misses this — and this repo already carries the webhook
# payload written out inside python/ts/php fences.
expect_caught "response body pasted" \
  "the same body hidden in a python fence" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

Ejemplo:

\`\`\`python
payload = { \"success\": True, \"data\": {}, \"msg\": \"OK\" }
\`\`\`
EOF"

expect_caught "cited operation exists" \
  "an operation that is not in the spec" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

Llama a \`GET /api/v1/posts/content/{id}\` para leerlo.
EOF"

# The citation form used across reference/ and the webhook pages omits /api/v1.
# A rule anchored to the literal prefix would never see this one.
expect_caught "cited operation exists" \
  "a bogus operation cited WITHOUT the /api/v1 prefix" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

Llama a \`POST /totally/not/an/endpoint\` primero.
EOF"

expect_caught "schema field tables" \
  "a schema field table retyped in Markdown" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

| Campo | Tipo | Requerido |
|---|---|---|
| name | string | Sí |
EOF"

# D-7 generalised: the defect that retired check-provider-leak.mjs — a gate whose
# subject was deleted printed a green tick and exited 0.
expect_caught "scan surface is empty" \
  "an empty scan surface fails instead of passing quietly" \
  "find docs -name '*.mdx' -delete"

printf '\n%s— the guard must NOT catch these —%s\n' "$DIM" "$RESET"

expect_clean "a legitimate curl carrying a request body" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

\`\`\`bash
curl -X POST \"\$BASE_URL/users/transactions\" \\
  -H \"Authorization: Bearer \$APP_TOKEN\" \\
  -d '{\"amount\": 10, \"currency\": \"USD\", \"description\": \"x\"}'
\`\`\`
EOF"

expect_clean "operations that ARE in the spec, cited without the prefix" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

Primero \`POST /auth/token\`, después \`POST /users/token\`.
EOF"

expect_clean "a prose comparison table that is not a schema" \
  "$(declare -f write_subject); write_subject <<'EOF'
---
title: t
---

| Capacidad | Dónde vive | Nota |
|---|---|---|
| Dominios | Referencia | CRUD |
EOF"

# The path exemption (notes 5 in the guard). Without it these fail on day one —
# and neither is a page this epic even edits.
expect_clean "reference/response-format.mdx may document the envelope itself" \
  "$(declare -f write_subject); rm -f $SUBJECT; cat > $REFERENCE_DIR/response-format.mdx <<'EOF'
---
title: Formato de respuesta
---

\`\`\`json
{ \"success\": true, \"data\": {}, \"msg\": \"OK\" }
\`\`\`
EOF"

expect_clean "reference/webhooks-payload.mdx may carry the outbound body" \
  "$(declare -f write_subject); rm -f $SUBJECT; cat > $REFERENCE_DIR/webhooks-payload.mdx <<'EOF'
---
title: Webhooks — payload saliente
---

\`\`\`json
{ \"event\": \"on_approved\", \"transaction_id\": \"x\", \"status\": \"approved\", \"amount\": 78.0 }
\`\`\`
EOF"

echo
if [ "$FAILURES" -ne 0 ]; then
  printf '%sSelf-test failed:%s %s case(s) did not behave as declared.\n' "$RED" "$RESET" "$FAILURES"
  exit 1
fi
printf '%sSelf-test passed.%s Every category fails on its own tell and passes on legitimate content.\n' "$GREEN" "$RESET"
