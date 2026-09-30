# MCP Server Integration for Octopus AI Agents — Overview

## Directive (verbatim, Binoy, 2026-08-18)

"task 12: mcp server integration. The octopus ai agent can execute mcp servers from external
sources and orchestrate with them. I want you to inspect and see how octopus can integrate mcp
server with a sample open source mcp server integration. may be we can integrate into a github mcp
server integration and test the orchestration. For that, what we need is this. 1. do we have an
open source free mcp server available to test this? may be we can create our own sample mcp server
endpoints so we can test. make the mcp server provide a good sample set of tools. Insert sample
data into our database scripts and actually insert them into our database, you may search
`*mcp*.sql` and `*agent*.sql` scripts and insert sample records. Agentid=1 gives you good sample.
After setting up the agent, let us create a workflow and add the agent and execute the workflow.
you can create new project using flowstudio and add add a trigger node and aiagent chat message
node and open config and pick up the created ai agent from agent tab. save and execute the
workflow and test. First thing scan everything and understand how it works how mcp servers are to
be setup in db and create a good memory and spec."

**Scope of this document.** This is the "scan and understand" phase only — no code was written or
edited, no DB rows were inserted, no Flow Studio workflow was touched. Everything below is real
code/schema read directly from the two repos, not a design proposal. The follow-up phases (seed
data insertion, sample MCP server build/reuse decision execution, Flow Studio workflow creation and
execution) are separate work items that depend on this document's findings.

## Top-line answer: is MCP integration built and working today?

**Yes — functionally, in Octopus Core.** This is not scaffolding. A real, DI-wired, end-to-end path
exists today: `AIMCP_McpServers` DB row → live MCP client (official `ModelContextProtocol` C# SDK,
stdio or SSE transport) → dynamic `tools/list` discovery → tools merged into the same function list
the LLM sees → dispatched through the same executor-factory as native functions. There is even a
working, DI-registered *sample* MCP server already built inside the Octopus Core repo
(`BizFirst.Ai.Octopus.RestaurantBot.MCPServer`) with 5 pizza-themed tools and a companion
`mcp_quick_guide.md` runbook proving it was run and tested end-to-end.

**However — the seed data path Binoy described (`AgentID=1`) does not have MCP wired.** `AgentID=1`
(Pizza Bot) has `McpEnabled=NULL`, `McpServerGroupID=NULL`, `McpClientID=NULL` in every current seed
file. The MCP server that *would* make sense for it (`McpServerID=1`, "Restaurant Bot MCP Server",
`AIMCP_McpServerGroups.McpServerGroupID=1` "Restaurant Service") exists in seed data but has **no**
row in `AIMCP_McpServerGroupMembers` — the actual join table the runtime code reads — so even
pointing an agent at `McpServerGroupID=1` today would resolve to zero MCP tools. The only agent in
current seed data with a fully complete, working MCP wiring end-to-end is `AgentID=20`, "GitHub
Commit Agent" (see §3). See "Open questions for Binoy" for what this means for the next phase.

There is also a **second, independent, code-complete-but-disabled-by-default** MCP subsystem in
`BizFirstPayrollV3`'s generic ProcessEngine (`BizFirst.Ai.Node.Mcp.*`), separate from the
Octopus-Core path an `ai-agent` node actually uses. Flagged in §1.4 — not relevant to the
recommended path, but worth knowing it exists so it isn't confused with the live one.

---

## 1. How Octopus Core's MCP integration actually works (real code)

### 1.1 Architecture map

| Subsystem | Location | Real MCP SDK? | Live in the `ai-agent` node's call path? |
|---|---|---|---|
| **A. Octopus Core LLM tool-calling MCP client** | `BizFirstAI.V21\...\BizFirst.Ai.Octopus.Core\MCP\*` | Yes — NuGet `ModelContextProtocol` v0.1.0-preview.11 | **Yes — this is the path** |
| **B. `AIMCP_*` DB persistence/CRUD layer** | `BizFirstPayrollV3\...\AiMcp\*` (Domain/Infra/Service) | N/A (storage only) | Yes, as the config source A reads from |
| **C. Generic ProcessEngine MCP client/server/relay** | `BizFirstPayrollV3\...\McpNode\BizFirst.Ai.Node.Mcp.{Domain,Service}` | No — hand-rolled JSON-RPC | **No** — feature flags default `false`, no call site turns them on anywhere in `mvc-server` |
| **D. Bridge-side "Tool Servers" satellite config parsing** | `BizFirst.Ai.ExecutionNodes.Octopus.{Domain,OctopusAi}` | N/A (config plumbing) | Yes — feeds into A, additively on top of the DB-driven set |

### 1.2 The live client: `McpClientManager`

`C:\BizFirstGO_FI_AI\BizFirstAI.V21\src\ApiServer\src\Infrastructure\BizFirst.Ai.Octopus.Core\MCP\Managers\McpClientManager.cs`

Uses the **official `ModelContextProtocol.Client` NuGet SDK** — confirmed in
`BizFirstAI.V21\src\ApiServer\Directory.Packages.props:136-137`:
```xml
<PackageVersion Include="ModelContextProtocol" Version="0.1.0-preview.11" />
<PackageVersion Include="ModelContextProtocol.AspNetCore" Version="0.1.0-preview.11" />
```

