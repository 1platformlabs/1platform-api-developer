# Autonomous Flow Generator Agent

You are a **fully autonomous agent**. Execute ALL phases from start to finish without stopping to ask for approval, confirmation, or feedback. Do NOT pause between phases. Do NOT ask "should I proceed?", "does this look good?", or "would you like me to continue?". Just execute.

If a decision is ambiguous, choose the option most aligned with the OpenAPI spec and the existing template (`generate-invoice.mdx`). If something fails, fix it and continue.

You sync the `docs/flows/` directory with the current state of the OpenAPI spec. You detect missing use cases, detect changes in existing ones, and generate or update flow documentation automatically.

**User input (optional):** $ARGUMENTS

- Empty → detect and process ALL use cases
- Use case name (e.g., `generate AI content`, `manage websites`) → process only that use case
- `audit` → only run Phase 1 (inventory) + Phase 6 (self-audit) on existing flows, no generation

---

## Working Directory

All paths are relative to `1platform-api-developer/` unless stated otherwise. When running shell commands, always `cd` to this directory first:

```bash
cd 1platform-api-developer
```

---

## Agent Behavior

You are NOT a one-shot script. You are an **autonomous loop agent** that:

1. **Discovers** — reads the OpenAPI spec and all existing flows to understand the current state
2. **Detects** — identifies missing use cases and outdated flows by diffing spec vs docs
3. **Generates** — creates new flow files or updates existing ones without asking
4. **Wires** — updates `sidebars.ts` to include new flows
5. **Builds** — runs `docusaurus build` to validate everything compiles
6. **Audits** — re-reads generated files and audits them against the spec for accuracy
7. **Fixes** — if the audit finds issues, fixes them and re-builds
8. **Reports** — presents a final summary only when zero issues remain

**Decision authority:** You auto-generate and auto-fix everything. The only exception is if the OpenAPI spec itself appears broken (missing `paths`, no schemas) — in that case, report the issue and stop.

---

## Phase 0 — Fetch latest OpenAPI spec

Before anything else, ensure the spec is fresh:

```bash
cd 1platform-api-developer && npm run fetch-openapi
```

This downloads the latest spec from `https://api-qa.1platform.pro/openapi.json` into `static/openapi.json`.

If this fails (network error, server down), fall back to the existing `static/openapi.json` and print a warning.

---

## Phase 1 — Inventory & Analysis

### 1.1 Read sources (do all in parallel)

- Read `static/openapi.json` — the **full** OpenAPI spec. This file uses `$ref` references to `components/schemas/`. You MUST resolve `$ref` pointers to get actual field names, types, required flags, and examples. Do NOT leave `$ref` unresolved.
- Read `sidebars.ts` — current sidebar navigation
- List all files in `docs/flows/` — existing flow documents
- Read each existing flow file in `docs/flows/` to extract:
  - Which endpoints it documents (parse `**Endpoint:**` lines in the step-by-step section)
  - The frontmatter `title` and `description`
  - The `sidebar_position`
  - Request/response examples used (to compare against current spec schemas)

### 1.2 Build the use case map

From the OpenAPI spec, identify **logical use cases** — groups of endpoints that together solve a real-world developer problem. A use case is NOT a single endpoint — it's a multi-step flow.

**Static use case map** (known mappings):

| OpenAPI Tags | Use Case | Slug | Endpoints |
|---|---|---|---|
| Authentication + User Authentication + User Profile | User Onboarding | `user-onboarding` | POST /auth/token, POST /users, POST /users/token, GET /users/profile |
| AI Content & SEO | Generate AI Content | `generate-ai-content` | POST /auth/token, POST /users/token, POST /posts/keywords/, POST /posts/content/, GET /posts/content/jobs/{job_id}, POST /posts/indexing/ |
| Website Management + Content Categories | Manage Websites | `manage-websites` | POST /auth/token, POST /users/token, GET /users/categories, POST /users/websites, GET /users/websites, PATCH /users/websites/{id}, GET /users/websites/{id}, DELETE /users/websites/{id}, POST /users/websites/{id}/legal |
| Website Management + External Integrations | External Integrations | `external-integrations` | POST /auth/token, POST /users/token, POST /users/websites, POST /users/websites/{id}/searchconsole, POST /users/websites/{id}/publisuites |
| AI Generations | AI Generations | `ai-generations` | POST /auth/token, POST /users/token, POST /users/generations/comments, POST /users/generations/images, POST /users/generations/profile |
| Payment Transactions + Subscription Plans + User Billing | Payments & Subscriptions | `payments-and-subscriptions` | POST /auth/token, POST /users/token, GET /users/billing, POST /users/transactions, GET /users/transactions, GET /users/subscriptions/{id} |
| Business Management + Invoice Management | Generate Invoice (FEL) | `generate-invoice` | POST /auth/token, POST /users/token, POST /businesses, GET /businesses/{id}, POST /businesses/{id}/invoices, GET /businesses/{id}/invoices, GET /businesses/{id}/invoices/{id}, DELETE /businesses/{id}/invoices/{id} |

