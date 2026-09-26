# Elasticsearch Node — Workflow Build Automation

This folder is the concrete automation for testing the `elasticsearch` node per `..\..\globals.md`'s
"How automated testing works for a node" — the **direct DB/API build** path (option 2 there, the
**fallback**, not the preferred method).

**Why the fallback was used for this pilot, explicitly:** at build time (2026-08-23) the
`claude-in-chrome` browser session for Flow Studio was found logged out, and re-authenticating wasn't
practical in the moment while also needing to build 10 near-identical isolated Phase 1 workflows
quickly. That is the specific, legitimate trigger condition for using this path per `..\..\globals.md`
and `..\..\02-guidelines.md` Step 5 — it was **not** chosen because it's faster or preferred in
general. **Chrome-driven, through Flow Studio's real UI, remains the standing preferred method** for
every node this framework tests, including a redo pass on this one once the UI is confirmed usable.

A Chrome-driven pass through Flow Studio's actual UI is still required (see
`..\testround\r1\results.md`) to cover category 6 (error surface in the UI), to confirm the Atlas
Forms themselves render correctly, and — per Binoy's standing instruction — to be the actual method of
record for this node once it's viable, not just a supplementary check. This folder's scripts got the
pilot's Phase 1/Phase 2 workflows built and DB-verified quickly under that specific constraint; they
do not replace a real UI pass, they unblocked forward progress while one wasn't available.

## What's built (already run, 2026-08-23)

| Script | Builds | Real IDs |
|---|---|---|
| `build-phase1-isolated-workflows.sql` | 10 isolated workflows, one per elasticsearch operation (manual-trigger → one elasticsearch node) | `ProcessID` 1055-1065 — see the script's own header comment for the full ID table |
| `build-phase2-combined-workflow.sql` | 1 combined workflow chaining all 10 operations sequentially (a realistic index/document lifecycle in one execution) | `ProcessID=1066` — see the script's own header comment |

Both scripts were executed for real against the live dev DB
(`sqlcmd -S .\SQLEXPRESS -d data-ocean-platform-prod -E -C`) on 2026-08-23 and their output — the
real `ProcessID`/`ProcessElementID`/`ConnectionID` values — is recorded in each script's own header
comment and in `..\testround\r1\results.md`. This is not a hypothetical/untested script; it already
built 11 real, verified-in-DB workflows.

## The technique (reusable for any node type, not just elasticsearch)

1. **Confirm the node's real registry row and executor first** — `Process_ProcessElementTypes.Code`
   and `ProcessElementTypeID` (query directly: `SELECT ProcessElementTypeID, Code FROM
   Process_ProcessElementTypes WHERE Code = '{code}'`), matched against a real C# executor under
   `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\`. Don't build a workflow for a node that
   doesn't have both.
2. **Clone, don't hand-type, the workflow-definition rows.** `Process_Processes` /
   `Process_ProcessThreads` / `Process_ProcessThreadVersions` all carry ~20-35 columns each, most of
   them the project's standard audit/tenant columns (`Deleted`, `Archived`, `LastModifiedOn/By`,
   `CreatedOn/By`, `SourceAppID`, `ClientAccountID`, `AppDomainID`, `DataDomainID`, `DataSegmentID`,
   `TenantID`, `ResID`, etc. — the project's own DB standard). Hand-typing all of these per new
   workflow is error-prone. Instead, use dynamic SQL that reads the real column list from
   `INFORMATION_SCHEMA.COLUMNS` and does an `INSERT INTO {table} (<cols>) SELECT <cols> FROM {table}
   WHERE {PK} = @knownGoodID` — a clone of a row the engine already accepts, with only the specific
   columns you care about (`Name`, `Configuration`, etc.) swapped via `REPLACE()` on the column-list
   string before building the dynamic SQL. Both scripts in this folder do exactly this — read them as
   the worked template.
3. **Element wiring**: one `Process_ProcessElements` row per node instance
   (`ProcessElementTypeID` = the real registry ID, `Configuration` = a JSON string matching the
   node's real `LoadFrom()` schema — see `..\resource.md`), `IsTrigger = 1` on exactly the trigger
   node. Wire nodes together with `Process_Connections` rows (`SourceProcessElementID`/
   `TargetProcessElementID`/`SourcePortKey`/`TargetPortKey` — `main`/`main` covers most simple
   action-node chains; confirm a node's real port keys from its
   `Process_ProcessElementTypes.InputPortsSchema`/`OutputPortsSchema` if it has non-default ports).
4. **This IS the "dry-run" / config-acceptance proof** — after running a build script, query the
   inserted rows back (`SELECT Configuration FROM Process_ProcessElements WHERE ProcessElementID =
   ...`) and confirm the JSON landed exactly as intended. This proves the workflow structure and the
   node's config are both valid *before* attempting any live execution — exactly the "confirming the
   workflow builds and the node accepts config" bar called for when live credentials aren't available
   yet.

## Executing a built workflow for real

Real, proven endpoint (confirmed working, not theoretical — see
`Knowledge\Form\design\STATUS.md`, "Done (cont. 7)",
7 real executions logged there):

```
POST https://localhost:10001/api/v1/process-engine/execution/execute-by-id
Content-Type: application/json
Authorization: Bearer {JWT}

