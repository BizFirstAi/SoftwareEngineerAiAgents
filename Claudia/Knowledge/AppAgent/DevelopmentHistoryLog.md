# App Studio RAG — Development History Log

## 2026-11-13 — `delete_widget`/`delete_section` shipped; `delete_app`/`delete_server` now HumanOnly; per-agent scope check added

Backend sync (`BizFirstPayrollV3`, MCP authorization hardening, 2026-11-12): `delete_widget` and
`delete_section` are real tools now (soft delete; the section variant cascades to every widget in
it), including through the Build-with-AI bridge (its blocklist had a bug matching them by the same
`^delete_` regex used for `delete_app`/`delete_page`/`delete_server`, fixed with an explicit
carve-out). `delete_app`/`delete_server` were reclassified `HumanOnly` — unreachable from any agent
or API key, same tier as `create_credential`. The McpAgentWriter fast path also gained a per-agent
module-scope check (`mcp:{module}:read|write`), staged via `ScopeMode` (`Off`/`Warn`/`Enforce`,
default `Warn` — logs but doesn't yet deny). `delete_workflow_node`/`delete_connection` were
deliberately left unchanged at Write tier.

Updated: `05-integration-guide.md` (Apps/Sections/AppWidgets tool tables), `06-mcp-server-reference.md`
(Apps/Sections/AppWidgets endpoints, Known Gaps), `site-building-lessons.md` §1 and §10 (the
`delete_widget` "not available" claim was wrong as of this date; added the HumanOnly and scope-check
notes), `platform-requests.md` (closed the `delete_widget`/`delete_section` half of P5, kept
`update_widget` open).

## 2026-09-26 — Public access + MCP review sync (`app-model.md`, `app-creation-flow.md`, agent doc)

`app-model.md` gained "`ResID` and public access" (ResID on the entity responses; apps/widgets are
private by default; `Everyone` grant rows, AppWidget inherits from App; entity type codes `App`/
`AppWidget`/`ExecutionTemplate`, AppWidget record ID = placement ID; resolved state only via
`GET api/v1/iam/public-access/effective` / `POST .../effective/batch` or the MCP `get_public_access`
tool; custom domains via `list_custom_domains`; the agent never changes any of it).
`app-creation-flow.md` gained a short "Public access" note (private by default, agent never
publishes/exposes, how to report state) plus the MCP note that `create_app_from_template` now always
has a Project. `00-overview.md`: "17" widget-type wording corrected to 18 in the retrieval text (the
table always had 18 rows). Companion changes: `..\..\agents\create-app-from-description@agent.md`
(new "check and report public-access state" step, `create_section`-first gotcha) and
`..\..\mcp-servers\app-studio-mcp-server-design.md` (v3: 18 tools, not-exposed list, defects fixed).

## 2026-09-14 — Added `theming.md` (Task 89)

New Tier 1 doc: the full, current `--app-var-*` theme cascade reference (all 19 tokens from
`ThemeTokens.ts`, the two real integration shapes — `AppPlayer.tsx`'s 3-layer nested cascade vs.
WorkDesk's collapsed resolve-then-inject-once pattern — real before/after CSS from ChatDesk/
hil-ui-chat-window/WorkDesk/the Content Widget Templates, the two real theme-scope bugs found and
fixed 2026-09-11/12, and the `AppStudioTheme` preset catalog). Additive scope beyond the original
theming brief, per same-day follow-up requests: a full per-type catalog (real `Configuration` JSON
+ theme-participation + validation-gap notes) for all 18 real widget types, grounded in
`WidgetTypeCatalog.cs` and live `AIExt_Widgets` rows queried from `data-ocean-platform-prod`; and a
short section on the `StockAssets` local stock-image folder (163 files, `preview.html` browsing
aid) as a real-image source for widget authoring. `00-overview.md`'s Tier 1 index updated to point
to it. Existing `styling-and-common-properties.md`'s own theming summary (12-token version) is now
stale on the token count — left as-is rather than edited, since this new file is the authoritative,
current version and a future full pass could fold the two together.

## 2026-09-04 — Created (Task 51, superseding an earlier partial attempt)

Written from scratch, source-grounded directly against current `app-studio` package code (not the
DB `AIExt_WidgetTypes` description columns). Covers all 17 real `WidgetType` values with full
Tier 1 config docs — full first-pass coverage, unlike `workflow-nodes-rag`'s partial (18/107)
coverage of workflow nodes.

**Supersedes** `..\_archive\app-studio-rag-v1-2026-08-30\` (originally under
`agentic-coding\app-studio--automation-project\rag\v1\`), which covered only 10 of the (then-fewer)
widget types and predates the 7 media widgets (`image`/`video`/`audio`/`pdf` singles +
`image-gallery`/`video-gallery`/`audio-gallery`/`pdf-gallery`) added 2026-09-02, and the App Studio
Template wizard system (Task 22/23) added 2026-09-04. That set's two genuinely non-duplicated files
(`01-common-properties.md`, `02-style-properties.md` — AppSection shared fields and the full
Structured Style Builder system) were merged into this set as `styling-and-common-properties.md`
rather than left to rot in the archive.

Files: `00-overview.md` (Tier 0), `app-model.md`, `app-creation-flow.md`,
`styling-and-common-properties.md`, `widgets\{17 files}.md`, `agent\add-new-widget-type.md`.

Reorganized the same day (Task 51 follow-up, "agentic-development-engineers" restructure) from
`agentic-coding\app-studio-rag\` into its current home under
`agentic-development-engineers\app-development-engineer\rag\app-studio-rag\` — part of a
codebase-wide reorganization of Agent/MCP-Server/RAG artifacts by development-engineer role
(Workflow / Form / App). See `..\..\..\README.md` for the full reorganization rationale.
