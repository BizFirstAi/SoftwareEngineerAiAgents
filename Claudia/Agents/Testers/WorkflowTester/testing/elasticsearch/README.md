# Elasticsearch Node — Agentic Testing

The first node tested under this framework — the fully-built worked example `02-guidelines.md`
points to. Read `..\01-Getting-started\` (published artifact) and `..\02-guidelines.md` first for
the general methodology; this file is the 2-minute orientation for this specific node.

## What this node is

A Flow Studio / Octopus workflow execution node type that talks to a real Elasticsearch cluster —
10 operations across two resources: index management (`create`/`get`/`getMany`/`delete`) and document
management (`create`/`get`/`getMany`/`search`/`update`/`delete`).

- **Registry code:** `elasticsearch` (`Process_ProcessElementTypes.ProcessElementTypeID=269`,
  confirmed live via direct DB query, not just present as an unapplied script).
- **Executor:** `BizFirst.Ai.ExecutionNodes.DB.ElasticSearch` under
  `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\DB\ElasticSearch\` — see `resources\backend-projects.md`.
- **DB-side data (Forms/DataTemplates/registry row):**
  `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\DB\ElasticSearch\` — already built and
  reviewed by a prior node-engineer pass; see `resources\db-catalog.md`.
- **Note:** a second, empty/stale folder exists at
  `BizFirstPayrollV3\...\ExecutionNodes\Productivity\Elasticsearch\` — not the real implementation,
  contains no real source, ignore it (see `resources\backend-projects.md` for the full explanation).

## Status

**Build-verified, live execution pending.** As of 2026-08-23:

- Static config coverage (registry/executor/DB catalog agreement, Atlas Form vs. C# schema
  cross-check) — **done, Pass**.
- 10 Phase 1 isolated workflows + 1 Phase 2 combined workflow — **built and DB-verified** (real
  `ProcessID`s, config JSON and wiring confirmed correct by reading every row back).
- Live execution against a real Elasticsearch cluster — **blocked**, on two independent, named
  prerequisites: real Elasticsearch credentials (see `resource.md` §5 for the exact ask) and the
  Consolidated WebApi backend being reachable (it went down mid-round; not restarted per standing
  rule). Neither is a testing-framework gap — both are named, concrete, and ready to clear.

See `testround\r1\results.md` for the full, honest round record.

## Where to look

- `lessons\README.md` — **read this first, before anything else below** — the running, dated log of
  real findings on this node (defects, pitfalls, technique corrections). Append a new entry for any
  real finding before considering a work session on this node done — this is a standing requirement,
  not optional.
- `resource.md` — the index: prior DB-side work, backend code, feature/test-case map,
  credential-sourcing checklist.
- `resources\` — backing detail (`config-schema.md`, `credentials.md`, `backend-projects.md`,
  `db-catalog.md`).
- `test-plan.md` — Phase 0 (static) + Phase 1 (isolated, per-feature) + Phase 2 (combined chain).
- `workflow-build\` — the automation itself: two SQL scripts (already run) + the execution recipe
  (JWT minting, `execute-by-id`).
- `testround\r1\` — the actual round record: `results.md` + raw query evidence in `evidence\`.

## Starting the next round

1. Read `lessons\README.md` first.
2. Confirm the Consolidated WebApi backend is reachable
   (`curl -sk -m 5 -o /dev/null -w "%{http_code}\n" https://localhost:10001/swagger/index.html` → `200`)
   — **do not restart it yourself**, see `..\globals.md`.
3. Confirm real Elasticsearch credentials are available per `resource.md` §5 (or proceed with just
   the backend-only cases — `P1-CROSS-01`/`P1-CROSS-02` in `test-plan.md` need only the backend, not
   real credentials).
4. Continue `testround\r1\results.md` in place (this round isn't finished, so it isn't a new round)
   per `test-plan.md`'s "Certification / sign-off" section.
