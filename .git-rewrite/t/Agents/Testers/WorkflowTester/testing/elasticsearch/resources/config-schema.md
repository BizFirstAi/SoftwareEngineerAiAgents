# Elasticsearch Node — Config Schema

Cross-checked source: Atlas Forms (`BizFirstFiDB\...\dbo\Data\projects\DB\ElasticSearch\Forms\`) vs.
the C# `LoadFrom(ConfigDataPropertyBag reader)` / `Validate()` methods in
`BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\DB\ElasticSearch\BizFirst.Ai.ExecutionNodes.DB.ElasticSearch\Main\Features\`.
Both agree on every field below — no schema drift found between the on-canvas form and the runtime
reader as of this pass (2026-08-23).

## Base fields (every operation — `BaseElasticSearchOperationInfo`)

| Field | Config key | Type | Required | Notes |
|---|---|---|---|---|
| Host | `host` | text | **Yes** | Must start with `http://` or `https://` (`ElasticSearchNodeExecutorSettings.Validate()` rejects bare `host:port`). |
| Username | `username` | text | Yes (unless vault credential supplies it — see `credentials.md`) | |
| Password | `password` | password | Yes (unless vault credential supplies it) | Never serialized back out (`ToDictionary()` omits it). |
| Allow Insecure SSL | `allowInsecure` | switch | No (default `false`) | Skips TLS cert validation — for self-signed/private certs. |

Resource/operation selection (`resource`, `operation`) is read by the base settings class before any
operation-specific fields; the Atlas Form encodes this as two read-only badge controls
(`_badge_resource` / `_badge_operation`) rather than user-editable fields — each of the 10 forms is
already scoped to one fixed (resource, operation) pair.

## Index operations

| Operation | Extra fields | Required | Validation |
|---|---|---|---|
| `index` / `create` | `indexName` (text), `mappings` (JSON), `settings` (JSON) | `indexName` required | `VAL_MISSING_INDEX_NAME` if blank |
| `index` / `get` | `indexName` (text) | required | `VAL_MISSING_INDEX_NAME` |
| `index` / `getMany` | `limit` (int, default 50), `returnAll` (switch) | neither required, but `limit` must be `>0` unless `returnAll=true` | `VAL_INVALID_LIMIT` |
| `index` / `delete` | `indexName` (text) | required | `VAL_MISSING_INDEX_NAME` |

## Document operations

| Operation | Extra fields | Required | Validation |
|---|---|---|---|
| `document` / `create` | `indexName`, `documentID` (optional), `fields` (JSON, single mode), `bulk` (switch), `documents` (JSON array, bulk mode), `simplify` (switch) | `indexName` always; `fields` required if `bulk=false`; `documents` (non-empty, valid JSON) required if `bulk=true` | `VAL_MISSING_INDEX`, `VAL_MISSING_FIELDS`, `VAL_MISSING_DOCUMENTS`, `VAL_INVALID_DOCUMENTS_JSON` |
| `document` / `get` | `indexName`, `documentID` | both required | `VAL_MISSING_INDEX`, `VAL_MISSING_DOC_ID` |
| `document` / `getMany` | `indexName`, `limit` (default 50), `returnAll` (switch), `filter` (JSON) | `indexName` required | `VAL_MISSING_INDEX` |
| `document` / `search` | `indexName`, `query` (JSON, **Query DSL**), `limit` (default 50), `returnAll`, `simplify` (default `true`), `aggregations` (JSON, optional) | `indexName` and non-empty `query` required | `VAL_MISSING_INDEX`, `VAL_MISSING_QUERY` |
| `document` / `update` | `indexName`, `documentID`, `fields` (JSON, non-empty) | all three required | `VAL_MISSING_INDEX`, `VAL_MISSING_DOC_ID`, `VAL_MISSING_FIELDS` |
| `document` / `delete` | `indexName`, `documentID` (single mode), `bulk` (switch), `documentIDs` (JSON array, bulk mode) | `indexName` always; `documentID` required if `bulk=false`; non-empty `documentIDs` required if `bulk=true` | `VAL_MISSING_INDEX`, `VAL_MISSING_DOC_ID`, `VAL_MISSING_DOC_IDS` |

## Satellite (shared-connection) variant

A separate node type, `satellite` (profile `satellite-elasticsearch-server`, Atlas Form 20310,
`PrimaryUsage = node-form-satellite-elasticsearch-server`), exposes only `host` and `userName` on
its own form plus an attached credential (see `credentials.md`). Its single output port
(`elasticsearchServer`, diamond handle) property-merges into any connected Elasticsearch operation
node — `mergeWinner: satellite`, so the satellite's values win over anything typed directly into the
operation node's own `host`/`username` fields, when both are wired. This lets one Elasticsearch
Server node supply the connection to many operation nodes on the same canvas instead of re-entering
host/username/password on every one. **Not required** — every operation node above is fully
self-sufficient with its own inline `host`/`username`/`password` fields; the satellite is a
convenience wiring pattern, not a mandatory prerequisite. The worked test plan in this folder uses
one standalone operation node (inline credentials) for simplicity; the satellite pattern is
documented here so a future round can test it explicitly if wanted.

## Output shape

Every operation returns (`Process_ProcessElementTypes.OutputSchema`):
```json
{"result": {"type": "object"}, "executionTimeMs": {"type": "integer"}}
```
Two output ports on every node instance: `success` (main) and `error`. Each feature partial's
concrete success payload varies by operation (e.g. `document create` returns
`{documentID, version, failedCount}` wrapped into the standard `items[]` output array via
`WrapSingleObjectIntoItems`; `document search` returns matched hits — read the specific feature
partial under `Main\Features\{Resource}\{Operation}\` for the exact shape before writing a case that
asserts on it).
