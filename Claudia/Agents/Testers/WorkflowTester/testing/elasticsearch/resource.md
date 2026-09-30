# Elasticsearch Node — Resource Sheet

Single entry point for everything a tester (human or agent) needs before touching this node's test
plan. Detailed backing docs live in `resources\` (`config-schema.md`, `credentials.md`,
`backend-projects.md`, `db-catalog.md`) — this file is the index + the feature/test-case mapping +
the credential-sourcing instructions. Read `..\globals.md` and `..\02-guidelines.md` first if you
haven't already; this file assumes that context.

## 1. Already-reviewed prior work — use it, don't redo it

Binoy has already had this node's DB-side data config built and reviewed once, by a prior
node-engineer pass. It lives at:

```
C:\BizFirstGO_FI_AI\BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\DB\ElasticSearch\
  ProcessElementTypes\Process_ProcessElementTypes_Elasticsearch.data.sql   (the registry row)
  Forms\Atlas_Forms_203{00-10}_elasticsearch_*.data.sql                    (11 Atlas Forms)
  DataTemplates\Template_DataTemplates_100001{09-18}_elasticsearch-*.data.sql (10 op templates)
  DataTemplates\Template_DataTemplates_10000480_satellite-elasticsearch-server.data.sql
  NodeReport.md                                                            (the pipeline's own
                                                                             10/10 coverage-matrix
                                                                             validation report)