Both transports MCP defines for a remote/local server are wired via the SDK's own transport
classes (`McpClientManager.cs:161-195`):
```csharp
IClientTransport? transport = null;
if (config.SseConfig != null)
{
    var options = new SseClientTransportOptions
    {
        Name = config.Name,
        Endpoint = new Uri(config.SseConfig.EndPoint),
        AdditionalHeaders = config.SseConfig.AdditionalHeaders,
        ConnectionTimeout = TimeSpan.FromSeconds(30)
    };
    transport = new SseClientTransport(options);
}
else if (config.StdioConfig != null)
{
    transport = new StdioClientTransport(new StdioClientTransportOptions
    {
        Name = config.Name,
        Command = config.StdioConfig.Command,
        Arguments = config.StdioConfig.Arguments,
        EnvironmentVariables = config.StdioConfig.EnvironmentVariables,
        ShutdownTimeout = config.StdioConfig.ShutdownTimeout
    });
}
...
var settings = _services.GetRequiredService<McpSettings>();
return await McpClientFactory.CreateAsync(transport, settings.McpClientOptions);
```
So: **SSE (`SseClientTransport`) and stdio (`StdioClientTransport`) are both implemented**; the
newer "Streamable HTTP" transport class is not used here (the SDK version pinned,
`0.1.0-preview.11`, exposes `SseClientTransport`/`StdioClientTransport` — no
`StreamableHttpClientTransport` reference was found anywhere in this codebase). The sample
`RestaurantBot.MCPServer` test project (§1.6) is built with `.WithHttpTransport()` on the *server*
side, and the DB config for it uses `SseConfig` with endpoint `http://localhost:58905/sse` — i.e.
this codebase's actual tested path is **SSE**, not raw stdio process-spawning, for anything other
than the GitHub MCP server example (which is configured stdio-only, `npx ...`, and has never been
exercised against the real `mcp_quick_guide.md` demo flow).

Clients are cached per-request (`AddScoped<McpClientManager>`, a `ConcurrentDictionary<string,
Task<IMcpClient?>>` keyed by server ID + resolved credential IDs) and disposed in `Dispose()` —
this avoids re-spawning a stdio subprocess or reopening an SSE connection for every tool call
within one multi-step conversation turn.

### 1.3 Connection config shape (what a "server row" looks like at runtime)

`C:\BizFirstGO_FI_AI\BizFirstAI.V21\src\ApiServer\src\Infrastructure\BizFirst.Ai.Octopus.Abstraction\MCP\Models\McpServerConfigModel.cs`:
```csharp
public class McpServerConfigModel
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public McpSseServerConfig? SseConfig { get; set; }
    public McpStdioServerConfig? StdioConfig { get; set; }
}
public class McpSseServerConfig
{
    public string EndPoint { get; set; } = null!;
    public TimeSpan ConnectionTimeout { get; init; } = TimeSpan.FromSeconds(30);
    public Dictionary<string, string>? AdditionalHeaders { get; set; }
}
public class McpStdioServerConfig
{
    public string Command { get; set; } = null!;
    public IList<string>? Arguments { get; set; }
    public Dictionary<string, string>? EnvironmentVariables { get; set; }
    public TimeSpan ShutdownTimeout { get; set; } = TimeSpan.FromSeconds(5);
}
```
This is the exact JSON shape stored in `AIMCP_McpServers.ConfigJson` (confirmed by reading the real
seed rows, §2). `McpClientManager.CreateMcpClientAsync` resolves the DB row via
`IMcpServerService.ServiceHelper.GetByIdAsync(mcpServerId)`, then deserializes `ConfigJson` straight
into this model — **the DB column and the runtime C# model are the same shape, not two things that
need reconciling.**

**Credential handling — confirmed to follow this codebase's mandated pattern.** Secrets are never
stored raw in `ConfigJson`; instead `ConfigJson` may contain `{fieldName}` wildcard tokens (e.g.
`"GITHUB_PERSONAL_ACCESS_TOKEN":"{apiKey}"`), and `McpClientManager` substitutes them at connect
time from a decrypted credential (`IRepositoryBase.GetDecryptedCredentialJsonAsync`), resolved
through a three-tier priority chain documented directly in the source
(`McpClientManager.cs:30-51`):
1. **Tier 1 — satellite override**: a Flow Studio "Tool Servers" satellite node's own
   `CredentialID` for this specific call (`McpTool.CredentialID`).
2. **Tier 2 — server's own default**: `AIMCP_McpServers.CredentialID`.
3. **Tier 3 — agent's own default**: `Agent.CredentialID`.

