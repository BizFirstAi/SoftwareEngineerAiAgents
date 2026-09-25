# Odoo Node — Credential Model

## What the node needs

Every one of the 35 operation forms shares the same four-control connection block (orders 1-4,
`BaseOdooOperationInfo`'s `LoadConnection`):

| Field | Config key | Notes |
|---|---|---|
| Credential | `credentialID` | Vault reference (numeric `Process_ProcessElements.CredentialID`) — resolved server-side, never round-tripped back into config. |
| Site URL | `siteUrl` | Not a secret — the Odoo instance base URL, e.g. `http://localhost:8069`. Trimmed and trailing-slash-stripped by `BuildCredential()`. |
| Database | `database` | Odoo's own multi-database name (Odoo Community/Enterprise can host several DBs behind one URL) — optional if the instance only has one. |
| Auth Mode | `authMode` | `apiKey` (default) or `usernamePassword`. |

**Known gotcha, already fixed in code** (per `BaseOdooOperationInfo`'s own doc-comment): some
node-config resolution paths only deliver the connection block inside a nested `nodeFormValues`
object rather than at the flat top level, which used to leave `siteUrl`/credential empty at runtime
on `get`/`getAll` nodes even though the form was filled in correctly. `ReadConnectionValue()` now
falls back to `nodeFormValues` when the flat key is blank. Worth knowing before assuming a blank
`siteUrl` at runtime means the form is misconfigured — it might be this exact class of bug
resurfacing.

## Two supported resolution paths (`OdooNodeExecutor.Credentials.cs` → `ResolveVaultCredentialsAsync`)

1. **`usernamePassword` mode**: `ReadCredentialKeyValuePrimaryAsync(isMandatory: false, ct)` — the
   vault credential's `Username`/`Password` pair is used directly.
2. **`apiKey` mode (default)**, tried in order:
   - A single-value vault credential (`ReadCredentialValuePrimaryAsync`) — used as-is if present.
   - A key-value vault credential — `Password` side wins if present, else `Username` side.
   - **Inline fallback**: if `CredentialID` doesn't parse as an integer (i.e. it's not a real vault
     reference), the raw string is treated as the API key directly — lets the node work without
     provisioning a stored credential first, at the cost of the key living in plain text in the
     workflow config. Documented in the code as an explicit, deliberate tradeoff, not an oversight.

This is a different pattern from Elasticsearch's satellite-node option — Odoo has no satellite/
shared-connection node type; every operation node carries its own connection block inline (or via
vault), full stop.

## Real local test target — already stood up, manually confirmed working (2026-09-06)

Unlike Elasticsearch (blocked on sourcing a real external account), **this node already has a real,
working Odoo instance to test against**, built earlier the same day this folder was created:

| What | Value | Source |
|---|---|---|
| Odoo version | 19.0-20260906, self-hosted (Windows service `odoo-server-19.0`) | `Documentation\WorkManagement\LeadFirst\Workflows\Odoo\02-LocalDevEnvironmentSetup.md` |
| Site URL | `http://localhost:8069` | same |
| Database | `leadfirst` | same (confirmed via `POST /web/database/list` → `["leadfirst"]`) |
| Admin login | `<odoo-admin-login>` / `<redacted>` | `...\Workflows\Odoo\password.md` |
| Master password (DB manager only, not needed for node operations) | `<redacted>` | same |

**Manually confirmed live, same session, against the real JSON-RPC endpoint this node's own
`OdooJsonRpcTransport` speaks** (`http://localhost:8069/jsonrpc`):

1. `common.login("leadfirst", "<odoo-admin-login>", "<password>")` → real `uid` (`2`).
2. `object.execute_kw(..., "res.partner", "create", [{...}])` → real new record ID (`6`), using a
   real contact row sourced from `ContactsPro\LeadSource\Binoy_100K_USA_CLevel_PhoneEnriched.csv`.
3. `object.execute_kw(..., "res.partner", "search_read", [[["email","=","..."]]], {...})` → confirmed
   the created record round-trips correctly by email lookup (this is exactly the dedup mechanism
   the LeadFirst Push-to-Odoo workflow design's "Workflow A" needs — see
   `Documentation\WorkManagement\LeadFirst\Workflows\Odoo\01-PushToOdooWorkflowDesign.md`).
4. `object.execute_kw(..., "res.partner", "unlink", [[6]])` → cleaned up the test record.

This proves the full write + read-back + cleanup cycle works against a real Odoo database using the
exact protocol this node uses — not a fabricated or assumed credential. **Config to use on any test
node instance**: `siteUrl=http://localhost:8069`, `database=leadfirst`, `authMode=usernamePassword`,
credential = the admin login above (inline or vault, either works per the resolution order).

## Test-data hygiene — this DB is shared with other in-progress work

The `leadfirst` database is also the target for LeadFirst's own Push-to-Odoo workflow design work
(not yet built). Give every test record this framework creates an obviously-fake, greppable name
(e.g. prefix `agentic-testing-nodes-odoo-` on `name`/`email` fields) and `unlink` it at the end of
each round — the same discipline demonstrated in the manual check above — so this framework's test
data is never mistaken for real LeadFirst demo/design data sharing the same DB.

## What's independently blocking live execution right now (unrelated to credentials)

The Consolidated WebApi backend (`https://localhost:10001`) was found unreachable on 2026-09-06
(confirmed via repeated `curl` checks the same session this Odoo instance was verified). Per this
framework's standing rule, its lifecycle is reserved for direct human action — not restarted as part
of this task. Both the `execute-by-id` API path and any Chrome-driven Flow Studio pass need it back
up; neither is blocked by anything Odoo-specific.
