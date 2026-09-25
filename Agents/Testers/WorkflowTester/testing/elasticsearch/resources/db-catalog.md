# Elasticsearch Node — DB Catalog

All three pieces a node-engineer pipeline keeps in lockstep, all present and validated (per the
project's own `NodeReport.md`, dated 2026-06-21 — a real coverage-matrix report, not re-derived
here, just pointed to):

Path: `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\DB\ElasticSearch\`

## 1. `Process_ProcessElementTypes` (the registry row)

`ProcessElementTypes\Process_ProcessElementTypes_Elasticsearch.data.sql` — inserts one row,
`Code = 'elasticsearch'`, `Enabled = 1`, `RequiresCredentials = 1`, `IsAsync = 1`,
`SupportsMultipleOutputs = 1`. Its `ConfigurationSchema` column (a coarse top-level JSON schema,
`{ServerUrl, Username, Password, IndexName, Operation}`) is a summary shape only — the authoritative
per-operation schema is the 10 Atlas Forms below, not this column. `InputPortsSchema` /
`OutputPortsSchema` define the generic `input` → `success`/`error` port shape shared by every
operation instance of this node type.

## 2. `Atlas_Forms` (11 forms — one per operation + one satellite)

Path: `Forms\Atlas_Forms_{FormID}_elasticsearch_{resource}_{operation}.data.sql`

| FormID | Operation | PrimaryUsage |
|---|---|---|
| 20300 | index/create | `node-form-elasticsearch-index-create` |
| 20301 | index/get | `node-form-elasticsearch-index-get` |
| 20302 | index/getMany | `node-form-elasticsearch-index-get-many` |
| 20303 | index/delete | `node-form-elasticsearch-index-delete` |
| 20304 | document/create | `node-form-elasticsearch-document-create` |
| 20305 | document/get | `node-form-elasticsearch-document-get` |
| 20306 | document/getMany | `node-form-elasticsearch-document-get-many` |
| 20307 | document/search | `node-form-elasticsearch-document-search` |
| 20308 | document/update | `node-form-elasticsearch-document-update` |
| 20309 | document/delete | `node-form-elasticsearch-document-delete` |
| 20310 | satellite/server | `node-form-satellite-elasticsearch-server` |

## 3. `Template_DataTemplates` (11 templates — the palette entries a user drags onto the canvas)

Path: `DataTemplates\Template_DataTemplates_{ID}_elasticsearch-{resource}-{operation}.data.sql`
(IDs 10000109–10000118 for the 10 operations, 10000480 for the satellite). `code: "elasticsearch"`
on all 10 operation templates; `code: "satellite"` / `profileName: "satellite-elasticsearch-server"`
on the satellite one. `configFormId` is intentionally empty on all — form resolution goes through
`PrimaryUsage` matching, not a hardcoded form ID on the template.

## Known, already-flagged, non-blocking issue

`NodeReport.md`'s own Rule 007 check **FAILs**: `headerImageUrl` on all 11 templates points at
`https://bizfirstai.github.io/UserGuides/Images/Icons/elasticsearch.svg` instead of the required
`https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/` CDN prefix. Cosmetic (palette/canvas icon
only) — does not affect config schema, execution, or credential handling. Worth a one-line fix by
whoever owns the node-engineer pipeline, but out of scope for this testing task (no product-adjacent
data files are edited here).

## Coverage verdict (per `NodeReport.md`'s own rule validation, restated for this test plan's use)

10/10 operation routes have a matching form, template, and C# route (`Rule 004`/`Rule 005`). C#
`NodeTypeName` matches the DB `Code` (`Rule 003`). This is what test-plan category 1 ("static config
coverage") re-verifies independently rather than taking the report on faith — see `test-plan.md`
cases 01-03.
