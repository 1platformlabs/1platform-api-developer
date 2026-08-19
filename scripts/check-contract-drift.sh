#!/usr/bin/env bash
#
# check-contract-drift.sh — keeps the prose from copying the API contract.
#
# The contract (request/response bodies, field types, error codes) lives in
# exactly one place: static/openapi/*.json, which the deploy pipeline
# re-downloads from PROD on every run. That copy cannot go stale. A hand-written
# copy in the prose can, and did — PRs #34, #35 and #36 landed in a single month,
# each fixing a page that said the opposite of what the API does.
#
#     pnpm check:contract             # run the guard
#     pnpm check:contract:self-test   # prove every category still fails on its tell
#
# Exits non-zero if any category has findings.
#
# ── Why this is built the way it is ──────────────────────────────────────────
#
# Cloned from check-tells.sh, preserving the two properties that script earned
# from real false greens:
#
#   1. Matches reach `report` as an ARGUMENT, never through a pipe. `... | report`
#      runs the function in a SUBSHELL, where FAILED=1 is lost — the script
#      prints FAIL and still exits 0.
#   2. A tool that cannot run is a hard error, never a quiet pass. BSD grep has
#      no -P, and on a developer machine `grep` may actually be ugrep, so ALL
#      scanning goes through perl.
#
# Four more decisions come from an adversarial review of this design, before a
# line of it existed. Each one is a false positive or false negative that the
# obvious implementation would have shipped:
#
#   3. The scan surface is DISCOVERED (`find docs -name '*.mdx'`), never a
#      hardcoded directory list. A list written today goes blind to whatever
#      subtree gets added tomorrow — and journeys/ is exactly where the pressure
#      to paste a response body is highest.
#   4. Endpoint citations are normalised before they are checked against the
#      spec. Most citations under reference/ and the webhook pages omit the
#      /api/v1 prefix (`POST /users/transactions`, `GET /webhooks/config/`),
#      because BASE_URL already carries it. A rule anchored to a literal
#      /api/v1 sees none of them — it would go blind to the very subtree where
#      PR #35's drift happened.
#   5. Three pages are exempt BY PATH, because they teach the SHAPE of the
#      contract rather than one endpoint's answer, and there is nowhere else for
#      them to live. Without this, response-format.mdx — a page this epic never
#      touches — fails the build on day one.
#   6. The schema-table rule requires all THREE header words. Anchoring on
#      "Campo" alone matches reference/glossary.mdx, an ID-format table that is
#      prose, not a schema.

set -uo pipefail
cd "$(dirname "$0")/.."

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; DIM=$'\033[2m'; RESET=$'\033[0m'
FAILED=0

# A check that cannot run must fail loudly, never pass quietly.
command -v perl >/dev/null 2>&1 || {
  printf '%sFAIL%s  preflight: perl is required for every scan in this script\n' "$RED" "$RESET"
  exit 1
}
command -v python3 >/dev/null 2>&1 || {
  printf '%sFAIL%s  preflight: python3 is required to read the OpenAPI spec\n' "$RED" "$RESET"
  exit 1
}

# The portal documents TWO products, each with its own spec, and the deploy
# pipeline downloads both. Judging one product's prose against the other's
# contract is not a stricter check — it is a WRONG one: it invents findings for
# operations that do exist (measured: 5 of 6 Atlas citations flagged this way),
# and it can never validate the product it is not holding. Atlas is standalone
# and must never be resolved against the 1Platform contract.
SPEC="static/openapi/1platform-api.json"
SPEC_ATLAS="static/openapi/atlas-api.json"
for s in "$SPEC" "$SPEC_ATLAS"; do
  [ -f "$s" ] || {
    printf '%sFAIL%s  preflight: %s is missing — nothing to check citations against\n' "$RED" "$RESET" "$s"
    exit 1
  }
done

# Pages that teach the SHAPE of the contract, not one endpoint's answer. See
# note 5 above. Keep this list short and justified; every entry is a hole.
#
#   response-format / error-codes  — the envelope and the error catalogue are
#     what these pages exist to document.
#   webhooks-payload               — an OUTBOUND webhook body has no operation
#     in the spec at all: OpenAPI describes calls a client makes, and here the
#     caller is our server calling yours. There is no other home for it.
EXEMPT_RE='docs/saas/1platform-api/reference/(response-format|error-codes|webhooks-payload)\.mdx$'

