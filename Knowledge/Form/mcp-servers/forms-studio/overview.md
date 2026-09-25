# Forms Studio — AI Agent Design Index (items 1-5)

This is the consolidated index for the "Forms Studio" initiative — Octopus AI agents building and
editing Atlas Forms via MCP tools, backed by a RAG spec so an agent knows the real control-type
catalogue. It ties together five work items dispatched the night of 2026-08-19, each with its own
detailed design doc elsewhere — this file is the map, not a duplicate of their content. **Written
while all five items are still in progress as background agents; update the status lines below as
each completes rather than treating this as a final record.**

## How the five items fit together

```
[3] DB registration (AIMCP_McpServers/Groups/GroupMembers + a test agent)
        |
        v
[1] MCP gateway host  <---calls in-process--- [2] Atlas Forms tool module (8 tools)
        ^                                              |
        |                                              v
   (agent connects via SSE)                  IFormsExtendedService (DONE, built+tested earlier)
        |
        v
   an Octopus agent, generating/editing forms
        |
        +--- grounded by ---> [5] RAG upload (gets atlas-forms-rag/v2's 77-file spec INTO the
        |                      live KnowledgeBase store an agent actually queries at runtime —
        |                      the spec exists as markdown today but isn't ingested anywhere yet)
        |
        +--- optionally coordinates via ---> [4] Agent teams (a team-leader agent delegating
                                               form-building sub-tasks to team-member agents —
                                               separate capability, not required for items 1-3
                                               to work standalone)
```

Items 1-3 are one coupled unit (the actual live MCP server) — item 2 doesn't work without item 1
hosting it, item 1 has nothing to serve without item 2's tools, and neither is reachable by an agent
without item 3's DB rows. Items 4 and 5 are independent extensions: item 5 (RAG upload) makes the
*existing* Atlas Forms MCP tools smarter (an agent that knows the real 115-type catalogue instead of
guessing), item 4 (agent teams) is a separate capability that isn't specific to Atlas Forms at all —
neither blocks items 1-3 from working.

## Item 1 — MCP gateway host process (`BizFirst.Ai.Mcp.Gateway`)

**Status: IN PROGRESS** (background agent, dispatched 2026-08-19 night). New host process, modeled
on the existing, proven `BizFirst.Ai.Octopus.RestaurantBot.MCPServer` sample
(`BizFirstAI.V21\src\ApiServer\tests\`) — `AddMcpServer().WithHttpTransport()`, SSE transport. Full
design: `Documentation\Employees\agentic-coding\bizfirst-ai-mcp-servers-spec\architecture.md`
("one MCP gateway process, many independent per-domain tool-module projects").

## Item 2 — Atlas Forms tool module (`BizFirst.Ai.Mcp.Tools.AtlasForms`)

**Status: IN PROGRESS** (same background agent as item 1). Implements the 8 curated tools
(`find_forms`, `create_form`, `get_form_schema`, `add_form_control`, `update_form_control`,
`remove_form_control`, `reorder_form_controls`, `set_form_enabled`), calling the already-built
`IFormsExtendedService`/`IFormService` directly in-process. Full design:
`Documentation\Employees\agentic-coding\bizfirst-ai-mcp-servers-spec\atlas-forms-design.md`. The
service layer this depends on is **already done** — real C#, 0 build errors, 26/26 tests passed
(see that doc's implementation, done earlier the same night).

## Item 3 — DB registration

**Status: IN PROGRESS** (same background agent as items 1-2). Real rows in `AIMCP_McpServers` /
`AIMCP_McpServerGroups` / `AIMCP_McpServerGroupMembers` (`data-ocean-platform-prod` database — not
`BIZFIRSTATLASDB`, a different, unrelated DB on the same SQL Server instance that caused real
confusion earlier tonight), plus a new dedicated test agent (`AgentTypeID=1`/Standard — not
`AgentID=1`"Pizza Bot", which is Routing-type and explicitly skipped by MCP tool loading; not
`AgentID=20`/`22`, the unrelated GitHub MCP test agents from an earlier task tonight). **Correction
relayed mid-build**: registration must land as a real, checked-in SQL script under
`BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\Master\` (matching the existing
`AIMCP_McpServers.data.sql`/etc. convention, which already has the GitHub MCP Server rows from
earlier tonight), executed via that script — not ad-hoc inline `sqlcmd -Q` commands. Full schema
reference: `Documentation\Employees\agentic-coding\mcp-server-spec\overview.md`.

## Item 4 — Agent teams

**Status: DONE — design/investigation pass complete.** Finding, unlike the other two "built but
unconsumed" gaps found elsewhere tonight: **two separate team mechanisms exist, both fully
consumed, not orphaned plumbing.** (1) DB-first Teams (`AIAgent_Teams`/`AIAgent_TeamMembers`/
`AICommon_TeamTypes`) — read live by `RoutingAgentHook` as Priority 2 of a 3-tier router
agent-selection cascade; delegation confirmed sequential/single-target/LLM-selected handoff, not
fan-out+aggregation. **The real gap: zero write path exists** — only hand-authored seed SQL has ever
created a row. (2) Flow-Studio-canvas Teams (`team-leader`/`team-member` satellite ports) — fully
wired but only Priority 3 fallback, creation is human-only via Flow Studio, no realistic
programmatic path. **Conclusion: "agent teams creates" = a CRUD write path for mechanism 1**, a
well-scoped MCP tool target. Design doc:
`Documentation\Employees\agentic-coding\bizfirst-ai-mcp-servers-spec\agent-teams-design.md` —
proposes `IAgentTeamService` in `BizFirstAI.V21`'s `Octopus.Core` (matching where the only existing
read path lives — note this is a *different* placement decision than Atlas Forms' tool module) +
`BizFirst.Ai.Mcp.Tools.AgentTeams` (6 new tools, all genuinely new, no reuse-wrappers). 5 open
questions for Binoy, most notably: is sequential handoff really the intended delegation model, and
tenant/auth threading, since this would be the first real MCP *write* tool if it ships before Atlas
Forms.

## Item 5 — RAG upload design

**Status: DONE (design) — actual upload is a manual step, by Binoy's explicit direction, not
further agent work.** Design doc: `Documentation\Employees\atlas-forms\atlas-forms-rag\agent\
ragUploadDesign.md`. Confirmed the real tool Binoy meant by "we already have tools": **FlowRag**
(`BizFirst.Ai.ExecutionNodes.Flow.FlowRag`, a real, already-built Flow Studio node — Insert/Update/
Delete/Search, takes raw text directly, atomic Update-by-`knowledge_id` refresh). Also found a real,
separate live bug worth knowing about even though it's now out of scope here: the native
`IKnowledgeService` admin UI's `FileDropzone` accepts `.md` uploads, but the backend silently fails
to chunk markdown files — FlowRag avoids this bug entirely, which is part of why it's the right
tool. **Binoy has since confirmed the actual upload of `atlas-forms-rag\v2\`'s 77 files will be done
manually, via the existing app — not something to automate or build further.** The design doc
remains the reference for *how* (which tool, what refresh strategy) whenever that manual step
happens; 7 open questions in it remain for Binoy's own reference, not blocking anything.

## What's next

Update each item's status line above as its background agent reports back. Items 1-3 landing means a
real, live, callable Atlas Forms MCP server exists for the first time — that's the priority
completion to confirm. Items 4-5 are designs to review, not yet build tasks, until Binoy has read
their open questions and given direction.