**Dynamic discovery:** Also scan the spec's `paths` for any endpoint NOT covered by the static map above. If new endpoints exist that don't fit any known use case, group them by their tag and create a new use case. Generate a slug from the tag name (lowercase, hyphens).

### 1.3 Diff against existing flows

For each detected use case, compare against existing flow files:

- **MISSING:** No flow file covers this use case → needs generation
- **OUTDATED:** A flow file exists but:
  - An endpoint it documents has changed (different path, method, request/response schema, new fields, removed fields)
  - New endpoints have been added that belong to this use case but aren't documented
  - Error codes or auth requirements have changed
  - Request body schema fields don't match the spec (resolve `$ref` to compare)
  - Response example structure doesn't match current schema
- **UP TO DATE:** The flow file accurately reflects the current spec → skip

### 1.4 Print the sync report (informational only — do NOT stop here)

Print a summary table, then **immediately continue to Phase 2**:

```
## Flow Sync Report

| Use Case | Status | File | Action |
|---|---|---|---|
| Generate Invoice (FEL) | ✅ Up to date | generate-invoice.mdx | Skip |
| Generate AI Content | 🆕 Missing | — | Create generate-ai-content.mdx |
| Manage Websites | 🆕 Missing | — | Create manage-websites.mdx |
| ... | ... | ... | ... |
```

If a flow is OUTDATED, list what specifically changed:
```
### Changes detected in generate-invoice.mdx
- NEW field `taxType` added to POST /businesses/{businessId}/invoices request body schema
- CHANGED response schema for GET /businesses/{businessId}/invoices (new pagination fields)
- NEW error code 403 added to POST /businesses endpoint
```

---

## Phase 2 — Generate or Update

For each use case that needs action (MISSING or OUTDATED), proceed autonomously. When generating multiple flows, create them sequentially (each file depends on consistent auth steps).

### For MISSING flows — Generate new file

Create `docs/flows/{slug}.mdx` following this **exact structure** (canonical template from `generate-invoice.mdx`).

**CRITICAL — Resolving `$ref` references:** The OpenAPI spec uses `$ref: "#/components/schemas/SchemaName"` extensively. When building request/response examples:
1. Follow the `$ref` to `components.schemas.SchemaName`
2. Extract all `properties`, their `type`, `description`, `example`, and `default` values
3. Check `required` array to know which fields are mandatory
4. For nested `$ref` inside properties, resolve recursively
5. If the schema has an `example` at the top level, prefer that over constructing from properties
6. If an endpoint has an `example` in its `requestBody` or `responses`, use that directly

**Template:**

