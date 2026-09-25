# `odoo`

Multi-resource Odoo CRM/ERP integration node (contact / lead / activity / custom-model / trigger
resources, 34 actions + 1 polling trigger across 13 resources total), using the same
resource/operation dispatch pattern as `slack`. Talks to Odoo's own JSON-RPC endpoint
(`OdooJsonRpcTransport`, `{siteUrl}/jsonrpc`).

**Not previously in this doc set** — promoted here 2026-09-18 from investigative notes at
`..\..\..\..\Agents\Testers\WorkflowTester\testing\odoo\resources\{config-schema,credentials}.md` (that folder's own test-plan work,
P0-02) plus direct source confirmation for this doc. Source read directly:
`BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\RealEstate\Odoo\
BizFirst.Ai.ExecutionNodes.RealEstate.Odoo\Main\Executor\OdooNodeExecutor.cs` (+ `.Config.cs`) and
`Infos\OdooCrudInfos.cs`. This node lives under the RealEstate vertical package, not the generic
Standard/Core node set `00-overview.md`'s 107-type count tracks — its own count/index isn't touched by
this addition.

- **Node type code**: `odoo` (confirmed via `ProcessElementTypeCode`).
- **Output ports**: `main` / `error` (confirmed via `GetOrCreatePortSuccessAndError()` in
  `ValidateExecutorSettings`).
- **Dispatch**: `(resource, operation)` pair, resolved in `_ExecuteInternal_Route_Async`'s switch
  expression. `contact` and `lead` map to real Odoo models (`res.partner`, `crm.lead` respectively) via
  the same generic CRUD handlers; `custom` uses the same CRUD handlers against a caller-supplied
  `model` name (any Odoo model); `activity` (`mail.activity`) has its own create/getAll/markDone
  handlers; `trigger`/`poll` is a separate polling-trigger resource, not a CRUD one.
- **Important Odoo modeling fact used by this doc's downstream consumers (see
  `Documentation\WorkManagement\email-organizer\design\`)**: Odoo has no separate "company" model —
  a company is a `res.partner` row with `is_company: true` and no `parent_id`; a person-contact under
  that company is a `res.partner` row with `parent_id` pointing at the company's ID. Both "create
  company" and "create contact" therefore use `resource: "contact"`, `operation: "create"` — only the
  `fields` payload differs.

## Connection block (every operation, `BaseOdooOperationInfo.LoadConnection`)

| Field (JSON key) | Type | Required | Notes |
|---|---|---|---|
| `credentialID` | int or string | No (unless the resolved secret ends up blank at runtime) | Vault reference if numeric (`Process_ProcessElements.CredentialID`); if it doesn't parse as an integer, the raw string is used directly as the API key (deliberate inline-fallback tradeoff, documented in code — not an oversight). |
| `siteUrl` | string | **Yes** | Odoo instance base URL, e.g. `http://localhost:8069`. Trimmed/trailing-slash-stripped by `BuildCredential()`, but blank/malformed-URL rejection has not been independently located — don't assume it's guarded before the network call. |
| `database` | string | No | Odoo's own DB name; optional if the instance hosts only one. |
| `authMode` | string enum `apiKey` (default) / `usernamePassword` | No | Selects which vault-credential shape `ResolveVaultCredentialsAsync` expects — see Credentials below. |

**Known gotcha, already fixed in code**: some resolution paths used to only deliver this block inside a
nested `nodeFormValues` object rather than flat top-level keys, leaving `siteUrl`/credential blank at
runtime even with a correctly filled-in form. `ReadConnectionValue()` now falls back to
`nodeFormValues` — worth knowing before assuming a blank `siteUrl` at runtime means the node is
misconfigured.

## Credentials (`OdooNodeExecutor.Credentials.cs` → `ResolveVaultCredentialsAsync`)

1. **`usernamePassword` mode**: vault credential's `Username`/`Password` pair used directly
   (`ReadCredentialKeyValuePrimaryAsync(isMandatory: false)`).
