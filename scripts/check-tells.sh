#!/usr/bin/env bash
#
# check-tells.sh — guards the docs portal against sliding back into the
# "AI template" patterns the design refinement removed.
#
# Adapted from 1platform-website/scripts/check-tells.sh. Every rule below traces
# to a tell that actually existed in this repo: emoji on pastel tiles in the
# sidebar, a palette declared in three places, a Google-CDN font import, and a
# dark theme nobody could reach.
#
#     pnpm check:tells             # run the guard
#     pnpm check:tells:self-test   # prove every category still fails on its tell
#
# Exits non-zero if any category has findings.
#
# ── Why this is built the way it is ──────────────────────────────────────────
#
# The website's version of this script shipped two false greens, and both are
# designed out here:
#
#   1. Matches reach `report` as an ARGUMENT, never through a pipe. `... | report`
#      runs the function in a SUBSHELL, where FAILED=1 is lost — the script
#      prints FAIL and still exits 0.
#   2. A tool that cannot run is a hard error, never a quiet pass. BSD grep has
#      no -P, and on a developer machine `grep` may actually be ugrep, so ALL
#      scanning goes through perl instead of depending on which grep is on PATH.
#
# Scanning through perl also buys correct comment handling. A line-prefix
# heuristic ("does the line start with /*") misses the continuation lines of a
# block comment, so the CSS comment explaining why `saturate()` was removed read
# as a live `saturate()`. `scan` blanks comment bodies while preserving line
# numbers, so documentation may freely name the patterns it removed.

set -uo pipefail
cd "$(dirname "$0")/.."

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; DIM=$'\033[2m'; RESET=$'\033[0m'
FAILED=0

# A check that cannot run must fail loudly, never pass quietly.
command -v perl >/dev/null 2>&1 || {
  printf '%sFAIL%s  preflight: perl is required for every scan in this script\n' "$RED" "$RESET"
  exit 1
}

# Source surfaces that must stay on-system. `docs/**` prose is content, not
# chrome, and is excluded — except the _category_.json files, which carry
# presentation. Provider names inside docs/** are the job of
# check-provider-leak.mjs, which exempts docs/saas/** deliberately.
SRC_DIRS="src"
CONFIG_FILES="docusaurus.config.ts sidebars.ts"

# shellcheck disable=SC2086
SRC_FILES=$(find $SRC_DIRS -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) 2>/dev/null | sort)
CATEGORY_FILES=$(find docs -name '_category_.json' 2>/dev/null | sort)

