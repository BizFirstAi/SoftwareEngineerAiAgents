# Elasticsearch Node — Backend Projects

## Confirmed real, currently registered implementation

Path: `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\DB\ElasticSearch\`

| Project | Role |
|---|---|
| `BizFirst.Ai.ExecutionNodes.DB.ElasticSearch` | The node executor itself — `ElasticSearchNodeExecutor` (routing + 10 feature partials under `Main\Features\{Index,Document}\{Operation}\`), settings (`Main\Settings\ElasticSearchNodeExecutorSettings.cs`), operation-info DTOs + factory (`Main\OperationInfo\`), credential resolution (`Main\Executor\ElasticSearchNodeExecutor.Credentials.cs`), self-registration (`Support\ElasticSearchNodeExecutorDependency.cs`). |
| `BizFirst.Integration.ElasticSearch.Domain` | Domain models/results/settings for the ES integration (`Results\`, `Settings\`) — e.g. `DocumentSearchResult`, `IndexCreateResult`, `ClusterHealthResult`. |
| `BizFirst.Integration.ElasticSearch.Services` | `IElasticSearchService`/`ElasticSearchService` — the actual HTTP client layer that talks to a real Elasticsearch cluster. `Support\ElasticSearchServicesExtensions.cs` is the DI registration (`services.AddElasticSearchServices()`, called from the node's own dependency class). |
| `Tests\BizFirst.Ai.ExecutionNodes.Productivity.ElasticSearch.Tests` | **Stale — does not currently build.** See "Known issue" below. |

**Key facts:**
- `NodeTypeName` / `ProcessElementTypeCode` = `"elasticsearch"` (constant in `ElasticSearchNodeExecutor.cs`).
- Base class: `ResourceBasedNodeExecutor`; interface: `IActionNodeExecution`.
- Routes on `(mySettings.Resource, mySettings.Operation)` — 10 valid pairs, unmatched pairs fall
  through to `base._ExecuteInternal_Route_Async(...)`.
- `Docs\DevelopmentHistoryLog.md` (in the executor project) documents a 2026-06-05 "Rule_011
  compliance pass" that migrated this node from a bare `BaseNodeExecutor` to
  `ResourceBasedNodeExecutor` — worth reading before assuming any older doc/blog/summary about this
  node's shape is still accurate.

## Known issue: stale/orphaned test project

`Tests\BizFirst.Ai.ExecutionNodes.Productivity.ElasticSearch.Tests\` (folder still nested under the
current `DB\ElasticSearch\` path, but its own namespace/`RootNamespace` is the **old**
`BizFirst.Ai.ExecutionNodes.Productivity.Elasticsearch.Tests`, referencing a project
—`BizFirst.Ai.ExecutionNodes.Productivity.Elasticsearch.csproj`— that no longer exists on disk
(pre-dates the 2026-06-05 move to `DB\ElasticSearch`). Confirmed via `dotnet build` on
2026-08-23: **9 build errors**, the key one being
`MSB9008: The referenced project ..\BizFirst.Ai.ExecutionNodes.Productivity.Elasticsearch\...csproj does not exist`,
cascading into missing-type errors for `IElasticsearchService`/`ElasticsearchNodeExecutor` (lowercase
`s`, the old class names) throughout `Fixtures\ElasticSearchTestFixtures.cs` and every file under
`Unit\`/`Integration\`.

**This means:** there is currently no working `dotnet test` unit-test suite to run as a pre-live
"dry run" for this node — despite `Tests\TEST_EXECUTION_REPORT.md` in the same folder claiming
"87/87 passing" (dated 2026-05-12, i.e. *before* the June refactor; that report is stale evidence
from the old, now-deleted project, not the current one). Do not cite that report as current
regression coverage. This is a real gap worth flagging to Binoy separately from this testing task —
whoever owns this node should either delete the orphaned test project or repoint/rewrite it against
the current `BizFirst.Ai.ExecutionNodes.DB.ElasticSearch` namespace and class names. Not fixed here —
this testing-infrastructure task does not touch product code.

## Duplicate/empty folder — not the real implementation

`BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\Productivity\Elasticsearch\` exists but contains
**no C# source** — only `.vs\` (VS scratch) and `obj\` (build-artifact) folders, no `Main\`, no
`.csproj` with real content, and it is **not referenced by any `.sln`** in the repo (confirmed via
grep across `BizFirstPayrollV3\...\Solutions\`). This is what the orphaned test project above used to
reference before it was deleted from disk. Ignore this path — `DB\ElasticSearch\` above is the sole
real, currently-registered node.

## DB-side project (Atlas Forms / DataTemplates / registry row)

Path: `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\DB\ElasticSearch\` — see
`db-catalog.md` in this same `resources\` folder.