2. **`apiKey` mode (default)**, tried in order: a single-value vault credential used as-is; else a
   key-value vault credential's `Password` side (falling back to `Username`); else, if `credentialID`
   isn't a real vault reference, the raw string is the API key inline.

No satellite/shared-connection node type exists for Odoo (unlike Elasticsearch) — every operation node
carries its own connection block, always.

## `contact` (`res.partner`) / `lead` (`crm.lead`) / `custom` (any model) — shared CRUD shape

Confirmed via `Infos\OdooCrudInfos.cs` (`OdooCreateInfo`/`OdooGetInfo`/`OdooGetAllInfo`/
`OdooUpdateInfo`/`OdooDeleteInfo`).

| Operation | Config keys | Notes |
|---|---|---|
| `create` | `model` (custom only — fixed by resource for contact/lead), `fields` (JSON object), `relationFields` (JSON, many2many commands: `{"tag_ids":{"mode":"add","ids":[3,7]}}`) | `fields`/`relationFields` merged via `MergeRelations()` into the final `values` dict sent to Odoo's `create`. |
| `get` | `model`, one of `contactID`/`leadID`/`activityID`/`recordID` (first present wins, via `ReadFirstId`), `fieldsList` (CSV) | |
| `getAll` | `model`, `domain` (JSON array of 3-element leaves, ANDed — `[["name","ilike","acme"],["active","=",true]]`), `fieldsList`, `returnAll` (switch), `limit` (default 50 unless `returnAll`), `order` | Maps to Odoo's `search_read`. |
| `update` | Same identity + `fields`/`relationFields` as create | |
| `delete` | Same identity resolution as `get` | Maps to Odoo's `unlink`. |

`domain` operator mapping (`MapOperator()`): `=`/`==`→Equal, `!=`/`<>`→NotEqual, `>`/`<`/`>=`/`<=`→as
named, `like`/`ilike`→Like, `in`→In, `not in`/`not_in`/`notin`→NotIn, `child_of`/`childof`→ChildOf;
**an unrecognized operator string silently becomes `=` rather than erroring** — a real footgun if a
domain is authored with a typo'd operator.

### Example — create a company

```json
{
  "resource": "contact",
  "operation": "create",
  "fields": "{\"name\": \"Acme Corp\", \"is_company\": true, \"website\": \"https://acme.com\"}"
}
```

### Example — create a contact under an existing company

```json
{
  "resource": "contact",
  "operation": "create",
  "fields": "{\"name\": \"Jane Doe\", \"email\": \"jane@acme.com\", \"is_company\": false, \"parent_id\": 42}"
}
```

### Example — look up a contact by email

```json
{
  "resource": "contact",
  "operation": "getAll",
  "domain": "[[\"email\", \"=\", \"jane@acme.com\"]]",
  "limit": 1
}
```

### Example — look up a company by website domain

```json
{
  "resource": "contact",
  "operation": "getAll",
  "domain": "[[\"is_company\", \"=\", true], [\"website\", \"ilike\", \"acme.com\"]]",
  "limit": 1
}
```

## `lead`-specific actions (`Infos\OdooLeadInfos.cs`) — keys known, per-action `Validate()` rules not yet independently confirmed

`convert` (Convert-to-Opportunity, presumably needs `partnerID`), `markWon`, `markLost` (presumably
needs `lostReasonID`), `logNote` (presumably needs `noteBody`), `scheduleActivity` (presumably needs
`activityTypeID`/`userID`). Config keys exist for `partnerID`, `userID`, `teamID`, `lostReasonID`,
`noteBody` (from `OdooConfigKeys.cs`). Read `OdooLeadInfos.cs` directly before authoring any of these.

## `activity` (`mail.activity`) — keys known, class not yet independently read

`resModel`, `resID` (the record the activity is attached to), `activityTypeID`, `feedback` (for
`markDone`), plus shared `resModelFilter`/`resIDFilter` for `getAll`.

## Lookup resources (`Infos\OdooLookupInfo.cs`) — 8 read-only `getAll`s, class not yet independently read

`activityType`, `stage`, `team`, `tag`, `lostReason`, `utmSource`, `utmMedium`, `utmCampaign` —
presumably share the generic `getAll` shape above, not yet confirmed.