# scan <perl-regex> <files...>
#
# Prints `path:line: text` for every match outside a comment. Understands CSS/JS
# block comments (/* ... */, multi-line) and // line comments; JSON has neither,
# so it passes through untouched.
scan() {
  local re="$1"; shift
  [ "$#" -gt 0 ] || return 0
  perl -e '
    # The encoding layer is load-bearing, not tidiness. Read as bytes, and a
    # 4-byte UTF-8 emoji arrives as four separate latin-1 characters, none of
    # which can match \x{1F9ED} — the emoji rule then reports "ok" against a
    # file full of emoji. Verified: without this, injecting an emoji into a
    # _category_.json passes the guard.
    use open ":std", ":encoding(UTF-8)";
    no warnings "utf8";
    my $re = shift @ARGV;
    for my $file (@ARGV) {
      open my $fh, "<:encoding(UTF-8)", $file or next;
      my $in_block = 0;
      my $ln = 0;
      while (my $line = <$fh>) {
        $ln++;
        my $code = $line;
        # Blank out comment bodies, preserving the rest of the line.
        if ($in_block) {
          if ($code =~ s{^.*?\*/}{}s) { $in_block = 0; } else { $code = ""; }
        }
        $code =~ s{/\*.*?\*/}{}gs;
        if ($code =~ s{/\*.*$}{}s) { $in_block = 1; }
        $code =~ s{(^|\s)//.*$}{$1};
        $code =~ s{^\s*\*.*$}{};   # JSDoc continuation line
        next if $code =~ /^\s*$/;
        if ($code =~ /$re/) {
          print "$file:$ln: $line";
        }
      }
      close $fh;
    }
  ' -- "$re" "$@"
}

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

# shellcheck disable=SC2086
ALL_FILES="$SRC_FILES $CATEGORY_FILES $CONFIG_FILES"

# ── 1. Emoji and HTML entity glyphs standing in for icons ────────────────────
# Entities matter as much as raw emoji: on the website they hid as &#128640;
# and evaded a raw-emoji grep entirely. &#x27; (apostrophe) is not a glyph.
#
# The decimal range is {4,7}, not the {4,5} this rule was inherited with: the
# documented example &#128640; is SIX digits, so the original pattern could not
# match the very case its own comment cited.
#
# U+2500-257F (box drawing) is deliberately excluded — the section rules in
# these stylesheets are made of it.
# shellcheck disable=SC2086
m=$(scan '(?!&#x27;)(?:[\x{1F000}-\x{1FAFF}]|[\x{2190}-\x{24FF}]|[\x{2580}-\x{27BF}]|&#[0-9]{4,7};|&#x[0-9A-Fa-f]{4,6};)' $ALL_FILES)
report "no emoji or entity glyphs as icons" \
       "icons come from src/components/Icon; a _category_.json carries an IconName" "$m"

# ── 2. Palette colours as literals instead of tokens ─────────────────────────
# Neutral #fff/#000 shorthand inside authored SVG is tolerated; brand colours
# are not. src/css/custom.css IS the token layer, so it is exempt by design.
# `theme-color` is exempt too: an HTML meta attribute cannot reference a CSS
# variable, so that one literal is unavoidable — it is the only one.
# shellcheck disable=SC2086
m=$(scan '#[0-9a-fA-F]{6}' $SRC_FILES $CONFIG_FILES \
  | grep -v '^src/css/custom\.css:' \
  | grep -viE '#(ffffff|000000)\b' \
  | grep -v 'theme-color')
report "no hardcoded brand colours outside the token layer" \
       "colour decisions live in :root in src/css/custom.css, nowhere else" "$m"

# ── 3. The retired palette written as an rgba triplet ────────────────────────
# NOT redundant with rule 2. The primary button's hover glow survived every
# #hex sweep of this repo as `rgba(37, 99, 235, .25)` — the old accent, in a
# form no hex search can see.
# shellcheck disable=SC2086
m=$(scan 'rgba\(\s*(?:37,\s*99,\s*235|59,\s*130,\s*246|29,\s*78,\s*216|124,\s*58,\s*237|8,\s*145,\s*178|5,\s*150,\s*105|56,\s*189,\s*248|167,\s*139,\s*250|74,\s*222,\s*128|251,\s*146,\s*60|148,\s*163,\s*184|100,\s*116,\s*139)' \
  $SRC_FILES $CONFIG_FILES)
report "no retired palette as rgba triplets" \
       "the old accent hid from hex searches inside rgba()" "$m"

# ── 4. An --ifm-*/--scalar-* colour with a literal value ─────────────────────
# Infima and Scalar variables must MAP onto tokens. A literal here recreates the
# exact problem this epic removed: a second place where colour is decided.
# shellcheck disable=SC2086
# Not anchored to line start: a declaration written inline inside a `:root {...}`
# on one line would otherwise slip straight past.
m=$(scan '--(?:ifm|scalar)-[a-z0-9-]*(?:color|colour|background|bg|border)[a-z0-9-]*:\s*(?:#|rgb)' $SRC_FILES)
report "no --ifm-*/--scalar-* colour with a literal value" \
       "Infima and Scalar consume tokens; a literal here is drift waiting to happen" "$m"

# ── 5. Token fallbacks silently bypass the system ────────────────────────────
# shellcheck disable=SC2086
m=$(scan 'var\(--[a-zA-Z0-9-]+,\s*(?:#|rgb)' $SRC_FILES $CONFIG_FILES)
report "no var(--token, #fallback) colour fallbacks" \
       "a fallback hex means the page renders off-system when a token is renamed" "$m"

# ── 6. Unreachable dark-mode CSS ─────────────────────────────────────────────
# colorMode.disableSwitch is true, so anything scoped to [data-theme='dark'] is
# code documenting a feature that does not exist.
# shellcheck disable=SC2086
m=$(scan 'data-theme=[\x27"]dark[\x27"]' $SRC_FILES)
report "no unreachable dark-mode CSS" \
       "the colour-mode switch is disabled; dark rules can never apply" "$m"

# ── 7. The retired template kit ──────────────────────────────────────────────
# shellcheck disable=SC2086
m=$(scan 'transition:\s*all|backdrop-filter|saturate\(|translateY\(-' $SRC_FILES)
report "no retired template kit" \
       "transition:all, frosted glass and hover lifts are the generic SaaS chrome" "$m"

# ── 8. Gradients as brand decoration. Functional masks are allowed ───────────
# shellcheck disable=SC2086
m=$(scan 'linear-gradient|radial-gradient' $SRC_FILES | grep -viE 'mask')
report "no decorative gradients" \
       "one flat accent; gradient tiles and washes are the template look" "$m"

# ── 9. Pastel tiles identifying a product by hue alone ───────────────────────
# shellcheck disable=SC2086
m=$(scan 'tint_(?:blue|purple|green|orange)|icon(?:Blue|Purple|Green|Orange)|"tint"' \
  $SRC_FILES $CATEGORY_FILES)
report "no pastel product tiles" \
       "colour must not be the only carrier of product identity" "$m"

# ── 10. Typography must actually be embedded, not merely declared ────────────
# Counting @font-face rules is not enough: the website declared six faces while
# shipping zero files, and every page rendered in system-ui while every probe
# said the fonts were present.
m=$({
  face_count=$(grep -c '@font-face' src/css/custom.css || true)
  woff_count=$(find static/fonts -name '*.woff2' 2>/dev/null | wc -l | tr -d ' ')
  licence_count=$(find static/fonts -name 'LICENSE-*.txt' 2>/dev/null | wc -l | tr -d ' ')
  preload_count=$(grep -c "rel: 'preload'" docusaurus.config.ts || true)
  [ "${face_count:-0}" -ge 6 ] || echo "only ${face_count:-0} @font-face rules in src/css/custom.css (expected 6)"
  [ "${woff_count:-0}" -ge 6 ] || echo "only ${woff_count:-0} .woff2 files in static/fonts/ (expected 6)"
  [ "${licence_count:-0}" -ge 3 ] || echo "only ${licence_count:-0} LICENSE-*.txt in static/fonts/ (the OFL travels with the files)"
  [ "${preload_count:-0}" -ge 2 ] || echo "only ${preload_count:-0} font preloads in docusaurus.config.ts headTags (expected 2)"
})
report "fonts are self-hosted, licensed and preloaded" \
       "faces can be declared and still absent; count the files, not the rules" "$m"

# ── 11. No font fetched from a third party at render time ────────────────────
# shellcheck disable=SC2086
m=$(scan 'fonts\.googleapis\.com|fonts\.gstatic\.com|\@import\s+url\(' $SRC_FILES $CONFIG_FILES)
report "no third-party font requests" \
       "a CDN @import is render-blocking and makes the letterforms someone else's" "$m"

# ── 12. Provider names in the chrome ─────────────────────────────────────────
# The lookarounds are load-bearing: a bare \bstripe\b matches the Infima variable
# --ifm-table-stripe-background, and a guard that cries wolf on real code is a
# guard someone deletes. docs/** is covered by check-provider-leak.mjs.
# shellcheck disable=SC2086
m=$(scan '(?i)(?<![-\w])(?:openai|anthropic|migo|tributax|pixabay|pexels|valueserp|publisuites|nicho\.ai|stripe|resend)(?![-\w])' \
  $SRC_FILES $CONFIG_FILES)
report "no external provider names in the chrome" \
       "capabilities are presented as native product features" "$m"

echo
if [ "$FAILED" -ne 0 ]; then
  printf '%sDesign-system check failed.%s See the findings above.\n' "$RED" "$RESET"
  exit 1
fi
printf '%sAll design-system checks passed.%s\n' "$GREEN" "$RESET"
