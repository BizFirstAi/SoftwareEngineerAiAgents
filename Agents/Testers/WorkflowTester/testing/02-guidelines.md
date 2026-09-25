# Guidelines — Bootstrapping Node Testing For a New Node Type

Written for a junior operator (human or Claude agent) with **zero prior context** on this framework,
bootstrapping node testing for a node type that doesn't have a folder here yet. If you're looking for
the *why*/high-level methodology first, read `01-Getting-started\` (the published overview) before
this — this file is the concrete step-by-step "how do I actually do it," using the Elasticsearch pass
(`elasticsearch\`) as the one fully worked example throughout. Read `globals.md` too — it defines the
shared vocabulary (Pass/Fail/Blocked, what "resources" means, the two-phase structure) this file
assumes.

## Lessons — read first, write always

**Before Step 0, before anything else**: this framework maintains its own knowledge, cross-node,
on purpose. Two standing requirements, for every node type, not just Elasticsearch:

1. **Check every existing node's `{node-slug}\lessons\README.md` for something transferable before
   starting work on a new node type.** A pitfall or pattern found on one node often applies directly
   to the next — e.g. `elasticsearch\lessons\README.md` documents a decoy/orphaned duplicate-named
   folder trap, a stale `TEST_EXECUTION_REPORT.md` claiming coverage a broken test project can't
   actually produce, the credential-sourcing pattern in practice, and concrete T-SQL gotchas in the
   direct-DB build fallback (`EXEC sp_executesql` rejecting a concatenation expression as a named
   parameter value, `SET QUOTED_IDENTIFIER ON`/`SET ANSI_NULLS ON` being required for these specific
   tables) — all of these are generic enough to bite the next node too, not Elasticsearch-specific.
   This is meant to be cross-pollinating institutional knowledge across every node-type testing
   effort in this framework, not siloed per node — read the other logs, don't rediscover their
   findings from scratch.
2. **Create your own node's `{node-slug}\lessons\README.md` from day one, not as an afterthought.**
   Copy `elasticsearch\lessons\README.md`'s header/instruction block verbatim (the "must read
   first, must append on every real finding" rule) and start logging real findings as they happen —
   don't wait until the node is "done" to backfill it, and don't leave it as empty placeholder
   scaffolding. Same format as `agentic-coding\atlas-form-automation-project\lessons\README.md`:
   newest entries first, dated, short and specific (what was assumed, what turned out true/false,
   what to do differently), biased toward the surprising and concrete over generic advice. Every real
   finding, defect, or process improvement discovered while testing a node **must** be appended before
   that work is considered done.

## Step 0 — Confirm the node type is real before doing anything else

Do not build a folder for a node type that doesn't actually exist yet. Confirm **both** of these are
real:

1. **A live registry row.** Find it two ways, cross-check them:
   - **On disk**: search `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\` for a
     folder named after the node (category subfolder + node name, e.g.
     `DB\ElasticSearch\`, `RealEstate\Odoo\`). Look for a `ProcessElementTypes\*.data.sql` file
     inserting into `Process_ProcessElementTypes` with `Code = '{your-node-code}'`. If that project
     folder also has its own `NodeReport.md`, read it — it's often a real, already-validated
     coverage matrix (form/template/C#-route lockstep) you can build on instead of re-deriving.
   - **Live in the DB**: `sqlcmd -S .\SQLEXPRESS -d data-ocean-platform-prod -E -C -Q "SELECT
     ProcessElementTypeID, Code, Enabled FROM Process_ProcessElementTypes WHERE Code =
     '{code}'"` — confirms the `.sql` script was actually applied, not just sitting in the repo
     unapplied. Get the connection string from
     `BizFirstPayrollV3\src\mvc-server\Solutions\AiUltimate\BizFirst.Ai.Consolidated.WebApi\appsettings.Development.json`'s
     `DefaultConnection` if `.\SQLEXPRESS` / `data-ocean-platform-prod` isn't right for your
     environment.