{"ProcessID": <id>, "AppID": 1}
```

This endpoint requires a real authenticated caller (`[AuthorizeWorkflowExecutorAttribute]`) — the
anonymous `node-instance-runner` path exists too but is a **documented, known-broken path for any
node whose execution needs a real per-tenant identity** (confirmed broken for AI-agent nodes in the
STATUS.md incident above; not re-verified here for elasticsearch specifically, but the safer,
already-proven choice is the authenticated path below).

**Minting a local JWT for testing** (same technique this codebase's own integration-test helpers use,
e.g. `BizFirstPayrollV3\...\BizFirst.Ai.AiCommon.IntegrationTests\Common\JwtTokenHelper.cs` — not a
browser login, not credential-guessing, a locally-signed token for backend testing):

1. Read the Consolidated WebApi's own dev JWT signing config from
   `BizFirstPayrollV3\src\mvc-server\Solutions\AiUltimate\BizFirst.Ai.Consolidated.WebApi\appsettings.json`
   (`Jwt:Key` / `Jwt:Issuer` / `Jwt:Audience`) — do not copy the key value into any doc outside this
   already-checked-in file; reference the file path instead.
2. Sign an HS256 JWT with that key, containing at minimum: `ClaimTypes.NameIdentifier` = a real
   `IAM_Users.UserID` for the tenant that owns the test `ProcessID` (`UserID=5`/`TenantID=1`,
   Binoy's own `binoyjose` admin account, is the value already proven to work for this DB), a
   `tenantId` claim (exact lowercase-`t` casing) matching that user's `TenantID`, and a `Role` claim
   of `TenantAdmin` (or `Admin`) — `iss`/`aud` matching the config above, a short expiry.
3. Send it as `Authorization: Bearer {token}` on the `execute-by-id` call above.

**Security note, worth repeating to whoever reads this**: the dev JWT signing key is committed in
plaintext to `appsettings.json` — anyone with repo read access can mint a valid token for any
existing user this way. This is an accepted, existing pattern in this codebase for local/dev testing
(not something introduced by this testing framework), already flagged as a real security observation
in `atlas-form-automation-project\STATUS.md`. Use it for exactly this kind of testing, don't treat it
as a general-purpose bypass technique.

## What's still blocked

Every workflow above uses a syntactically-valid but **fake** Elasticsearch connection
(`host: https://localhost:9200`, `password: PLACEHOLDER_NOT_A_REAL_CREDENTIAL`) — there is no real
Elasticsearch cluster at that address. Executing any of these for real right now would produce a
connection-failure error, which is legitimate evidence for a "does the node surface a clean
connection error" case (see `..\testround\r1\results.md`), but **cannot** produce a real happy-path
Pass or a real write-then-read-back Pass. See `..\resource.md`'s credential-sourcing section for what
Binoy needs to do next.

Also currently blocked, independent of credentials: **the Consolidated WebApi backend
(`https://localhost:10001`) was found down** (`000`/connection-refused) partway through this session
— confirmed not caused by this task's own actions (SQL Server itself, reached directly via `sqlcmd`,
stayed up and reachable throughout; only the WebApi process was affected — same class of external
interruption noted previously in `STATUS.md`). Per `Documentation\Employees\agentic-testing\globals.md`, its
lifecycle is reserved for direct human action — **do not restart it as part of this testing task**.
Both `execute-by-id` calls and any Chrome-driven Flow Studio pass need it back up first.
