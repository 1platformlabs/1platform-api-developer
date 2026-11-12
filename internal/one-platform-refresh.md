# One Platform public brand refresh

Implemented on branch `feat/one-platform-brand-refresh`, from `5e338fb0147086cc382e51980c6ee1e6768e600f`, together with Website branch `feat/one-platform-landing-refresh`.

The portal header/footer, home lead, metadata and API reference shell use One Platform with the unchanged original symbol. The footer links to `/docs/saas/1platform-api/integrar-con-ia#mcp`. Technical routes, package names, API contracts and the legal company name are preserved.

The navbar reserves space for the longer name and search. `pnpm check:brand-layout` checks rendered geometry, the compact menu and the MCP destination at nine widths, using one browser page at a time. It complements TypeScript, build, public UI, contrast and design guards.

This is local product implementation. No push, merge or deployment was executed. Website tenant content must be activated separately through its offline preparer and administrative snapshot procedure. This portal has no tenant activation step.

The project-local CLAUDE.md now names the approved public brand. There is no project-local AGENTS.md; workspace-wide guidance was not changed.

The browser audit also reproduced a pointer race after search focus: late search-index loading refocused the input, and the expanding search field moved the menu target between pointerdown and pointerup. Compact navigation now reserves a stationary menu target. The existing search-package patch restores focus only if search still owned it immediately before autocomplete initialization; it preserves focus across the input's internal reparenting. The lockfile changes only that patch digest. The regression covers both slow-index outcomes (stay searching / open the menu), plus nine viewport widths and the MCP link.

## Local validation

- `pnpm typecheck` and `pnpm build`: passed. The build's existing Scalar `#tag/...` warnings refer to client-rendered anchors; the dedicated anchor guard validates their OpenAPI targets.
- `pnpm check:brand-layout`: nine widths (320–1600 px), physical pointer navigation from focused search, two delayed-index focus cases, and the footer MCP destination passed. The previous compiled navbar fails the pointer case at 320 px.
- `pnpm check:search-runtime`: passed on the docs home and API reference at 390/1440 px, including negative accessible-label controls.
- `pnpm check:public-ui` and `pnpm check:chrome-contrast`: passed. First-party JavaScript remains within the existing budget; no budget was changed.
- Manual Chrome review covered desktop chrome and the compact menu. Website's final paused-message state was also inspected in Safari.
- The updated dependency patch installs with `pnpm install --offline --frozen-lockfile`; dependency versions are unchanged.

Temporary product-review servers on 4481–4483 were stopped. The user-requested prototype on 4465 and its existing ngrok tunnel remain running. Website companion implementation is committed locally as `b13ebc6`; no branch was pushed and no PR was opened (Developer PR creation triggers QA publication).

Final artifact verification passed after the compact control's CSS centering adjustment: build, all brand-layout cases, public UI budgets, design-system guard and all 140 API-reference anchor targets. No guard, threshold or retry policy was weakened. Browser/runtime checks use local built artifacts and controlled resources; they do not certify real authentication, API operation or production activation.
