# Development History Log - Node Forms Agent

## 2026-09-20 - Folder created: reusable node-forms debugging/fixing agent

**Why:** The SQL Server node showed no operation-specific config form because it had no palette data template carrying
`connector.configuration.profileName` (37 templates were then generated, IDs 91030001..91030037). MySql has the same gap and other
nodes may too. The diagnosis and fix were done ad hoc; this folder captures them so any node type can be debugged and fixed
the same way.

**What was created (documentation only; no database or code touched, nothing committed):**
- `agent.md` - role, invocation table, inputs, 7-step procedure, hard safety rules, definition of done
- `resource.md` - repo paths, both databases (no credentials), endpoints, MCP handshake, Chrome page-context REST, tool caveats
- `debug-runbook.md` - queries Q1-Q6, JS snippets J1-J2, decision tree (incl. wrong-form and forms-exist-but-UI-empty cases)
- `fix-playbook.md` - per-operation template generation, ID range selection, apply, verify, log; generator pseudo-code + Node sketch
- `audit-all-datatemplates.md` - all-node read-only audit SQL, Node sketch, table output format
- `rag\` - `00-overview.md`, `form-resolution-pipeline.md`, `profilename-to-form-contract.md`, `data-template-anatomy.md`,
  `caching-layers.md`, `database-topology.md`, `per-node-audit-checklist.md`, `node-type-status-table.md`
- `lessons\README.md` - lessons from the SQL Server case

**Status of the content:** facts come from live verification on 2026-09-20. SQL and Node snippets are drafts that were not executed
while writing the docs (no DB access by design); the first real run must validate column names flagged "unverified".

## 2026-09-20 - Added display-order research (palette menu and config-dialog form order)

**Why:** new SQL Server templates/forms use DisplayOrder values that do not fit any convention; operation templates scatter
through the palette and per-operation forms can sort after or between common forms. Needed a documented rule and remedy.

**What changed (documentation only; no code or database touched, nothing committed):**
- `.\display-order-and-menu.md` (new): palette data flow and sort (server `DisplayOrder, TemplateName`, frontend keeps it),
  categories (type 15 dropdown filter, `sortOrder` inert, 11 categories without type-15 row), type 14 role, curation flags,
  config dialog global sort (`ConnectorConfigDialog.tsx:410`), tier vs order, real local distributions, proposed bands,
  detector SQL, normaliser UPDATE (not run), "Where ordering is controlled" table.
- `.\00-overview.md`: index entry 8.
- `agent.md`: Step 1 item 6 (check order as well as presence).
- `lessons\README.md`: new dated lesson.

**Status:** local DB values verified read-only; the reported large DisplayOrder values (Odoo 3601+, Jira 30001+, Docker,
SSH, 590 rows >= 1002) were NOT found locally (max 1001) and remain unverified (served remote DB not queried).

## 2026-09-20 (late) - Display-order normalisation applied; profile stamping root cause recorded

- Ran `Sync_AtlasForms_2026_09_20_profile_forms_display_order_on_top.sql` on the local DB (598 forms moved to 100+ so profile-driven forms sit above the common
  forms in the config dialog). Added a correction to `.\display-order-and-menu.md` explaining why post-run queries no longer show DisplayOrder >= 1002.
- Root cause of "wrong operation form on nodes built without a template": `workflowStore.ts` (~lines 279-316) resolves the template with
  `new Map(templates.map(t => [t.code, t]))` (LAST template per code wins) when `designer.ui.dataTemplateID` is missing, then merges it into the connector
  configuration with existing connector values winning. MCP-built Odoo/Apify nodes therefore got `odoo-custom-delete` / `apify-key-value-store-get-record`
  AND the wrong resource/operation stamped on their connectors. Fix procedure: set `designer.ui.dataTemplateID` on the element, then correct the connector
  via PUT /api/v1/ai-extension/connectors/{id} (body {metadata, data:{ConnectorID, Name, Configuration}}); the Workflow MCP cannot write connector config.

## 2026-09-20 (late) - Policy: profile-driven forms DisplayOrder strictly between 100 and 500
Requested by Binoy. Added POLICY section to rag/display-order-and-menu.md and policy notes to agent.md, fix-playbook.md, rag/per-node-audit-checklist.md and lessons.
The DB-project normaliser Sync_AtlasForms_2026_09_20_profile_forms_display_order_on_top.sql was rewritten to the 101..499 band (was 100+ / left 1000-1001 alone) and re-run on the local DB (1282 of 1292 rows, 0 violators).

## 2026-09-20 (night) - DB data-script tree cleanup: no obsolete/backup/unsorted/unapproved folders; folder standard documented

**Why:** Binoy asked for a clean slate: banned folders and legacy-prefixed copies removed, every needed script in a standard place and current against the C# code.

**What changed:** 95 files inspected item by item (report `audit\cleanup-2026-09-20.md`), 21 banned folders removed, 8 loose sync scripts moved to `Sync\`, `Forms\sub` and 3 other odd folders folded, 3 doc files moved to `Docs\`. New standard doc `.\db-project-folder-standard.md` (linked from `.\00-overview.md`); lesson appended to `lessons\README.md`. Local DB: +7 forms, +4 PETs, +5 templates, 4 forms and 1 template updated through idempotent Sync scripts; normalisers re-run (0 rows). No commit, no C# change.

**Note:** this log is in chronological order (oldest first), so this entry was appended at the end.

## 2026-09-21 - Research: observability configuration in nodes, and the observe panels (read-only)

**Why:** Binoy asked how the common Observability form (FormID 11109) is applied to nodes and how the observe panels use it.

**What changed:** New `.\observability-in-nodes.md` (control table with WIRED / PARTIAL / not-wired status, storage and read paths, end-to-end flow, gaps, recommendations, panel table, doc-claim cross-check); index entry 10 added to `.\00-overview.md`. No code, script, DB or git change.

**Key findings:** form values are saved flat at the ProcessElement Configuration root (DB elements 2264 and 2310) while `NodeObservabilitySettingsInfo` reads `$.observability.*`, so no form value reaches the runtime today and code defaults (all on) apply; `slowThresholdMs`, `logOnlySummary`, `maskSensitiveData` have dead or stubbed readers; node input/output capture (`Process_NodeActivityLogs`, SignalR envelope) is not governed by these settings and input is unscrubbed; `Obs_*` tables exist with 0 rows and have no engine writer; `Documentation\WorkManagement\observe-panels` is empty (real docs are in `Projects\FlowStudio\ObserverPanels`).

**Status:** research only; unverified items are listed in section 3 of the report.
