# Agent Teams — Design & Investigation

See `overview.md`/`architecture.md` for the overall MCP strategy this follows. Binoy's directive,
paraphrased from mid-session tonight: **"We will also require agent teams creates"** — a capability
for an agent (or a human) to create a *team* of Octopus agents (a leader delegating to member
sub-agents), as a follow-on to the Atlas Forms MCP pilot. This request was ambiguous in scope as
stated. This document is the investigation into what already exists, grounded in real code, before
any build decision — no implementation code was written in this pass.

## Summary — the one-paragraph answer

**There are two separate, unrelated "team" mechanisms already in this codebase, at very different
levels of completeness.** (1) A DB-first mechanism — `AIAgent_Teams`/`AIAgent_TeamMembers` tables,
consumed live by the routing hook as **Priority 2** of a 3-tier routing agent selection — is fully
wired end-to-end on the **read/consume** side, but has **zero write path anywhere in the codebase**:
no repository method, no service, no controller, no UI. It can only be populated today by hand-
authored SQL seed data. (2) A Flow-Studio-canvas mechanism — `team-leader`/`team-member` satellite
ports on the `AIAgentNode`, resolved through `AiAgentNodeExecutorConfigResolver` → `SubAgentCollector`
→ `OctopusAiAgentBridgeOriginReader.SubAgents` → `ProcessEngineAgentOverrideSource` →
`RoutingAgentHook` — is **also fully wired end-to-end**, not config-plumbing-with-no-consumer. It
supplements only **Priority 3** (profile-based fallback) of the same routing selection, and requires
a human to hand-wire it on a Flow Studio canvas; there is no programmatic/MCP-reachable way to create
this wiring either. **Neither mechanism has anything an MCP tool could call today to programmatically
create a team.** That is the actual, single gap this document scopes a v1 around.

## Current state (read directly from code, not assumed)

### Mechanism 1 — DB-first Teams (`AIAgent_Teams`/`AIAgent_TeamMembers`), Priority 2 routing

