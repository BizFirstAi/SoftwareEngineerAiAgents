# Servers MCP Server — Design

**Status: built, wired, and live-verified end to end (2026-09-10).** Real code, not a design-only
doc — see `BizFirstPayrollV3\src\mvc-server\AI\Mcp\BizFirst.Ai.Mcp.Tools.Servers\`.

## Why this exists — Binoy's own words

"I will ask flow studio to create a workflow that will, for eg, copy data from sql server to
postgres server. the individual nodes will need server details/connection string. The server
details can be added by creating two servers and adding its credentials to CredentialID. then
configure Nodes using destinationServerID to the node. the node will find the serverid or
serverName and find the server and credentialId from server and find connection string. This way
servers can be reused everywhere. I need servers to be available as mcp."

A `Server_Servers` row is a named, reusable connection target (SQL Server, Postgres, S3-compatible
storage, SFTP, MySQL, MongoDB, Redis, Odoo, a vector database, etc. — 10 real `ServerTypeID` values
already seeded) that references a `CredentialID` (`AIExt_Credentials`) for auth instead of
duplicating host/port/credential details on every workflow node. A node stores a `ServerID` and
resolves Server → Credential → real connection string at run time.

## What already existed (found, not built, this session)

`BizFirst.Ai.Platform.Servers.{Domain,Service,Api.Base,Api}` was already a real, complete,
already-DI-registered backend (route `api/v1/platform/servers`) — `IServerService` with a rich real
interface (Registry Queries: by category/type/provider/status/credential/working/owner/mine/
connection-test-status; Registry Operations: Register/UpdateStatus/BindCredential/
UpdateConfiguration/SetEnabled/ExtendLease; Connection Test Cache; Lease Maintenance). The
`Server` entity (`Server_Servers`) already had exactly the shape Binoy described: `Host`, `Port`,
`ServerTypeID`, `Configuration` (JSON, type-specific), and `CredentialID` — with an explicit doc
comment confirming secret material is never stored on this entity, only the credential reference.
Already framework-free (no ASP.NET Core reference in Domain/Service), so — unlike the Workflow/App
Studio MCP modules — no `*Extended` service extraction was needed.

## The 7 MCP tools

| Tool | Wraps | Notes |
|---|---|---|
| `find_servers` | `GetByCategoryAsync`/`GetByTypeAsync`/`GetByProviderAsync`/`GetByCredentialAsync`/`GetByStatusAsync`/`GetWorkingAsync`/`GetMineAsync`/`GetAllAsync` | Flat scalar parameters (see "Real bug found" below for why, not a nested filter object) |
| `get_server` | `GetByIdAsync` | Full detail incl. `Configuration` JSON |
| `create_server` | `RegisterAsync` | Never accepts secret material — `credentialId` references an existing credential |
| `update_server` | `GetByIdAsync` + `UpdateAsync` | Descriptive/connection fields only — not CredentialID or Enabled |
| `bind_server_credential` | `BindCredentialAsync` | The tool that closes the loop Binoy described — bind or clear (`credentialId: null`) |
| `set_server_enabled` | `SetEnabledAsync` | |
| `delete_server` | `DeleteAsync` | |

**Deferred, not yet exposed** (real capability on `IServerService`, no blocker to add later):
`UpdateStatusAsync`, `UpdateConfigurationAsync`, `RecordConnectionTestAsync`, `ExtendLeaseAsync`,
`ExpireLeasedServersAsync`, `GetByOwnerAsync` (admin-only — ownership is caller-supplied, unlike
`GetMineAsync`), `GetExpiredAsync`/`GetExpiringSoonAsync` (lease-renewal queries).

## Real bug found and fixed — nested filter-object schema corruption

The first `find_servers` implementation mirrored the proven `FindFormsTool`/`FormFilter` and
`FindCredentialsTool`/`CredentialFilter` pattern exactly: one nested filter-class parameter. Every
call failed with a generic, completely unlogged `"An error occurred invoking 'find_servers'"`. A
diagnostic try/catch around the tool body never fired, proving the failure is in the SDK's own
argument-binding step, before the method runs — confirmed by inspecting the actual generated
`tools/list` schema: the nested object's plain `int?` properties were corrupted to
`"type":["string","integer","null"]`, the shape belonging to `IDInfo`'s custom JSON converter, not a
plain nullable int. `find_forms`'s own nested filter, re-tested live at the same moment, still
worked correctly — ruling out a general nested-object regression. This is a narrower schema
generation/caching defect specific to this new type in a now much larger composed multi-module
deployment (5 tool-module assemblies on one `AddMcpServer()`), not fully root-caused. **Fix**:
`find_servers` uses flat scalar parameters instead, matching this module's other 6 tools — proven
working immediately. **Lesson for the next new MCP module with a filter object**: check the actual
generated schema in `tools/list` before trusting a clean build, the same "verify live" discipline
every module built tonight has independently needed.

## What is genuinely NOT built yet — node-side ServerID consumption

Confirmed by direct code search: no reference to `ServerID`/`destinationServerID`/`sourceServerID`
exists anywhere in `BizFirst.Ai.Mcp.Tools.Workflow` or any node executor. `attach_node_credential`
(built earlier this session) only lets a node reference a `CredentialID` directly — there is no
`ServerID`-indirection path yet. Building this is separate, real work:
1. A node-configuration field (or a new MCP tool, e.g. `attach_node_server`) that stores a
   `ServerID` reference on a node's `Configuration`.
2. Node-executor-side resolution logic: given a `ServerID`, look up the `Server` row (host/port/
   type/configuration), then its `CredentialID`, then the actual credential secret via
   `ICredentialResolver` — composing two existing lookups (`IServerService.GetByIdAsync` +
   `ICredentialResolver`) into one resolved connection.

Neither piece exists today. This module (find/create/update/bind/enable/delete a `Server` row) is
the necessary first half; the second half is a distinct task.

## Live verification (2026-09-10)

Real MCP calls over `http://localhost:5001/mcp` with a real, scoped API key (`bizfirst-engineer`,
granted `mcp:servers:read`/`write`), cross-checked against `Server_Servers` via direct SQL:

- `create_server` → ServerID 4, `orders-sqlserver-source`, `ServerTypeID=4` (SQL Server),
  `CredentialID=7` (a real, pre-existing credential) — confirmed in the DB.
- `create_server` → ServerID 5, `orders-postgres-destination`, `ServerTypeID=5` (PostgreSQL), no
  credential initially.
- `bind_server_credential(5, 6)` → confirmed `CredentialID=6` now set on ServerID 5.
- `update_server(4, description=..., region="us-east-1")` → confirmed both fields updated.
- `set_server_enabled(5, false)` → confirmed `Enabled=0` on ServerID 5.
- `create_server` (throwaway) → ServerID 6, then `delete_server(6)` → confirmed row gone.
- `find_servers` (no filter) → returned all 3 real remaining rows, including a pre-existing
  production row (`PrimarySystemRag`, a FlowRag placeholder server) — confirming this table already
  has real, independent production usage beyond tonight's test data.
- `get_server(4)` → full detail matched exactly.

All results matched the database exactly — no discrepancy between what the tools reported and what
was actually persisted.
