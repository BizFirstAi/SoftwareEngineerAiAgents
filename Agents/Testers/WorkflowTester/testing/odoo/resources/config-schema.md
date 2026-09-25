# Odoo Node — Config Schema

Cross-checked source: `BizFirstFiDB\...\dbo\Data\projects\RealEstate\Odoo\Forms\` (35 forms) vs. the
C# `LoadFrom(ConfigDataPropertyBag reader)` methods in
`BizFirstPayrollV3\...\ExecutionNodes\RealEstate\Odoo\BizFirst.Ai.ExecutionNodes.RealEstate.Odoo\Main\OperationInfo\`.
**Confirmed, file-read, no drift found (2026-09-06):** the connection block and the generic CRUD
shape (`OdooCreateInfo`/`OdooGetInfo`/`OdooGetAllInfo`/`OdooUpdateInfo`/`OdooDeleteInfo` in
`Infos\OdooCrudInfos.cs`) shared by `contact`, `lead`, and `custom`. **Not yet independently
read/cross-checked**: `Infos\OdooLeadInfos.cs` (the lead-specific action operations),
`Infos\OdooActivityInfos.cs`, `Infos\OdooLookupInfo.cs`, `Infos\OdooTriggerInfo.cs` — their config
keys are known (from `OdooConfigKeys.cs`, itself read directly) but the per-class `Validate()`
required-field rules and error codes are not yet confirmed the way Elasticsearch's were. This is the
concrete remaining work for test-plan.md's P0-02.

## Connection block (every operation — `BaseOdooOperationInfo`, orders 1-4 on all 35 forms)

| Field | Config key | Required | Notes |
|---|---|---|---|
| Credential | `credentialID` | No (unless the resolved secret ends up blank at runtime — see `credentials.md`) | Vault reference if numeric; raw API key if not (deliberate inline fallback). |
| Site URL | `siteUrl` | **Yes** — `BuildCredential()` trims/strips trailing slash but does not itself reject blank; not yet confirmed which layer (settings `Validate()`?) rejects a blank/malformed URL before the network call. | e.g. `http://localhost:8069`. |
| Database | `database` | No | Odoo's own DB name; optional if the instance hosts only one. |
| Auth Mode | `authMode` | No (defaults to `apiKey`) | `apiKey` or `usernamePassword` — see `credentials.md` for the resolution paths each implies. |

**Open item**: unlike Elasticsearch's `ElasticSearchNodeExecutorSettings.Validate()` (confirmed to
reject a schemeless host before any network call), the equivalent blank/malformed-`siteUrl` guard
for this node has not yet been located and read. Confirm this before writing P1-CROSS-01
(invalid-config) — don't assume it exists just because the pattern is common in this codebase.

## Generic CRUD shape (`contact`, `lead` base fields, `custom` — confirmed via `OdooCrudInfos.cs`)

| Operation | Config keys | Notes |
|---|---|---|
| `create` | `model` (custom only — fixed by resource for contact/lead), `fields` (JSON object), `relationFields` (JSON, many2many commands: `{"tag_ids":{"mode":"add","ids":[3,7]}}`) | `fields`/`relationFields` merged via `MergeRelations()` into the final `values` dict sent to Odoo's `create`. |
| `get` | `model`, one of `contactID`/`leadID`/`activityID`/`recordID` (first present wins, via `ReadFirstId`), `fieldsList` (CSV) | |
| `getAll` | `model`, `domain` (JSON array of 3-element leaves, ANDed — `[["name","ilike","acme"],["active","=",true]]`), `fieldsList`, `returnAll` (switch), `limit` (default 50 unless `returnAll`), `order` | Maps to Odoo's `search_read`. `resModelFilter`/`resIDFilter` are activity-resource-only extras folded into the domain by `OdooGetAllInfo`. |
| `update` | Same identity + `fields`/`relationFields` as create | |
| `delete` | Same identity resolution as `get` | Maps to Odoo's `unlink`. |

`domain` operator mapping (`MapOperator()`, confirmed): `=`/`==`→Equal, `!=`/`<>`→NotEqual,
`>`/`<`/`>=`/`<=`→as named, `like`/`ilike`→Like, `in`→In, `not in`/`not_in`/`notin`→NotIn,
`child_of`/`childof`→ChildOf; anything else defaults to Equal (silent, not an error — worth a test
case: an unrecognized operator string doesn't fail loudly, it silently becomes `=`).

## Lead-specific actions (`Infos\OdooLeadInfos.cs`) — keys known, classes not yet read

Config keys exist for: `partnerID`, `userID`, `teamID`, `lostReasonID`, `noteBody` (from
`OdooConfigKeys.cs`). Maps to `convert` (Convert-to-Opportunity, presumably needs `partnerID`),
`markWon`, `markLost` (presumably needs `lostReasonID`), `logNote` (presumably needs `noteBody`),
`scheduleActivity` (presumably needs `activityTypeID`/`userID`, shared with the Activity resource).
**Not yet confirmed** which fields are required per action, or their `Validate()` error codes — read
`OdooLeadInfos.cs` directly before writing P1-06..15's invalid-config cases.

## Activity-specific fields (`Infos\OdooActivityInfos.cs`) — keys known, class not yet read

`resModel`, `resID` (the record the activity is attached to), `activityTypeID`, `feedback` (for
`markDone`), plus the shared `resModelFilter`/`resIDFilter` for `getAll`. Not yet confirmed against
the actual class.

## Lookup resources (`Infos\OdooLookupInfo.cs`) — 8 read-only `getAll`s, class not yet read

`activityType`, `stage`, `team`, `tag`, `lostReason`, `utmSource`, `utmMedium`, `utmCampaign` — all
`getAll`-only, presumably sharing the same `domain`/`fieldsList`/`returnAll`/`limit`/`order` shape as
the generic `getAll` above, but not yet confirmed to actually reuse `BuildReadRequest()` versus
having their own simpler implementation.

## Trigger (`Infos\OdooTriggerInfo.cs`, confirmed via `OdooNodeExecutor.Trigger.cs` directly)

| Field | Config key | Notes |
|---|---|---|
| Watch (target resource) | `targetResource` | `lead` (default)/`contact`/`activity`/`custom`. |
| Custom model | `customModel` | Required only when `targetResource=custom` — enforced (`"A custom model is required when Watch is set to Custom model."`, confirmed by reading the feature partial directly). |
| Filter | `filter` | Passed through to the poll request. |
| Fields | `fields` | Passed through. |
| Page size | `pageSize` | Default 100 if `<= 0`. |
| Poll interval | `pollIntervalSeconds` | Key exists in `OdooConfigKeys`; not yet confirmed where/how the executor itself uses it (likely the workflow engine's own trigger-scheduling layer, not this file). |

Poll state (write-date cursor + seen IDs) persists per node instance via `INodeStateStore`, keyed
`odoo:trigger:{ProcessElementKey}` — confirmed by reading `OdooNodeExecutor.Trigger.cs` directly.
State-read/-write failures are swallowed defensively (unseeded on read failure, best-effort on write
failure, "just re-emits next cycle") rather than failing the poll — worth a test case (P1-35) that
confirms a transient state-store hiccup doesn't crash the trigger, only causes an extra re-emit.

## Output shape

Not yet independently confirmed field-by-field per operation (`OdooNodeExecutor.Output.cs` has been
seen to exist but not read in detail) — do this as part of finishing P0-02, mirroring
`elasticsearch\resources\config-schema.md`'s "Output shape" section once done.