## `trigger`/`poll` (`Infos\OdooTriggerInfo.cs`, confirmed via `OdooNodeExecutor.Trigger.cs` directly)

A separate polling-trigger resource (distinct from the CRUD resources above) — same "trigger IS the
schedule" shape as `email-imap-trigger` (see that doc's own note in
`WorkManagement\email-organizer\design\00-OVERVIEW.md`), except this one **does** have a config-level
interval:

| Field | Config key | Notes |
|---|---|---|
| Watch (target resource) | `targetResource` | `lead` (default) / `contact` / `activity` / `custom`. |
| Custom model | `customModel` | Required only when `targetResource=custom` (enforced, confirmed by reading the feature partial directly). |
| Filter | `filter` | Passed through to the poll request. |
| Fields | `fields` | Passed through. |
| Page size | `pageSize` | Default 100 if `<= 0`. |
| Poll interval | `pollIntervalSeconds` | Key exists in `OdooConfigKeys`; not yet confirmed where/how the executor consumes it (likely the workflow engine's own trigger-scheduling layer, not this file — same open question class as `email-imap-trigger`'s cadence). |

Poll state (write-date cursor + seen IDs) persists per node instance via `INodeStateStore`, keyed
`odoo:trigger:{ProcessElementKey}` — confirmed by reading `OdooNodeExecutor.Trigger.cs` directly.
State-read/-write failures are swallowed defensively (unseeded on read failure, best-effort on write
failure — "just re-emits next cycle") rather than failing the poll.

## Output shape

Not yet independently confirmed field-by-field per operation — `OdooNodeExecutor.Output.cs` exists but
hasn't been read in detail. For `getAll`, expect the standard items-array wrapping this doc set's other
multi-item nodes use, with each item shaped by whatever `fieldsList` was requested (or Odoo's default
field set if omitted).

## Real, live-verified test target (2026-09-06)

Unlike some nodes in this doc set, Odoo already has a real, working instance verified end-to-end
against the actual JSON-RPC protocol this node speaks (`common.login` → real `uid`; `create` → real new
record ID; `search_read` by email → confirmed round-trip; `unlink` → cleanup) — not a fabricated
credential:

| What | Value |
|---|---|
| Odoo version | 19.0-20260906, self-hosted (Windows service `odoo-server-19.0`) |
| Site URL | `http://localhost:8069` |
| Database | `leadfirst` |
| Auth | `authMode=usernamePassword`, admin login — see `..\..\..\..\Agents\Testers\WorkflowTester\testing\odoo\resources\credentials.md` for the actual credential (not repeated here to avoid a second place to go stale) |

**Shared DB caution**: `leadfirst` is also LeadFirst's own in-progress Push-to-Odoo workflow target.
Prefix any test record's `name`/`email` with something obviously fake and greppable (e.g.
`agentic-testing-nodes-odoo-`) and `unlink` it at the end of each test round.

## Gotchas

- **"Company" is not a separate resource/model** — see the modeling note above. Don't look for a
  `resource: "company"` value; it doesn't exist, and won't route anywhere in the switch expression
  (falls through to `base._ExecuteInternal_Route_Async`, i.e. an unhandled-operation error).
- **An unrecognized `domain` operator string silently becomes `=`**, not an error — a typo'd operator
  (e.g. `"contains"` instead of `"ilike"`) won't fail loudly; it'll just silently match on equality
  instead, which for a domain-based company lookup will almost always return zero rows without any
  indication why.
- **Poll interval for the `trigger`/`poll` resource is a real config key (`pollIntervalSeconds`) that
  the CRUD/lookup resources have no equivalent of** — don't confuse this node's own trigger capability
  with `email-imap-trigger`'s cadence gap; they're separate open questions in separate node types.
- Lead-specific action required-fields, activity fields, and the 8 lookup resources are all
  "keys known, per-class `Validate()` not yet independently read" — treat their required/optional
  status as unconfirmed until read directly, same caveat `config-schema.md` already carried.