```

`NodeReport.md` in that folder is itself a real, dated (2026-06-21) validation pass — 10/10 operation
routes confirmed to have a matching form, template, and C# route; only one FAIL (a cosmetic icon-URL
rule, not a functional issue). This testing round independently re-verified the two load-bearing
facts from it (the DB registry row is real and live — `ProcessElementTypeID=269`, confirmed via
direct `sqlcmd` query on 2026-08-23; the C# executor at `BizFirstPayrollV3\...\ExecutionNodes\DB\ElasticSearch\`
is real and matches) rather than taking it on faith — see `resources\db-catalog.md`. Treat that
folder's file contents as the authoritative, already-approved DB-side source of truth for this node's
config schema, forms, and templates; `resources\config-schema.md` in this folder cross-checks it
against the actual C# runtime code, not against a second copy of the same claims.

## 2. Backend code — already studied, per Binoy's explicit instruction

Three C# projects, confirmed real and current (as opposed to an orphaned duplicate — see
`resources\backend-projects.md` for the full detail on both):

- `BizFirst.Ai.ExecutionNodes.DB.ElasticSearch` — the node executor.
- `BizFirst.Integration.ElasticSearch.Domain` — result/settings models.
- `BizFirst.Integration.ElasticSearch.Services` — the real HTTP client to Elasticsearch.
- `Tests\BizFirst.Ai.ExecutionNodes.Productivity.ElasticSearch.Tests` — **studied and found stale**:
  confirmed via `dotnet build` (2026-08-23) that it references a deleted project and does not
  compile against the current node. Not a source of current regression coverage — see
  `resources\backend-projects.md`'s "Known issue" section for the full finding. This is a real,
  separate defect worth reporting to whoever owns this node (not fixed here — this task doesn't
  touch product code).

## 3. Feature/capability breakdown — one test case per feature

Ten real, independently-routed operations (`Main\Features\{Resource}\{Operation}\` in the executor
project, each with its own Atlas Form and DataTemplate — see `resources\config-schema.md` for full
field-level detail per operation):

| # | Feature (resource/operation) | What it does | Phase 1 test case |
|---|---|---|---|
| 1 | `index` / `create` | Creates an ES index with optional mappings/settings | `test-plan.md` P1-01 |
| 2 | `index` / `get` | Fetches one index's metadata | P1-02 |
| 3 | `index` / `getMany` | Lists indices (paged or all) | P1-03 |
| 4 | `index` / `delete` | Deletes an index | P1-04 |
| 5 | `document` / `create` | Creates one document, or bulk-creates many | P1-05 |
| 6 | `document` / `get` | Fetches one document by ID | P1-06 |
| 7 | `document` / `getMany` | Lists documents in an index, with optional filter | P1-07 |
| 8 | `document` / `search` | Runs a real Query DSL search, with optional aggregations | P1-08 |
| 9 | `document` / `update` | Partially updates one document's fields | P1-09 |
| 10 | `document` / `delete` | Deletes one document, or bulk-deletes many | P1-10 |

Every feature also gets its credential-resolution and invalid-config behavior exercised (shared
across all 10 via the common `BaseElasticSearchOperationInfo`/`ApplyCredentialsAsync` code path — see
`test-plan.md`'s cross-cutting cases, not repeated per feature).

## 4. Phased testing structure (see `test-plan.md` for the actual numbered cases)

**Build method note:** both phases below were built via the direct-DB fallback, not the preferred
Chrome-driven method, because the `claude-in-chrome` Flow Studio session was found logged out at
build time (a legitimate, named trigger for the fallback — see `..\globals.md`). **A Chrome-driven
UI pass through Flow Studio's real UI is still owed for both phases** before sign-off; the DB build
is a fast floor, not a substitute.

- **Phase 1 — isolated, one feature at a time.** One workflow per operation: a `manual-trigger` node
  wired straight into one `elasticsearch` node configured for that single operation. Proves each
  capability works on its own before anything is combined. **Already built (DB fallback)** — 10 real
  workflows, `ProcessID` 1055-1065 — see `workflow-build\build-phase1-isolated-workflows.sql`'s
  header comment for the full ID table, and `testround\r1\results.md` for what's been verified so far.
- **Phase 2 — ONE combined workflow, built only after Phase 1 is complete.** Chains all 10 operations
  into a single realistic index/document lifecycle (create index → create doc → get it → search it →
  update it → list docs → get/list indices → delete doc → delete index), executable in one click.
  **Already built (DB fallback)** — `ProcessID=1066` — see `workflow-build\build-phase2-combined-workflow.sql`.

Every write/query case in both phases also requires an independent backend data comparison — a
direct call to Elasticsearch's own API confirming the real result, not just the workflow's own
reported output (see `..\globals.md` category 7 and `..\02-guidelines.md` Step 5).

Both are built and DB-verified (dry-run confirmed: config JSON round-tripped correctly, wiring
correct, trigger flags correct — see `testround\r1\results.md`). Neither has been **executed** against
a real Elasticsearch cluster yet — see the next section.

## 5. Credential sourcing — Special Instruction from Binoy

> **This is a standing instruction from Binoy, not a one-off note** — it applies to every node type
> tested in this framework going forward (Sajira: read this before your own first node), not just
> Elasticsearch. See `..\02-guidelines.md`'s "Credential sourcing" section for the generalized
> version of this playbook.

When a node needs a real external account/service to actually execute (as opposed to a config-only
check), the Claude agent running the test **cannot** create that account or enter payment details —
that stays a human action (see the platform's own Explicit-permission rules: creating accounts is
never something an agent does on the user's behalf). Instead, the pattern is:

1. **The operator (Binoy, or whoever is running this round) signs up for a free/trial tier of the
   real external service themselves.** For Elasticsearch specifically: **Elastic Cloud's free 14-day
   trial** — sign up at **https://www.elastic.co/cloud/elasticsearch-service/signup**. As of this
   writing (checked live, 2026-08-23) it does not require a credit card to start the trial; a
   deployment is provisioned in a few minutes and gives you a real Elasticsearch endpoint URL plus an
   `elastic` superuser password shown once at creation time. (Confirm current terms on that page
   yourself before relying on this — trial terms change over time; this was verified live today, not
   assumed.)
2. **Open that Elastic Cloud deployment/console in the Chrome browser** the `claude-in-chrome`
   session is already attached to (a new tab is fine — don't touch tabs another concurrent agent
   might be using, per this framework's standing Chrome rule).
3. **Tell the Claude agent it's open.** The agent then reads the real endpoint URL and credentials
   directly from that open browser session (the deployment's "Manage" page shows the Elasticsearch
   endpoint; the initial `elastic` password is shown once at deployment creation — if it's already
   been dismissed, the operator resets it from the deployment's Security settings, still without
   Claude ever handling a password entry field itself), fills in the node's config with the real
   values, and runs live validation — the operator never needs to understand Elasticsearch
   configuration internals themselves.

**What's needed right now, concretely, to unblock Phase 1/Phase 2 live execution:**

- [ ] An Elastic Cloud trial deployment created (or an existing Elasticsearch instance you already
      have, if you'd rather use that instead of a new trial).
- [ ] Its console/deployment page open in the Chrome tab this session is using.
- [ ] Confirmation of whether the throwaway index name `agentic-testing-nodes-elasticsearch-20260823`
      (used in every Phase 1/2 config already built) is fine to create/write/delete freely, or
      whether a different name/prefix should be used instead.

Nothing else is needed from Binoy directly — once the deployment is open in Chrome, the remaining
work (reading the real host/credentials, updating the 11 already-built workflows' `Configuration`
JSON with real values via the same DB technique, executing them, capturing results) is this
framework's own job to complete, not something to hand back to the operator piecemeal.

## 6. What's independently blocking execution right now (unrelated to credentials)

The Consolidated WebApi backend (`https://localhost:10001`) was found unreachable partway through
this session (confirmed via repeated `curl` checks; SQL Server itself stayed up throughout — this is
a WebApi-process issue, not a DB issue). Per this framework's standing rule, its lifecycle is reserved
for direct human action — not restarted as part of this task. Both the `execute-by-id` API path and
any Chrome-driven Flow Studio screenshot pass need it back up. See `workflow-build\README.md` and
`testround\r1\results.md` for the full detail.
