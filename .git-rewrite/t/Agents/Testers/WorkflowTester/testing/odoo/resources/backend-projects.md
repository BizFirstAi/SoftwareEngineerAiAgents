# Odoo Node — Backend Projects

## Confirmed real, currently registered implementation

Path: `BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\RealEstate\Odoo\`

| Project | Role |
|---|---|
| `BizFirst.Ai.ExecutionNodes.RealEstate.Odoo` | The node executor — `OdooNodeExecutor` (routing + 5 feature partials: `Main\Features\OdooNodeExecutor.{Crud,Lead,Activity,Lookup,Trigger}.cs`), settings (`Settings\OdooNodeExecutorSettings.cs`), operation-info DTOs + factory (`Main\OperationInfo\` — `Base\BaseOdooOperationInfo.cs`, `Base\OdooConfigKeys.cs`, `Infos\Odoo{Crud,Lead,Activity,Lookup,Trigger}Infos.cs`, `OdooOperationInfoFactory.cs`), credential resolution (`Main\Executor\OdooNodeExecutor.Credentials.cs`), config plumbing (`Main\Executor\OdooNodeExecutor.Config.cs`), output shaping (`Main\Executor\OdooNodeExecutor.Output.cs`), self-registration (`Support\`). |
| `BizFirst.Integration.Odoo.Domain` | Domain models — `Common\`, `Lead\`, `Support\`, `Trigger\` namespaces (result/request shapes, e.g. `OdooDomain`, `OdooRelationCommand`, `OdooTriggerState`). |
| `BizFirst.Integration.Odoo.Services` | The real JSON-RPC client layer — `Crud\OdooCrudService.cs` + `OdooServiceGuard.cs`, `Lead\OdooLeadService.cs`, `Activity\OdooActivityService.cs`, `Lookup\OdooLookupService.cs`/`OdooLookupModels.cs`, `Transport\` (see below), `StatePersistence\` (trigger poll cursor), `Mapping\`, `Schema\`, `DependencyInjection\`. |

**No `Tests\` project exists for this node anywhere in the repo** — confirmed via a repo-wide search
for `*Odoo*Tests*` on 2026-09-06, zero matches. This is a different situation from Elasticsearch's
(present but stale) — there is simply no unit-test suite at all to run as a pre-live dry run.

## Key facts

- `NodeTypeName`/`ProcessElementTypeCode` = `"odoo"` (matches the DB `Code`, confirmed by direct
  query — `resources\db-catalog.md`).
- Two transports in `BizFirst.Integration.Odoo.Services\Transport\`:
  `OdooJsonRpcTransport.cs` (legacy `common.login` → cached `uid` → `object.execute_kw`, used for
  `usernamePassword` auth mode — `OdooUidCache.cs` caches the `uid` per credential for
  `UidCacheMinutes`, default 30, to avoid re-authenticating on every call) and
  `OdooJsonTwoTransport.cs` (presumably a direct-API-key-based JSON-RPC path for `apiKey` auth mode —
  not yet read line-by-line, named here for the next session to confirm). Both speak the same
  `http://{siteUrl}/jsonrpc` endpoint this session already manually exercised (`common.login`,
  `res.partner` `create`/`search_read`/`unlink`) against the real local Odoo instance — see
  `credentials.md`.
- `OdooApiClientOptions.cs` (bound from the `Odoo` config section, `HttpClientName =
  "BizFirst.Odoo"`): 30s timeout, 3 retries with exponential backoff (transient faults only — Odoo
  Community has no platform rate limit), a 10,000-row `ResultSetCeiling` on unbounded reads (Odoo's
  `search_read` has no server-side cap, so the client requests `ceiling + 1` and fails loudly rather
  than silently truncating), 6-hour `fields_get` schema cache.
- `OdooFaultMapper.cs` and `OdooRpcException.cs` (in `Transport\`) suggest a structured error-mapping
  layer from raw Odoo JSON-RPC faults to this node's own error codes — not yet read in detail; do
  this before writing P1-CROSS-01 (invalid-config) test cases so the expected error codes are real,
  not guessed.
- `OdooServiceGuard.cs` (in `Crud\`) — name suggests a shared precondition/validation layer for CRUD
  operations; not yet read in detail.

## No duplicate/decoy folder found

Searched for any second folder matching `Odoo` under `BizFirstPayrollV3\...\ExecutionNodes\` on
2026-09-06 — only one exists, at `RealEstate\Odoo\`. Unlike Elasticsearch, there is no
`Productivity\Odoo\`-style decoy to rule out for this node.

## DB-side project (Atlas Forms / DataTemplates / registry row)

Path: `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\RealEstate\Odoo\` — see
`db-catalog.md` in this same `resources\` folder.
