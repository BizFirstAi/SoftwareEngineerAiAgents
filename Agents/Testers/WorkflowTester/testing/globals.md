# Agentic Testing (Nodes) — Shared Facts

Read this before running any node's test round — the mechanics below apply to every node in this
system; each node's own `README.md`/`test-plan.md` only adds what's specific to it.

Sibling system to `Documentation\Employees\agentic-testing\` (that one drives React apps end to end through a browser;
this one drives **Flow Studio / Octopus workflow execution node types** — the building blocks a
user drags onto a workflow canvas, e.g. an Elasticsearch node, an HTTP node, a SQL node). Read
`Documentation\Employees\agentic-testing\globals.md` first if you have not already — the environment/screenshot/verdict
mechanics defined there (backend health check, Passport SSO login pattern, 3-viewport responsive
convention, `results.md` shape) all still apply here. This file only adds what is specific to
testing a **node** instead of an **app**.

## What "node" means here

A node type is a registered entry in `Process_ProcessElementTypes` (`Code` column, e.g.
`elasticsearch`, `http-request`, `sql-server`) with a matching C# executor class under
`BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\...\` (implements `IActionNodeExecution` or
similar, registered via an `INodeExecutorDependency`), one or more Atlas Forms (the node's
on-canvas config panel schema, `PrimaryUsage = node-form-{code}[-{resource}-{operation}]`), and
usually one or more `Template_DataTemplates` rows (the pre-built palette entries a user drags onto
the canvas). A node is **not** a standalone app — it does nothing by itself. It only executes when
wired into a real workflow (`Process_Processes` → `Process_ProcessThreads` →
`Process_ProcessElements` → `Process_Connections`) and that workflow is run. Every mechanic in this
system exists to make that fact testable anyway.

Confirm a node type is real (not proposed/aspirational) before building out a folder for it — find
its `Process_ProcessElementTypes` row (or the DB-side `.data.sql` script that inserts it, typically
under `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\{Category}\{NodeName}\`) **and**
its live C# executor under `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\`. If you can only
find one of the two, that node is half-built — say so plainly rather than treating it as tested.

## What "resources" means for a node

Unlike an app (which has UI screens to catalog), a node's `resources\` folder documents the pieces
that make the node executable:

- **Config schema** — every field the node's Atlas Form(s) expose, cross-checked against what the
  C# settings/`OperationInfo` classes actually read (`LoadFrom(ConfigDataPropertyBag reader)`) —
  the Atlas Form is the source of truth for what a user sees; the C# `LoadFrom`/`Validate` methods
  are the source of truth for what's actually required at runtime. Both should agree; note it in
  `resources\` if they don't.
- **Credentials** — how the node authenticates: inline config fields (e.g. `username`/`password` on
  the operation form itself), a vault-backed credential lookup
  (`ReadCredentialKeyValuePrimaryAsync`-style, `CredentialID` on `Process_ProcessElements`), and/or
  a **satellite node** pattern (a separate connection-holder node type, e.g.
  `satellite-{service}-server`, wired via an output port into every operation node that shares the
  connection, merged in via `NodeFormResolver`/`mergeType: property`). Document which pattern(s)
  this specific node actually supports — don't assume every node uses the same one.
- **Backend project(s)** — the actual C# project path(s) implementing the node (executor +
  integration/domain/services split, if the project uses one), so a fresh agent (or a human) can go
  read the real validation/error-handling logic instead of guessing from the form alone.
- **DB scripts/catalog** — pointers to the node's `Process_ProcessElementTypes` insert script, its
  `Atlas_Forms` script(s), and its `Template_DataTemplates` script(s) — the three things a
  node-engineer pipeline keeps in lockstep (see `project_node_engineer.md`-style NodeReport.md files
  under the DB project's own folder, if one exists — it's often already a validated coverage matrix
  worth reading rather than re-deriving).

Every node folder also needs a single `resource.md` at its root — the index into the above, plus a
feature/capability breakdown (one row per real operation, mapped to a Phase 1 test case) and the
credential-sourcing checklist (see "Credentials" below). See `02-guidelines.md` step 3 for the
required shape, and `elasticsearch\resource.md` for the worked example. `resources\` (plural, the
subfolder) holds the detailed backing docs `resource.md` (singular, the index file) links into —
don't confuse the two.

Every node folder also needs a `lessons\README.md` — a running, dated log of real findings (defects,
pitfalls, technique corrections), read before starting any work on that node and appended to after
any real finding. This makes each node folder a continuously-improving knowledge base, not a one-off
deliverable — see `elasticsearch\lessons\README.md` for the worked example and
`02-guidelines.md`'s "Lessons" section for the full standing requirement, including checking other
nodes' lesson logs for transferable knowledge before starting a new one.

Resources are stable across rounds, same as an app's `resources\` — round-specific output still goes
in `testround\r{N}\`, never here.

## What a node's `test-plan.md` should cover

A node test plan is not a UI click-through — it is a config/execution contract test. Structure it
around:

1. **Static config coverage** — every operation/resource combination the node supports has a real
   Atlas Form, a real C# route, and (if the node uses design-time templates) a real
   `Template_DataTemplates` row. This is a fast, DB/code-level pass before touching a live instance.
2. **Happy-path execution** — valid config, valid credentials, a real external system reachable →
   the node executes and returns the documented success shape. This is the only category of case
   that actually needs live credentials to the external system; every other category below can run
   without them.
3. **Invalid config** — required field missing, malformed value (e.g. host without a scheme) →
   the node's own `Validate()` catches it *before* attempting the call, with a clean, specific error
   message (not a null-reference or an unhandled exception).
4. **Credential failure handling** — config is otherwise valid but the credential is wrong/expired/
   missing → a clean, specific auth error surfaces (not a generic 500, not a stack trace), and it
   surfaces through the same channel a happy-path error would (node's `error` output port /
   Flow Studio's execution inspector), not silently swallowed.
5. **Real data round-trip** (if the node does I/O) — for a node with both write and read/search
   operations, a write-then-read-back pass proves the node genuinely reached the real external
   system and got a real answer, not just a "call succeeded" status. This is the single most
   convincing piece of evidence a node test plan can produce.
6. **Error surface in Flow Studio's UI** — when a node fails mid-workflow, confirm the failure is
   visible and legible in Flow Studio itself (the canvas node shows an error state, the execution
   inspector/observer shows the real error message) — this is the one place claude-in-chrome/browser
   evidence genuinely matters for a node test, same spirit as the `agentic-testing\features\`
   folder's note that screenshots matter "only where a real UI is genuinely part of the flow."
7. **Backend data comparison — required, every case that touches an external system.** Category 5's
   write-then-read-back happens *through the node itself* — that alone is not sufficient evidence,
   because it only proves the node's own two operations agree with each other, not that either one
   actually reached the real system correctly. For every case that writes or queries real external
   data, independently confirm it against the external system's **own** interface — for a node
   backed by a REST API (Elasticsearch, most SaaS integrations), that means a direct `curl`/HTTP call
   to the real API using the same credentials, comparing field-by-field against what the workflow
   claimed. A write case isn't a real Pass until the written record is confirmed to exist, with
   correct field values, via a query the workflow itself had no part in. A search/query case isn't a
   real Pass until its returned results are confirmed to match a direct query run independently. This
   is a permanent, standing requirement for every node type this framework tests, not an
   Elasticsearch-specific extra — bake it into every `test-plan.md`'s Phase 1/Phase 2 cases as their
   own explicit step, not an afterthought.

Every case still gets a Pass/Fail/Blocked verdict per `Documentation\Employees\agentic-testing\globals.md`'s rules —
"Blocked on missing credentials" is an expected, legitimate verdict for category 2/4/5/7 cases when
real external credentials haven't been supplied yet; it is not the same as skipping the case.

**Sequence these into three phases, strictly in order** (per Binoy's explicit instruction — see
`01-Getting-started\` and `02-guidelines.md` for the full rationale): **Phase 0** is category 1
(static coverage) — no live system, no credentials, do this first. **Phase 1** is one small,
isolated workflow per feature/operation (trigger → one node, configured for exactly one
capability) — this is where categories 2/3/4/5/6 actually get exercised, one feature at a time.
**Phase 2** is exactly ONE combined workflow chaining every feature from Phase 1 into a single
realistic end-to-end sequence — built and run **only after** every Phase 1 case has a verdict, never
in parallel with or before Phase 1. `elasticsearch\test-plan.md` is the worked example of this exact
structure.

## How "automated testing" works for a node

A node has no standalone URL to open — "running a round" means building a small, real workflow that
uses the node, executing it, and checking the real result.

**Chrome-driven, through Flow Studio's actual real UI, is the preferred and default method** — use
it unless it is genuinely unusable for the case at hand. Only Chrome-driven testing proves the Atlas
Form itself renders and accepts real user input correctly, and it's the only path that exercises
category 6 (the error-surface-in-the-UI case). A workflow built any other way still needs at least
one Chrome-driven pass before a node can be signed off, per `test-plan.md`'s certification section.

1. **Preferred: Chrome-driven, through Flow Studio's actual UI** (`claude-in-chrome`) — open Flow
   Studio (confirm its dev-server port from its own `vite.config.ts` under
   `BizFirstAiStudio\src\flow-studio\apps\flow-studio\`, don't assume it's already running — start it
   only if truly needed, this machine has ~7.7GB RAM per `Documentation\Employees\agentic-testing\globals.md`), confirm you
   are actually logged in (a session can silently be logged out — check before assuming it works),
   create or open a test project, drag the node's palette template(s) onto the canvas, fill its
   config form with real values, wire it up (a trigger node feeding it, output ports going somewhere
   observable), save, and run it via Flow Studio's own execute/observer surface.
2. **Fallback only: direct DB/API build** — use this **only** when the real UI is genuinely unusable
   for the case at hand (e.g. the browser session is logged out and re-authenticating isn't possible
   in the moment, or a large batch of near-identical isolated Phase 1 cases needs to exist before a
   UI pass is practical) — not as a first choice, and not as a substitute for eventually confirming
   the same workflow through the real UI. Insert the workflow directly (`Process_Processes` →
   `Process_ProcessThreads` → `Process_ProcessElements` with the node's real `ProcessElementTypeID`
   and a config JSON matching its `LoadFrom` schema → `Process_Connections` wiring ports together),
   then execute it via whatever API/service call the backend exposes for running a process. This does
   **not** verify the Atlas Form or the on-canvas error surface — every workflow built this way still
   needs at least one Chrome-driven pass before its node can be signed off (category 6, and to catch
   any form-schema bug a DB-inserted config would silently bypass). Record explicitly in `results.md`
   *why* the fallback was used, not just that it was.

Either way: execute the workflow for real, capture the real result (a screenshot of Flow Studio's
observer/execution panel, and/or the raw execution/output-data JSON if you pulled it via API or DB),
and record what actually happened — not what the config *should* produce.

## Credentials — never fabricate

If a node needs real external credentials (an Elasticsearch connection, an API key, an OAuth token)
to reach the actual external system, you cannot obtain or guess these. Build and verify everything
that doesn't require them (config schema documented, Atlas Form confirmed to render and accept
input, invalid-config cases run for real, the workflow itself built and confirmed to accept a valid-
*shaped* config), then stop at the exact point live execution needs the real credential and ask for
it explicitly — name the exact fields needed (e.g. "Elasticsearch host URL, username, password for
Basic Auth"). Never invent placeholder credentials and record a Pass against them — a category 2/4/5
case run against fabricated credentials is not evidence of anything and must not be recorded as
Pass or Fail; record it as Blocked with the reason.

**Don't stop at "blocked" — tell the operator how to unblock it.** Per Binoy's standing instruction
(the full playbook is in `01-Getting-started\`'s Credentials section and `02-guidelines.md` step 6):
identify a free/trial tier of the real external service, name the exact signup URL, ask the operator
to create the account and open it in the `claude-in-chrome` session, then read the real values from
that open browser session yourself — the operator should never need to understand the node's
internals, and you should never ask them to paste a password into chat. `elasticsearch\resource.md`
§5 is the worked example (Elastic Cloud's free trial, verified live before being recommended).

## Result verdicts, screenshots, `results.md` format

Identical to `Documentation\Employees\agentic-testing\globals.md` — Pass / Fail / Blocked, same `results.md` table shape,
same `testround\r{N}\` / `screenshots\` layout and naming convention, same "never overwrite a prior
round" rule. Not repeated here.

## Related

- `01-Getting-started\index.html` (plain local file — open directly, not hosted) — the narrative
  methodology this file's mechanics support: why this framework exists, the two-phase structure
  explained, the credential-sourcing playbook in full.
- `02-guidelines.md` — the concrete, zero-prior-context procedure for bootstrapping testing on a
  brand-new node type, referencing this file throughout.
- `Documentation\Employees\agentic-testing\globals.md` — the parent system's shared mechanics (environment startup,
  screenshot convention, responsive pass, verdict definitions, `results.md` format).
- `Documentation\Employees\agentic-testing\features\README.md` — closest existing precedent: backend features tested at
  the API level without a dedicated app UI. A node test plan is similar in spirit but scoped to one
  execution-node type instead of one protocol/feature.
