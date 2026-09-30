# Elasticsearch Node — Test Plan

Read `..\globals.md`, `..\02-guidelines.md`, and `resource.md` first. Structured per Binoy's explicit
two-phase instruction: **Phase 1 (isolated, one feature at a time) must be fully run before Phase 2
(the combined chained workflow) is attempted.** Every case below maps to a real, already-built
workflow (see `workflow-build\` and `resource.md` §4) — this plan is not hypothetical.

Cross-cutting categories from `..\globals.md` are folded into each phase below rather than repeated
per operation: static config coverage (category 1) is verified once, up front; invalid config
(category 3) and credential failure (category 4) are each verified with one representative case
(the failure code path is shared across all 10 operations via `BaseElasticSearchOperationInfo`, so
one solid case proves the pattern rather than needing ten near-identical repeats); happy path
(category 2), data round-trip (category 5), and UI error surface (category 6) genuinely need one
real pass per feature and are what Phase 1/Phase 2 exist for.

## Phase 0 — Static config coverage (no live system, no credentials needed)

### P0-01 — Registry, executor, and DB catalog agree

**Steps:** Confirm `Process_ProcessElementTypes.Code = 'elasticsearch'` exists and is `Enabled=1`
(`SELECT ProcessElementTypeID, Code, Enabled FROM Process_ProcessElementTypes WHERE Code =
'elasticsearch'`); confirm the C# `NodeTypeName`/`ProcessElementTypeCode` constant in
`ElasticSearchNodeExecutor.cs` equals `"elasticsearch"`; confirm all 11 Atlas Forms and 11
DataTemplates listed in `resources\db-catalog.md` exist.
**Expected:** all present, IDs match `resources\db-catalog.md`.
**Status:** **Pass** — verified live 2026-08-23 via direct `sqlcmd` query: `ProcessElementTypeID=269`,
`Code='elasticsearch'`. C# constant confirmed by reading `ElasticSearchNodeExecutor.cs` directly.
Forms/templates confirmed present on disk per `resources\db-catalog.md` (derived from the DB
project's own `NodeReport.md`, itself dated 2026-06-21).

### P0-02 — Atlas Form fields agree with C# `LoadFrom`/`Validate`

**Steps:** For each of the 10 operation forms, cross-check every field ID against the matching
`*Info.cs` class's `LoadFrom(ConfigDataPropertyBag reader)` keys and `Validate()` requirements.
**Expected:** no drift — every form field has a matching reader call, every `Validate()` requirement
has a matching required form field.
**Status:** **Pass** — done directly, file-by-file, 2026-08-23; see `resources\config-schema.md` for
the full field table this case produced. No drift found.

### P0-03 — Stale test project does not silently claim current coverage

**Steps:** Attempt `dotnet build` on
`Tests\BizFirst.Ai.ExecutionNodes.Productivity.ElasticSearch.Tests\`.
**Expected:** either it builds and passes (real current coverage), or it fails cleanly and that
failure is documented so nobody cites its `TEST_EXECUTION_REPORT.md` as current.
**Status:** **Fail (real defect, not a testing-framework issue)** — 9 build errors, references a
deleted project (`BizFirst.Ai.ExecutionNodes.Productivity.Elasticsearch.csproj`). See
`resources\backend-projects.md`'s "Known issue" section. Reported, not fixed (out of scope for this
task). `TEST_EXECUTION_REPORT.md`'s "87/87 passing" claim is stale, pre-dates the refactor.

---

## Phase 1 — Isolated, one feature at a time

**Rule: every Phase 1 case below must reach a verdict before Phase 2 is attempted — do not build or
run Phase 2 in parallel.** Each case is one real workflow: `manual-trigger` → one `elasticsearch`
node configured for exactly that operation.

**Build method note:** these 10 workflows were built via the direct-DB fallback
(`workflow-build\build-phase1-isolated-workflows.sql`, already run — see its header for real IDs),
because the `claude-in-chrome` Flow Studio session was found logged out at build time — not because
the DB path is preferred (it isn't; see `..\globals.md` and `workflow-build\README.md`). **A
Chrome-driven redo/confirmation pass through Flow Studio's real UI is still owed** for every case
below before it can be signed off — this is tracked explicitly in part (a).

Every case has four parts, run in this order:
- **(a) UI confirmation (preferred method) — open the workflow in Flow Studio via `claude-in-chrome`**,
  confirm the node's Atlas Form renders with the right fields and the saved config is visible; ideally
  rebuild/re-verify the case through the UI directly rather than only inspecting the DB-built version.
  **Blocked on the Consolidated WebApi backend being reachable** (see `resource.md` §6) — Flow
  Studio's dev server proxies `/api` to it — and on confirming the browser session is actually logged
  in.
- **(b) Build verification (fallback method, already done)** — the DB-level build/read-back check for
  all 10 (see Phase 1 Build Verification table below). Only a floor, not a substitute for (a).
- **(c) Live execution** — `POST .../execute-by-id` with the real `ProcessID`, per
  `workflow-build\README.md`. **Blocked on Elasticsearch credentials** (see `resource.md` §5) for a
  genuine happy-path Pass; not blocked for confirming a clean connection/auth error surfaces (the
  configs currently use a fake host/password on purpose — see below).
- **(d) Backend data comparison (required for any write/query case, not optional)** — independently
  confirm the result against Elasticsearch's own API directly (`curl` with the same credentials), not
  just against the node's own reported output or another node's read-back in the same workflow. See
  `..\globals.md`'s category 7 and `..\02-guidelines.md` Step 5's "Verifying against the real backend,
  independently." A write case (P1-01, 05) isn't a real Pass without this; neither is a query case
  (P1-03, 07, 08).

### Phase 1 Build Verification (part (b), fallback-method floor — done for all 10, 2026-08-23)

| Case | Feature | ProcessID | Config JSON round-trip confirmed | Wiring confirmed |
|---|---|---|---|---|
| P1-01 | index/create | 1056 | Pass | Pass |
| P1-02 | index/get | 1057 | Pass | Pass |
| P1-03 | index/getMany | 1058 | Pass | Pass |
| P1-04 | index/delete | 1059 | Pass | Pass |
| P1-05 | document/create | 1060 | Pass | Pass |
| P1-06 | document/get | 1061 | Pass | Pass |
| P1-07 | document/getMany | 1062 | Pass | Pass |
| P1-08 | document/search | 1055 | Pass | Pass |
| P1-09 | document/update | 1064 | Pass | Pass |
| P1-10 | document/delete | 1065 | Pass | Pass |

"Config JSON round-trip confirmed" = the `Process_ProcessElements.Configuration` column was read back
via `sqlcmd` after insert and matches the intended JSON exactly (proves the direct-DB build path
itself is reliable, and that each config is syntactically well-formed per the node's own schema).
"Wiring confirmed" = the trigger's `IsTrigger=1` and the `Process_Connections` row
(`main`→`main`) were both read back and correct. See `testround\r1\results.md` for the raw evidence.

### P1-CROSS-01 — Invalid config is rejected cleanly, before any network call

**Goal:** category 3 — pick one representative operation (`document`/`search`, the richest schema)
and confirm each of its `Validate()` failure paths produces a clean, specific error rather than an
unhandled exception.
**Steps:** For `DocumentSearchInfo.Validate()` (see `resources\config-schema.md`), build/execute
three variants: (1) missing `indexName`, (2) missing/empty `query`, (3) `host` without a scheme
(e.g. `localhost:9200`, caught earlier by `ElasticSearchNodeExecutorSettings.Validate()`).
**Expected:** each returns a distinct, documented error code (`VAL_MISSING_INDEX`,
`VAL_MISSING_QUERY`, the host-scheme message) via the node's `error` output port — never a 500,
never a raw exception, and critically: **none of these require reaching a real Elasticsearch cluster**
(validation runs before the service call).
**Status:** **Blocked on backend** — the `execute-by-id` call itself needs the WebApi up; not
blocked on Elasticsearch credentials (this case is designed specifically to not need them). Ready to
run the moment the backend is confirmed back up — no further build work needed.

### P1-CROSS-02 — Credential failure handling

**Goal:** category 4 — confirm `ApplyCredentialsAsync`'s blank-username/blank-password checks fire
cleanly.
**Steps:** Build one throwaway variant of the `document`/`get` config (P1-06's shape) with `username`
and `password` both omitted (no vault credential attached either), execute it.
**Expected:** `CFG_MISSING_USERNAME` (checked first) via the `error` port — again, before any network
call, so this **also does not need real Elasticsearch credentials**, only the backend up.
**Status:** **Blocked on backend**, same as above — not blocked on Elasticsearch credentials. Not yet
built (five-minute addition once the backend is confirmed up — clone P1-06's workflow, drop
`username`/`password` from its `Configuration`).

### P1-01 through P1-10 — UI pass, happy path, and backend-verified data (parts (a)/(c)/(d))

**Status: Blocked on three independent, named things:** (1) the Chrome/Flow Studio UI pass (part a) —
blocked on the backend being reachable and on confirming the browser session is logged in; (2) a
genuine happy-path execution (part c) — blocked on real Elasticsearch credentials (see `resource.md`
§5) and the backend; (3) backend data comparison (part d) — blocked on the same credentials, since it
requires a direct call to the real Elasticsearch API. What *is* available without any of these:
attempting `execute-by-id` against the current fake-host configs would, once the backend is back up,
produce a real (not fabricated) connection-failure error — useful evidence for "does the node surface
a clean external-system-unreachable error," but explicitly **not** a substitute for a real happy-path
Pass. Do not record any of P1-01..10 as Pass until: executed through the real UI, executed against a
real Elasticsearch endpoint, **and** independently confirmed against Elasticsearch's own API directly
(not just against another node's read-back in the same workflow — e.g. P1-05's created document being
fetched back by P1-06 through the workflow is not sufficient; it must also be confirmed via a direct
API call outside the workflow).

---

## Phase 2 — Combined chained workflow (only after every Phase 1 case above has a verdict)

One workflow, `ProcessID=1066` (`workflow-build\build-phase2-combined-workflow.sql`, built via the
DB fallback for the same reason as Phase 1 — see `workflow-build\README.md`), chaining all
10 operations sequentially: index-create → document-create → document-get → document-search →
document-update → document-getMany → index-get → index-getMany → document-delete → index-delete.
**A Chrome-driven UI pass through Flow Studio is still owed for this workflow too** — building it via
the DB fallback does not exempt Phase 2 from the same UI-first standard as Phase 1.

### P2-01 — Build verification (fallback-method floor)

**Status:** **Pass** — verified 2026-08-23: all 11 elements (1 trigger + 10 ES steps) and 10
connections read back correctly via `sqlcmd`; each step's `Configuration` matches its intended JSON;
chain wiring (`step N`'s `success`/`main` → `step N+1`'s `main`) confirmed correct end to end. See
`testround\r1\results.md`. Not a substitute for a Chrome-driven UI confirmation, still pending.

### P2-02 — Full chain executes end to end against a real cluster, independently backend-verified

**Expected:** all 10 steps complete in `success`, in order, with `document-search` (step 4) actually
finding the document `document-create` (step 2) wrote, and `document-get`/`document-getMany`
similarly reflecting real state from earlier steps. **This alone is not sufficient for a Pass** — per
`..\globals.md` category 7, the workflow's own step-to-step agreement only proves internal
consistency, not correctness against the real cluster. Also required: at least one direct
`curl`-against-Elasticsearch confirmation (e.g. `GET /{index}/_doc/{id}` for the document
`document-create` wrote, compared field-by-field against what was sent) run independently of the
workflow, after the chain completes.
**Status:** **Blocked on Elasticsearch credentials + backend reachability + a Chrome-driven UI pass**
— not runnable until all three are resolved (see `resource.md` §5/§6). Ready to execute the moment
they are — no further build work needed on this case.

---

## Certification / sign-off

See `testround\r1\results.md` for the running record. Per Binoy's instruction, end-to-end testing
across all 10 features (Phase 1 individually + Phase 2 combined) must reach a real verdict — executed
through Flow Studio's real UI as the method of record (not just DB-built and API-executed), with real
screenshots for the UI-facing cases, and with every write/query case independently confirmed against
Elasticsearch's own API directly — before this node can be signed off. Current state: build and
static-verification cases are Pass; live-execution and UI-confirmation cases are honestly Blocked on
three independent, named prerequisites (a Chrome-driven Flow Studio UI pass, real Elasticsearch
credentials, backend reachability) — not silently skipped, not fabricated.