**Tables** (`BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Tables\`):

- `AIAgent_Teams.sql` — `TeamID` PK, `TeamName`, `Description`, `TeamTypeID` (FK →
  `AICommon_TeamTypes`), `Purpose`, `IsActive`, **`LeaderAgentID` INT NULL** (the router agent this
  team belongs to), `TenantID`, full standard audit-column set (`Deleted`/`Archived`/
  `LastModifiedOn(By)`/`CreatedOn(By)`/`SourceAppID`/`ClientAccountID`/`AppDomainID`/`DataDomainID`/
  `DataSegmentID`/`ResID`) — this table already follows every DB standard in the project's own
  instructions.
- `AIAgent_TeamMembers.sql` — `TeamMemberID` PK, `TeamID` (FK), `AgentID`, `Role`, `Capabilities`,
  `JoinedOn`/`LeftOn`, `IsActive`, `RoutingPriority`, `RoutingCondition`, `RoutingWeight`,
  `IsRoutingEnabled`, `MaxConcurrentRequests`/`MaxQueueSize`, `RoutingMetadata`, `LastRoutedTime`,
  `RoutingSuccessRate`/`RoutingFailureCount`, same full audit-column set, unique index on
  `(TeamID, AgentID)` where `IsActive = 1`.
- `AICommon_TeamTypes.sql` — lookup table, `TeamTypeID` PK, `TeamTypeName`, standard audit columns.
- Seed data exists for a demo pizza-ordering domain: `AIAgent_Teams_005_bizfirst.data.sql`,
  `AIAgent_TeamMembers_005_bizfirst.data.sql`, plus per-team files under `dbo\Data\Agents\{1_Pizza
  Bot,2_Order Inquiry,3_Order Placement,4_Payment}\AIAgent_TeamMembers_*.data.sql` — these are the
  **only** place any row in these tables is created anywhere in the repo. All hand-authored `.sql`.

**Consumption (real, confirmed live):**
`BizFirstAI.V21\src\ApiServer\src\Infrastructure\BizFirst.Ai.Octopus.Core\Routing\Hooks\
RoutingAgentHook.cs` (`OnInstructionLoaded`) implements a documented **3-priority** cascade for
populating a router agent's routable-agent list:

1. **Priority 1 — Request**: explicit `requested_agent_ids` from conversation state
   (`ITeamsBasedRoutingService.GetRequestedRoutableAgents`).
2. **Priority 2 — Teams**: `teamsService.GetTeamRoutableAgents(_agent.AgentID)` — a **raw SQL query**
   (`TeamsBasedRoutingService.cs`) joining `AIAgent_Teams` → `AIAgent_TeamMembers` → `AIAgent_Agents`
   on `t.LeaderAgentID = @RouterId AND t.IsActive = 1 AND tm.IsActive = 1 AND
   tm.IsRoutingEnabled = 1`, ordered by `RoutingPriority`. A warning is logged and it falls through if
   no team exists: `"No team members found for router {RouterId}. Check AIAgent_Teams and
   AIAgent_TeamMembers tables."`
3. **Priority 3 — Profiles**: `routing.GetRoutableAgents(_agent.Profiles)`, then — **only at this
   tier** — unioned with the canvas mechanism's seeds (Mechanism 2 below) via
   `IAgentCompositionOverrideSource.GetRoutableSeedsFor`/`RoutingOrchestrationService
   .AddCanvasRoutableAgents`.

**Actual delegation semantics** (confirmed by reading `NaiveReasoner.cs`/`OneStepForwardReasoner.cs`
and `RoutingOrchestrationService.InstructDirect`): this is **sequential, LLM-selected single-target
handoff**, not parallel fan-out with aggregation and not "leader always wins with members as extra
context." The router agent's own LLM call (`reasoner.naive` template, rendered with
`routing_agents_list`) picks **one** next agent via function-call-style output
(`FunctionCallFromLlm`); `RoutingOrchestrationService.InstructDirect` then invokes exactly that agent
and appends its response to the shared dialog. `NaiveReasoner.AgentExecuted` handles an
"UnmatchedAgent" case by popping back to the router and excluding the wrong agent from
`routing_agents`, so control *can* return to the router for a second selection, but each hop targets
one agent at a time — there is no code path that invokes multiple team members concurrently or merges
their outputs into one response.

