# Odoo Node — Resource Sheet

Single entry point for everything a tester (human or agent) needs before touching this node's test
plan. Detailed backing docs live in `resources\` (`config-schema.md`, `credentials.md`,
`backend-projects.md`, `db-catalog.md`) — this file is the index + the feature/test-case mapping +
the credential-sourcing status. Read `..\globals.md` and `..\02-guidelines.md` first if you haven't
already; this file assumes that context.

## 1. Already-reviewed prior work — use it, don't redo it

This node's DB-side data (forms, templates, registry row) already exists at:

```
C:\BizFirstGO_FI_AI\BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\RealEstate\Odoo\
  ProcessElementTypes\Process_ProcessElementTypes_Odoo.data.sql   (the registry row)
  Forms\Atlas_Forms_360{00-34}_odoo_*.data.sql                    (35 Atlas Forms)
  Forms\README.md                                                 (spec: PrimaryUsage format,
                                                                    schema layout, deployment)
  DataTemplates\Template_DataTemplates_910201{23-57}_odoo-*.data.sql (35 op templates)
```

Unlike Elasticsearch, this project folder has no `NodeReport.md` coverage-matrix file — `Forms\README.md`
is the closest equivalent (a real, dated spec covering `PrimaryUsage` conventions and schema layout,
not a rule-by-rule validation report). Treat that folder as the authoritative, already-approved
DB-side source of truth for forms/templates; `resources\config-schema.md` in this folder
cross-checks the connection block and the generic CRUD shape against the actual C# runtime code —
see that file for what's been independently verified versus what's read from the DB side only.

## 2. Backend code — confirmed real, no orphaned duplicate found

Three C# projects, all under `BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\RealEstate\Odoo\`
(confirmed real, current, and the only folder of this name in the repo — see
`resources\backend-projects.md` for the full detail):

- `BizFirst.Ai.ExecutionNodes.RealEstate.Odoo` — the node executor.
- `BizFirst.Integration.Odoo.Domain` — domain models (Lead/Support/Trigger namespaces).
- `BizFirst.Integration.Odoo.Services` — the real JSON-RPC client to Odoo (Crud/Lead/Activity/
  Lookup/Transport/StatePersistence).
- **No dedicated `Tests\` project found** for this node (searched `BizFirstPayrollV3` for any
  `*Odoo*Tests*` folder, 2026-09-06 — none exists). This is a different situation from
  Elasticsearch's *stale-but-present* test project — here there's simply no unit-test suite to run
  as a pre-live dry run at all. Not fixed here (out of scope for a testing-framework task) but worth
  flagging to whoever owns this node.

## 3. Feature/capability breakdown — one test case per feature

35 real operations across 5 C# feature partials (`Main\Features\OdooNodeExecutor.{Crud,Lead,
Activity,Lookup,Trigger}.cs`) and 13 resources — see `resources\config-schema.md` for full
field-level detail on the generic CRUD shape; Lead/Activity/Lookup/Trigger-specific fields are
named but not yet fully cross-checked (see `test-plan.md` P0-02).

| # | Resource | Operations | Feature partial | Phase 1 test case(s) |
|---|---|---|---|---|
| 1 | `contact` (`res.partner`) | create, get, getAll, update, delete | `Crud.cs` | P1-01..05 |
| 2 | `lead` (`crm.lead`) | create, get, getAll, update, delete, convert, markWon, markLost, logNote, scheduleActivity | `Lead.cs` | P1-06..15 |
| 3 | `activity` (`mail.activity`) | create, get, getAll, update, delete, markDone | `Activity.cs` | P1-16..21 |
| 4 | `activityType` | getAll | `Lookup.cs` | P1-22 |
| 5 | `stage` | getAll | `Lookup.cs` | P1-23 |
| 6 | `team` | getAll | `Lookup.cs` | P1-24 |
| 7 | `tag` | getAll | `Lookup.cs` | P1-25 |
| 8 | `lostReason` | getAll | `Lookup.cs` | P1-26 |
| 9 | `utmSource` | getAll | `Lookup.cs` | P1-27 |
| 10 | `utmMedium` | getAll | `Lookup.cs` | P1-28 |
| 11 | `utmCampaign` | getAll | `Lookup.cs` | P1-29 |
| 12 | `custom` (any model) | create, get, getAll, update, delete | `Crud.cs` (generic path) | P1-30..34 |
| 13 | `trigger` | poll | `Trigger.cs` | P1-35 |

Every feature also gets its credential-resolution and invalid-config behavior exercised (shared
across all 35 via the common `BaseOdooOperationInfo`/`ResolveVaultCredentialsAsync` code path — see
`test-plan.md`'s cross-cutting cases, not repeated per feature).

## 4. Phased testing structure (see `test-plan.md` for the actual numbered cases)

**Nothing built yet.** Unlike Elasticsearch's pilot round, no Phase 1 or Phase 2 workflow exists for
this node — this folder currently only covers Phase 0 (static coverage). The next session should
build Phase 1, preferably Chrome-driven through Flow Studio's real UI (see `..\globals.md`'s
preferred method) now that a real Odoo target is already available (§5 below) — the DB-fallback
reason that applied to Elasticsearch (logged-out browser session) does not currently apply here.

## 5. Credential sourcing — already solved for this node, unusually

Per `..\02-guidelines.md` step 6 and `..\globals.md`'s standing instruction, a node normally can't be
live-tested until a human sources real external credentials. **For Odoo, this is already done**: a
real local Odoo 19 + PostgreSQL 18 instance exists on this dev machine
(`Documentation\WorkManagement\LeadFirst\Workflows\Odoo\02-LocalDevEnvironmentSetup.md`, credentials
in the sibling `password.md`), and its JSON-RPC endpoint was manually confirmed working end-to-end on
2026-09-06 (login, `res.partner` create, email-based search, delete — all via
`http://localhost:8069/jsonrpc`, the same protocol this node's `OdooJsonRpcTransport` speaks).

**What to configure on any Odoo node instance to point it at this real target:**

| Form field (`OdooConfigKeys`) | Value |
|---|---|
| `siteUrl` | `http://localhost:8069` |
| `database` | `leadfirst` |
| `authMode` | `usernamePassword` |
| Credential (vault, or raw inline per `resources\credentials.md`) | username `<odoo-admin-login>`, password `<redacted: see local ...\Workflows\Odoo\password.md>` |

**One open question before Phase 1 write-cases run against it:** the local `leadfirst` Odoo DB is a
shared throwaway dev instance also used for the LeadFirst Push-to-Odoo workflow design work
(`Documentation\WorkManagement\LeadFirst\Workflows\Odoo\01-PushToOdooWorkflowDesign.md`). Test
records this framework creates (contacts/leads) should use an obviously-fake, greppable naming
convention (e.g. a `agentic-testing-nodes-odoo-` prefix on `name`/`email`) and be cleaned up
(`unlink`) after each round, the same discipline used during the manual connectivity check this
session (create → search_read → unlink), so this node's test data never gets confused with real
LeadFirst design/demo data in the same database.

**Nothing is blocking live execution on the credential side.** The only two things blocking Phase 1
live execution right now are (a) no workflow has been built yet (this is just unstarted work, not a
blocker) and (b) the Consolidated WebApi backend was found down on 2026-09-06 — needed for both
`execute-by-id` and any Chrome-driven Flow Studio pass; not restarted here, per the standing rule
(see `resources\credentials.md` for detail).
