# Octopus Agent MCP Server — Design (Task 23)

See `overview.md`/`architecture.md` for the overall MCP strategy this follows, and
`atlas-forms-design.md`/`agent-teams-design.md` for the two prior modules whose shape and rigor this
document matches. This is the concrete design for **Task 23: the "Octopus" MCP server** — the
capability Binoy described as *"for certain node types such as ai agent, will require its own complex
mcp server called octopus"* — covering **Agents, Agent Teams, Agent Members, MCP Servers, and
DocumentCollection**, plus **Credentials** as a sixth, shared component.

**Sibling document**: Task 22 (ProcessStudio/workflow-node generation, the "Flow" MCP server),
`flow-workflow-mcp-design.md`, was written in parallel by another pass and has since landed in this same
folder. The "How this relates to Flow's per-node AI Agent problem" section below states the intended
Flow↔Octopus relationship from the Octopus side and has been reconciled against that sibling document —
no discrepancy found (see that section's closing paragraph for the two independent confirmations).

## Shared components — read this before the per-component sections

**Credentials is common infrastructure, owned by neither this spec nor Task 22's Flow spec
individually.** Binoy's explicit instruction (given while this document was being written): things
like Credentials must be shared, not duplicated across the two MCP server specs. The design in §4.5/§5
below is a single module, **`BizFirst.Ai.Mcp.Tools.Credentials`**, wrapping the already-proven-tonight
`ICredentialService`/`api/v1/ai-extension/credentials` (`BizFirst.Ai.AIExtension`, `BizFirstPayrollV3`
— confirmed real and production-grade, see §4.5). Both this Octopus gateway registration and Task 22's
Flow gateway registration reference this **one** module in-process; neither owns it, and it is not
redesigned or forked per-spec. Any workflow node that needs to create/select a credential (an HTTP
connector node, a database node, an email node, an MCP server node, an AI Agent node) calls the same
six tools listed in §5.2 regardless of which spec's gateway composition exposes them to a given agent.

## Summary — the one-paragraph answer

**Four of this spec's five non-Credential components already have complete, production-grade write
paths — the fifth (DocumentCollection) does too.** Applying the lesson `agent-teams-design.md` learned
the hard way (an under-scoped grep wrongly concluded "no write path exists" for Agent Teams, when a
complete one lived in an unexpected module), this pass searched thoroughly, both repos, multiple
strategies, per component — and every component came back with a real, tested, already-wired write
path. **Agents**: `BaseAgentController.cs`/`IAgentService` (`BizFirst.Ai.AiAgent.Api.Base`/`.Service`).
**Agent Teams/Members**: `ITeamService`/`ITeamMemberService`, already fully designed in
`agent-teams-design.md`, pulled in by reference, not redesigned. **MCP Servers** (Servers/Groups/
GroupMembers/Tools, all four): `BizFirst.Ai.AiMcp.*`, full CRUD, already wired into the Consolidated
WebApi. **DocumentCollection**: `IDocumentCollectionService` (`BizFirstFi.Go.Documents.Service`), with
a bonus API-key-authorized surface (`api/v1/knowledge/collections`) that is an even better fit for
programmatic/MCP callers than the user-auth one. **Credentials**: `ICredentialService`
(`BizFirst.Ai.AIExtension.Service`), the richest of the six — full CRUD plus activate/deactivate/
refresh/test/validate/OAuth-exchange. **Every real write path for every component lives in
`BizFirstPayrollV3\src\mvc-server`** — a genuinely different, better outcome than Agent Teams' V21-vs-
PayrollV3 cross-repo question: there is no HTTP-hop wrinkle anywhere in this spec, because everything
this Octopus MCP server needs to call is already in the same repo, reachable in-process. The actual
design work in this document is not "build missing services" — it is **curation** (which of each
service's real methods become MCP tools), **composition** (how five-plus backend service families
become one coherent "Octopus" MCP server registration), and **one real, unresolved concern**: every
identified write route requires `[AuthorizeTenantAdminAttribute]`, and this spec surfaces — but does
not resolve — what identity an autonomous Octopus agent call presents to satisfy that.

## Current state (read directly from code, not assumed)

### 1. Agents (`AIAgent_Agents` and its sub-entities)

**Write path — complete, `BizFirstPayrollV3\src\mvc-server\Ai\AiAgent\`** (the same module family Agent
Teams turned out to live in — confirmed by checking there first, per this document's standing
instruction to apply the Agent-Teams lesson rigorously):

- **Controller**: `BizFirst.Ai.AiAgent.Api.Base\Controllers\BaseAgentController.cs`, route
  `api/v1/ai-agent/agents`. Full action list: `list`/`get-by-id` (regular user), root `POST` **Create**
  / `{id:int}` `PUT` **Update** / `{id:int}` `DELETE` **soft-delete** (all tenant-admin), plus
  `enabled`/`by-type`/`by-name`/`active`/`public`/`by-llm-provider` (queries, regular user),
  `enable`/`disable`/`make-public`/`make-private` (tenant-admin toggles), `update-llm-configuration`
  (tenant-admin, a narrower partial-LLM-only patch alongside the full Update), `validate`. A concrete
  `AgentController` is copied into `BizFirst.Ai.Platform.Web.Server.Core\Controllers\AI\AIAgent\` per
  this codebase's standard API/API.Base convention — confirming the route is live in the actual running
  Consolidated WebApi.
- **Service**: `IAgentService` (`BizFirst.Ai.AiAgent.Domain.Interfaces.Services`) extends
  `IBaseService<Agent,int>` (`GetAllAsync`/`GetByIdAsync`/`CreateAsync`/`UpdateAsync`/
  `SoftDeleteAsync`) plus `GetByTypeAsync`/`GetEnabledAgentsAsync`/`GetPublicAgentsAsync`/
  `GetByLlmProviderAsync`/`GetActiveAgentsAsync`/`GetByConnectorAsync`/`EnableAgentAsync`/
  `DisableAgentAsync`/`MakePublicAsync`/`MakePrivateAsync`/`UpdateLlmConfigurationAsync`/
  `FindByNameAsync`/`ValidateAgentAsync`. Implementation `AgentService.cs` → `AgentRepository.cs`
  (standard tenant/soft-delete filtering).
- **Full-entity round-trip, confirmed by tracing `CreateAsync`/`UpdateAsync` to
  `BaseRepository.AddAsync`/`UpdateAsync`**: the entire `Agent` entity is written as one object, not a
  curated DTO — so every scalar column on `AIAgent_Agents` is settable through this one Create/Update,
  including **LLM provider/model** (`LlmProviderID`/`LlmModelID`/`LlmModelVersion`/`Temperature`/
  `MaxTokens` + 5 more tuning columns), **system prompt** (`LongDescription`, 4000 chars), and — the
  finding that matters most for this spec — **MCP server grants**
  (`McpEnabled`/`McpServerGroupID`/`McpClientID`/`CredentialID`/`SecondaryCredentialID`/
  `MCPServerRoutingCustomRuleID`/`MCPToolRoutingCustomRuleID`), all plain FK/scalar columns directly on
  the `Agent` row, no separate sub-entity needed. **This is the single tool that connects Component 1
  (Agents) to Component 3 (MCP Servers)** — granting an agent access to an MCP server this spec's own
  tools just registered is one `update_agent` call setting `McpServerGroupID`, not a separate mechanism.
- **Two sub-concerns are two-tier**: `FunctionEnabled`/`KnowledgeEnabled` are bare flags on `Agent`, but
  the actual grant *records* are separate entities with their own complete, independent CRUD, not
  reachable from Agent's own Create/Update:
  - **Instructions** — `BaseInstructionController.cs`, route `api/v1/ai-agent/instructions`. Full CRUD
    + `by-agent-id`/`active`/`bulk-insert`. Backing `IInstructionService`/`InstructionService.cs`.
    Entity `Instruction` (table `AIAgent_Instructions`): `AgentID` (required FK), `InstructionTypeID`,
    `Name`, `Content` (ntext), `ChannelID`, `ProfileID`, `IsActive`. This is the real backend for
    `AgentEditor.tsx`'s `instructionApiClient`/`InstructionEditor` (per `octopus-admin-spec`).
  - **Capabilities** (functions/tools grants) — `BaseCapabilityController.cs`, route
    `api/v1/ai-agent/capabilities`, `AgentID`-scoped.
  - **Knowledge bases** (RAG grants) — `BaseKnowledgeBaseController.cs`, route
    `api/v1/ai-agent/knowledge-bases`, `AgentID`-scoped. See §4.6 below — this table's
    `PrimaryCollectionName`/`FallbackCollectionName` fields are the (soft, string-only) bridge to
    Component 4, DocumentCollection.
- **V21's `IAgentManagementService` — corrected, not purely read/compose as this document's own
  drafting assumption first stated.** It genuinely exposes `CreateAgent`/`UpdateAgent(agent,
  AgentField)`/`DeleteAgent` alongside the expected `LoadAgent`/`GetAgent`/rendering/hook surface
  (`BizFirst.Ai.Octopus.Core`, `AgentManagementService.{CreateAgent,UpdateAgent,DeleteAgent,
  LoadAgent,...}.cs`, partial class). **But this is not a second, independent write path or a second
  schema** — the production repository backing it,
  `SqlServerAtlasStorage.SqlServerRepository.Agent.cs`, resolves and calls the exact same
  `IAgentService` documented above, in-process via DI (`AgentManagementService =>
  _services.GetRequiredService<IAgentService>()`, `SqlServerRepository.cs:100`), targeting the same
  `AIAgent_Agents` table. `LoadAgent`/the read side is genuinely read/compose/cache (30-min composite
  cache, LLM provider/model name enrichment, hook application) as expected; the write side is a
  thin GUID/`ResID`-translating wrapper around the one true write path, not a rival to it. One real,
  narrower gap: V21's *bulk-collection* update paths (Templates/Tasks/ChannelInstructions/Rules/
  KnowledgeBases via `UpdateAgentTemplates` etc.) are explicitly stubbed
  ("`UpdateByAgentIdAsync` method not available on interface") — a V21-side gap in bulk collection
  sync, not in `IAgentService`'s own write path, and out of scope for this spec (this spec calls
  `IAgentService`/`IInstructionService`/`ICapabilityService`/`IKnowledgeBaseService` directly, in
  `BizFirstPayrollV3`, never through V21's stubbed bulk paths).
- **Test coverage**: `AgentServiceTests.cs` (12 cases), `AgentControllerTests.cs` (8),
  `InstructionServiceTests.cs` (4), `InstructionControllerTests.cs` (8) — same production-readiness
  signal as Team's `TeamServiceTests.cs`.

**Verdict: thin wrapper over existing, for all of it.** No new write-path code needed anywhere in this
component. The design work is curating which of `IAgentService`/`IInstructionService`/
`ICapabilityService`/`IKnowledgeBaseService`'s real methods become MCP tools (§5.2).

### 2. Agent Teams / Agent Members — by reference, not redesigned

**Already fully investigated and corrected in `agent-teams-design.md`.** Per this document's explicit
instruction: incorporated directly, not re-derived. Summary for this document's own completeness (see
`agent-teams-design.md` for full detail, decisions, and open questions):

- Real, tested write path: `ITeamService`/`ITeamMemberService` (`BizFirst.Ai.AiAgent.Service`, the
  **same module family** as Component 1's `IAgentService` — confirming Team and Agent really are sibling
  concepts in one backend, as this document's investigation directive expected).
- Routes: `api/v1/ai-agent/teams` (`BaseTeamController.cs`), `api/v1/ai-agent/team-members`
  (`BaseTeamMemberController.cs`) — full CRUD, plus query/operational/validation actions.
- Proposed module: `BizFirst.Ai.Mcp.Tools.AgentTeams`, 6 tools (`create_agent_team`/
  `find_agent_teams`/`get_agent_team`/`add_team_member`/`remove_team_member`/`set_team_active`) —
  table reproduced verbatim in §5.2.
- v1 build target confirmed by Binoy: Mechanism 1 (DB-first `AIAgent_Teams`/`AIAgent_TeamMembers`)
  only. Mechanism 2 (Flow-Studio-canvas `team-leader`/`team-member` satellite wiring) is explicitly
  deferred — Binoy's own words, "Flow is more like injected mcp server and we will deal with them
  later."
- **One consequence of this spec's own findings worth adding to that document, not restated there**:
  `agent-teams-design.md`'s Open Question 3 asked whether `create_agent_team` should be able to create
  a brand-new leader agent in the same call, versus only accepting an existing `LeaderAgentID`. Now
  that Component 1 (Agents) has a designed `create_agent` tool (§5.2) in the *same* MCP server, that
  question resolves naturally: **it does not need to be one call.** An agent-authoring flow calls
  `create_agent(agentType: Routing, ...)` (Component 1), then `create_agent_team(leaderAgentId: <the
  new AgentID>, ...)` (Component 2) — two tool calls, same conversation turn, composing cleanly across
  components in one MCP server. `agent-teams-design.md`'s own scoping (leader must already exist) does
  not need to change; this spec just closes the loop on how a caller satisfies that precondition when
  starting from nothing.

### 3. MCP Servers (`AIMCP_McpServers`/`AIMCP_McpServerGroups`/`AIMCP_McpServerGroupMembers`/
`AIMCP_McpTools`)

**Write path — complete, `BizFirstPayrollV3\src\mvc-server\Ai\AiMcp\`**, a full 5-project family
(`.Domain`/`.Infrastructure`/`.Service`/`.Api.Base`/`.Api` + `.Tests`/`.IntegrationTests`) covering
**all 16 `AIMCP_*` entities**. This directly answers `mcp-server-spec\overview.md`'s open question
("verify whether a REAL service/controller write path already exists ... or whether hand-SQL really is
the only way today") — **hand-SQL was never actually necessary**, the same "the real path existed all
along" outcome as Agent Teams:

| Table | Service | Controller / route | CRUD completeness |
|---|---|---|---|
| `AIMCP_McpServers` | `IMcpServerService : IBaseService<McpServer,int>` + `GetActiveServersAsync`/`GetByServerTypeAsync`/`GetByNameAsync`/`ActivateServerAsync`/`DeactivateServerAsync`/`UpdateConfigurationAsync`/`TestConnectionAsync` | `BaseMcpServerController.cs`, `api/v1/ai-mcp/mcp-servers` — list/get/create/update/delete + `active`/`type/{id}`/`name/{name}`/`{id}/activate`/`{id}/deactivate`/`{id}/configuration`/`{id}/test-connection` | **Full** |
| `AIMCP_McpServerGroups` | `IMcpServerGroupService : IBaseService<McpServerGroup,int>` + `GetActiveGroupsAsync`/`GetByServerAsync`/`GetByRoleAsync` | `BaseMcpServerGroupController.cs`, `api/v1/ai-mcp/mcp-server-groups` | **Full** |
| `AIMCP_McpServerGroupMembers` | `IMcpServerGroupMemberService : IBaseService<McpServerGroupMember,int>` + `GetByGroupAsync`/`GetByServerAsync`/`GetByGroupAndServerAsync`/**`AddServerToGroupAsync`**/**`RemoveServerFromGroupAsync`** | `BaseMcpServerGroupMemberController.cs`, `api/v1/ai-mcp/mcp-server-group-members` — standard CRUD plus purpose-built `add-server-to-group`/`remove-server-from-group` | **Full**, including the exact join-table linking op this spec needs |
| `AIMCP_McpTools` | `IMcpToolService : IBaseService<McpTool,int>` + `GetByServerIdAsync`/`GetByProviderTypeAsync`/`GetByNameAsync`/`GetToolsRequiringApprovalAsync`/`InvokeToolAsync`/`ValidateInputAsync`/`UpdateSchemaAsync` | `BaseMcpToolController.cs`, `api/v1/ai-mcp/mcp-tools` — full CRUD plus `{id}/invoke`/`{id}/validate`/`{id}/schema` | **Full** (this is the *admin/allow-list* `AIMCP_McpTools` row — recall from `mcp-server-spec\overview.md` §1.5 that this table is never read to build the LLM-facing tool schema at runtime, only as an optional name filter; writing here manages that filter, it does not register live tool definitions) |

Entity `McpServer.cs` maps exactly to the columns `mcp-server-spec\overview.md` §2.1 already documented
as this spec's create surface: `Name`, `Description`, `McpServerTypeID`, `ConfigJson` (including the
`{fieldName}` credential-wildcard convention — the entity's own code comment documents this), `IsActive`,
`CredentialID`/`SecondaryCredentialID`. Confirmed wired into the Consolidated WebApi: DI registration
(`AddAiMcpInfrastructureTenantAware`/`AddAiMcpServices`) and a copied concrete controller in
`Platform.Web.Server.Core\Controllers\AI\AiMcp\McpServerController.cs`, same convention as every other
component in this document.

**Verdict: thin wrapper over existing, for all four tables.** No new `IMcpServerExtendedService` is
needed — `architecture.md`'s standing "never modify core, add `*Extended`" rule applies when a
capability doesn't already exist; here it already does, so the MCP tool module calls
`IMcpServerService`/`IMcpServerGroupService`/`IMcpServerGroupMemberService`/`IMcpToolService` directly,
same shape as Atlas Forms' unchanged reads.

**One real gap surfaced, not a missing write path**: every write action above requires
`[AuthorizeTenantAdminAttribute]`. An Octopus agent calling `create_mcp_server` autonomously — the
scenario Binoy's directive explicitly wants ("the octopus ai agent can execute mcp servers from
external sources and orchestrate with them") — needs to present tenant-admin-equivalent authorization.
This is not unique to this component (Agents' writes and Credentials' writes carry the same attribute)
but it is sharpest here, since *registering a new MCP server* is the highest-blast-radius write this
whole spec proposes (a malicious or malformed `ConfigJson` could point an agent's tool-calling at an
arbitrary stdio command or SSE endpoint). See §5.4 and Open Questions.

### 4. DocumentCollection (`Doc_DocumentCollections`)

**Write path — complete, `BizFirstPayrollV3\src\mvc-server\Go\Documents\`**
(`BizFirstFi.Go.Documents.{Domain,Infrastructure,Service,Api.Base,Api,Tests}`), a `BizFirstFi.Go.*`
shared-platform module as its naming convention implied, confirmed genuinely separate from the
`Ai`-prefixed Agents/Teams/MCP-Servers modules above — its own repo location, its own module family, but
still `BizFirstPayrollV3`, still in-process reachable.

- **Entity**: `DocumentCollection.cs` (`Domain\Entities`), maps to `Doc_DocumentCollections`
  exactly: `DocumentCollectionID` (PK), `CollectionName` (unique per `TenantID`),
  `CollectionDescription`, `ProviderName` (nullable — `"postgresql"`/`"qdrant"`, the FlowRag provider
  it's indexed in, per the table's own code comment), `IsActive`, full standard audit/tenant column
  set — confirmed DB-standards-compliant (`DATETIME` not `DATETIME2`, named `DF_`/`PK_`/`FK_`/`UQ_`
  constraints, `CreatedBy INT`). Sibling table `Doc_DocumentCollectionMembers` (document↔collection
  many-to-many, carrying `RagKnowledgeID`/`RagProviderName`/`RagIndexedOn` per-collection indexing
  state) is equally compliant.
- **Service**: `IDocumentCollectionService` extends `IBaseService<DocumentCollection,int>`
  (`GetByIdAsync`/`GetAllAsync`/`GetActiveAsync`/`CreateAsync`/`UpdateAsync`/`SoftDeleteAsync`/
  `FindByNameAsync`) plus `AddDocumentAsync`/`RemoveDocumentAsync`/`GetMembersAsync`/
  `GetCollectionsForDocumentAsync` for membership. Implementation `DocumentCollectionService.cs` —
  full CRUD with a duplicate-name guard per tenant.
- **Two parallel controller surfaces, both real, both live in the Consolidated WebApi** (confirmed
  present in both `Go\Documents\BizFirstFi.Go.Documents.Api\Controllers\` and duplicated into
  `Platform.Web.Server.Core\Controllers\Go\Documents\`, same convention as every other component here):
  - `BaseDocumentCollectionController.cs`, route `api/v1/documents/collections` — full CRUD
    (`list`/`{id}` GetById/`Create`/`Update`/`Delete`) plus membership operations (`{id}/members`
    AddDocument, `{id}/members/{documentID}` RemoveDocument, `{id}/members/list` GetMembers,
    `for-document/{documentID}` GetCollectionsForDocument, i.e. the reverse lookup backing
    `GetCollectionsForDocumentAsync` above) — confirmed directly against the controller source.
    `[AuthorizeRegularUserAttribute]` on reads/create/**all four membership operations**,
    `[AuthorizeTenantAdminAttribute]` only on `Update`/`Delete` of the collection row itself — so
    `create_document_collection`/`add_document_to_collection`/`remove_document_from_collection` (§5.2)
    only need regular-user authorization, materially lower-privilege than every write tool in
    Components 1/3/5. Worth weighing directly against Open Question 2 below.
  - `BaseKnowledgeCollectionController.cs`, route `api/v1/knowledge/collections` — a
    vendor-facing "Knowledge"-branded façade over the **same entity** via `IKnowledgeCollectionService`
    → `KnowledgeCollectionService.cs` (a thin composition wrapper, no duplicated logic). Uses
    **`[AuthorizeApiKeyOrUserAttribute("knowledge:read"/"knowledge:write")]`** — already built for
    external/programmatic (non-interactive) callers. **This is the better fit for an Octopus MCP tool
    to call**, both because API-key auth is closer to how an autonomous agent should authenticate than
    interactive tenant-admin auth, and because it sidesteps §5.4's open concern for this one
    component specifically (see Open Questions — whether the same pattern should extend to Agents/MCP
    Servers).
- **RAG/ingestion linkage — confirmed real, but a soft, string-based link, not a foreign key.**
  `Service\Processing\RagCollectionResolver.cs` auto-creates a `{tenantID}-default`
  `DocumentCollection` via `_collectionRepository.AddAsync` when a document has no explicit membership;
  `KnowledgeFileIngestionService`/`KnowledgeTextIngestionService` call `IDocumentCollectionService`
  during upload/text-submission ingestion. So today's writers are the ingestion pipeline (auto-default)
  and the two controller surfaces above (explicit, named collection creation). Critically: **Component
  1's `AIAgent_KnowledgeBases.PrimaryCollectionName`/`FallbackCollectionName` are plain `NVARCHAR`
  strings, not a `DocumentCollectionID` FK into `Doc_DocumentCollections`.** An MCP "attach this
  collection to this agent" tool crosses that gap by writing a matching name string into
  `AIAgent_KnowledgeBases`, not by writing a foreign key — nothing in the schema enforces the two
  actually refer to the same collection. See §4.6.

**Verdict: thin wrapper over existing** (`IDocumentCollectionService`/`IKnowledgeCollectionService`),
no new write-path code needed. The one design note (not a gap): a `create_document_collection` /
`grant_agent_knowledge_base` tool pairing must be written carefully to keep the name string in sync,
since the schema itself won't catch a typo.

### 4.6 The three "Collection" concepts — a cross-cutting caution, confirmed real (not speculative)

Applying the same "two disconnected systems sharing vocabulary" pattern already documented elsewhere in
this codebase (Octopus AI Agent V21-vs-PayrollV3; Flow↔Octopus conversation correlation), this spec's
own investigation surfaced a **third-order version of it**, worth naming explicitly so no future reader
— or MCP tool description — conflates them:

1. **`Doc_DocumentCollections`** (`BizFirstFi.Go.Documents`, §4 above) — a document-*grouping* registry:
   which document IDs belong to which named collection, for a given RAG indexing provider
   (`ProviderName`). This is Component 4 of this spec.
2. **`AIRag_KnowledgeCollectionConfigs`** (`BizFirst.Ai.AiRag`, referenced from V21's
   `KnowledgeCollectionTranslator.cs`) — embedding-model/vector-store-*provider configuration* per
   named collection-type (pgvector/pinecone/qdrant, OpenAI/Azure/Cohere embedding provider), own PK
   (`KnowledgeCollectionConfigID`), own unique `Name` — **not FK'd to `Doc_DocumentCollections` at
   all**. A fundamentally different concern (how a collection is embedded/stored) from #1 (which
   documents are in it). **Not in scope for this spec** — no MCP tools proposed against this table; flagged
   here only so it is never confused with #1 or #3.
3. **`AIAgent_KnowledgeBases`** (`BizFirst.Ai.AiAgent`, §4 above, part of Component 1) — a per-agent
   knowledge-base *grant*, with its own vector-db connection fields (`RagProviderID`,
   `VectorDbProvider`, `EmbeddingModelID`, `ConnectionString`) **and** `PrimaryCollectionName`/
   `FallbackCollectionName` string fields that softly reference #1 by name only.

Three tables, three real, live, non-overlapping write paths, sharing the word "collection"/"knowledge."
This spec's tool descriptions (§5.2) name each tool's target table explicitly for exactly this reason.

### 5. Credentials — confirmed real and complete, shared component (see top of document)

`ICredentialService`/`CredentialService.cs` (`BizFirst.Ai.AIExtension.Service`,
`BizFirstPayrollV3\src\mvc-server\Ai\AIExtension`) — full `Domain`/`Infrastructure`/`Service`/
`Api.Base`/`Api` layering, `BaseCredentialController.cs`, route `api/v1/ai-extension/credentials`.
Confirmed the richest write surface of all six components: standard CRUD (`list`/`get-by-id`/`POST`
create/`PUT` update/`DELETE` soft-delete, all present and non-stub) plus `get-by-id/decrypted`
(tenant-admin only), `by-type-code`/`by-type`/`active`/`by-scope`/`by-environment`/`shared`/`expired`/
`by-vault-provider` queries, `activate`/`deactivate`/`refresh`/`test`/`test-connection`/`validate`
actions, `exchange-oauth-code` (server-side OAuth token exchange, client secrets never leave the
backend), `update-display-metadata`, `name-exists`. Vault-backed encryption via
`ICredentialEncryptionService`/`CredentialEncryptionService.cs`. Full unit + integration test coverage.
This is the exact system already confirmed working tonight for MCP server credential resolution
(`McpClientManager`'s three-tier `{fieldName}` substitution, `mcp-server-spec\overview.md` §1.3) and
for `AIAgent_Agents.CredentialID`/`SecondaryCredentialID` — both this spec's Agents and MCP Servers
components already point at rows in this same table by FK convention.

**Verdict: thin wrapper over existing, no new write-path work — confirmed, not re-derived**, per the
directive's own framing that this component "likely needs NO new write path, only an MCP tool wrapper."

## Proposed design

### 5.1 Project/service placement

Applying `agent-teams-design.md`'s corrected reasoning directly: place new MCP tool-module code
wherever the real backend service already lives, per component — not by a blanket rule. **The good
news this spec surfaces, genuinely different from the Agent Teams case**: every real write path for
every one of this spec's six components already lives in `BizFirstPayrollV3\src\mvc-server` (just in
five different module families within it). There is **no cross-repo, no HTTP-hop wrinkle anywhere in
this document** — unlike Agent Teams' original V21-vs-PayrollV3 placement question, every tool module
proposed here can reach its backing service in-process, same DI container, same process, zero network
hop, the moment it is project-referenced into wherever the gateway host itself lives (per
`overview.md`'s still-open gateway-hosting question).

| Component | Real backend service | Module family | New MCP tool-module project | In-process reachable? |
|---|---|---|---|---|
| 1. Agents (+ Instructions/Capabilities/KnowledgeBases) | `IAgentService`/`IInstructionService`/`ICapabilityService`/`IKnowledgeBaseService` | `BizFirst.Ai.AiAgent.Service` | **`BizFirst.Ai.Mcp.Tools.OctopusAgents`** (new) | Yes — same repo, same module family as Agent Teams |
| 2. Agent Teams / Members | `ITeamService`/`ITeamMemberService` | `BizFirst.Ai.AiAgent.Service` | `BizFirst.Ai.Mcp.Tools.AgentTeams` (already designed, `agent-teams-design.md`, unchanged) | Yes |
| 3. MCP Servers (Servers/Groups/GroupMembers/Tools) | `IMcpServerService`/`IMcpServerGroupService`/`IMcpServerGroupMemberService`/`IMcpToolService` | `BizFirst.Ai.AiMcp.Service` | **`BizFirst.Ai.Mcp.Tools.OctopusMcpAdmin`** (new) | Yes |
| 4. DocumentCollection | `IDocumentCollectionService` / `IKnowledgeCollectionService` | `BizFirstFi.Go.Documents.Service` | **`BizFirst.Ai.Mcp.Tools.OctopusDocuments`** (new) | Yes |
| 5. Credentials (shared) | `ICredentialService` | `BizFirst.Ai.AIExtension.Service` | **`BizFirst.Ai.Mcp.Tools.Credentials`** (new, shared with Task 22) | Yes |

**Worth flagging as an open sequencing question (not decided here, see Open Questions)**: since
Component 1 (`BizFirst.Ai.Mcp.Tools.OctopusAgents`) and Component 2 (`BizFirst.Ai.Mcp.Tools.AgentTeams`,
already designed) both reference the exact same `BizFirst.Ai.AiAgent.Service` project, they could
reasonably be one tool-module project instead of two. This document does not merge them — Agent Teams'
design is explicitly incorporated "by reference, not redesigned" per this document's own instructions —
but names the option for Binoy to decide, since building both as separate small projects versus one
combined project is a real, cheap-to-decide-now, expensive-to-change-later choice.

**Gateway composition**: per `architecture.md`'s "one gateway, many tool-module projects" structure,
these five (four new + one existing) modules compose into what an Octopus agent or external MCP client
sees as **one thing**: registered once in `AIMCP_McpServers`, granted once via a `McpServerGroupID` —
this is "the Octopus MCP server" Binoy's directive named, even though it is built from five independent
C# projects underneath, exactly matching the pattern already established for Atlas Forms.

### 5.2 Curated tool list

Following `architecture.md`'s scaling guidance (curate to task-shaped tools, not 1:1 controller
wrappers) applied per component, then composed. Total is larger than a single domain's 5-15 guidance
because this is genuinely five-plus domains under one server — §5.3 explains how the per-agent
allow-list keeps any *one* agent's exposed tool list small regardless of the server's total catalogue
size.

**Component 1 — Agents (`BizFirst.Ai.Mcp.Tools.OctopusAgents`)**

| Tool | Backing call | New or existing |
|---|---|---|
| `find_agents(filter)` | `IAgentService.GetAllAsync`/`GetByTypeAsync`/`GetByNameAsync`/`GetActiveAsync`/`GetPublicAsync`/`GetByLlmProviderAsync` collapsed | thin wrapper |
| `get_agent(agentId)` | `IAgentService.GetByIdAsync` | thin wrapper |
| `create_agent(name, agentType, description, longDescription, llmProviderId, llmModelId, ...)` | `IAgentService.CreateAsync` | thin wrapper |
| `update_agent(agentId, patch)` | `IAgentService.UpdateAsync` — covers LLM config and MCP grant fields, see §4.1 | thin wrapper |
| `delete_agent(agentId)` | `IAgentService.SoftDeleteAsync` | thin wrapper |
| `set_agent_enabled(agentId, enabled)` | `EnableAgentAsync`/`DisableAgentAsync` | thin wrapper |
| `grant_agent_mcp_server(agentId, mcpServerGroupId, credentialId)` | `IAgentService.UpdateAsync` (scalar `McpEnabled`/`McpServerGroupID`/`CredentialID`) | thin wrapper — **the Component 1 ↔ Component 3 bridge** |
| `add_agent_instruction(agentId, name, content, instructionTypeId, channelId)` | `IInstructionService.CreateAsync` | thin wrapper |
| `find_agent_instructions(agentId)` | `IInstructionService`'s `by-agent-id` query | thin wrapper |
| `grant_agent_capability(agentId, capabilityDetails)` | `ICapabilityService.CreateAsync` | thin wrapper |
| `grant_agent_knowledge_base(agentId, name, primaryCollectionName, ragProviderId, embeddingModelId)` | `IKnowledgeBaseService.CreateAsync` | thin wrapper — **the Component 1 ↔ Component 4 bridge, by name string, see §4.6** |

**Component 2 — Agent Teams / Members (`BizFirst.Ai.Mcp.Tools.AgentTeams`)** — reproduced verbatim
from `agent-teams-design.md`, not redesigned:

| Tool | Backing call | New or existing |
|---|---|---|
| `create_agent_team(name, leaderAgentId, teamType, description)` | `ITeamService.CreateAsync` | thin wrapper |
| `find_agent_teams(filter)` | `ITeamService.GetAllAsync`/`FindByNameAsync` | thin wrapper |
| `get_agent_team(teamId)` | `ITeamService.GetByIdAsync` | thin wrapper |
| `add_team_member(teamId, agentId, role, routingPriority)` | `ITeamMemberService`'s add method | thin wrapper |
| `remove_team_member(teamId, agentId)` | `ITeamMemberService`'s remove method | thin wrapper |
| `set_team_active(teamId, isActive)` | `ITeamService.ActivateTeamAsync`/`DeactivateTeamAsync` | thin wrapper |

**Component 3 — MCP Servers (`BizFirst.Ai.Mcp.Tools.OctopusMcpAdmin`)**

| Tool | Backing call | New or existing |
|---|---|---|
| `find_mcp_servers(filter)` | `IMcpServerService.GetAllAsync`/`GetActiveServersAsync`/`GetByServerTypeAsync`/`GetByNameAsync` | thin wrapper |
| `create_mcp_server(name, configJson, mcpServerTypeId, credentialId)` | `IMcpServerService.CreateAsync` | thin wrapper — the capability that makes "Octopus registers a new MCP server integration" real |
| `update_mcp_server(mcpServerId, patch)` | `IMcpServerService.UpdateAsync`/`UpdateConfigurationAsync` | thin wrapper |
| `set_mcp_server_active(mcpServerId, isActive)` | `ActivateServerAsync`/`DeactivateServerAsync` | thin wrapper |
| `test_mcp_server_connection(mcpServerId)` | `IMcpServerService.TestConnectionAsync` | thin wrapper |
| `create_mcp_server_group(name, mcpServerId, role)` | `IMcpServerGroupService.CreateAsync` | thin wrapper |
| `add_server_to_group(groupId, mcpServerId)` | `IMcpServerGroupMemberService.AddServerToGroupAsync` | thin wrapper |
| `remove_server_from_group(groupId, mcpServerId)` | `IMcpServerGroupMemberService.RemoveServerFromGroupAsync` | thin wrapper |
| `find_mcp_tools(mcpServerId)` | `IMcpToolService.GetByServerIdAsync` | thin wrapper — admin/allow-list visibility only, see §4.3 caveat |

**Component 4 — DocumentCollection (`BizFirst.Ai.Mcp.Tools.OctopusDocuments`)**

| Tool | Backing call | New or existing |
|---|---|---|
| `find_document_collections(filter)` | `IKnowledgeCollectionService`'s equivalent of `GetAllAsync`/`GetActiveAsync`/`FindByNameAsync` | thin wrapper |
| `create_document_collection(name, description, providerName)` | `IKnowledgeCollectionService`'s Create (via `api/v1/knowledge/collections`, API-key-authorized surface — preferred over the user-auth `api/v1/documents/collections`) | thin wrapper |
| `get_document_collection(collectionId)` | `IKnowledgeCollectionService`'s GetById | thin wrapper |
| `add_document_to_collection(collectionId, documentId)` | `IDocumentCollectionService.AddDocumentAsync` (`BaseDocumentCollectionController`'s `{id}/members`, regular-user auth, see §4.4) | thin wrapper |
| `remove_document_from_collection(collectionId, documentId)` | `IDocumentCollectionService.RemoveDocumentAsync` (`{id}/members/{documentID}`) | thin wrapper |

**Component 5 — Credentials (`BizFirst.Ai.Mcp.Tools.Credentials`, shared with Task 22)**

| Tool | Backing call | New or existing |
|---|---|---|
| `find_credentials(filter)` | `ICredentialService.GetAllAsync`/`GetActiveCredentialsAsync`/`GetByTypeAsync`/`GetByTypeCodeAsync` | thin wrapper |
| `create_credential(name, credentialTypeId, data)` | `ICredentialService.CreateAsync` | thin wrapper |
| `update_credential(credentialId, patch)` | `ICredentialService.UpdateAsync` | thin wrapper |
| `delete_credential(credentialId)` | `ICredentialService.SoftDeleteAsync` | thin wrapper |
| `test_credential(credentialId)` | `ICredentialService.TestCredentialAsync` | thin wrapper |
| `exchange_oauth_code(credentialTypeId, code, credentialId?)` | `ICredentialService.ExchangeOAuthCodeAsync` | thin wrapper |

**37 tools total, across six components (11 + 6 + 9 + 5 + 6), zero new backend write-path code.** Every
row above is a thin wrapper over an already-real, already-tested method — this document did not find a
single genuine service-layer gap in any of the six components, a materially cleaner outcome than either
Atlas Forms (which needed five new `IFormsExtendedService` methods) or the original Agent Teams draft
(which wrongly thought it needed a whole new service).

### 5.3 Catalogue scaling — the per-agent allow-list keeps this from becoming unwieldy

37 tools in one server exceeds `architecture.md`'s 5-15-per-domain guidance taken literally, but that
guidance is stated per *domain*; this is five-plus domains sharing one MCP server registration by
design (Binoy's own framing — "its own complex mcp server called octopus," singular). Per
`architecture.md`'s already-established mechanism: `AIMCP_McpTools`/`McpTool.Functions` lets a specific
agent's grant name a subset of a server's tools. A narrow "agent-builder" Octopus agent should be
granted only the Component 1 + Component 5 (Agents + Credentials) subset; a broader "platform-admin"
Octopus agent could be granted all 37. This is the same mechanism already proven live for the GitHub MCP
server (`AgentID=20`) — no new plumbing, just per-agent curation at grant time.

### 5.4 Authorization — the one real open concern, not a missing write path

Every write action documented in §4.1 (Agents/Instructions/Capabilities/KnowledgeBases) and §4.3 (MCP
Servers/Groups/GroupMembers) carries `[AuthorizeTenantAdminAttribute]`. §4.5 (Credentials) is the same.
Only §4.4 (DocumentCollection, via `api/v1/knowledge/collections`) already has an
API-key-authorized surface built for non-interactive callers. `architecture.md` already flagged this
generally ("confirm this threading works before building the first real write tool") — this spec makes
it concrete and unavoidable: an Octopus agent autonomously calling `create_mcp_server` or `create_agent`
needs to present an identity satisfying tenant-admin authorization, and nothing in this document's
research found where that identity comes from for an in-conversation MCP tool call today. This is the
single most consequential open question in this document (see Open Questions #1) — not a code gap to
fill, a policy decision to make before any write tool in this spec goes live.

## How this relates to Flow's per-node AI Agent problem (the Flow ↔ Octopus connective tissue)

Binoy's directive frames this precisely: *"for certain node types such as ai agent, will require its
own complex mcp server called octopus."* Read literally against what this document found: **when Flow's
workflow-generation MCP server (Task 22) needs to build an AI Agent node, it should not attempt to
embed full agent configuration inline in the Flow node's own config schema — it should call this
Octopus MCP server's `create_agent`/`update_agent`/`grant_agent_mcp_server`/`grant_agent_knowledge_base`
tools (§5.2) to actually create and configure the agent, then have the Flow node reference the
resulting `AgentID`.**

This is not a speculative recommendation — it matches how the real, existing Flow Studio UI already
works today, independently confirmed by `mcp-server-spec\overview.md` §5.1: the `AIAgentNode`'s "Agent"
tab in `ConnectorConfigDialog.tsx` is a **search-and-pick-by-reference** UI (`store.setAgentId(agent
.AgentID)`), not an inline agent-config editor embedded in the node. A human building a Flow Studio
workflow today already creates/edits the agent as a separate object (via `AgentEditor.tsx`, itself
calling `agentApiClient` → the same `IAgentService` this spec wraps) and the *node* only stores a
reference to it. Task 22's MCP server generating that same node programmatically should follow the
identical shape: **agent creation is Octopus's job; the Flow node config is just an `AgentID`
pointer.** This is also exactly the `create_form` → `FormID` pattern `atlas-forms-design.md` already
established (§"Agent conversation flow") — a create tool in one domain returns an ID, a downstream tool
in a different domain (or a different MCP server entirely) stores the reference, never the full object.

**Concretely, the division of responsibility this implies**: Task 22's Flow MCP server owns everything
about *where a node sits in a workflow graph and how it wires to other nodes* (trigger nodes, port
connections, satellite config resolution). This Task 23 Octopus MCP server owns everything about *what
an agent actually is* (its LLM config, instructions, capabilities, knowledge bases, MCP-server grants,
team membership). An AI Agent node's config, once built by Flow's MCP server, should be small — an
`AgentID` plus whatever satellite wiring is genuinely node-graph-shaped (the `team-member` port,
per Mechanism 2 in §2 above, deliberately out of scope for both specs' v1). Credentials (§5, shared) sit
underneath both — a Flow HTTP-connector node and an Octopus agent's MCP-server grant both resolve
secrets through the same `create_credential`/`find_credentials` tools, never a per-spec credential
concept.

**Reconciled against `flow-workflow-mcp-design.md`, which landed after this section was first drafted
(checked again before finishing this pass) — no discrepancy found, confirmed by two independent
pieces of evidence in that document.** First, its own Non-goals section explicitly defers
`BizFirst.Ai.Mcp.Tools.Credentials`'s tool-level design to this document rather than duplicating it —
consistent with the "Shared components" note at the top of this document, and it resolves that
sibling document's own Open Question 3 ("who writes that note and when"): this document does, §5.2's
Component 5 table is that note. Second, and more directly confirming the division of responsibility
proposed above: that document's own §4 (node-type schema investigation) found the real, seeded
`ai-agent` node type's `ConfigurationSchema` names an **`AgentID`** field (alongside `MessageSource`/
`Message`/`ConversationScope`/etc.) as the node's actual configuration surface — not an inline agent
definition. That is exactly the "the node stores a reference, Octopus owns the object" shape this
section predicted from the Flow Studio UI evidence alone, now independently confirmed from the node
type's own database-resident schema. `flow-workflow-mcp-design.md`'s `add_workflow_node`/
`update_node_configuration` tools are therefore the right place for a Flow-side agent to *populate* an
`ai-agent` node's `AgentID` once this spec's `create_agent` (§5.2, Component 1) has produced one — no
further reconciliation needed between the two documents on this point.

## Non-goals

- **Not building any of the five new tool-module C# projects yet.** This is a design pass, matching how
  `atlas-forms-design.md` and `agent-teams-design.md` were scoped — no code written, no `.csproj`
  created.
- **Not resolving §5.4's authorization question.** Flagged clearly, not guessed at — see Open
  Questions #1.
- **Not building `BizFirst.Ai.Mcp.Tools.Credentials`'s Task-22-facing half.** This document names it as
  shared infrastructure and lists its tool table (§5.2), but the actual module is common code neither
  spec unilaterally owns — final shape should be agreed once Task 22's document exists, not built
  solely from this document's framing.
- **Not touching `AIRag_KnowledgeCollectionConfigs`.** Confirmed real and load-bearing (§4.6 #2) but a
  different concern (embedding/vector-store provider config) from this spec's DocumentCollection
  component — no MCP tools proposed against it here.
- **Not resolving whether Components 1 and 2's tool-module projects should merge** (§5.1) — named as an
  option, not decided.
- **Not fixing V21's stubbed bulk-collection update paths** (`UpdateAgentTemplates` etc., §4.1) — a
  separate, narrower gap in `BizFirstAI.V21`, unrelated to this spec's tool design since this spec calls
  `BizFirstPayrollV3`'s services directly, never through those stubbed V21 paths.
- **Not building Mechanism 2 (Flow-Studio-canvas team wiring) tools** — already a settled non-goal in
  `agent-teams-design.md`, restated here only for completeness since Component 2 is incorporated by
  reference.
- **Not adding hard-delete anywhere.** Every delete tool in §5.2 (`delete_agent`, `delete_credential`)
  maps to a `SoftDeleteAsync` backend call, consistent with every other domain in this codebase.

## Open questions for Binoy — do not guess

1. **Authorization for autonomous write calls (§5.4) — the most consequential open item in this
   document.** Every write tool across Agents, MCP Servers, and Credentials requires tenant-admin
   authorization at the controller layer. What identity does an Octopus agent's MCP tool call present
   to satisfy `[AuthorizeTenantAdminAttribute]`? Options worth considering (not evaluated here, this is
   a policy question): (a) the gateway process runs under a genuine service-account identity with
   tenant-admin rights, scoped per tenant from conversation context (`ConversationPipeContext`, per
   `architecture.md`'s existing credential/tenant-scoping note); (b) a narrower, MCP-specific
   authorization policy is added (a new `[AuthorizeMcpServiceAttribute]` or similar) distinct from
   interactive tenant-admin; (c) these specific write tools are deliberately excluded from any Octopus
   agent's default grant and reserved for human-initiated MCP calls only (an external client acting on
   a real tenant-admin's behalf, never an autonomous in-conversation agent). This blocks building any
   write tool in this document, not just a subset.
2. **Should `api/v1/knowledge/collections`'s API-key pattern (§4.4) extend to Agents and MCP Servers
   too?** DocumentCollection already has a non-interactive-caller-shaped auth surface that sidesteps
   Open Question 1 for that one component. Is building equivalent API-key-scoped façades for Agents/MCP
   Servers (mirroring `BaseKnowledgeCollectionController`'s relationship to
   `BaseDocumentCollectionController`) the intended resolution to Open Question 1, or a distraction from
   it?
3. **Merge Components 1 and 2's tool-module projects?** (§5.1) `BizFirst.Ai.Mcp.Tools.OctopusAgents` and
   `BizFirst.Ai.Mcp.Tools.AgentTeams` reference the identical backend service project
   (`BizFirst.Ai.AiAgent.Service`). One combined project is simpler to maintain; two separate ones keep
   Agent Teams' already-approved design untouched. Low-cost to decide now, more disruptive to change
   once either is built.
4. **`grant_agent_knowledge_base`'s name-matching risk (§4.6).** Since `AIAgent_KnowledgeBases
   .PrimaryCollectionName` is a free string, not a FK to `Doc_DocumentCollections`, should this tool
   validate the supplied name against `find_document_collections` before writing (rejecting an agent
   grant that points at a collection name that doesn't exist), or is a free-text field intentional
   (e.g. to support a collection that will be created later, or an external RAG provider entirely
   outside `Doc_DocumentCollections`)? Affects whether `grant_agent_knowledge_base` needs a
   cross-component validation call before persisting.
5. **`create_mcp_server`'s blast radius (§4.3).** This is the single highest-risk write tool in the
   whole document — a stdio `Command`/`Arguments` pair or an SSE `EndPoint` an Octopus agent registers
   becomes something a *future* agent's tool-calling can execute/reach. Should this tool require
   additional guardrails beyond standard tenant-admin auth (e.g. an approval step, an allow-list of
   permitted stdio commands, a human-in-the-loop confirmation before a newly-registered server's tools
   are ever actually invoked) — or is standard tenant-admin authorization considered sufficient given
   this is the same trust boundary every other write tool in this document already crosses?
6. **Curation ownership for this specific 37-tool catalogue** (per `overview.md`'s still-open Question
   3, now concrete): is 37 tools — even split across five sub-modules with per-agent allow-listing
   (§5.3) — the right shape, or should some rows in §5.2 be cut for v1 (e.g. defer `test_mcp_server_
   connection`/`exchange_oauth_code` as v2 additions) the way Atlas Forms explicitly deferred
   `delete_form` and batch operations?