# Discovered, never hardcoded (note 3).
DOC_FILES=$(find docs -name '*.mdx' 2>/dev/null | sort)
SCAN_FILES=$(printf '%s\n' "$DOC_FILES" | grep -vE "$EXEMPT_RE" || true)

# Rule 1 (a response body pasted into the prose) is the rule the `journeys/`
# rewrite was built to satisfy, and it is enforced over every page of the tree
# this epic reworked — including any file added later, since the surface is
# discovered, not listed. The Atlas tree has NOT been rewritten to it: 20 of its
# pages still paste a body, so enforcing it there today would fail every future
# PR on prose no one in this epic wrote or reviewed. That is a scope boundary,
# not an exemption — rule 2 (a citation naming an operation that does not exist)
# still covers the Atlas pages, against the Atlas spec.
#
# When the Atlas tree gets the same treatment, delete this and the count below.
BODY_SCOPE_OUT_RE='^docs/saas/atlas-api/'
BODY_FILES=$(printf '%s\n' "$SCAN_FILES" | grep -vE "$BODY_SCOPE_OUT_RE" || true)
body_skipped=$(printf '%s\n' "$SCAN_FILES" | grep -cE "$BODY_SCOPE_OUT_RE" || true)

# ── D-7: a check with nothing to check must fail, not pass ───────────────────
# This is the defect that retired check-provider-leak.mjs: once its subject was
# deleted it scanned zero files and printed a green tick. Generalised here so the
# class cannot recur.
doc_count=$(printf '%s\n' "$DOC_FILES" | grep -c . || true)
if [ "${doc_count:-0}" -lt 5 ]; then
  printf '%sFAIL%s  preflight: only %s .mdx files found under docs/ — the scan surface is empty or broken\n' \
    "$RED" "$RESET" "${doc_count:-0}"
  printf '%s      a gate that inspects nothing must fail loudly, never pass quietly%s\n' "$DIM" "$RESET"
  exit 1
fi

# report <name> <why> <matches>
report() {
  local name="$1" why="$2" matches="$3"
  if [ -n "$matches" ]; then
    printf '%sFAIL%s  %s\n' "$RED" "$RESET" "$name"
    printf '%s      %s%s\n' "$DIM" "$why" "$RESET"
    printf '%s\n' "$matches" | sed 's/^/        /'
    FAILED=1
  else
    printf '%sok%s    %s\n' "$GREEN" "$RESET" "$name"
  fi
}