2. **A live C# executor.** Search
   `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\` (note: this path's actual casing on disk is
   `Ai\ExecutionNodes`, both resolve fine on Windows) for a project whose name matches the node. The
   category subfolders as of this writing: `Ai`, `Blockchain`, `Cloud`, `Config`, `Core`, `Database`,
   `DB`, `Distributed`, `Documents`, `Enterprise`, `FlowAiAgent`, `Gateways`, `IaaS`, `Mail`,
   `Octopus`, `Productivity`, `Providers`, `RealEstate`, `ScrapeApi`, `Social`, `Standard` — a new
   node type usually lands in whichever of these its integration category fits, not always the one
   you'd guess first (Elasticsearch is `DB\ElasticSearch\`, not `Productivity\Elasticsearch\` — see
   the pitfall below). Confirm the executor class's `NodeTypeName`/`ProcessElementTypeCode` constant
   matches the DB `Code` from step 1 exactly.

**Pitfall worth naming explicitly**: a node can have a stale, empty, or duplicate-named folder
sitting alongside the real one (`Productivity\Elasticsearch\` existed with **no real C# source** —
only IDE scratch/build-artifact folders — while the real implementation was at `DB\ElasticSearch\`,
confirmed by checking which folder is actually referenced by any `.sln`). Don't assume the
first folder you find by name is the real one — verify it has real `Main\`/`Support\` source and is
referenced by a solution file, or check DI registration
(`services.AddTransient<{X}NodeExecutor>(); ExecutorRegistry.Register<{X}NodeExecutor>(...)` in a
`*NodeExecutorDependency.cs` file) before committing to it.

**If you can only confirm one of the two** (a DB row with no matching executor, or an executor with
no DB row), the node type is half-built. Say so plainly to whoever asked for testing and ask whether
they want a different, fully-real node type instead — don't build out a full test framework folder
for something that can't actually execute yet.

## Step 1 — Build the folder structure

```
agentic-testing-nodes\{node-slug}\
  README.md          orientation — what it is, registry code, executor path, status
  resource.md         THE index file — see step 3
  resources\           backing detail docs (config-schema.md, credentials.md, backend-projects.md,
                       db-catalog.md) — resource.md links into these, doesn't duplicate them
  test-plan.md         Phase 0 (static coverage) + Phase 1 (isolated per-feature) + Phase 2 (combined)
  workflow-build\       the actual automation — SQL build scripts + a README explaining execution
  lessons\README.md      running, dated log of real findings — create this NOW, not later, see
                       "Lessons — read first, write always" above
  testround\r1\         created once a round actually runs — results.md + screenshots\/evidence\