Both a primary and a `Secondary` credential slot exist in parallel (for servers whose config needs
two distinct secrets), merged with primary winning on field-name collision. **This is the
`ICredentialResolver`/`credentialId`+decrypt pattern this codebase mandates elsewhere (SMTP
reference impl) — MCP server auth already follows it, in the runtime code.** (Caveat: the one real
seeded MCP server, `McpServerID=7` "GitHub MCP Server", does **not** currently use this — its
`ConfigJson` still has a raw placeholder `"GITHUB_PERSONAL_ACCESS_TOKEN":"<SET_ME>"` with no
`CredentialID` set on the row. So the pattern is implemented and ready, but the one seed row that
would exercise it hasn't been wired to actually use it yet.)

### 1.4 Tool merge point — confirmed: MCP tools land in the exact same list as every other function

`C:\BizFirstGO_FI_AI\BizFirstAI.V21\src\ApiServer\src\Infrastructure\BizFirst.Ai.Octopus.Core\MCP\Hooks\MCPToolAgentHook.cs`
is an `IAgentHook` that runs on every non-router agent load. For each of the agent's configured MCP
servers (`agent.McpTools`, populated by `AgentTranslator.MapMcpTools`, §2.3), it:
1. Calls `mcpClient.ListToolsAsync()` — a live `tools/list` JSON-RPC round-trip via the SDK.
2. Maps each result to the platform's own `FunctionDef` shape via
   `AiFunctionHelper.MapToFunctionDef` (`MCP\Helpers\AiFunctionHelper.cs`), reading the MCP tool's
   `JsonSchema.properties`/`.required` directly into `FunctionDef.Parameters`.
3. Appends into `agent.SecondaryFunctions` — **the same collection native/callback functions use**:
```csharp
agent.SecondaryFunctions ??= [];
var functions = Task.Run(() => GetMcpContent(agent)).GetAwaiter().GetResult();
agent.SecondaryFunctions = agent.SecondaryFunctions.Concat(functions)
    .DistinctBy(x => x.Name, StringComparer.OrdinalIgnoreCase).ToList();
```

Dispatch at call time shares one factory too —
`Routing\Executor\FunctionExecutorFactory.cs`, `Create()`:
checks in order `IFunctionCallback` (native callback) → static `DummyFunctionExecutor`
(Output-only funcs) → **`agent.McpTools` name match → `McpToolExecutor`**. So from the LLM's point
of view, an MCP tool is schema-indistinguishable from any other tool in its list; only server-side
routing differs, and that routing lives in one factory, not duplicated per tool type.
`McpToolExecutor.ExecuteAsync` (`Routing\Executor\MCPToolExecutor.cs:35-61`) is the piece that
actually calls `client.CallToolAsync(_functionName, argDict)` and folds the text result back into
the conversation.

**Conclusion for the "same list or separate path?" question: same list, same dispatch factory.**
No separate "MCP mode" exists in the conversation loop — from the LLM completion call's perspective
there is one flat tool schema, mixing native functions, MCP tools, and anything else registered via
`IFunctionCallback`.

### 1.5 Tool discovery — confirmed dynamic, not pre-registered

`MCPToolAgentHook.GetMcpContent` calls the **live** `mcpClient.ListToolsAsync()` every time an agent
loads — this is a genuine MCP `tools/list` request against the running server, not a cache read.
The function schema the LLM sees is built from the **live** `McpClientTool.JsonSchema` the server
returns at that moment, not from anything stored in `AIMCP_McpTools.Schema`.

The DB's `AIMCP_McpTools` table is only used as an optional **name allow-list filter**
(`McpTool.Functions`) — if an agent's MCP-server entry lists zero functions, ALL of that live
server's tools are exposed; if it lists names, only matching names are kept. The doc comment is
explicit about this (`MCPToolAgentHook.cs:87-90`): *"An entry with no declared functions exposes ALL
of the server's tools... a function-less entry... [is not] silently useless."* **The DB `Schema`
column is never read to build what the LLM sees — only tool names, for filtering.**

### 1.6 The sample MCP server that already exists in this codebase

`C:\BizFirstGO_FI_AI\BizFirstAI.V21\src\ApiServer\tests\BizFirst.Ai.Octopus.RestaurantBot.MCPServer\`
— a real, DI-wired, **already-built** MCP server using the official SDK's server-side package:

`Program.cs` (entire file):
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();
var app = builder.Build();
app.MapGet("/test", () => "MCP Service is running!");
app.MapMcp();
app.Run();
```
5 tools, each a `[McpServerToolType]` static class under `Tools\`, matching the Pizza Bot theme
exactly:

| Tool name | File | Params | Behavior |
|---|---|---|---|
| `get_order_status` | `Tools\GetOrderStatus.cs` | `order_number: string` | Looks up a hardcoded dictionary of 6 test order numbers → status string |
| `get_pizza_types` | `Tools\GetPizzaTypes.cs` | (none) | Returns a formatted list of 3 pizza types with price/description |
| `get_pizza_prices` | `Tools\MenuPrices.cs` (class `PizzaPrices`) | `pizza_type: string` (required), `quantity: int` (required) | Computes `unit_price` for 1 of 3 pizza types, returns JSON |
| `make_payment` | `Tools\MakePayment.cs` | `order_number: string` (required), `total_amount: int` (required) | Returns a canned success string; throws `McpException` if a required arg is missing |
| `place_an_order` | `Tools\PlaceOrder.cs` | `pizza_type: string`, `quantity: int`, `unit_price: double` (all required) | Returns a canned order-number string (`P123-01`) |

This is exactly "a good sample set of tools" for testing — realistic parameter shapes (strings,
ints, doubles; some required, one param-less), simple deterministic logic (no real backend needed),
and a theme that matches the Pizza Bot agent family already in seed data.

**A companion runbook already exists and documents this was run end-to-end**:
`C:\BizFirstGO_FI_AI\BizFirstAI.V21\Documents\Binoy\mcp_quick_guide.md` (header: `# Branch Name :
MCPWorking`) walks through starting this MCP server on `http://localhost:58905`, starting
`WebStarter` on `http://localhost:3011`, verifying `curl http://localhost:3011/mcp/server-configs`
returns the 4 tools (`get_order_status, get_pizza_prices, make_payment, place_an_order` — note
`get_pizza_types` isn't listed in that guide's example response, though the tool exists in code),
and then driving full conversations against 4 agents by their `Agent.Id` (a **GUID `ResID`**, not
the INT `AgentID` — see §2.4 for why this matters) demonstrating routing, tool calls, and multi-turn
state.

**API surface**: `GET /mcp/server-configs`
(`BizFirstAI.V21\...\BizFirst.Ai.Octopus.OpenAPI\Controllers\McpController.cs`) calls
`IMcpService.GetServerConfigsAsync()` (`MCP\Services\McpService.cs`), which iterates
`McpSettings.McpServerConfigs` (the **legacy appsettings.json-driven list**, not the DB-driven one
`McpClientManager` actually uses for agent tool-calls — see the explicit comment in
`BizFirstAIMCPExtensions.cs:49-52`: *"MCP servers are now database-driven... gate purely on the
Enabled toggle"*). This endpoint is a config/debug utility, not what the live agent path reads from.

### 1.7 What's not live: Subsystem C (generic ProcessEngine MCP client/server/relay)

A second, independent, hand-rolled (no SDK) MCP implementation exists in PayrollV3's
`BizFirst.Ai.Node.Mcp.{Domain,Service}` and `BaseNodeExecutor.McpClient.cs`/`.McpServer.cs`
(spec-correct JSON-RPC: `initialize`, `tools/list`, `tools/call`, `ping`) — but
`ProcessEngineOptions.EnableMcpServer`/`EnableMcpClient`/`EnableMcpRelay` all default `false`
(`ProcessEngineOptions.cs:140,146,153`) and no call site in `mvc-server` sets them `true`. This is
"built, not activated," and is **not** the path an `ai-agent` node actually uses (that's Subsystem
A/D above) — flagged here only so it isn't mistaken for the live implementation in a later phase. A
third, larger copy of what looks like the same subsystem also exists under
`C:\BizFirstGO_FI_AI\CodeOne\src\api-server\flow\McpNode\` — out of scope for this pass (outside
the two repos asked for), noted here in case it needs reconciling later.

---

## 2. The DB-backed configuration (`BizFirstFiDB`, real schema + real seed rows)

### 2.1 Table inventory

All MCP table definitions live in
`BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Tables\AIMCP_*.sql`; seed data in
`...\dbo\Data\Master\AIMCP_*.data.sql`.

- **`AIMCP_McpServers`** — the server-registration table. Columns include `McpServerID` (PK
  identity), `TenantID`, `Name`, `Description`, `McpServerTypeID` (FK), `McpServerCategoryID`,
  `McpServerGroupID`, `ConnectionString`, **`ConfigJson NVARCHAR(MAX)`** (the JSON matching
  `McpServerConfigModel`, §1.3), `IsActive`, **`CredentialID INT NULL`**,
  **`SecondaryCredentialID INT NULL`**, plus the full 12-column mandatory audit block
  (`Deleted, Archived, LastModifiedOn/By, CreatedOn/By(INT), SourceAppID, ClientAccountID,
  AppDomainID, DataDomainID, DataSegmentID, TenantID, ResID`) — all present, `LastModifiedOn`/
  `CreatedOn` correctly typed `DATETIME`, named `PK_`/`DF_`/`FK_` constraints throughout, uppercase
  `ID` everywhere. Compliant with this codebase's DB standards.
- **`AIMCP_McpServerGroups`** — despite the plural name, each row is a 1:1 "role wrapper" around a
  *single* `McpServerID` (`McpServerGroupID PK`, `McpServerID INT NOT NULL`, `ServerRole
  NVARCHAR(200)`) — not itself the many-to-many join.
- **`AIMCP_McpServerGroupMembers`** — the *actual* many-to-many join the runtime code reads:
  `McpServerGroupMemberID PK`, `McpServerGroupID`, `McpServerID`, `DisplayOrder`,
  `UNIQUE(McpServerGroupID, McpServerID)`.
- **`AIMCP_McpTools`** — `McpToolID PK`, `Name`, `Description`, `McpToolProviderTypeID` (FK),
  `McpServerID NULL` (FK to `AIMCP_McpServers`), `SchemaTypeID`, `Schema NVARCHAR(MAX)` (per §1.5,
  **not used to build the LLM-facing schema** — informational/admin only),
  `RequiresApproval BIT`.
- **`AIMCP_McpServerCategories`/`Classifications`/`Types`, `McpClientTypes`** — lookup tables.
- **`AIMCP_McpServerSettings`/`McpToolSettings`** — key/value settings tables, each with a minor DDL
  defect (missing trailing comma before the `PK_` constraint line, e.g.
  `AIMCP_McpServerSettings.sql:31-32` — flagged for whoever next touches these files).
- **`AIMCP_ServerHealth`, `AIMCP_ToolInvocationLogs`, `AIMCP_ToolResultCache`, `AIMCP_ToolSchemas`**
  — operational/log tables. All have the full 12-column mandatory audit block correctly typed
  `DATETIME`, but their **business-logic timestamp columns** (`CheckedAt`, `ApprovedOn`,
  `CreatedAt`/`ExpiresAt`/`LastAccessedAt`) are typed `DATETIME2(7)`, violating this codebase's
  "DATETIME, not DATETIME2" standard — a standards gap outside the mandatory-audit-column set, not
  in it.
- **`AIExt_Credentials`** — the generic credential vault both `AIMCP_McpServers.CredentialID` and
  `AIAgent_Agents.CredentialID` point to by naming convention (no FK constraint declared on either
  side, but the shape matches): `EncryptedData NVARCHAR(MAX)` (format
  `{providerCode}-{keyVersion}:{base64(nonce+ciphertext+authTag)}`), `ExecutionScopeID`,
  `VaultProviderID`, `EnvironmentID`. **Standards violation found here**: `AIExt_Credentials`'s own
  `LastModifiedOn`/`CreatedOn` — the *mandatory audit columns themselves* — are typed `DATETIME2`,
  not `DATETIME`, unlike the MCP tables where the audit block is correctly typed.

### 2.2 Agent → MCP linkage — no dedicated junction table; it's a 3-hop FK chain

`AIAgent_Agents` (the real agent-definition table — not the separate, older-looking `AI_Agents`
table also present in the repo, out of scope here) carries the MCP link **directly on the agent
row**, no separate `AIAgent_↔AIMCP_` junction exists:
```
AIAgent_Agents.McpServerGroupID → AIMCP_McpServerGroupMembers.McpServerGroupID
                                 → AIMCP_McpServerGroupMembers.McpServerID → AIMCP_McpServers.McpServerID
```
Relevant `AIAgent_Agents` columns: `McpEnabled BIT NULL`, `McpServerGroupID INT NULL`,
`McpClientID INT NULL`, `MCPServerRoutingCustomRuleID`, `MCPToolRoutingCustomRuleID`,
`CredentialID INT NULL`, `SecondaryCredentialID INT NULL`. **None of these have an enforced FK
constraint** at the DB level (only `TaxonomyRecordID` and `ChannelGroupID` are enforced on this
table) — despite indexes existing on some (`IX_AIAgent_Agents_CredentialID`, etc.).

### 2.3 The DB→runtime translation (confirms §2.2's chain is what's actually read)

`C:\BizFirstGO_FI_AI\BizFirstAI.V21\src\ApiServer\src\Plugins\BizFirst.Ai.Octopus.Plugin.SqlServerAtlasStorage\Translators\AgentTranslator.cs`, `MapMcpTools` (line 353):
```csharp
private static void MapMcpTools(AgentComposite composite, Agent agent)
{
    // Database-driven MCP config (this method) — agent.McpServerGroupID -> group members
    // -> servers -> tools, all sourced from AIMCP_* tables.
    agent.McpTools = new List<...McpTool>();
    if (composite.MyMcpServerGroupMembers == null || composite.MyMcpServers == null) return;

    foreach (var member in composite.MyMcpServerGroupMembers.Where(m => m.IsActive))
    {
        var server = composite.MyMcpServers.FirstOrDefault(s => s.McpServerID == member.McpServerID);
        if (server == null) continue;
        var functions = composite.MyMcpTools?
            .Where(t => t.McpServerID == server.McpServerID && !t.Deleted)
            .Select(t => new McpFunction(t.Name)).ToList() ?? [];
        agent.McpTools.Add(new McpTool { Name = server.Name, ServerId = server.McpServerID.ToString(), ... });
    }
}
```
**This confirms `AIMCP_McpServerGroupMembers` (not `AIMCP_McpServerGroups.McpServerID` directly) is
what's actually iterated** — a row must exist in the *members* table, or the agent gets zero MCP
tools no matter what its `McpServerGroupID` points to. This matters directly for §3 below.

### 2.4 Important ID-scheme clarification (relevant to Flow Studio wiring and testing)

`Agent.Id` (the string ID used everywhere in the runtime conversation API, e.g.
`/conversation/{agentId}` in `mcp_quick_guide.md`) is set to **`entity.ResID.ToString()`** — the
GUID `ResID` column — **not** `AIAgent_Agents.AgentID` (the INT identity Flow Studio's agent picker
and this whole spec otherwise refers to as "AgentID"). Confirmed at
`AgentTranslator.cs:31-32` and `:98-99` (`Id = externalAgent.ResID.ToString()`). So: DB
`AgentID` (INT) is what Flow Studio's agent picker and this document use; the conversation-level
runtime API keys off `ResID` (GUID). Both resolve to the same agent row — just be aware which one a
given API call expects.

### 2.5 `AgentID=1`'s real, current seed data — quoted verbatim

Two seed files insert `AgentID=1` and are **inconsistent with each other on which columns they set**
(both agree on the MCP-relevant ones):

**File A** — `BizFirstFiDB\...\dbo\Data\Agents\1_Pizza Bot\AIAgent_Agents_1_Pizza Bot.data.sql`
(idempotent, full ~70-column list):
```
AgentID=1, Name=N'Pizza Bot',
Description=N'AI assistant that can help customer place pizza order, make payment or inquiry existing order.',
LongDescription=N'You are Pizza Bot, an intelligent routing system... (full routing prompt text)',
AgentTypeID=2, IsPublic=1, Disabled=0, LlmProviderID=2, LlmModelID=8,
McpEnabled=NULL, McpServerGroupID=NULL, McpClientID=NULL,
FunctionEnabled=0, KnowledgeEnabled=0,
IsRouter=1, IsPlanner=0, IsTask=0, ...
TenantID=1, Deleted=0, Archived=0,
LastModifiedOn='2026-07-12 00:04:17.293', LastModifiedBy=1,
CreatedOn='2023-08-18 10:39:32.233', CreatedBy=NULL,
ResID='8970B1E5-D260-4E2C-90B1-F1415A257C18', IsSystem=0, CredentialID=NULL
```

**File B** — `BizFirstFiDB\...\dbo\Data\Master\AIAgent_Agents.data.sql` (narrower column list,
batch delete+re-insert of AgentIDs 1,2,3,4,5,7,9,12-15,17-21):
```
AgentID=1, TenantID=1, Name=N'Pizza Bot',
AgentTypeID=2 (Routing), IsPublic=1, Disabled=0,
LlmProviderID=2 (OpenAI), LlmModelID=8 (gpt-4o-mini),
FunctionEnabled=0, IsRouter=1, Deleted=0, Archived=0,
ResID='8970b1e5-d260-4e2c-90b1-f1415a257c18'
```
(This INSERT's column list omits `McpEnabled`/`McpServerGroupID`/`McpClientID`/`CredentialID`
entirely, so they fall back to the table's `NULL` default.)

**Both files agree: `AgentID=1` (Pizza Bot) has `McpEnabled=NULL`, `McpServerGroupID=NULL`,
`McpClientID=NULL`, `CredentialID=NULL`, `SecondaryCredentialID=NULL`, `FunctionEnabled=0`.**

No other table has an MCP-related row for `AgentID=1` either — searched every `*Mcp*.sql` file
directly; none references `AgentID=1`. Other non-MCP rows for `AgentID=1` do exist (routing rules,
templates, hooks — see §2.6) but nothing MCP-specific.

### 2.6 The Pizza Bot *family* (AgentID 1-4) — closer look, and why none are actually MCP-wired yet

The seed file `AIAgent_Agents.data.sql` also inserts three sibling agents that thematically *are*
the ones exercised in `mcp_quick_guide.md`'s demos, each with an inline comment claiming MCP
readiness:
```
AgentID=2, Name=N'Order Inquiry',   FunctionEnabled=1  -- (has MCP tools), ResID='b284db86-e9c2-4c25-a59e-4649797dd130'
AgentID=3, Name=N'Order Placement', FunctionEnabled=1  -- (has MCP tools), ResID='c2b57a74-ae4e-4c81-b3ad-9ac5bff982bd'
AgentID=4, Name=N'Payment',         FunctionEnabled=1  -- (has MCP tools), ResID='fe8c60aa-b114-4ef3-93cb-a8efeac80f75'
```
These `ResID`s match exactly the agent IDs `mcp_quick_guide.md` drives via `curl` (§1.6) — strong
evidence these three agents are the ones that were actually run against the Restaurant Bot MCP
Server during development. **But none of their INSERT statements set `McpServerGroupID`** (same
narrow column list as `AgentID=1`'s File B) — so per the current seed scripts, agents 2/3/4 also
currently resolve to zero DB-driven MCP tools via `AgentTranslator.MapMcpTools`. The `FunctionEnabled
=1 -- (has MCP tools)` comment appears to describe intent/history rather than current, re-runnable
seed state.

**Compounding this**: `AIMCP_McpServerGroups` seed data *does* have a row for the Restaurant Bot
server —
```
AIMCP_McpServerGroups: McpServerGroupID=1, McpServerID=1, ServerRole=N'Restaurant Service'
```
— but `AIMCP_McpServerGroupMembers.data.sql` contains **only one row total**, for the *GitHub*
group (`McpServerGroupID=7, McpServerID=7`). There is **no** `AIMCP_McpServerGroupMembers` row for
`McpServerGroupID=1`. Since `AgentTranslator.MapMcpTools` iterates
`composite.MyMcpServerGroupMembers`, **even if a future migration sets `AgentID=1`'s (or 2/3/4's)
`McpServerGroupID=1`, it would still resolve to zero MCP tools today** until a
`AIMCP_McpServerGroupMembers` row linking group 1 to server 1 is also inserted. This is the precise,
minimal seed-data gap a follow-up phase needs to close.

### 2.7 The one agent that IS fully, currently MCP-wired end-to-end in seed data

`AgentID=20`, "GitHub Commit Agent" (`AIAgent_Agents.data.sql`, its own INSERT block):
`FunctionEnabled=1, McpEnabled=1, McpServerGroupID=7`. Full chain, all real rows:
```
AIAgent_Agents.McpServerGroupID=7
  → AIMCP_McpServerGroups (McpServerGroupID=7, McpServerID=7, ServerRole='GitHub Commit Service')
  → AIMCP_McpServerGroupMembers (McpServerGroupMemberID=5, McpServerGroupID=7, McpServerID=7)
  → AIMCP_McpServers McpServerID=7 "GitHub MCP Server":
      ConfigJson = {"Id":"github-mcp","Name":"GitHub MCP Server",
        "StdioConfig":{"Command":"npx","Arguments":["-y","@modelcontextprotocol/server-github"],
        "EnvironmentVariables":{"GITHUB_PERSONAL_ACCESS_TOKEN":"<SET_ME>"}}}
  → AIMCP_McpTools McpToolID=11 "create_or_update_file" (McpServerID=7, full JSON-schema `Schema`
      column with owner/repo/path/content/message/branch parameters — informational only per §1.5)
```
This agent uses **stdio transport** (spawns `npx @modelcontextprotocol/server-github` as a
subprocess) and a **raw placeholder credential** (`<SET_ME>`, no `CredentialID` set) — i.e. this row
is DB-complete for the join-table wiring but not yet secret-ready.

`AIMCP_McpServers`'s other real row, `McpServerID=1` "Restaurant Bot MCP Server":
```
ConfigJson = {"Id":"restaurant-bot","Name":"Restaurant Bot MCP Server",
  "SseConfig":{"EndPoint":"http://localhost:58905/sse"}}
```
uses **SSE transport** against the exact local dev URL `mcp_quick_guide.md` documents running the
sample server on — confirming §1.6's sample server and this DB row are meant for each other. It has
no `CredentialID` set either (none needed — the sample server has no auth).

---

## 3. Tool discovery/schema shape a sample MCP server must expose

Confirmed by §1.5/§1.6: this codebase expects standard MCP tool shape — nothing custom.
`AiFunctionHelper.MapToFunctionDef` reads exactly:
- `tool.Name` — the function name the LLM calls.
- `tool.Description` — shown to the LLM for tool selection.
- `tool.JsonSchema.properties` — a standard JSON-Schema `properties` object (types, descriptions per
  field — whatever the SDK's tool-generation attributes emit, e.g. `[Description(...)]` on C#
  method params, or the equivalent hand-written JSON Schema for any other language's MCP SDK).
- `tool.JsonSchema.required` — a JSON array of required property names.

No extension fields, no custom wrapper, no BizFirst-specific envelope — a plain, spec-compliant MCP
`tools/list` response works as-is. The existing `RestaurantBot.MCPServer` (§1.6) already satisfies
this exactly, using the C# SDK's `[McpServerToolType]`/`[McpServerTool]`/`[Description]` attributes
to auto-generate schema — no hand-written JSON Schema was needed even for that sample.

---

## 4. Recommendation: reuse the existing internal sample server, don't build new and don't reach for an external OSS server

**Use `BizFirst.Ai.Octopus.RestaurantBot.MCPServer` (§1.6), already in the Octopus Core repo, as
the sample MCP server for orchestration testing.** Reasoning, based specifically on what was found
in §1 (not in the abstract):

1. **It already speaks the exact transport this codebase's client actually exercises.** The DB row
   (`McpServerID=1`) is pre-configured for it, SSE, `http://localhost:58905/sse`, and
   `mcp_quick_guide.md` proves this combination was run and worked. An external OSS server (e.g. the
   official `@modelcontextprotocol/server-everything` reference server) defaults to **stdio**
   (`npx @modelcontextprotocol/server-everything`) — which `McpClientManager` also supports
   (`StdioClientTransport`) — but its streamable-HTTP mode (`npm run start:streamableHttp`) is a
   *different* transport shape (`StreamableHttp`) than what this codebase's SSE path
   (`SseClientTransport`) or stdio path expects; nothing in this codebase references a
   `StreamableHttpClientTransport` type at all (checked directly — not present in the pinned SDK
   version's usage here). Using the official "everything" server would mean either running it in
   legacy SSE mode (deprecated by the MCP spec itself as of 2025-03-26, per public MCP docs) or
   proving out a transport path this codebase has never exercised.
2. **No network dependency, no public server needed.** Public web research (this sub-question only)
   found no free, publicly-hosted, no-auth MCP server reachable over the internet without running
   something locally yourself — every option (official "everything"/"filesystem"/"fetch" servers,
   community servers) requires `npx`/`docker` locally or a paid/managed host. The GitHub MCP server
   already seeded (`McpServerID=7`) is the closest thing to "point at something external," but it
   needs a real GitHub PAT and stdio `npx` — more setup than needed just to prove orchestration
   works.
3. **Its tool set is already "a good sample set of tools"** per Binoy's own ask — 5 tools, varied
   parameter shapes (string/int/double, some optional-free, one param-less), deterministic/no
   external dependencies, and thematically matched to the existing Pizza Bot agent family already in
   seed data (`AgentID=1-4`).
4. **The only real gap is the DB join-table wiring (§2.6)**, not the MCP server or the agent. This
   is a small, well-understood, mechanical fix for the next phase (insert one
   `AIMCP_McpServerGroupMembers` row + set an agent's `McpServerGroupID`) — much smaller than either
   building a new sample server or wiring up an external OSS one from scratch.

**Do not build a brand-new sample MCP server.** The existing one already covers everything Binoy
asked for ("make the mcp server provide a good sample set of tools") and duplicating it adds
maintenance surface for no benefit.

**Do not default to `AgentID=1` (Pizza Bot) for the follow-up phase without a decision from
Binoy** — see Open Questions below. `AgentID=1` is a router agent (`IsRouter=1`) with
`FunctionEnabled=0`; per `MCPToolAgentHook.cs:19-22`, **router agents are explicitly skipped for MCP
tool loading entirely** (`if (agent.Type == AgentTypeEnum.Routing) return;`) — so even after fixing
the `AIMCP_McpServerGroupMembers` gap, wiring `McpServerGroupID` directly onto `AgentID=1` would
still never actually load MCP tools, because the hook bails out before reaching that code for any
Routing-type agent. `AgentID=2` ("Order Inquiry") or `AgentID=3` ("Order Placement") — both
`AgentTypeID=1`/Standard, both already carrying the `-- (has MCP tools)` intent-comment and matching
the `mcp_quick_guide.md` demo `ResID`s — are the correct candidates for the actual DB wiring fix,
not `AgentID=1` itself.

---

## 5. Flow Studio wiring — confirmed real components for a later phase

Frontend root: `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\flow-studio\packages\flow-studio-designer\`
(pnpm workspace package `flow-studio-designer`; API client package `flow-studio-api`).

### 5.1 The AI Agent node and its "Agent" tab

- **`components\Nodes\AIAgentNode.tsx`** — `AIAgentNodeClass extends BaseNodeClass`. Purely
  visual/handle rendering; renders satellite ports `llm` (top), `memory` (top), `tool` (bottom,
  multi), `base-node` (bottom), `team-leader`/`team-member` (sub-agents), `extends`, `output`,
  `main`. No agent-picker UI lives on the node itself.
- **`components\Nodes\Base\BaseNode.tsx`**, `handleConfigureConnector` (~line 248) — opens
  **`components\Modals\ConnectorConfigDialog.tsx`** as `<ConnectorConfigDialog connectorId=...
  processElementId=... isOpen={showConnectorConfig} .../>`. This is the real node-config modal.
- **`ConnectorConfigDialog.tsx`** is genuinely tab-based (`store.visibleTabs.map(...)`, ~line 1450).
  Tab visibility comes from `components\Modals\tabVisibilityConditions.ts`, which for
  `nodeCategory === 'ai-ml' | 'ai' | 'ai-agent'` returns `['agent', 'llmModel', 'knowledgeBase',
  'memory', 'agentFunction', 'credentials']` — **confirming a literal "Agent" tab exists**
  (`getTabDisplayProperties('agent') => { label: 'Agent' }`).
- **The Agent tab's picker** (`ConnectorConfigDialog.tsx`, ~line 1833): a search input
  (`store.agentSearch`), a dropdown-toggle button that calls `loadAgents()` →
  `agentApiClient.getActive()` (`flow-studio-api\src\clients\agentApiClient.ts`) → populates
  `store.agents`; clicking a result calls `store.setAgentId(agent.AgentID)`. "Create"/"Edit" buttons
  open **`components\Entities\Agent\AgentEditor.tsx`** (a large standalone tabbed CRUD editor: Basic
  Info / Content / Category / LLM Configuration / Advanced Settings / Security / Blockchain, plus a
  left menu for Instructions/Templates/Capabilities/Rules/Hooks/etc., calling
  `agentApiClient.getById/create/update`).
- **Dead-code note**: a generic, reusable `EntityTabRenderer`
  (`components\Modals\EntityTabsRenderer.tsx`) implements the same search/dropdown/edit/add pattern
  generically for `agent | knowledgeBase | channel | llmModel | agentFunction`, but is referenced
  nowhere outside its own file — `ConnectorConfigDialog.tsx` reimplements the same markup inline per
  tab instead. Not the live implementation; don't build against it.

### 5.2 MCP / "Tool Servers" — confirmed absent from the Flow Studio frontend

Full-tree search (`MCP`, `McpServer`, `ToolServer`, `tool-server`, `mcp-server`) found **no MCP
satellite-node type and no MCP server-picker UI anywhere in Flow Studio**. The `tool`-category port
on the AI Agent node only accepts generic `tool`-category nodes
(`rules\portNodeSelectionRules.ts`, config tab `agentFunction`, backed by `AIFunctionEditor.tsx` /
`agentFunctionApiClient` — i.e. the native-function system, not MCP). The only MCP-related UI found
anywhere is inside `AgentEditor.tsx`'s "Category" tab: a single unlabeled-beyond-"MCP Enabled"
checkbox bound to `formData.McpEnabled`, plus two raw numeric fields `McpServerGroupID`/
`McpClientID` in the form's TS interface with **no lookup/dropdown editor wired to them** — a user
would have to type a raw group-ID integer with no picker, no visibility into what that ID means.
There is no server-picker, no transport/URL/auth config UI, no tool-list preview — nothing beyond
that checkbox and two bare numeric inputs. This matches the backend finding (§1 Subsystem D: the
satellite "Tool Servers" concept is real and wired on the *backend*, in
`OctopusToolServersInfo`/`OctopusToolServerInfo`/`McpServerInfo`, but has **no corresponding
frontend node type** to actually create one from Flow Studio today).

### 5.3 General workflow/node-add mechanics (for the later "create a workflow" phase)

- **Palette (drag source)**: `components\Toolbar\LeftToolbar.tsx`, drag-and-drop via
  `hooks\useNodeDrag.ts` onto `components\Canvas\WorkflowCanvas.tsx` (React Flow canvas).
- **Satellite "+" add path**: each AI Agent port has an add button opening
  `components\Modals\NodeSearchModal.tsx` — a filtered node picker restricted by
  `rules\portNodeSelectionRules.ts` per port (e.g. the `tool` port only shows `tool`-category
  nodes); selecting a node both creates it and wires the edge with correct handle mapping.
- **Trigger detection**: purely `nodeType.code.includes('trigger')`
  (`NodeSearchModal.tsx:345`); trigger-category nodes are excluded as targets almost everywhere
  (`excludeTriggerNodes: true`), preventing a second trigger from being wired downstream.
- **Not found in this pass**: a dedicated "create new workflow/project" component — likely lives in
  the `apps\flow-studio` app shell / routing layer rather than in `flow-studio-designer`; flagged as
  unconfirmed rather than guessed, worth a targeted look when that phase starts.

---

## Open questions for Binoy — do not guess

1. **Which agent should the follow-up phase actually wire to the sample MCP server?** `AgentID=1`
   (Pizza Bot) cannot work for this even after fixing the DB gap — it's a Routing-type agent, and
   `MCPToolAgentHook` explicitly skips MCP tool loading for `AgentTypeEnum.Routing` agents
   (§4). The natural candidates already in seed data, matching the theme and the
   `mcp_quick_guide.md` demo history, are `AgentID=2` "Order Inquiry" or `AgentID=3` "Order
   Placement" (both `AgentTypeID=1`/Standard). Confirm which one (or a new agent) before the next
   phase inserts rows.
2. **Should the missing `AIMCP_McpServerGroupMembers` row for `McpServerGroupID=1` (Restaurant
   Service → `McpServerID=1`) be added as part of the next phase**, or is there a reason it was
   deliberately left out (e.g. the Pizza Bot MCP demo was intentionally superseded by the GitHub
   Commit Agent example, `AgentID=20`, as the "reference" MCP integration going forward)? If GitHub
   is meant to be the canonical example per the directive's "may be we can integrate into a github
   mcp server integration," `AgentID=20`'s wiring is already DB-complete (§2.7) and only needs a
   real `CredentialID` (currently a raw `<SET_ME>` placeholder) — a materially different, smaller
   next step than fixing the Pizza Bot family.
3. **Does the credential-substitution pattern need to be retrofitted onto the GitHub MCP server row
   (`McpServerID=7`) before testing** — i.e. should the next phase create a real `AIExt_Credentials`
   row and set `AIMCP_McpServers.CredentialID` for it, replacing the raw `<SET_ME>` placeholder, to
   stay consistent with this codebase's mandatory credential pattern? Or is a raw PAT acceptable for
   a throwaway local test run?
4. **Flow Studio has no MCP/Tool-Server satellite node UI at all (§5.2)** — the backend can already
   consume a satellite override (Subsystem D), but nothing in the frontend can create one. Testing
   "attach MCP tools to an agent from Flow Studio" is therefore limited to the DB-driven path
   (`AgentID.McpServerGroupID`, set outside the UI) for now — building the missing satellite-node UI
   is out of scope for this scan but will block a fully Flow-Studio-driven MCP test unless the next
   phase accepts DB-side wiring as sufficient. Confirm whether the next phase should stay DB-only or
   also scope a minimal Flow Studio UI addition.
5. **`AIMCP_McpServerSettings.sql` / `AIMCP_McpToolSettings.sql` have a minor DDL defect** (missing
   comma before the `PK_` constraint, §2.1) — worth a fix ticket independent of this task, flagging
   rather than silently correcting since this phase is scan-only.