# ── 1. An endpoint response body pasted into the prose ───────────────────────
# Scans the contents of EVERY fenced block, not just ```json (note: the same
# payload already appears in this repo inside python/ts/php fences). A block is
# a finding when it carries the response envelope, or when it looks like a
# schema body — an object of three or more "key": value pairs.
#
# A request body sent with curl is legitimate and stays: the rule only fires on
# a block that is not part of a shell command.
# shellcheck disable=SC2086
m=$(perl -e '
  use open ":std", ":encoding(UTF-8)";
  no warnings "utf8";
  for my $file (@ARGV) {
    open my $fh, "<:encoding(UTF-8)", $file or next;
    my ($in_fence, $fence_start, $buf, $lang) = (0, 0, "", "");
    my $ln = 0;
    while (my $line = <$fh>) {
      $ln++;
      if (!$in_fence && $line =~ /^\s*```+\s*([A-Za-z0-9_-]*)/) {
        ($in_fence, $fence_start, $buf, $lang) = (1, $ln, "", lc($1 // ""));
        next;
      }
      if ($in_fence && $line =~ /^\s*```+\s*$/) {
        $in_fence = 0;
        # A shell block is a request being sent, not a contract being restated.
        next if $lang =~ /^(bash|sh|shell|console|zsh)$/;
        next if $buf =~ /\bcurl\b/;
        my $envelope = ($buf =~ /"success"\s*:/ && $buf =~ /"data"\s*:/)
                    || ($buf =~ /"success"\s*:/ && $buf =~ /"msg"\s*:/);
        my $fields = () = $buf =~ /"[A-Za-z_][A-Za-z0-9_]*"\s*:/g;
        if ($envelope || $fields >= 3) {
          my $why = $envelope ? "response envelope" : "$fields schema fields";
          print "$file:$fence_start: fenced block (${lang}) restates the contract ($why)\n";
        }
        next;
      }
      $buf .= $line if $in_fence;
    }
    close $fh;
  }
' -- $BODY_FILES)
report "no endpoint response body pasted into the prose" \
       "the body lives in the OpenAPI reference; name the field the next step needs and link" "$m"

# ── 2. A cited operation that does not exist in the spec ─────────────────────
# Citations are normalised (note 4): `POST /users/transactions` and
# `POST /api/v1/users/transactions` are the same operation, and both forms are
# in use. Path parameters are normalised too — {id} and {invoice_id} are the
# same slot to the spec.
m=$(python3 - "$SPEC" "$SPEC_ATLAS" $SCAN_FILES <<'PY'
import json, re, sys

spec_path, atlas_spec_path, files = sys.argv[1], sys.argv[2], sys.argv[3:]

METHODS = {"get", "post", "put", "patch", "delete", "head", "options"}


def norm(path: str) -> str:
    path = re.sub(r"\{[^}]*\}", "{}", path)
    path = path.rstrip("/")
    if not path.startswith("/api/v1"):
        path = "/api/v1" + ("" if path.startswith("/") else "/") + path
    return path


def operations(path: str) -> set:
    spec = json.load(open(path))
    return {
        (method.upper(), norm(raw))
        for raw, ops in spec.get("paths", {}).items()
        for method in ops
        if method.lower() in METHODS
    }


KNOWN = operations(spec_path)
KNOWN_ATLAS = operations(atlas_spec_path)


def spec_for(f: str):
    """A page is judged against the contract of the product it documents."""
    return (KNOWN_ATLAS, "the Atlas spec") if "/atlas-api/" in f else (KNOWN, "the spec")

# `METHOD /path` inside inline code — the form every page uses to cite one.
cite = re.compile(r"`(GET|POST|PUT|PATCH|DELETE)\s+(/[A-Za-z0-9/_{}.\-]*)`")

findings = []
for f in files:
    try:
        text = open(f, encoding="utf-8").read()
    except OSError:
        continue
    known, label = spec_for(f)
    for lineno, line in enumerate(text.splitlines(), 1):
        for method, path in cite.findall(line):
            if (method, norm(path)) not in known:
                findings.append(f"{f}:{lineno}: {method} {path} is not in {label}")

print("\n".join(findings))
PY
)
report "every cited operation exists in the spec" \
       "a citation the spec does not have is documentation of something that is not there" "$m"

# ── 3. A schema field table rebuilt in Markdown ──────────────────────────────
# Requires all three header words (note 6): `Campo` alone matches
# reference/glossary.mdx, which is an ID-format table, not a schema.
# shellcheck disable=SC2086
m=$(perl -e '
  use open ":std", ":encoding(UTF-8)";
  no warnings "utf8";
  for my $file (@ARGV) {
    open my $fh, "<:encoding(UTF-8)", $file or next;
    my $ln = 0;
    while (my $line = <$fh>) {
      $ln++;
      next unless $line =~ /^\s*\|/;
      my $h = lc $line;
      my $campo = $h =~ /\|\s*`?(?:campo|field|par[aá]metro|parameter)`?\s*\|/;
      my $tipo  = $h =~ /\|\s*`?(?:tipo|type)`?\s*\|/;
      my $req   = $h =~ /\|\s*`?(?:requerido|required|oblig)/;
      if ($campo && $tipo && $req) {
        print "$file:$ln: $line";
      }
    }
    close $fh;
  }
' -- $SCAN_FILES)
report "no schema field tables rebuilt in Markdown" \
       "field types and requiredness are generated from the spec, not retyped by hand" "$m"

echo
if [ "$FAILED" -ne 0 ]; then
  printf '%sContract-drift check failed.%s See the findings above.\n' "$RED" "$RESET"
  exit 1
fi
printf '%sAll contract-drift checks passed.%s (%s files scanned; %s outside the body rule)\n' \
  "$GREEN" "$RESET" "$(printf '%s\n' "$SCAN_FILES" | grep -c . || true)" "${body_skipped:-0}"