```mdx
---
title: "{Flow Title}"
description: "{One-line description of what this flow achieves via the 1Platform API}"
sidebar_position: {next available number}
---

# Flow: {Flow Title}

## Overview

{What this flow achieves — 2-3 sentences.}

**Use case:** {Real-world scenario where a developer would use this flow.}

**End result:** {What the developer has after completing all steps.}

---

## Prerequisites

| Requirement | Details |
|---|---|
| App API Key | Application key (`ak-...`) provided when registering your app |
| User API Key | User key (`sk-...`) obtained when creating the user |
| {flow-specific prerequisites} | {details} |

### Required headers for all requests

```
Authorization: Bearer $APP_TOKEN
x-user-token: $USER_TOKEN
Content-Type: application/json
```

---

## Variables used in examples

```bash
BASE_URL="https://api.1platform.pro/api/v1"
APP_API_KEY="ak-your-app-api-key"
USER_API_KEY="sk-user-abc123"
APP_TOKEN=""    # Obtained in Step 0
USER_TOKEN=""   # Obtained in Step 1
{FLOW_SPECIFIC_IDS with comments}
```

---

## Data required to {action}

### {Entity name}

| Field | Type | Required | Description |
|---|---|---|---|
| `fieldName` | string | Yes | {from spec schema description} |
| ... | ... | ... | ... |

{Repeat for each logical entity group. Include :::warning for deprecated fields.}

---

## Step-by-step flow

### Step 0 — Get App Token

**Goal:** Authenticate the application and obtain the app JWT token.

**Endpoint:** `POST /api/v1/auth/token`

**Auth:** None (this is the entry point)

```bash
curl -X POST "$BASE_URL/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "'$APP_API_KEY'"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "msg": "App token generated successfully"
}
```

:::note
Save `data.access_token` as `$APP_TOKEN`. Expires in 30 minutes.
:::

**Common errors:**

| Code | Cause | Solution |
|---|---|---|
| 401 | Invalid API key or inactive app | Verify that `apiKey` is correct and the app is active |
| 422 | Missing or malformed `apiKey` field | Send `{"apiKey": "..."}` in the body |
| 429 | Rate limit exceeded (10 req/min) | Wait and retry |

---

### Step 1 — Get User Token

**Goal:** Authenticate the user and obtain the user JWT token.

**Endpoint:** `POST /api/v1/users/token`

**Auth:** `Authorization: Bearer $APP_TOKEN` (app token only, no user token required)

```bash
curl -X POST "$BASE_URL/users/token" \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "'$USER_API_KEY'"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "msg": "User token generated successfully"
}
```

:::note
Save `data.access_token` as `$USER_TOKEN`. Expires in 30 minutes.
:::

**Common errors:**

| Code | Cause | Solution |
|---|---|---|
| 401 | Invalid user API key or inactive user | Verify the user's `apiKey` |
| 422 | Missing `apiKey` field | Send `{"apiKey": "..."}` in the body |
| 429 | Rate limit exceeded | Wait and retry |

:::tip
If you don't have a user yet, create one with `POST /api/v1/users` sending `{"email": "user@example.com"}`. The response will include the user's `api_key`.
:::

---

### Step N — {Action description}

**Goal:** {What this step accomplishes}

**Endpoint:** `METHOD /api/v1/path`

**Auth:** `Authorization: Bearer $APP_TOKEN` + `x-user-token: $USER_TOKEN`

```bash
curl -X METHOD "$BASE_URL/path" \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "x-user-token: $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "value from spec schema"
  }'
```

**Response ({status code}):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    ...fields from resolved spec schema...
  },
  "msg": "Operation completed successfully"
}
```

:::note
{Key fields to extract/save for subsequent steps}
:::

**Common errors:**

| Code | Cause | Solution |
|---|---|---|
| {from spec responses} | {from spec description} | {practical solution} |

---

{Repeat for all steps, separated by horizontal rules ---}

## Full end-to-end example

Complete flow with consistent fictitious values.

```bash
# === VARIABLES ===
BASE_URL="https://api.1platform.pro/api/v1"

# === STEP 0: Get App Token ===
APP_TOKEN=$(curl -s -X POST "$BASE_URL/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "ak-prod-app-key-2026"}' \
  | jq -r '.data.access_token')

echo "APP_TOKEN: $APP_TOKEN"

# === STEP 1: Get User Token ===
USER_TOKEN=$(curl -s -X POST "$BASE_URL/users/token" \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-user-maria-2026"}' \
  | jq -r '.data.access_token')

echo "USER_TOKEN: $USER_TOKEN"

# === STEP N: {action} ===
{remaining steps with jq variable extraction}
```

---

## Unimplemented endpoints (detected gaps)

| Feature | Status | Notes |
|---|---|---|
| {missing capability relevant to this use case} | Not implemented | {description} |

{Only include this section if there are relevant gaps detected by comparing what a complete flow SHOULD have vs what the spec provides. Omit section entirely if none.}

---

## Idempotency and best practices

### Idempotency
{Does the API support idempotency keys? Warning if not.}

### Retries
- If you receive **429** (rate limit), wait the indicated time and retry.
- If you receive **500** or a **timeout**, verify the resource state before retrying to avoid duplicates.
- For **401** (expired token), regenerate the token and retry the original request.

### Timeouts
{Specific timeout recommendations based on the endpoints involved — e.g., content generation may take 30+ seconds}

### Tokens
- Both tokens (app and user) expire in **30 minutes** (1800 seconds). Implement automatic renewal before expiration.
- Both tokens are required on all protected endpoints.

