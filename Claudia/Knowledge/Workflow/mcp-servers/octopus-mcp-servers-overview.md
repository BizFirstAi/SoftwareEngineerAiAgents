# BizFirstAI MCP Servers — Overall Strategy

## Directive (paraphrased, Binoy, 2026-08-19)

Binoy wants to expose BizFirstGO's product capabilities (form building, workflow building, and
more over time — "1000s of API endpoints," a catalogue that will keep growing) to AI agents via
MCP, both so **Octopus agents inside the product** can use them and so **external MCP clients**
(a client's own agent, Claude Desktop, etc.) can connect to the same servers. Given the same
capability set could otherwise be reached four other ways — (1) drive the UI, (2) call the REST
API directly, (3) wrap the API in an MCP server for Claude Code's own use, (5) call native
in-process functions — the explicit choice, confirmed in this conversation, is a hybrid of options
4 and 5: **build real MCP servers that Octopus agents call through the mechanism already proven
tonight**, using native in-process service calls as the implementation detail underneath. Start
slow: **Atlas Forms is the first pilot module.** Wants a consolidated MCP *gateway* with
independent per-domain C# projects underneath — not one monolith, not one process per domain.

This document is the overall strategy. See `architecture.md` for the concrete project/gateway
design and tool-catalogue-scaling approach, and `atlas-forms-design.md` for the first pilot
module's concrete tool list and the service-layer gaps it needs filled first.

## Why option 4 (Octopus calls a real MCP server), not 1/2/3/5 alone

Evaluated against what's actually built and just re-verified working end-to-end tonight
(`Documentation\Employees\agentic-coding\mcp-server-spec\overview.md` — the MCP integration scan
— and this session's live fix/retest of the MCP tool-dispatch bug):

1. **UI automation** — only justified for testing the UI itself. Not programmatic, not something
   an agent can reliably repeat. Not a contender for a real capability surface.
2. **Claude Code calls the API directly** — correct for one-off dev/ops/test automation (exactly
   what this session did to rebuild a test workflow and re-run it), but it is not a product
   capability. An end user's live Octopus agent cannot "do what Claude Code just did."
3. **Claude Code wraps the API in its own MCP server** — only pays off if Claude Code itself needs
   the same operations repeatedly across sessions. Still external tooling, not reachable by a live
   Octopus agent talking to an end user.
4. **Octopus agent calls a workflow/form/etc.-creation MCP server** — the pipeline this requires
   already exists and is now confirmed reachable end-to-end: `AIMCP_McpServers` (DB registration)
   → `McpClientManager` (live client, official `ModelContextProtocol` SDK, stdio or SSE) →
   `McpToolAgentHook` (merges live `tools/list` into the agent's function list) →
   `FunctionExecutorFactory` → `McpToolExecutor` (dispatch). Adopting this for a new domain needs
   **zero new plumbing** — write the MCP server, register it in `AIMCP_McpServers`/
   `AIMCP_McpServerGroupMembers`, grant it to an agent via `McpServerGroupID`. This is also
   externally reachable by design — the same server a client's own MCP-speaking agent could call.
5. **Native in-process functions** (`agent.Functions`, `IFunctionCallback`) — not a rival to
   option 4, it is how option 4's tool handlers should be *implemented internally* (call the same
   service-layer method a native function or a controller action would call). Native functions
   alone are only reachable by Octopus itself, in-process — no external interop, which conflicts
   with the explicit "connect a client's own MCP server too" goal.

**Conclusion: build real MCP servers (option 4), implemented internally via option 5's
service-layer calls.** One build serves both internal (Octopus) and external (any MCP client)
callers.

## What's already proven, not theoretical (grounds this strategy)

- The full DB→client→dispatch pipeline for MCP tool calling is real and live — confirmed by the
  MCP integration scan (`mcp-server-spec/overview.md`) and by this session's own work: a live
  GitHub MCP server (`AgentID=20`, `McpServerGroupID=7`) correctly offered `create_or_update_file`
  to gpt-4o-mini, the LLM correctly chose to call it, and — after this session's fix to
  `RoutingService.InvokeFunction.cs`/`RoutingService.InvokeAgent.cs` in `BizFirstAI.V21`'s
  Octopus Core — dispatch now reaches `McpToolExecutor` and attempts the real call (see
  `BizFirstAI.V21\src\ApiServer\src\Infrastructure\BizFirst.Ai.Octopus.Core\DevelopmentHistoryLog.md`,
  2026-08-19 entry, for the exact root cause and fix).
- A working sample MCP server already exists in-repo as a template:
  `BizFirst.Ai.Octopus.RestaurantBot.MCPServer` (`BizFirstAI.V21\src\ApiServer\tests\`) —
  `.WithHttpTransport()`, `[McpServerToolType]`/`[McpServerTool]`/`[Description]` attributes,
  auto-generated schema, no hand-written JSON Schema needed.
- The credential pattern MCP servers should use is already implemented and codebase-mandated:
  `McpClientManager`'s three-tier credential resolution (satellite override → server default →
  agent default), `{fieldName}` wildcard substitution from `IRepositoryBase.
  GetDecryptedCredentialJsonAsync` — the same `ICredentialResolver` pattern used everywhere else
  in this codebase (SMTP is the reference implementation).
- The per-agent tool allow-list mechanism is already implemented: `AIMCP_McpTools`/
  `McpTool.Functions` — an agent's MCP-server entry can list specific function names to expose, or
  none (exposes all of that server's tools). This is the mechanism that lets the total tool
  catalogue grow without any single agent's per-call tool list growing with it (see
  `architecture.md`).

## Non-goals for this pass

- **Not building the gateway or the Atlas Forms module yet.** This is a strategy + design pass
  only, matching how `mcp-server-spec/overview.md` was scoped ("scan and understand," no code
  written). `architecture.md` and `atlas-forms-design.md` are design documents to review before
  implementation starts.
- **Not attempting to migrate every existing endpoint to MCP.** The 1000s-of-endpoints scale is
  exactly why `architecture.md` recommends *curated, task-shaped* tools per domain (5-15 tools),
  not a 1:1 mechanical wrapper over every controller action.
- **Not redesigning `AIMCP_*`'s DB schema.** It already supports everything this strategy needs
  (server registration, group membership, per-agent function allow-lists, credential resolution).
  Any real gap found there is a separate, narrow fix — not a redesign.

## Open questions for Binoy — do not guess

1. **Gateway process placement.** Should the new MCP gateway live inside `BizFirstAI.V21` (next to
   `RestaurantBot.MCPServer`, closest to the client/dispatch code it will be tested against) or in
   `BizFirstPayrollV3` (closest to the domain service layers — Atlas Forms, ProcessEngine — it will
   call into)? `architecture.md` recommends `BizFirstPayrollV3`, reasoning below — confirm before
   committing.
2. **Deployment/hosting.** One long-running process per environment (like `Consolidated.WebApi`),
   or something lighter-weight/serverless per module? Given tonight's dev-box memory constraints
   (~7.7GB RAM, machine already OOM-kills the existing Consolidated WebApi under load — see that
   project's `DevelopmentHistoryLog.md`), a new always-on process is a real resource cost to plan
   for, not just a design footnote.
3. **Tool curation ownership.** Who decides which ~5-15 tools each domain module exposes (this
   doc's author, the domain's own team, or a shared review step)? This directly controls catalogue
   quality at scale — worth an explicit process, not ad hoc per module.
4. **Second pilot after Atlas Forms.** Workflow/Process building was named as a near-term target
   too. Confirm Atlas Forms ships and is validated first before starting a second module in
   parallel, per Binoy's own "start slow" framing.