```

Copy this shape from `elasticsearch\` directly — it's the one fully-built worked example, not just a
description of the shape.

## Step 2 — Read the node's real config schema and credential model

Don't guess the config schema from the Atlas Form alone, and don't guess it from the C# alone — read
both and cross-check:

- The C# settings class (`*NodeExecutorSettings.cs`) and its operation-specific `*Info.cs`/DTO
  classes' `LoadFrom(ConfigDataPropertyBag reader)` methods are the **runtime truth** — every
  `reader.ReadConfigByKey(...)` call names a real config key, and every `Validate()` method names a
  real required-field error.
- The Atlas Form(s) (`Atlas_Forms` rows with `PrimaryUsage = node-form-{code}[-{resource}-{operation}]`)
  are the **on-canvas truth** — what a user actually sees and can type into.
- Write down every field, cross-checked, in `resources\config-schema.md` — see `elasticsearch\resources\config-schema.md`
  for the exact table format that worked well (one table per resource/operation, base fields once at
  the top).
- Read `ElasticSearchNodeExecutor.Credentials.cs`-equivalent file (wherever the node resolves
  auth — vault lookup, inline config, or a satellite/shared-connection node pattern) and document
  which pattern(s) apply in `resources\credentials.md`.

## Step 3 — Write `resource.md` (the index file every node folder needs)

One file, four required sections, modeled on `elasticsearch\resource.md`:

1. **Prior-reviewed DB-side work** — point to the node's own `BizFirstFiDB\...\dbo\Data\projects\{Category}\{Node}\`
   folder explicitly (Forms/DataTemplates/ProcessElementTypes/NodeReport.md if one exists) as an
   already-reviewed resource to use, not redo.
2. **Backend code** — the confirmed-real project path(s) from Step 0, plus whether the node's own
   `Tests\` project (if it has one) actually builds — check with `dotnet build`, don't assume a
   `TEST_EXECUTION_REPORT.md`-style file is current (this is a real, general pitfall — the
   Elasticsearch one was stale after a refactor moved the project).
3. **Feature/capability breakdown** — one row per real operation/capability the node routes on
   (usually one C# feature partial = one row), each mapped to a specific Phase 1 test case ID.
4. **Credential sourcing** — see Step 6 below; this section is mandatory whenever the node needs a
   real external account to execute for real.

## Step 4 — Write the phased `test-plan.md`

Two phases, strictly sequenced — **do not build or run Phase 2 before every Phase 1 case has a
verdict**:

- **Phase 1**: one minimal workflow per feature — a trigger node wired straight into one instance of
  the node under test, configured for exactly one operation/capability. Proves each capability works
  in isolation. Also fold in the cross-cutting, non-per-feature cases here: one representative
  invalid-config case, one representative credential-failure case (these don't need to be repeated
  per feature since the failure code path is usually shared).
- **Phase 2**: built only after Phase 1 is done — ONE combined workflow chaining every feature from
  Phase 1 together into one realistic end-to-end sequence, executable in a single click/execution.
  This is what proves the whole feature set works together, not just individually.
- **Every case that writes or queries real external data also requires a backend data comparison**
  (see Step 5's "Verifying against the real backend, independently" — this is a required step, not
  optional, and applies to Phase 1 and Phase 2 alike, for every node type, not just Elasticsearch).

## Step 5 — Build and execute the workflows

**Chrome-driven, through Flow Studio's real UI, is the preferred and default method — reach for the
direct-DB fallback only when the real UI is genuinely unusable for the case at hand** (a logged-out
session you can't quickly re-authenticate, or a large batch of near-identical isolated Phase 1 cases
where a DB build followed by a confirming UI pass is more practical than clicking through all of them
by hand). Never treat the DB path as a first choice, and never skip the confirming UI pass it still
owes.

### Preferred: build and run it through Flow Studio's actual UI

Via `claude-in-chrome`: open Flow Studio, **confirm you're actually logged in before doing anything
else** (a session can silently be logged out — check, don't assume), open or create a test project,
drag the node's real palette template(s) onto the canvas, fill in its Atlas Form with real values,
wire a trigger into it, save, and execute via Flow Studio's own run/observer surface. This is the
only path that proves the Atlas Form itself renders and accepts input correctly, and the only path
that produces real evidence for the "error surface in the UI" test category — screenshot the canvas
and the execution result either way.

### Fallback only: the direct-DB clone technique

Full worked technique with a real, already-run example (used because the browser session was logged
out at build time, not by default choice — see `elasticsearch\workflow-build\README.md`'s own note on
this): `elasticsearch\workflow-build\README.md` and its two `.sql` scripts. Summary:

1. Find a known-good prior workflow (any real `ProcessID` that already executes cleanly — cloning
   from one avoids hand-typing ~20-35 columns per table, most of which are this project's standard
   DB-audit columns: `Deleted`, `Archived`, `LastModifiedOn/By`, `CreatedOn/By`, `SourceAppID`,
   `ClientAccountID`, `AppDomainID`, `DataDomainID`, `DataSegmentID`, `TenantID`, `ResID`).
2. Use dynamic SQL (`INFORMATION_SCHEMA.COLUMNS` → column list → `INSERT ... SELECT ... FROM
   {table} WHERE {PK} = @knownGoodID`, swapping only the columns you actually need to change via
   string `REPLACE()` on the column list before building the query) to clone
   `Process_Processes` → `Process_ProcessThreads` → `Process_ProcessThreadVersions`.
3. Clone a trigger `Process_ProcessElements` row and one node-under-test row per feature, swapping
   `Name`/`ProcessElementKey`/`Configuration` (your node's real config JSON from Step 2).
4. Wire with `Process_Connections` rows (`main`→`main` covers most simple cases — check the node's
   `InputPortsSchema`/`OutputPortsSchema` if it has non-default ports).
5. **Read every inserted row back** (`SELECT Configuration FROM Process_ProcessElements WHERE
   ProcessElementID = ...`) and confirm it matches exactly — this read-back *is* your Phase 0/1
   "build verification," runnable with zero live credentials and zero backend dependency (pure SQL
   Server, independent of whether the WebApi is up).

Executing a built workflow for real: `POST https://localhost:10001/api/v1/process-engine/execution/execute-by-id`
with a locally-minted JWT — full recipe (claim shape, where the signing key lives, the security
caveat worth repeating to whoever reads it) in `elasticsearch\workflow-build\README.md`'s "Executing
a built workflow for real" section. Don't re-derive this each time — reuse that recipe.

### Verifying against the real backend, independently — required, not optional

Whichever build method you used, a node's own "success" status (or Flow Studio's observer showing
green) is **not sufficient evidence** for any case that touches real external data, and neither is a
read-back performed *through the node itself* (e.g. a `document-search` step in the same chained
workflow that reads back what `document-create` just wrote) — that only proves the node's two calls
agree with each other, not that either one is actually correct against the real system. For every
write or query case, independently confirm against the external system's **own** interface:

- **Write case**: after the node reports success, issue a direct call to the real backend's own API
  (for a REST-backed integration like Elasticsearch: a plain `curl` with the same credentials) and
  confirm the record genuinely exists, field-by-field, matching what was written.