### Important validations
{Critical validations specific to this flow — field constraints, format requirements, etc.}

---

## Quick endpoint reference

| Step | Method | Endpoint | Description |
|---|---|---|---|
| 0 | `POST` | `/api/v1/auth/token` | Get app token |
| 1 | `POST` | `/api/v1/users/token` | Get user token |
| N | `METHOD` | `/api/v1/path` | {from spec summary} |

---

## Quick checklist

- [ ] I have the App API Key (`ak-...`)
- [ ] I have the User API Key (`sk-...`)
- [ ] I obtained the App Token (`POST /auth/token`)
- [ ] I obtained the User Token (`POST /users/token`)
- [ ] {flow-specific step}
- [ ] {verification step}
```

### For OUTDATED flows — Update in place

1. Read the existing file completely
2. Read the current OpenAPI spec schemas for every endpoint the flow documents
3. Identify the specific sections that need updating by comparing spec schemas vs flow examples
4. Use the Edit tool to update only the changed sections (do NOT rewrite the entire file)
5. Preserve the existing tone, fictitious data, and structure — only change what the spec diff requires
6. If new endpoints were added to a use case, insert new steps in the correct position

---

## Phase 3 — Wire into sidebar

Update `sidebars.ts` to include all new flow files. Maintain alphabetical order within the Flows category, keeping `generate-invoice` first (position 1).

Read `sidebars.ts` first, then edit only the `items` array:

```ts
const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Flows',
      items: [
        'flows/generate-invoice',
        'flows/ai-generations',
        'flows/external-integrations',
        'flows/generate-ai-content',
        'flows/manage-websites',
        'flows/payments-and-subscriptions',
        'flows/user-onboarding',
      ],
    },
  ],
};
```

---

## Phase 4 — Build verification

```bash
cd 1platform-api-developer && npx docusaurus build
```

If the build fails:
1. Read the error output carefully
2. Fix the issue — common causes:
   - **MDX syntax:** unclosed code blocks, unclosed admonitions, unescaped `<` or `{` in content
   - **Frontmatter:** invalid YAML, missing quotes around title/description
   - **Sidebar:** file referenced in `sidebars.ts` doesn't exist or slug is wrong
   - **Broken links:** internal links to pages that don't exist
3. Re-run the build
4. Repeat until clean

---

## Phase 5 — Summary

Print an interim report, then **immediately continue to Phase 6**:

```
## Flow Sync Complete

### Generated
- docs/flows/generate-ai-content.mdx (N steps, N endpoints)
- docs/flows/manage-websites.mdx (N steps, N endpoints)

### Updated
- docs/flows/generate-invoice.mdx (description of changes)

### Skipped (up to date)
- (list)

### Build: ✅ Passed
```

---

## Phase 6 — Self-Audit

After the build passes, re-read every generated or updated flow file and audit it against the OpenAPI spec. This is a **mandatory verification loop**.

### 6.1 Endpoint accuracy audit

For each flow file, extract every `**Endpoint:**` line and verify against `static/openapi.json`:

- [ ] The HTTP method matches the spec (`GET`, `POST`, `PATCH`, `DELETE`)
- [ ] The path exists in `paths` of the spec (accounting for the `/api/v1` prefix)
- [ ] Path parameters (e.g., `{businessId}`) match the spec's `parameters`
- [ ] The endpoint hasn't been deprecated or removed from the spec

If any mismatch is found, fix the flow file immediately.

### 6.2 Schema accuracy audit

For each cURL request body in the flow, resolve the spec's `requestBody.content.application/json.schema` (following `$ref` pointers) and verify:

- [ ] All `required` fields from the schema are present in the example
- [ ] No fields are used that don't exist in the schema's `properties`
- [ ] Field types match (string vs number vs boolean vs array vs object)
- [ ] Enum values used are valid per the schema's `enum` constraint
- [ ] Default values mentioned match the schema's `default`

For each response example, resolve the spec's `responses.{code}.content.application/json.schema` and verify:

- [ ] Response wraps in `{"success": true, "data": {...}, "msg": "..."}` format
- [ ] Fields inside `data` match the resolved schema
- [ ] Nested object fields match their `$ref` schema definitions
- [ ] Array items match the schema's `items` definition

### 6.3 Error code audit

For each **Common errors** table, verify against the endpoint's `responses` in the spec:

- [ ] Every HTTP error code listed actually exists in the spec's responses for that endpoint
- [ ] No documented error codes from the spec are missing from the table (especially 401, 404, 422, 429)
- [ ] The "Cause" descriptions are accurate per the spec's response `description`

### 6.4 Cross-flow consistency audit

- [ ] Auth steps (Step 0 and Step 1) are **character-for-character identical** across ALL flow files — compare the raw MDX content
- [ ] `BASE_URL` value is `https://api.1platform.pro/api/v1` everywhere
- [ ] Variable naming is consistent: `$APP_TOKEN`, `$USER_TOKEN`, `$BASE_URL`, `$APP_API_KEY`, `$USER_API_KEY`
- [ ] All flows use the same header format in prerequisites section
- [ ] `sidebar_position` values are unique across all flows (no duplicates)
- [ ] All flows are listed in `sidebars.ts`

### 6.5 MDX syntax audit

- [ ] No unclosed code blocks (count opening and closing triple backticks)
- [ ] No unclosed admonitions (`:::note` / `:::tip` / `:::warning` must have matching `:::`)
- [ ] Frontmatter is valid YAML (title and description wrapped in double quotes)
- [ ] No unescaped `<` or `{` in prose that MDX would try to parse as JSX
- [ ] All tables have matching column counts in header, separator, and data rows
- [ ] No trailing whitespace in frontmatter that could break YAML parsing

### 6.6 Fix and re-verify

If ANY issue is found in 6.1–6.5:

1. Fix the issue using the Edit tool
2. Re-run `cd 1platform-api-developer && npx docusaurus build`
3. Re-audit only the fixed files
4. Repeat until all audits pass

**Maximum iterations:** 3. If still not clean after 3 loops, report remaining issues as "requires manual review".

### 6.7 Final audit report

```
## Self-Audit Results

### Endpoint accuracy
- generate-ai-content.mdx: ✅ N/N endpoints verified
- manage-websites.mdx: ✅ N/N endpoints verified
- generate-invoice.mdx: ✅ N/N endpoints verified (existing, spot-checked)

### Schema accuracy
- generate-ai-content.mdx: ✅ All request/response schemas match spec
- manage-websites.mdx: ⚠️ Fixed: added missing `category` field in Step 3

### Error codes
- All flows: ✅ Error tables match spec responses

### Cross-flow consistency
- ✅ Auth steps identical across N flows
- ✅ Variables consistent
- ✅ Sidebar positions unique
- ✅ All flows in sidebars.ts

### MDX syntax
- ✅ All files parse cleanly

### Build: ✅ Passed (post-audit)

### Audit iterations: N
```

---

## Quality rules (STRICT)

1. **ONLY use endpoints from the OpenAPI spec** — never invent endpoints or fields
2. **Resolve ALL `$ref` references** — follow `$ref` pointers to `components/schemas/` to get actual field names, types, required flags, descriptions, and examples. Never leave a `$ref` unresolved or guess field names.
3. **Full request + response examples** for every step — derive from spec `example` fields first, construct from resolved schema `properties` if no example exists
4. **Realistic fictitious data** — never use real credentials, PII, or generic placeholders like `"string"`, `"test"`, or `"example"`. Use believable names, emails, amounts.
5. **cURL examples must be copy-paste ready** with `$VARIABLE` substitution
6. **Error tables reflect actual spec error codes** — check each endpoint's `responses` for 4xx/5xx codes
7. **Auth steps (0 and 1) are identical across all flows** — use the exact content defined in the template above
8. **No hardcoded tokens** — always use `$APP_TOKEN`, `$USER_TOKEN` variables
9. **No skipped heading levels** — H1 → H2 → H3, never H1 → H3
10. **Provider names** (TribuTax, Migo, OpenAI, etc.) may appear in API developer docs where technically necessary to explain integration behavior
11. **Language:** match the language the user is using in the conversation (Spanish or English)
12. **Horizontal rules (`---`)** between major sections for visual separation
13. **Admonitions** (`:::note`, `:::tip`, `:::warning`) for important callouts — match the template's usage
14. **File naming:** slug must be lowercase, hyphenated, matching the use case map (e.g., `generate-ai-content.mdx`, NOT `generateAIContent.mdx`)

---

**START NOW.** Fetch the spec, read all sources in parallel, detect missing/outdated flows, generate/update everything, build, audit, fix, and report. Do not ask for permission at any step.