**Write path — CORRECTION (2026-08-19): this was WRONG, a real research miss, not a confirmed
absence.** A parallel research pass (Task 16, `octopus-admin-spec\overview.md`) found — and this was
independently re-verified directly against real code before accepting the correction — a **complete,
tested, already-working write path** in `BizFirstPayrollV3\src\mvc-server\Ai\AiAgent\`:
- `BaseTeamController.cs` (`BizFirst.Ai.AiAgent.Api.Base`), route `api/v1/ai-agent/teams`: full CRUD
  (`list`/`by-id`/`Create`/`Update`/`Delete`), queries (`active`/`by-name`/`by-leader`/
  `get-by-agent`), operations (`activate`/`deactivate`/`assign-leader`/`remove-leader`), validation
  (`validate`/`name-exists`) — 15 actions total, `[AuthorizeTenantAdminAttribute]` on mutations,
  `[AuthorizeRegularUserAttribute]` on reads.
- `BaseTeamMemberController.cs` (same project), route `api/v1/ai-agent/team-members` — the member-level
  CRUD counterpart.
- Backing `TeamService.cs`/`ITeamService` (`BizFirst.Ai.AiAgent.Service`), with real test coverage
  (`TeamServiceTests.cs`, `TeamControllerTests.cs`, `TeamMemberControllerTests.cs`).
- **Confirmed to map to the exact same tables this document already investigated**: `Team.cs`
  (`BizFirst.Ai.AiAgent.Domain\Entities\`) has `TeamID`/`LeaderAgentID` matching `AIAgent_Teams`
  exactly, and `AiAgentDbContext.cs` confirms `entity.ToTable("AIAgent_Teams")` /
  `entity.ToTable("AIAgent_TeamMembers")` at lines 363/374 — this is not a parallel/different schema,
  it is the real write path for Mechanism 1's own tables.

**Why the original grep in this document missed it**: the search terms used (`Team.*Controller`,
`ITeamRepository`, `TeamService`, `CreateTeam`, `AgentTeam`) were run "across both `BizFirstAI.V21`
and `BizFirstPayrollV3\src\mvc-server`" but evidently never actually matched
`BizFirst.Ai.AiAgent.Api.Base\Controllers\BaseTeamController.cs`/`TeamService.cs` despite those
filenames containing "Team"/"TeamService" literally — likely a glob/path-scoping error in the
original pass, not a real absence. Lesson: this document's own confident "zero results" claim was
wrong; treat every "confirmed absent" claim across this whole spec folder as worth a second grep
before relying on it for a build decision, the same way this one was just caught.

There **is** still no UI for it, and there **is** no MCP/programmatic path to it yet — both of those
parts of the original finding stand. But "no service/controller exists, only hand-written SQL" is
retracted.

### Mechanism 2 — Flow-Studio-canvas Teams (`team-leader`/`team-member` satellite wiring)

**UI**: `BizFirstAiStudio\src\flow-studio\packages\flow-studio-designer\src\components\Nodes\
AIAgentNode.tsx` — a `team-member` **target** handle (left side, pink, "Sub Agent" label, line 265-267)
and a `team-leader` **source** handle (bottom, orange, "Sub Agents" label, line 270-274). A human
drags a wire from one `AIAgentNode`'s `team-leader` output to another `AIAgentNode`'s `team-member`
input on the same Flow Studio canvas. This is pure canvas wiring — it does not touch
`AIAgent_Teams`/`AIAgent_TeamMembers` at all; it is process-element satellite structure, resolved at
flow-execution time.

**Config resolution** (`BizFirstPayrollV3\...\BizFirst.Ai.ExecutionNodes.Octopus.OctopusAi\AiAgent\
Executor\Support\AiAgentNodeExecutorConfigResolver.cs`): `team-member` satellites are deliberately
**excluded** from the generic host-config rollup (a sub-agent's own config would otherwise pollute
the host's effective config) and instead have their own config subtree resolved into a throwaway
config, per satellite, recursively.

**Collection into a sub-agent list** — two parallel implementations exist, doing the same job for two
different call shapes:
- `SubAgentCollector.cs` (`OctopusAi` project) — static collector used elsewhere in the same project.
- `OctopusAiAgentBridgeOriginReader.SubAgents.cs` (`.Domain` project, partial class) — computed
  **live** (not populated imperatively) from `_satelliteNodes.GetAllByRole(SatellitePortKeys
  .TeamMember)`; also exposes `SubAgentReaders` (recursively-constructed child reader instances, one
  per team-member, so a sub-agent's own team-members/LLM/MCP overrides apply when *it* is invoked, not
  only when the host is) and `AgentsJson` (raw JSON view).

**Bridge to V21** (`BizFirstAI.V21\...\BizFirst.Ai.Octopus.ProcessEngine.Adapter.Services\Services\
Agent\ProcessEngineAgentOverrideSource.cs`) — implements `IAgentCompositionOverrideSource`
(`BizFirst.Ai.Octopus.Abstraction.Agents`). `Set()` recursively registers one `OriginReader` per
agent ID in the whole team-member tree (not just the host), keyed by each sub-agent's own resolved
`AgentID`. `GetRoutableSeedsFor(agentId)` maps `reader.SubAgents` → `AgentRoutingSeed` records.
`Apply(Agent agent)` — called from `AgentManagementService.LoadAgent` (`AgentService.LoadAgent.cs`
line 83), **after** channel-instruction override and **before** any `IAgentHook` fires — applies
`ExtraInstructions`→`SecondaryInstructions`, MCP servers→`agent.McpTools`, and LLM overrides.

**Consumed by routing** — `RoutingAgentHook.cs` line 101-107: **only** as the Priority-3 supplement
described above (`overrideSource.GetRoutableSeedsFor(_agent.Id)` → `routing.AddCanvasRoutableAgents`,
which resolves each seed to a real DB agent by int ID or by name, dedupes, and unions it into the
profile-based routable set — "canvas supplements DB, never replaces it"). **This mechanism is fully
consumed, not orphaned plumbing** — contrary to the two other "built the config layer, application
layer never followed" patterns found elsewhere this session (Flow↔Octopus conversation correlation;
AiConversation/ProcessSecurity authorization). Both `AiAgentNodeExecutorConfigResolver`'s comments and
`IOctopusAiAgentBridgeOriginReader`'s XML docs explicitly describe this WS2 (work-stream 2) design and
match what the running code actually does.

**Creation path**: human-only, via Flow Studio's visual canvas. No REST endpoint, no MCP tool, no
programmatic path exists to wire a `team-member` satellite — an agent (Octopus or otherwise) cannot
"create" this kind of team today except by an end user dragging a wire in the UI.

### How the two mechanisms relate

They are **not** the same "team" concept wearing two skins — they are structurally different and sit
at different routing priorities:

| | Mechanism 1 (DB Teams) | Mechanism 2 (Canvas satellites) |
|---|---|---|
| Storage | `AIAgent_Teams`/`AIAgent_TeamMembers` rows | Flow Studio process-element JSON (no DB team row) |
| Routing priority | 2 (primary, before profile fallback) | 3 only (profile-fallback supplement) |
| Scope | Whole agent, any conversation that routes to that leader | This one Flow Studio node instance only |
| Creation today | Hand-written SQL only | Human drags a wire in Flow Studio only |
| Write API | None | None |
| Read/consume path | Fully wired, live | Fully wired, live |

A router agent could in principle have team members from *both* sources simultaneously (Priority 2
DB team members, plus Priority 3 canvas-wired members if Priority 1/2 come up empty) — the code does
not prevent this, though in practice a router with a real DB team never reaches Priority 3.

**v1 build target — confirmed, not just this doc's own inference (see Decisions section below):**
Mechanism 1 (DB-first Teams) is the sole target for `IAgentTeamService`/
`BizFirst.Ai.Mcp.Tools.AgentTeams`. Mechanism 2 (Flow-Studio-canvas satellite wiring) is explicitly
deferred, future work — do not design or build against it in this pass. A future reader picking this
doc up does not need to re-derive that from the two-mechanism comparison above.

## Answering the four investigation questions directly

1. **Does anything downstream actually consume the config-resolution machinery, or is it unconsumed
   plumbing?** **Consumed.** Both the DB-team read path and the canvas-satellite read path are real,
   live, and exercised by `RoutingAgentHook`/`RoutingOrchestrationService`/`NaiveReasoner` today. This
   is *not* a repeat of the "built the layer, nothing downstream consumes it" pattern found twice
   earlier this session. What's missing is strictly upstream of both — there is no **create** path for
   either.
2. **Is there a DB-level "agent team" concept?** **Yes**, and it is the more complete of the two
   mechanisms in schema terms — `AIAgent_Teams` (with `LeaderAgentID`, `TeamTypeID`) +
   `AIAgent_TeamMembers` (with routing priority/weight/condition columns already far beyond what's
   used today) + `AICommon_TeamTypes` lookup. It already meets every column standard in this project's
   own DB conventions. It simply has no write path.
3. **Is there an existing API/UI path to create a team today?** **No, for either mechanism.**
   Mechanism 1 has no controller, service, or repository write method anywhere — only hand-authored
   seed SQL. Mechanism 2 has a human-only Flow Studio canvas path, with no REST/MCP equivalent.
4. **Should this be a new MCP tool module, following the `BizFirst.Ai.Mcp.Tools.{Domain}` pattern?**
   **Yes, this is the natural shape** — see proposed design below — but it targets **Mechanism 1**
   (DB Teams), not Mechanism 2. A tool that "creates a team" for an Octopus agent to call
   programmatically maps directly onto `AIAgent_Teams`/`AIAgent_TeamMembers` CRUD; there is no
   sensible way for an MCP tool to "drag a wire on a Flow Studio canvas" — that mechanism is
   inherently a human-authoring-time canvas feature, not a call an agent can make at runtime. This
   confirms Binoy's contextual framing (assemble a team of other agents programmatically) rather than
   assuming it. **Now directly confirmed by Binoy, not just this doc's own inference — see Decisions
   section below.**

## Proposed design: `BizFirst.Ai.Mcp.Tools.AgentTeams` — REVISED after the write-path correction above

The original version of this section proposed building a brand-new `IAgentTeamService` from scratch
in `BizFirstAI.V21`. **That premise is gone.** `ITeamService`/`ITeamMemberService`
(`BizFirst.Ai.AiAgent.Service`, `BizFirstPayrollV3`) already implement everything this section was
about to design: Create/Update/Delete, Activate/Deactivate, AssignLeader/RemoveLeader, GetByLeaderAgent,
NameExists, Validate — all against `AIAgent_Teams`/`AIAgent_TeamMembers`. This now follows the
**exact same shape as Atlas Forms**: wrap an existing, tested core service in-process, no new
write path, no new schema.

**Placement**: `BizFirstPayrollV3`, alongside `ITeamService`/`ITeamMemberService` (NOT
`BizFirstAI.V21`'s `Octopus.Core` as originally proposed) — same reasoning as Atlas Forms' Gateway
placement: the tool module needs the real service in-process, and that service lives here. This also
resolves Open Question 2 below (`BizFirstAI.V21` vs. `BizFirstPayrollV3` placement) the same
direction Binoy already decided for the MCP gateway host itself (merge into the platform server,
project-reference the tool logic — see `overview.md`'s update). If the gateway ends up merged into
the Consolidated WebApi (as just decided for Atlas Forms), an Agent Teams tool module placed in
`BizFirstPayrollV3` reaches `ITeamService` the same in-process way Atlas Forms' tools reach
`IFormsExtendedService` — no HTTP hop, no cross-repo call.

**No new interface needed.** Read `ITeamService.cs`/`ITeamMemberService.cs`
(`BizFirst.Ai.AiAgent.Domain.Interfaces.Services`) directly for the real method signatures before
building the tool module — do not re-sketch DTOs from scratch as the prior version of this section
did; use what's already there.

**One piece of business logic still worth stating** (carried over from the original draft, still
correct): a `create_agent_team` tool should validate `LeaderAgentID` resolves to a real, enabled
agent of type `Routing` — the only agent type `RoutingAgentHook` treats as a router. Check whether
`TeamService.CreateAsync`/`AssignLeaderAsync` already enforces this (likely, given the controller has
a dedicated `Validate` action) before assuming the MCP tool needs to re-implement the check itself.

**MCP tool module**: `BizFirst.Ai.Mcp.Tools.AgentTeams`, references `ITeamService`/
`ITeamMemberService` in-process (same in-process, no-HTTP-hop pattern as
`BizFirst.Ai.Mcp.Tools.AtlasForms`). Curated tool list — update against the REAL method names on
`ITeamService`/`ITeamMemberService` when building, the table below is illustrative pending that read:

| Tool | Backing call | New or existing |
|---|---|---|
| `create_agent_team(name, leaderAgentId, teamType, description)` | `ITeamService.CreateAsync` | **thin wrapper over existing** |
| `find_agent_teams(filter)` | `ITeamService.GetAllAsync`/`FindByNameAsync` | **thin wrapper over existing** |
| `get_agent_team(teamId)` | `ITeamService.GetByIdAsync` | **thin wrapper over existing** |
| `add_team_member(teamId, agentId, role, routingPriority)` | `ITeamMemberService`'s add method | **thin wrapper over existing** |
| `remove_team_member(teamId, agentId)` | `ITeamMemberService`'s remove method | **thin wrapper over existing** |
| `set_team_active(teamId, isActive)` | `ITeamService.ActivateTeamAsync`/`DeactivateTeamAsync` | **thin wrapper over existing** |

Every tool here is now a thin wrapper, same as most of Atlas Forms' tool set — there is no new
write-path code to build, only the MCP tool-attribute layer + tenant/auth threading (Open Question 5
below still applies unchanged). 6 tools, within `architecture.md`'s 5-15-tools-per-domain curation
guidance.

**Cross-reference**: `octopus-admin-spec\overview.md`/`architecture.md` (Task 16) independently
scopes a human-facing Agent Teams CRUD *admin UI* against this exact same `ITeamService`/
`ITeamMemberService` backend. Both this MCP tool module and that admin UI are two different front
doors onto the same one real service — building both does not duplicate the write path, as long as
neither one re-implements team-creation logic itself rather than calling the existing service.

## Decisions (confirmed by Binoy)

1. **Mechanism 1 vs. Mechanism 2 as the v1 build target.** Raised implicitly by this doc's own
   investigation ("Answering the four investigation questions directly," question 4), which concluded
   the target should be Mechanism 1 (DB-first Teams) but flagged that conclusion as this doc's own
   inference, not a confirmed instruction — "confirms Binoy's contextual framing... rather than
   assuming it." Confirmed directly by Binoy, mid-session, in response to this doc: *"we will be using
   database based choices (octopus). Flow is more like injected mcp server and we will deal with them
   later."* This resolves the inference into an explicit decision: **Mechanism 1
   (`AIAgent_Teams`/`AIAgent_TeamMembers`/`AICommon_TeamTypes`) is the sole v1 build target** for
   `IAgentTeamService`/`BizFirst.Ai.Mcp.Tools.AgentTeams`. Mechanism 2 (Flow-Studio-canvas
   `team-leader`/`team-member` satellite wiring) is explicitly deferred — Binoy characterizes it as
   behaving like an "injected MCP server," i.e. a per-process-definition satellite override layered
   additively on top of the DB-driven base configuration, matching the "Bridge-side Tool Servers
   satellite config parsing" pattern already documented in `mcp-server-spec\overview.md`'s Subsystem
   D — not something to design or build against in this pass. This does not change the proposed
   `IAgentTeamService`/tool design above, which already targeted Mechanism 1 only and already listed
   "not building Mechanism 2's programmatic equivalent" as a Non-goal; it removes the hedge from that
   conclusion, nothing more.

## Non-goals

- **Not building Mechanism 2's programmatic equivalent.** Giving an MCP tool the ability to wire a
  `team-member` satellite onto a specific Flow Studio node/canvas is a fundamentally different,
  much harder problem (it would need to mutate a specific process definition's JSON, not just insert
  DB rows) and was not what Binoy's "agent teams creates" request was actually pointed at once traced
  through the code — Mechanism 1 is the clean, MCP-shaped gap. Flag this explicitly as a deliberate
  scope cut, not an oversight.
- **Not changing `RoutingAgentHook`/`TeamsBasedRoutingService`/`NaiveReasoner`/
  `RoutingOrchestrationService`.** All four already correctly consume `AIAgent_Teams`/
  `AIAgent_TeamMembers` rows the moment they exist; this design only needs to make rows exist. No
  routing-logic change is in scope.
- **Not implementing parallel/aggregated multi-agent delegation.** Confirmed above: today's real
  semantics are sequential, single-target, LLM-selected handoff. If Binoy wants a leader that fans a
  task out to multiple members concurrently and merges their responses, that is a materially different
  (and much larger) change to `RoutingOrchestrationService`/`NaiveReasoner`, not a "team creation" gap
  — see Open Question 1 below.
- **Not building a `TeamsBasedRoutingService`-facing UI.** No Flow Studio / admin-app screen for
  managing DB teams is scoped here — MCP tool access only for v1, matching how Binoy framed the
  request (an Octopus agent assembling a team programmatically, not a human-facing admin screen).
- **Not resolving `RoutingWeight`/`RoutingCondition`/`RoutingSuccessRate`/`MaxConcurrentRequests`
  semantics.** `AIAgent_TeamMembers` already has these columns, but nothing in the current codebase
  (`TeamsBasedRoutingService`'s SQL only reads `RoutingPriority`) uses them. Whether `v1`'s
  `add_team_member` tool should even expose them, versus leaving them for a future routing-behavior
  change, is an open question below rather than an assumption either way.
- **Not adding an `IAgentTeamService.DeleteTeamAsync` (hard delete).** `SetTeamActiveAsync`
  (soft-deactivate via `IsActive`) is the only lifecycle-removal operation in v1, consistent with
  every other domain in this codebase never hard-deleting rows that carry `Deleted`/`Archived` audit
  columns.

## Open questions for Binoy — do not guess

1. **Delegation model.** Confirmed today's real semantics are sequential single-target handoff (the
   router's LLM picks exactly one member per turn; it does not fan a request out to several members
   concurrently and merge results). Is that the intended shape for "agent teams," or did "team leader
   delegating to team members" imply something closer to fan-out + aggregation? If the latter, this is
   a `RoutingOrchestrationService`/`NaiveReasoner` change, a materially larger and separate piece of
   work from the CRUD gap this doc scopes.
2. ~~Placement — `BizFirstAI.V21` vs. `BizFirstPayrollV3`.~~ **RESOLVED by the write-path
   correction above + Binoy's separate decision to merge the Atlas Forms MCP gateway into the
   platform server (project-reference only, tool logic stays in its own project).** Since
   `ITeamService`/`ITeamMemberService` already live in `BizFirstPayrollV3`, `BizFirst.Ai.Mcp.Tools.
   AgentTeams` belongs there too, in-process, same pattern as Atlas Forms — no HTTP hop, no V21
   `IRepositoryBase` changes needed.
3. **Should `create_agent_team` require the leader agent to already exist, or should it also be able
   to create a brand-new Routing-type agent in the same call?** As scoped above, `CreateTeamAsync`
   only accepts an existing `LeaderAgentID`. An agent-authoring flow ("build me a team of 3 agents for
   X") may want one tool call to create the leader too — that would pull in `IAgentManagementService`/
   agent-creation surface, which this pass deliberately did not investigate (out of scope: this
   document is about *team* creation, agent creation is a separate, larger existing surface).
4. **Are the unused `AIAgent_TeamMembers` routing-tuning columns** (`RoutingWeight`,
   `RoutingCondition`, `MaxConcurrentRequests`/`MaxQueueSize`, `RoutingSuccessRate`/
   `RoutingFailureCount`) **meant to be wired into `TeamsBasedRoutingService`'s selection logic
   eventually**, or are they legacy/aspirational columns from an earlier design that should be
   ignored? Affects whether v1's `add_team_member` tool should expose them as parameters now (cheap to
   add) or defer until the routing logic that would use them exists (avoids a tool parameter nothing
   reads).
5. **Auth/tenant scoping for team-creation tool calls.** Per `architecture.md`'s credential/tenant
   section: an Octopus agent calling `create_agent_team` needs the caller's real `TenantID` threaded
   through so a team isn't created under the wrong tenant — same open concern `architecture.md`
   already flagged generally for the first non-read-only MCP write tool ("confirm this threading works
   before building the first real write tool"). This module's `create_agent_team`/`add_team_member`
   would be exactly that first real write tool if built before Atlas Forms' `create_form`/
   `add_form_control` ship — sequencing question, not a new concern.
