# BizFirstAI MCP Servers — Architecture

See `overview.md` for why (option 4: Octopus/external agents call real MCP servers, implemented
via native in-process service calls). This document is the concrete project/gateway structure and
the standing conventions every future module must follow.

## Standing rule: never modify an existing core service — always add an `*Extended` service

**Confirmed by Binoy while this spec was being written, applies to every module, not just Atlas
Forms:** when a new capability is needed for AI/MCP that the existing core service (`IFormService`,
`IProcessEngineService`, etc.) doesn't have, do **not** add methods to that core service or its
controllers. Create (or extend, if the domain already has one) an `I{Domain}ExtendedService` in a
separate `*.Extended.Services` project, with its own `*.Extended.Api.Base`/`*.Extended.Api`
controllers exposing new routes. Reasoning, stated directly by Binoy: **existing developers/
consumers of the core service must never need to retest anything already working.** A new project
+ new interface + new routes is strictly additive — zero blast radius on the tested, shipped core
surface.

This is not a new pattern for this codebase — it is the SAME "Extended" split already used
throughout (e.g. `BizFirst.Atlas.Forms.Extended.{Domain,Services}` already exists alongside
`BizFirst.Atlas.Forms.Manager.{Domain,Infrastructure,Service,Api.Base,Api}`, currently used for
`IFullFormService`/`IFormInheritanceService`/`ISchemaChecksumService`). Atlas Forms today calls the
Extended service directly from the *core* `BaseFormController` (an existing bridge, `full-form`
action) — for **new** work, don't repeat that bridge; give the Extended service its own
`.Extended.Api.Base` controllers instead, so it is a fully independent surface a core-service
consumer never has to know exists. See `atlas-forms-design.md` for the concrete
`IFormsExtendedService` this produces.

**Every future MCP module follows this same rule**: an MCP tool module's implementation calls the
domain's `*ExtendedService` (new or existing) for anything MCP-specific, and the domain's ordinary
`I{Domain}Service` only for capabilities that were already there and already safe to reuse
unchanged (e.g. `create_form` can legitimately call the existing `IFormService.CreateAsync` — no
change needed there — while `add_form_control` needs a new `IFormsExtendedService.
AddControlAsync`).

## One MCP gateway process, many independent per-domain tool-module projects

**Not** one monolithic MCP server file with 1000s of tools, and **not** one MCP server process per
domain. Both extremes are wrong for different reasons: a monolith is a single point of failure and
an unversionable dumping ground; one-process-per-domain multiplies operational cost (auth wiring,
DI container, DB connections, health checks — each duplicated N times) on a dev box that already
OOM-kills a single large process under load (see `BizFirst.Ai.Octopus.Core`'s and the Consolidated
WebApi's `DevelopmentHistoryLog.md` entries from this exact session).

Structure:

```
BizFirst.Ai.Mcp.Gateway            (new host project — the ONE MCP server process/endpoint)
  Program.cs: AddMcpServer().WithHttpTransport() + .WithToolsFromAssembly() per registered module

BizFirst.Ai.Mcp.Tools.AtlasForms   (new — first pilot module, see atlas-forms-design.md)
  references: BizFirst.Atlas.Forms.Extended.Services (+ IFormService for the unchanged reads)
  NOT: BizFirst.Atlas.Forms.Manager.Api / .Api.Base — no HTTP hop, in-process only

BizFirst.Ai.Mcp.Tools.Workflow     (future — second pilot, after Atlas Forms ships)
  references: IProcessEngineService + its own new *ExtendedService for anything not already there

BizFirst.Ai.Mcp.Tools.{NextDomain} (future — same pattern, one project per domain)
```

- **One thing to register in `AIMCP_McpServers`** and **one thing to grant via `McpServerGroupID`**
  regardless of how many domains are behind it — an Octopus agent (or an external MCP client) sees
  one server. Internally the gateway composes its tool list from every referenced module assembly
  at startup (same idea as `BizFirst.Ai.Consolidated.WebApi` composing 640 controllers from many
  `.Api.Base` projects, not writing 640 controllers in one file).
- Each tool-module project calls its domain's service layer **in-process** — same DI container as
  the gateway host, zero extra network hop, zero duplicated auth/tenant-resolution logic. Tool
  methods use the official SDK's `[McpServerTool]`/`[Description]` attributes (same pattern as the
  existing sample, `BizFirst.Ai.Octopus.RestaurantBot.MCPServer`) — schema is auto-generated, never
  hand-written.
- Adding a new domain = one new project (following the `*ExtendedService`-only rule above for
  anything new) + one line in the gateway's `Program.cs`. Existing modules are never touched.

## Tool catalogue scaling (the "1000s of endpoints" problem)

Do **not** create a 1:1 tool per controller action. At the scale Binoy described, that would blow
out the LLM's per-call tool list and directly hurt tool-selection accuracy — a known MCP scaling
failure mode, not a hypothetical one.

1. **Curate to ~5-15 *task-shaped* tools per domain module**, not one tool per endpoint. Collapse
   every read-path variant (`list`/`by-id`/`by-category`/`by-type`/`by-code`/`search`/…) into one
   `find_{thing}(filter)` tool; keep writes as one tool per genuinely distinct write operation. See
   `atlas-forms-design.md` for a worked example (8 existing controller actions → curated to ~8 MCP
   tools, several of which are genuinely new capability, not endpoint wrappers).
2. **Use the already-built per-agent allow-list to keep any single agent's tool list small even as
   the total catalogue grows.** `AIMCP_McpTools`/`McpTool.Functions` already lets an agent's MCP
   server entry name a specific subset of a server's tools (confirmed live in tonight's
   investigation and fix — `MCPToolAgentHook.GetMcpContent`: "*a function-less entry exposes ALL of
   the server's tools; a function-less entry with declared functions filters to that subset*"). A
   form-building agent gets granted only the Atlas Forms subset; a workflow-building agent gets
   only the Workflow subset — from the SAME gateway, no per-domain server needed for isolation.
3. **Curation ownership** — open question in `overview.md` (#3); resolve before the catalogue grows
   past the first 1-2 modules, since retrofitting curation onto an already-large tool list is far
   more disruptive than deciding the target shape up front.

## Credential & tenant scoping — reuse, don't rebuild

`McpClientManager`'s three-tier credential resolution (satellite override → server default → agent
default) and tenant scoping already exist and are exercised by every MCP call today. A gateway
module calling its domain service in-process should resolve tenant/user context the exact same way
an ordinary controller action already does (`IGoUserContextAccessor`/`IRequestIdentityContext`) —
**do not invent a second identity-resolution path for MCP tool calls.** If the gateway process runs
under its own service identity rather than per-caller HTTP auth, the per-call `TenantId`/`UserId`
still needs to come from the conversation/session context Octopus already threads through
(`ConversationPipeContext`, `IConversationStateService`) — confirm this threading works before
building the first real (non-read-only) write tool, since a form/workflow created with the wrong
`TenantID` is a real data-integrity risk, not just a test inconvenience.

## Deployment note (ties to `overview.md` open question #2)

This dev box is memory-constrained (~7.7GB RAM) and has already OOM-killed the existing
Consolidated WebApi mid-session tonight. A new always-on gateway process is a real resource cost.
Recommend confirming hosting/deployment shape (own process vs. hosted inside an existing WebApi as
a mapped MCP endpoint) before the gateway is built, not after — retrofitting a hosting model change
onto a already-built gateway is wasted work.
