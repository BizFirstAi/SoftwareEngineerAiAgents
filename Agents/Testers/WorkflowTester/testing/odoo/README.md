# Odoo Node — Agentic Testing

Second node folder built under this framework (after `..\elasticsearch\`, the pilot). Read
`..\01-Getting-started\` (published overview) and `..\02-guidelines.md` first for the general
methodology; this file is the 2-minute orientation for this specific node.

## What this node is

A Flow Studio / Octopus workflow execution node type that talks to a real Odoo instance (Community
or Enterprise) via its JSON-RPC API — **35 operations across 13 resources**: contact (`res.partner`
CRUD, 5 ops), lead (`crm.lead` CRUD + Convert/MarkWon/MarkLost/LogNote/ScheduleActivity, 10 ops),
activity (`mail.activity` CRUD + MarkDone, 6 ops), 8 read-only lookup resources (activity type,
stage, team, tag, lost reason, UTM source/medium/campaign — `getAll` only, 8 ops), a `custom`
resource (CRUD against any arbitrary Odoo model by name, 5 ops), and one polling trigger
(`trigger/poll` — Odoo Community has no outbound webhooks, so a poll-and-diff trigger is the only
way to react to new/changed Odoo records; 1 op).

- **Registry code:** `odoo` (`Process_ProcessElementTypes.ProcessElementTypeID=337`, confirmed live
  via direct DB query on 2026-09-06, not just present as an unapplied script).
- **Executor:** `BizFirst.Ai.ExecutionNodes.RealEstate.Odoo` under
  `BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\RealEstate\Odoo\` — see
  `resources\backend-projects.md`. No decoy/duplicate folder found elsewhere for this node (checked
  the pattern `..\elasticsearch\lessons\README.md` flags — this one's clean).
- **DB-side data (Forms/DataTemplates/registry row):**
  `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\RealEstate\Odoo\` — 35 Atlas Forms
  (36000-36034) + 35 DataTemplates (91020123-91020157); see `resources\db-catalog.md`. No
  `NodeReport.md` in this project folder (unlike Elasticsearch's) — this node's own Forms
  `README.md` is the closest equivalent and is a real, detailed spec doc, just not the same
  coverage-matrix format.

## Why this node is ahead of the Elasticsearch pilot in one specific way

Elasticsearch's round is permanently blocked on *not having* a real external test target. This node
already does: a real local Odoo 19 instance + PostgreSQL 18 was stood up on this dev machine on
2026-09-06 (`Documentation\WorkManagement\LeadFirst\Workflows\Odoo\02-LocalDevEnvironmentSetup.md`,
credentials in the sibling `password.md`), and its JSON-RPC API (`http://localhost:8069/jsonrpc`)
was **manually confirmed live that same day** — `common.login`, `res.partner` `create`, `search_read`
(email-based lookup), and `unlink` all round-tripped correctly against the real Odoo database
(`leadfirst`). That is the **same JSON-RPC protocol** this node's own transport layer
(`OdooJsonRpcTransport.cs`, `OdooApiClientOptions.cs` — see `resources\backend-projects.md`) speaks.
See `resources\credentials.md` for exactly how to point this node's config at that instance.

## Status

**Static coverage confirmed; config schema partially cross-checked; no live workflow built yet.** As
of 2026-09-06:

- Registry row + executor + DB-side project all confirmed real and live — **Pass** (see
  `resource.md` §1-2, `resources\db-catalog.md`).
- Generic CRUD shape (`OdooCreateInfo`/`OdooGetInfo`/`OdooGetAllInfo`/`OdooUpdateInfo`/
  `OdooDeleteInfo` — shared by contact/lead/custom) read directly from source and cross-checked
  against the connection-block fields on all 35 forms — **Pass** (see `resources\config-schema.md`).
  Lead-specific action fields (Convert/MarkWon/MarkLost/LogNote/ScheduleActivity), Activity-specific
  fields, the 8 lookup resources, and the trigger's own fields are catalogued at the config-key
  level (`OdooConfigKeys.cs`) but **not yet cross-checked file-by-file** against each `Info` class the
  way the CRUD shape was — see `test-plan.md` P0-02 for what's left.
- No Phase 1/Phase 2 workflows built yet (DB or Chrome) — this folder is Phase 0 only so far.

See `test-plan.md` for the full breakdown and `resource.md` §5 for what's already available for live
testing.

## Where to look

- `lessons\README.md` — **read this first**, and check `..\elasticsearch\lessons\README.md` too
  (per `02-guidelines.md`'s standing "check other nodes' lessons" rule) — several of its findings
  (decoy-folder check, stale-test-report skepticism, `execute-by-id`+JWT recipe, `Process_*` dynamic-SQL
  gotchas) are general, not Elasticsearch-specific, and apply here too.
- `resource.md` — the index: prior DB-side work, backend code, feature/test-case map,
  credential-sourcing status (already largely solved for this node, unusually).
- `resources\` — backing detail (`config-schema.md`, `credentials.md`, `backend-projects.md`,
  `db-catalog.md`).
- `test-plan.md` — Phase 0 (static, partially done) + Phase 1/Phase 2 (not yet built).
- `workflow-build\` — not created yet; no Phase 1/2 workflows exist for this node yet.
- `testround\` — empty; no round has started yet.

## Starting the next session on this node

1. Read `lessons\README.md` first.
2. Confirm the local Odoo instance is still up: `curl -s -o /dev/null -w "%{http_code}\n"
   http://localhost:8069/web/login` → `200` (it's a Windows service, `odoo-server-19.0` — should
   survive a reboot; if down, the fix is in
   `Documentation\WorkManagement\LeadFirst\Workflows\Odoo\02-LocalDevEnvironmentSetup.md`'s gotchas
   section, not a rebuild).
3. Confirm the Consolidated WebApi backend (`https://localhost:10001`) is up before attempting
   `execute-by-id` or a Chrome-driven Flow Studio pass — it was found down on 2026-09-06, and per
   this framework's standing rule its lifecycle is human-only, not restarted as part of a testing task.
4. Finish P0-02 (full field-level cross-check for Lead/Activity/Lookup/Trigger, not just the generic
   CRUD shape), then move to Phase 1 build — preferably Chrome-driven through Flow Studio's real UI.