- **Query/search case**: run the same query directly against the real backend and confirm its result
  matches what the workflow returned.

Record both the workflow's own output *and* the independent verification call's raw output side by
side in `results.md` — a Pass on a write/query case requires both, not either alone. This is a
standing requirement for every node type this framework tests, not specific to Elasticsearch.

## Step 6 — Credential sourcing: get real test credentials without the operator needing domain knowledge

**Special Instruction from Binoy — apply this to every node type, not just Elasticsearch:**

When a node needs a real external account/service to execute for real (an API, a database, a SaaS
platform), the Claude agent testing it **cannot** create that account or enter payment/signup
details — that's a human-only action under this platform's own permission rules. The reusable
pattern:

1. **Identify a free or trial tier of the real external service** the node integrates with. Check
   the vendor's actual current signup page yourself (via `WebSearch`/`WebFetch`) rather than assuming
   — trial terms change. Document what you found, with a date, in that node's `resource.md` (see
   `elasticsearch\resource.md` §5 for the worked example — Elastic Cloud's 14-day, no-card-required
   trial, verified live on the date documented).
2. **Ask the operator, explicitly and concretely, to**: (a) sign up for that account themselves —
   name the exact URL; (b) open the resulting console/dashboard in the Chrome tab the
   `claude-in-chrome` session is already using (a fresh tab, not one another concurrent agent might
   be using); (c) confirm to the agent that it's open.
3. **The agent then reads the real connection details directly from that open browser session** (via
   `claude-in-chrome`'s page-reading tools — never by asking the operator to paste a password into
   chat) and updates the already-built workflow(s)' `Configuration` JSON with the real values (same
   direct-DB technique as Step 5 — an `UPDATE` instead of the original `INSERT`), then executes for
   real.
4. **Turn this into a concrete checklist** in that node's `resource.md`, not a vague "waiting on
   credentials" note — name every specific field still needed (see `elasticsearch\resource.md` §5's
   checklist) so the operator knows exactly what to do next without needing to understand the node's
   internals.

## Step 7 — Dispatching a Claude agent to do this work

If you (a human operator) are asking a Claude agent to bootstrap testing for a new node type,
structure the dispatch the way this exact framework was originally commissioned — that dispatch is a
real, worked example of a good one, worth re-reading directly
(`agentic-testing-nodes`'s own commissioning conversation) rather than reconstructing from memory.
The shape that worked:

- **State the destination folder and the sibling precedent explicitly** — "create X, following the
  pattern already established at Y" beats "build a testing thing" every time; it gives the agent a
  real template to match instead of inventing conventions from scratch.
- **Name the concrete worked example up front** (here: Elasticsearch) rather than leaving "pick a
  node" open-ended — but also explicitly authorize the agent to substitute a different real node type
  if the named one turns out not to exist, rather than forcing it to invent one.
- **State the credential boundary explicitly, before the agent starts** — "you cannot obtain real
  credentials, build everything up to that point, then stop and ask" prevents a fabricated Pass far
  more reliably than catching it after the fact.
- **Refine mid-flight, in writing, as understanding sharpens** — this framework's own real spec grew
  through several rounds of concrete additions (the two-phase structure, the `resource.md`
  requirement, the credential-sourcing playbook, this very guidelines file) sent as follow-up
  messages while the agent was already working, not all decided up front. Expect and plan for that
  rather than treating the first message as final.
- **Name the audience** — telling the agent "write for a junior operator with less context than you"
  changes what gets written (this file exists because of that instruction) versus writing for
  yourself.
- **State the sign-off bar explicitly** — "I should be able to sign off at the end, with real
  screenshots" turns a testing pass into a certification artifact instead of a scratch log.

## Step 8 — Certification / sign-off

A node's testround is only ready for sign-off when every Phase 1 case (all features, individually)
and the Phase 2 combined case have a real Pass — not Blocked — backed by real evidence (execution
output + Flow Studio screenshots for anything UI-facing). Until then, record honest Blocked verdicts
with the exact, named prerequisite still missing (per `globals.md`'s verdict rules) — see
`elasticsearch\testround\r1\results.md` for what an honest in-progress certification round looks
like: real Pass on everything verifiable without live credentials/backend, real Blocked (with a
concrete unblock checklist) on everything that needs them, zero fabricated Passes.

**Before considering any work session on this node "done," append a dated entry to
`{node-slug}\lessons\README.md`** for anything genuinely learned — a defect found, an assumption that
turned out wrong, a technique that worked or didn't, a process correction. This isn't a nice-to-have:
the next operator (on this node, or a different one entirely, per the "check other lesson logs" rule
above) depends on it actually being current.
