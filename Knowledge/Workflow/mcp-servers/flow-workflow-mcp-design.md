# Flow/Workflow MCP Module — Design (Task 22, Second Pilot)

See `overview.md`/`architecture.md` for the overall strategy (curated tool modules, `*Extended`
service pattern, project-reference-only hosting merged into the platform server, in-process no-HTTP
calls) and `atlas-forms-design.md` for the first pilot module this design follows the shape of. This
is the concrete design for the second module: `BizFirst.Ai.Mcp.Tools.Workflow`.

**Cross-reference note:** `octopus-agent-mcp-design.md` (Task 23) now exists and was read before
finishing this pass. It confirms, per Binoy's own mid-session clarification recorded there:
*"Credentials must not be designed twice."* `BizFirst.Ai.Mcp.Tools.Credentials` is **one shared MCP
tool module**, owned by neither spec, wrapping `ICredentialService`/`api/v1/ai-extension/credentials`
— exactly the same module and route this doc independently found in §3.5. This doc has been aligned
to that decision: it does **not** design a `create_credential`/`find_credentials` tool set (§4.4);
it only designs the one tool that is genuinely workflow-domain-specific —
`attach_node_credential`, linking an already-existing `CredentialID` to a `ProcessElement`, which is
not a Credentials-module concern.

## Summary

Binoy's framing was: "we don't have add node (ProcessElement), DeleteNode etc., also no update node
settings — we'll also need create credentials." **All three premises are wrong, in the same shape as
tonight's Agent Teams lesson** (a real write path existed all along in a module the original grep
didn't cover). A complete, tested, 5-layer CRUD stack for workflow nodes, edges, and node types
already exists — not in `ProcessStudio`, but in a sibling module Binoy's own directive didn't name:
**`BizFirst.Ai.Process`** (singular — distinct from `ProcessStudio`, `ProcessEngine`,
`ProcessDefinition`, `ProcessExecutor`, `ProcessExpression`, `ProcessNodePolicies`, `ProcessEvent`,
`ProcessWait`, `ProcessEngage`, all of which were also searched and came back empty for design-time
node CRUD). Credential creation is likewise already complete, in `BizFirst.Ai.AIExtension`.

The actual gap is narrower and different in kind than "no CRUD exists": **nothing validates a node's
`Configuration` JSON against its node type's schema before persisting it.** `ProcessElementType`
already has a `ConfigurationSchema` column, and it is genuinely populated with real, detailed JSON
Schema for the two node types this investigation read in full (`email-smtp`, `ai-agent`, out of ~107
live registered types — see §4) — but the write path (`UpdateNodeConfigurationAsync`) never reads or
checks it, and (§4) the one schema sampled against a known-complex node type (`ai-agent`) was found
stale relative to its real settings class. That is the one confirmed piece of real new backend code
this spec proposes, plus the MCP tool layer on top of everything that already works.

The "too many nodes, config needs a lot of RAG" concern is real but **less severe than Atlas Forms'**,
because the substrate is fundamentally different: Atlas Forms has no per-control-type schema anywhere
in the database (only TypeScript types on the frontend), which is why RAG-over-docs was the right
call there. Workflow node types already have a **structured, populated, per-type JSON Schema column
in the database** (`Process_ProcessElementTypes.ConfigurationSchema`/`InputPortsSchema`/
`OutputPortsSchema`). The right design here is a **thin discovery tool that reads that column
directly**, not a second RAG pipeline — see §4.2.

## Current state (read directly from code, not assumed)

### 1. `BizFirst.Ai.ProcessStudio` — orchestration layer, not a competing node-CRUD system

Module: `BizFirstPayrollV3\src\mvc-server\Ai\ProcessStudio\` —
`BizFirst.Ai.ProcessStudio.{Api,Api.Base,Domain,Service,Tests}`. Three controllers, three distinct
jobs:

| Controller | Route | What it does |
|---|---|---|
| `BaseStudioProjectController` | `api/v1/process-studio/studio-projects` | `POST create-with-structure` → `IStudioProjectService.CreateProjectWithStructureAsync` — creates an App + Process + ProcessThread in one call. The entry point for "start a brand-new workflow project." |
| `BaseStudioWorkflowController` | `api/v1/process-studio/workflows` | `POST save` → `IWorkflowSaveService.SaveWorkflowAsync` — **atomic whole-workflow save**: takes a complete `{Nodes[], Edges[]}` list, delta-detects against what's currently in the DB, validates, and executes inserts/updates/deletes for all nodes and edges in one transaction. `GET refresh/{processThreadId}` → full current workflow read-back. |
| `BaseFormBuilderController` | `api/v1/process-studio/form-builder` | `POST by-extension` / `POST by-connector` → `IFormBuilderService` — returns an **Atlas-Forms-shaped UI form definition** (sections/controls/validation/conditional-visibility) for rendering a node's *config-panel dialog*, for Extension- and Connector-backed nodes specifically. A third handler, `by-node-type` (generic, any `ExecutionNode` type, not just Extension/Connector-backed ones), is present in the file **but fully commented out** — not implemented. This is a real, narrow, already-flagged gap in the codebase's own UI-config-form story, distinct from the JSON-Schema-validation gap this spec fixes ("Proposed design" §3 below). |

**The critical finding, from reading `WorkflowSaveService.cs` directly**: `SaveWorkflowAsync` is
*implemented* by injecting and calling `IProcessElementService`, `IConnectionService`, and
`IProcessElementTypeService` — **the exact same services `BizFirst.Ai.Process` exposes via its own
granular controllers** (§2). ProcessStudio is a delta-detecting, transaction-coordinating orchestration
layer *on top of* the same `Process_ProcessElements`/`Process_Connections` tables, not a parallel or
competing node concept. Both the granular path (§2) and this bulk/delta path are real, tested, and
usable as thin MCP wrappers.

`SaveStudioWorkflowRequest`/`SaveStudioWorkflowData` shape (`ProcessStudio.Domain\SaveWorkflow\
SaveWorkflowRequest.cs`): `ProcessThreadID`, `VersionID`, `CreateNewVersion`/`VersionName`/
`VersionDescription`, `Nodes: List<WorkflowNodeDto>`, `Edges: List<WorkflowEdgeDto>`.
`WorkflowNodeDto` (`ProcessStudio.Domain\DTOs\Workflows\WorkflowNodeDto.cs`) mirrors `ProcessElement`
field-for-field (identity, position/layout, behavior flags, `ConnectorID`/`Connector`,
`Configuration` JSON string) plus a client-side `ProcessElementKey` used to match nodes across saves.

Real validation already runs on every save (`WorkflowValidator.cs`, six rules, all enforced): required
fields, node-key uniqueness, connection integrity (dangling source/target references), circular
dependency detection, trigger-node rules, version-request shape. **None of these six rules touch the
`Configuration` JSON's *content*** — they check structural/relational integrity of the node graph, not
whether a given node's `Configuration` is valid for its `ProcessElementTypeID`. That's the real gap —
see "Proposed design" §3 (`IProcessElementExtendedService`) below.

### 2. `BizFirst.Ai.Process` — the real node/edge/type CRUD (the module Binoy's search missed)

Module: `BizFirstPayrollV3\src\mvc-server\Ai\Process\` — full 5-layer split
(`.Api`/`.Api.Base`/`.Domain`/`.Service`/`.Infrastructure`/`.Tests`/`.IntegrationTests`). Confirmed by
multiple grep strategies across every sibling `Process*` folder (`ProcessEngine`, `ProcessStudio`,
`ProcessDefinition`, `ProcessExecutor`, `ProcessExpression`, `ProcessNodePolicies`, `ProcessEvent`,
`ProcessWait`, `ProcessEngage`) — none of them contain this; it lives only here, under the singular
`Ai\Process\` folder name, which is easy to miss if you search the more obviously-named siblings first
(exactly the failure mode the Agent Teams lesson warned about).

**`BaseProcessElementController`** (`Ai\Process\BizFirst.Ai.Process.Api.Base\Controllers\
BaseProcessElementController.cs`), route `api/v1/process/process-elements`:

| Route | Backing call | What it is |
|---|---|---|
| `POST` | `IProcessElementService.CreateAsync` (generic `InsertWebRequest`, full `ProcessElement`) | **AddNode** |
| `PUT {id}` | `UpdateAsync` (full-entity) | **UpdateNode** (whole entity) |
| `DELETE {id}` | `SoftDeleteAsync` | **DeleteNode** |
| `POST configuration/update` | `UpdateNodeConfigurationAsync(ProcessElementID, ConfigurationJson)` | **UpdateNodeSettings** — doc comment: *"Called by FlowStudio when saving node settings from the config panel."* Scoped read-modify-write of just `Configuration`; **no schema validation** — see "Proposed design" §3 below. |
| `POST credential/update` | `UpdateCredentialAsync(ProcessElementID, CredentialID)` | Attaches/detaches a credential on a node |
| `POST by-thread-version` / `by-process-element-type` / `by-execution-mode` / `by-group` / `triggers` / `by-key` / `enabled` / `active` / `by-credential` | various `Get*Async` | Query surface |

`ProcessElement` entity (`Ai\Process\BizFirst.Ai.Process.Domain\Entities\ProcessElement.cs`), table
`Process_ProcessElements`, doc comment: *"Stores individual nodes within workflows."* Key fields:
`ProcessElementID`, `ProcessThreadVersionID`, `ProcessElementTypeID`, `ProcessElementKey` (unique
within workflow), `PositionX/Y`/`Width`/`Height`/`ZIndex`, `Configuration` (JSON string),
`CredentialID` (int? FK), `IsTrigger`/`IsSatellite`/`IsDisabled`, `ContinueOnFail`/`RetryOnFail`/
`MaxRetries`/`Timeout`, `PinnedData` (design-time mock-output string).

**`BaseConnectionController`** (`Ai\Process\BizFirst.Ai.Process.Api.Base\Controllers\
BaseConnectionController.cs`), route `api/v1/process/connections` — identical CRUD shape
(list/by-id/create/update/delete), backing `Connection` entity: `SourceProcessElementID`/
`TargetProcessElementID`, `SourcePortKey`/`TargetPortKey`, `ConnectionTypeID`, `Condition`/
`IsConditional`, `Configuration`. This is **edge CRUD** — also already complete.

**`BaseProcessElementParameterController`**, route `api/v1/process/process-element-parameters` — full
CRUD over `ProcessElementParameter` (`ParameterKey`/`ParameterValue`/`DataTypeID`/`IsSecret`/
`IsExpression`, FK to one `ProcessElementID`). This is a **granular, per-key settings table**, separate
from the `Configuration` JSON blob. **Open question, not fully resolved by this pass** (see Decision #2
below): every
node executor's settings class I read (`ManualTriggerNodeSettings`, `SmtpNodeExecutorSettings`,
`OctopusAiAgentNodeExecutorSettings`) reads its values via `ReadConfigByKey`/`ConfigReader` against the
`Configuration` JSON blob (set via `SetConfig`), not against `ProcessElementParameter` rows. I did not
find any executor reading `ProcessElementParameter` at runtime. If that holds, `ProcessElementParameter`
is a real, CRUD-complete, but **currently-unused-by-execution** table — recommend **not** building an
MCP tool around it until confirmed live (Decision #2), rather than assuming it's the "settings" surface.

**`ProcessElementType`** (`Ai\Process\BizFirst.Ai.Process.Domain\Entities\ProcessElementType.cs`),
table `Process_ProcessElementTypes`, doc comment: *"Catalog of available node types."* — this is the
node-type registry, and it is far more load-bearing for this spec than initially expected (§3.4).

**A second, real caveat on "AddNode is a thin wrapper," found by reading
`ProcessStudio`'s `WorkflowTransactionCoordinator.cs` in full (not just `BaseProcessElementController`
in isolation):** `ProcessElement` (confirmed directly on the entity, `Ai\Process\...\Entities\
ProcessElement.cs`) carries **two separate, independent FKs** — `ConnectorID` (→
`AIExt_Connectors`) and its own direct `CredentialID` (→ the credential store). `UpdateCredentialAsync`
(§2 above) writes `ProcessElement.CredentialID` directly and needs no `Connector` at all — that path is
a genuine, unconditional thin wrapper, no caveat. `ConnectorID` is a different story:
`WorkflowTransactionCoordinator.InsertNodesAsync` **always** creates a paired `Connector` row for every
new node during the whole-workflow save path, and the code's own comment states this as a hard
invariant: *"Every ProcessElement must have a corresponding Connector (1-to-1 relationship)... This
ensures ConnectorID is always populated, so the Config button works after save."*
`DeleteNodesAsync` mirrors it on the way out (`DeleteConnectorForNodeAsync`). **`BaseProcessElementController`'s
raw `POST`/`DELETE` — the endpoints §4.1's gap table lists as unconditional thin wrappers for "Add
node"/"Delete node" — do not create or clean up this paired `Connector` at all.** A node created purely
through `IProcessElementService.CreateAsync` (as a literal 1:1 `add_workflow_node` wrapper would) is
consistent with every UI-created node for credential-only integrations (which use `ProcessElement
.CredentialID` directly), but inconsistent with every UI-created node whose config dialog is rendered
through `FormBuilderService`'s connector-instance-keyed schema lookup (§1) — for those, a missing
`ConnectorID` breaks the "Config button works" invariant the production UI relies on today. Whether
`add_workflow_node`/`delete_workflow_node` need to compose the same `Connector` pairing
`WorkflowTransactionCoordinator` does privately, or whether this is acceptable as an MCP-created-node
limitation for v1, is not assumed here — see the gap classification table under "Proposed design" below
and Decision #5.

**`BizFirst.Ai.Process.Domain.WebRequests.ProcessElement.UpdateNodeConfigurationRequest`**:
`{ IDInfo ProcessElementID; string? ConfigurationJson; }` — exact shape of the settings-update request.
**`UpdateProcessElementCredentialRequest`**: `{ IDInfo ProcessElementID; int? CredentialID; }`.

### 3. Node type inventory — quantified, from real code, not the "60+" memory estimate

Counted directly (excluding `Tests`/`obj`/`bin`): **101 files literally named `*NodeExecutor.cs`**,
plus **7 more real node executors under non-matching names** (`ChatExecutor.cs`,
`ChatReceiveExecutor.cs`, `WorkflowControlExecutor.cs`, `AddRagDocExecutor.cs`,
`DeleteRagDocExecutor.cs`, `UpdateRagDocExecutor.cs`, `GmailTriggerExecutor.cs`) — **~108 distinct
node executor classes** (112 files total match `*Executor.cs` broadly). Cross-checked independently
against the seed data: `find ... -iname "Process_ProcessElementTypes_*.data.sql"` under
`BizFirstFiDB\...\dbo\Data\projects\` returns **113 files total, 107 of them live** (6 sit in
`obsolete\` folders — `OpenAIGptImage`, `Expression`, `RagDocumentAdd/Delete/Update`, and a
superseded `Docker` seed alongside its live replacement) — a near-1:1 match with the live executor
count once obsolete seeds are excluded. The real number is meaningfully higher than the "60+" figure
in this session's own memory — this spec supersedes that estimate, and **107 live node types** is the
number to cite going forward (not 108 or 109 — both close, neither exact).

Category breakdown (by folder): **Core** (~25 — triggers, logic/control-flow, data, script, human/HIL,
satellite), **Blockchain** (16 — Binance, Bitcoin, Centrifuge, ChainLink, Coinbase ×2, DataProof,
Ethereum, HashiCorp, Hedera, IPFS, Ondo, Safe, Solana, Wormhole), **Social** (6 — Facebook, Instagram,
Slack, TikTok, Twilio, WhatsApp), **Email** (5 — Gmail, IMAP, Mailgun, SES, SMTP), **Google Workspace**
(5 — Calendar+trigger, Docs, Drive+trigger), **Microsoft Office** (3 — Excel, PowerPoint, Word),
**IaaS** (5 — Deploy, Docker, DockerCompose, Kubernetes, SSH), **Databases** (3 — SqlServer, MySql,
ElasticSearch), **Distributed** (2 — Kafka, Redis), **Octopus/AI** (3 — AiAgent, AiFunction,
FlowAiAgent), **Productivity** (5 — GSheets, Jira, MongoDB, Notion, S3), **ScrapeApi** (3 — Apify+
trigger, Browserless), **Cloud/Config/Documents/Enterprise** (~5 more — AzureBlob, CloudFlare,
EnvironmentVariables, SpreadsheetFile, Salesforce). This confirms and quantifies Binoy's "too many
nodes" concern — but see §3.4 for why the mitigation doesn't need to be RAG.

### 4. Config schema shape — three tiers sampled, plus the load-bearing database finding

Three representative executors, read directly:

- **`ManualTriggerNodeSettings`** (simple): zero real fields. Doc comment: *"requires zero
  configuration — accepts any InputData payload and forwards it unchanged."* `Validate()` always
  returns null.
- **`SmtpNodeExecutorSettings`** (moderate, the codebase's own Rule_011 reference implementation):
  resource/operation dispatch pattern (`resource="email"`, `operation="send"`) delegating to a
  per-operation DTO (`SmtpOperationInfoFactory.Create`) that owns its own field-by-field config
  reading.
- **`OctopusAiAgentNodeExecutorSettings`** (complex): HIL feature-flag overrides
  (`HilFeatureEnableEngageDefault`/`HilFeatureSuspendsWithoutEngageDefault`/etc.), a `ConversationScope`
  object (`Scope`/`Mode`/`Isolation`/`AlwaysStartNewConversation`, each its own enum), `InvocationMode`,
  agent-ID resolution, plus several fields **explicitly delegated elsewhere** (tool servers, LLM info,
  channel routing — moved to a separate `OctopusAiAgentBridgeOriginReader` per the file's own comments).
  Confirms this is a genuinely deep, multi-object config surface — the concrete evidence for "config
  needs a lot of RAG," and the reason a tiered discovery design (§4.2) is still warranted even though
  RAG-over-docs specifically is not.

**The load-bearing finding**: `ProcessElementType` already has `ConfigurationSchema`, `InputSchema`,
`OutputSchema`, `InputPortsSchema`, `OutputPortsSchema` columns (`Ai\Process\...\Entities\
ProcessElementType.cs`), and — checked directly in the DB seed data, not assumed — **these are
genuinely populated with real, detailed JSON Schema**, not left null/stub. Two seeds read in full:

- `email-smtp` (`Process_ProcessElementTypes_Smtp.data.sql`): a complete JSON Schema — every field
  from `SmtpNodeExecutorSettings`' resource/operation/host/port/credentials/from/to/cc/bcc/subject/
  body/priority/headers/attachments, with `required: [resource, operation, host, port, fromEmail,
  toEmail]`, enums on `resource`/`operation`/`priority`, a nested array schema for
  `attachmentsData[]`. This is genuinely usable for validation and for an agent to read before calling
  `add_workflow_node`.
- `ai-agent` (`Process_ProcessElementTypes_AI-Agent.data.sql`): a JSON Schema covering `AgentID`,
  `MessageSource`, `Message`, `ConversationScope`/`ConversationMode`, `IncludeInputData`,
  `InstanceInstructions`, `InstanceMcpServerIds`, `InjectExecutionEnv`,
  `EnableObservabilityLogging` — **but visibly thinner than the real
  `OctopusAiAgentNodeExecutorSettings` C# class** (no HIL feature flags, no tool-server info, no
  per-invocation LLM info). This is a real, specific, evidence-based caveat, not a hypothetical one:
  **for at least the AI-Agent node type, the seeded `ConfigurationSchema` is stale relative to the
  actual runtime settings surface.** Whether this holds for other complex node types (FlowAiAgent,
  the HIL-based Chat nodes) is unconfirmed — flagged as Decision #3 below, not asserted as universal.

This finding changes the recommended design fundamentally — see §4.2.

### 5. Credential system — single, complete, real system, confirmed via ExecutionNode runtime usage

`BaseCredentialController` (`Ai\AIExtension\BizFirst.Ai.AIExtension.Api.Base\Controllers\
BaseCredentialController.cs`), route `api/v1/ai-extension/credentials`: full `Create`(`POST`)/
`Update`(`PUT {id}`)/`Delete`, plus `activate`/`deactivate`/`refresh`/`test`/`validate`/
`test-connection`/`exchange-oauth-code`(OAuth token exchange)/`by-type-code`/`by-type`/`by-scope`/
`by-environment`/`shared`/`expired`/`by-vault-provider`/`name-exists`/`update-display-metadata`. This
is not a thin CRUD stub — it's a mature, feature-complete credential management surface.

`ProcessElement.CredentialID` (`int?`) is a plain FK into this same `Credential` entity — confirmed by
`UpdateProcessElementCredentialRequest.CredentialID` being typed identically and
`ProcessElementService.UpdateCredentialAsync`'s implementation simply assigning
`processElement.CredentialID = request.CredentialID`. `ICredentialResolver` usage is real and live at
node-execution time — found directly inside `ChainlinkNodeExecutor.Credentials.cs` and
`SalesforceNodeExecutor.Credentials.cs` under `Ai\ExecutionNodes\`, confirming node executors resolve
credentials through this exact same AIExtension credential store at runtime, not a separate
workflow-scoped concept. **No gap here — fully thin-wrappable as-is**, including for Task 23's
overlapping need.

## Proposed design

### 1. Gap classification — what needs new code vs. thin wrapper

| Capability | Status | Backing |
|---|---|---|
| Add node (no `Connector`/config-dialog needed — e.g. built-in Core control-flow nodes, direct-`CredentialID` integrations) | Thin wrapper | `IProcessElementService.CreateAsync` (existing) |
| Add node (**needs** the paired `Connector` row — extension/connector-backed nodes whose config dialog resolves via `FormBuilderService`, §2's Connector caveat) | **Gap, not yet a thin wrapper** | Needs the same `ProcessElement`+`Connector` composition `WorkflowTransactionCoordinator.InsertNodesAsync` does privately — either compose it in the new `IProcessElementExtendedService` alongside the validation method, or accept the limitation for v1 (open question) |
| Update node (whole entity — position, flags, retry/timeout) | Thin wrapper | `IProcessElementService.UpdateAsync` (existing) |
| Delete node (mirrors the Add-node caveat — orphans a `Connector` if one exists) | Thin wrapper for `Connector`-less nodes; same gap as Add for the rest | `IProcessElementService.SoftDeleteAsync` (existing) |
| Update node settings — **validated** | **New** (composes existing) | New `IProcessElementExtendedService.UpdateNodeConfigurationValidatedAsync`, which validates against `ProcessElementType.ConfigurationSchema` then calls the existing, unchanged `IProcessElementService.UpdateNodeConfigurationAsync` |
| Attach/change node credential | Thin wrapper | `IProcessElementService.UpdateCredentialAsync` (existing) |
| Add/update/delete edge (connection) | Thin wrapper | `IConnectionService` CRUD (existing) |
| Create whole new workflow (nodes+edges, one shot) | Thin wrapper | `IWorkflowSaveService.SaveWorkflowAsync` (existing, ProcessStudio) |
| Create new workflow *project* (App+Process+ProcessThread) | Thin wrapper | `IStudioProjectService.CreateProjectWithStructureAsync` (existing) |
| Read current workflow | Thin wrapper | `IWorkflowDataRefreshService.RefreshWorkflowAsync` (existing) |
| List/discover node types (overview tier) | Thin wrapper | `IProcessElementTypeService` list/search (existing) |
| Get one node type's full schema (detail tier) | Thin wrapper | `IProcessElementTypeService.GetByCodeAsync` → read `ConfigurationSchema`/`InputPortsSchema`/`OutputPortsSchema` columns (existing) |
| Create/find credential | Thin wrapper, **shared, not this spec's tool list** | `BizFirst.Ai.Mcp.Tools.Credentials` (owned by neither Task 22 nor Task 23 — see cross-reference note above) |
| Attach an existing credential to a node | Thin wrapper | `IProcessElementService.UpdateCredentialAsync` (existing) — this one **is** workflow-domain-specific |

**Net effect: at most two new methods, both pure compositions of already-real services, are the entire
backend delta** — `UpdateNodeConfigurationValidatedAsync` (the confirmed gap) and, if Binoy confirms
the `Connector`-pairing caveat above needs closing for v1 rather than being accepted as a known
limitation, an `AddNodeAsync`/`DeleteNodeAsync` pair on the same new `IProcessElementExtendedService`
that composes `IProcessElementService` + `IConnectorService` the same way
`WorkflowTransactionCoordinator` already does privately (same shape §3 proposes for the validation
method — compose, never duplicate). Everything else in the curated tool list (§4.4) is a direct
in-process call to code that already exists, is tested, and needs no change.

### 2. RAG strategy for node configuration — SUPERSEDED, see `workflow-nodes-rag\`

**Correction (2026-08-20): the "skip RAG" recommendation below was wrong and has been superseded.**
Binoy corrected it directly: *"for flow mcp server, we need a rag system because the schema in the
table is not reliable neither is complete."* The original reasoning rested on sampling only 2 node
types (`email-smtp`, `ai-agent`) and finding both populated with plausible-looking JSON Schema. A
follow-up pass sampled 18 node types across all complexity tiers (simple triggers through
Octopus/Flow AI Agent) and found the column's reliability is **inconsistent in a way sampling 2 types
could not reveal**: some node types have genuinely accurate, well-maintained schemas
(`http-request`, `flow-ai-agent`); some are stale relative to current code (`ai-agent`); some are
empty stubs despite real required fields (`if-condition`, `switch`, `webhook-trigger`,
`schedule-trigger`, `loop`, `code-execute`); and at least one (`slack`) is a **verbatim copy-paste of
an unrelated node type's schema** (`ai-agent`'s fields, none of which are real Slack fields) — a
failure mode "skip RAG, the column is structured and populated" cannot detect, because a copy-pasted
schema is exactly as structurally well-formed as a correct one. Good and bad schemas are randomly
interspersed with no reliable predictor (category, `DisplayOrder`, age) — `flow-ai-agent` and
`ai-function` sit in the same `Octopus/AI` category with opposite outcomes. That unpredictability,
not uniform badness, is what makes a verified, curated RAG doc set the right tool: an agent cannot
safely trust "the schema looked plausible" as a proxy for "the schema is correct."

**What was actually built**, following the Atlas Forms RAG precedent directly (per this task's own
instruction to reuse it rather than invent a second design): a new doc set at
`bizfirst-ai-mcp-servers-spec\workflow-nodes-rag\`, strictly two-tier per Binoy's explicit framing:
**Tier 0 = "always execute"** — `00-overview.md`, a lean, always-loaded index (node type, category,
one-line description, credentials, doc status only — never per-node config detail, so a workflow that
never touches Slack never pays for Slack's field list in context); **Tier 1 = "optional"** — one
`nodes\{code}.md` per node type, retrieved on demand via `util-kg-knowledge_retrieval` only when a
request implies that specific node type is relevant, written independently from the real
executor/settings C# source (never mirrored to `ConfigurationSchema`'s shape) and cross-checked
against that node type's DB seed only afterward, as a factual Gotchas-section finding. 18 node types
got real Tier 1 docs in this first pass (triggers, HTTP/webhook, email/Slack, if/switch/control-flow,
AI Agent/AI Function/Flow AI Agent — the priority order Decision #3 below already specified); the
remaining ~89 are a prioritized follow-up list in `00-overview.md`, addable via the extensibility
runbook `workflow-nodes-rag\agent\add-new-node-type.md` (mirrors `atlas-forms-rag\agent\
refreshFromCodeToDoc@agent.md`'s discipline) without redesigning anything. Ingestion follows the same
`FlowRag`-ExecutionNode-into-Qdrant mechanism `atlas-forms-rag\agent\ragUploadDesign.md` designed and
proved out for Atlas Forms, into a separate `workflow-nodes-spec` collection holding Tier 1 content
only (Tier 0 is injected directly, never retrieved) — see `workflow-nodes-ingestion.md` for the
concrete procedure and what remains a deferred/manual step (no live ingestion was actually run; see
that doc's "What was actually done vs. deferred" section).

The original "thin schema read, not RAG" reasoning below is kept for historical record, not as
current guidance — `list_node_types`/`get_node_type_schema` (§4.4) remain useful as a first-pass,
unverified lookup, but should now be treated as a fallback to cross-check against
`workflow-nodes-rag\nodes\{code}.md` (or the real source) rather than a trusted standalone source.

<details>
<summary>Original (superseded) reasoning</summary>

**The precedent, read directly before writing this section, not assumed:** the tiered RAG design
built for Atlas Forms lives at `Documentation\Employees\atlas-forms\atlas-forms-rag\v2\` (not under
`bizfirst-ai-mcp-servers-spec\` as this task's brief guessed — confirmed by directory search; flagged
so a future reader doesn't look in the wrong place) — `00-overview.md` (always-loaded: category table,
decision guide) plus one `controls\{type}.md` file per control type (69 files), ingested via the
`FlowRag` ExecutionNode into a Qdrant collection and retrieved through a gated
`util-kg-knowledge_retrieval` function call, per `atlas-forms-rag\agent\ragUploadDesign.md`. This is
real retrieval-augmented generation (embeddings + vector search), built because Atlas Forms' substrate
— the 88+/115 control types — exists **only as TypeScript types on the frontend**, with no structured,
queryable representation in the backend at all. Workflow node types are different in kind: `Process_ProcessElementTypes.ConfigurationSchema` is
already a **structured, versioned, database-resident JSON Schema**, and §3.4 confirmed it's populated
with real, detailed content for the two types sampled (not a stub column). Retrieval (RAG) is the
right tool when the source of truth is unstructured prose you need to *find the relevant chunk of*;
it is the wrong tool when the source of truth is already a single structured row you can look up
by exact key. Recommendation: **skip RAG for this module**, and use a **two-tier direct-read discovery
pattern** instead, mirroring Atlas Forms' tiering *shape* (always-loaded overview + on-demand detail)
without needing its retrieval *mechanism*:

- **Tier 0 — always-loaded overview.** A compact catalog embedded in the MCP tool module's own
  static description/prompt context: `{code, displayName, category, oneLineDescription,
  requiresCredentials}` for all ~108 node types. At this size (roughly Atlas Forms' own control-count
  order of magnitude) this is small enough to keep resident without blowing out tool-selection context
  — a `list_node_types(category?, search?)` tool additionally lets an agent query it live rather than
  trusting a possibly-stale embedded snapshot.
- **Tier 1 — on-demand full schema, one node type at a time.** `get_node_type_schema(nodeTypeCode)` —
  a direct, in-process call to `IProcessElementTypeService.GetByCodeAsync`, returning
  `ConfigurationSchema`/`InputPortsSchema`/`OutputPortsSchema`/`RequiresCredentials` verbatim. The
  agent calls this exactly once, for the one node type it's about to configure, immediately before
  `add_workflow_node`/`update_node_configuration` — never needs the other 107 types' schemas in
  context at the same time.
- **Known caveat, not solved by this design**: for node types where the seeded `ConfigurationSchema`
  is stale relative to the real settings class (confirmed for `ai-agent`, §3.4), Tier 1 will hand the
  agent an incomplete schema. This is a **data-quality problem in `Process_ProcessElementTypes` seed
  data**, not a retrieval-architecture problem — the fix is auditing/regenerating `ConfigurationSchema`
  for the highest-traffic node types (starting with `ai-agent`, `flow-ai-agent`, and other
  HIL/Octopus-backed types, since those are both the most complex and the most likely to be
  agent-configured first) against their real `*NodeExecutorSettings` classes, not building a second
  parallel RAG system to compensate. Recommend this as an explicit, separate, prioritized follow-up
  task — not silently absorbed into this MCP module's scope.
- **Tier 2 fallback, only if the audit above is deferred or a node type turns out to be irreducibly
  too complex for a single `NVARCHAR(4000)` JSON Schema column** (§3.4's `OctopusAiAgentNodeExecutorSettings`
  read — HIL feature flags, nested `ConversationScope` object, tool-server/LLM info delegated to a
  separate reader — is exactly this shape): **reuse `atlas-forms-rag`'s infrastructure directly rather
  than building a second one**, per this task's own instruction. Concretely: a new `FlowRag`-ingested
  Qdrant collection (`workflow-nodes-spec`), one `{node-type-code}.md` doc per node type that genuinely
  needs it (almost certainly a short list — `ai-agent`, `flow-ai-agent`, other HIL-backed types — not
  all 107), retrieved through the same gated `util-kg-knowledge_retrieval` mechanism, wired via a second
  `AIAgent_KnowledgeBases` row. This is a fallback *tier*, not the module's primary mechanism — most of
  the 107 node types resolve at Tier 0/1 above and never need it.

### 3. New service: `IProcessElementExtendedService`

Following the `*Extended` standing rule (`architecture.md`) — never modify
`IProcessElementService`/`BaseProcessElementController`; compose them from a new Extended service.

```csharp
namespace BizFirst.Ai.Process.Extended.Services;

public interface IProcessElementExtendedService
{
    /// <summary>
    /// Validates ConfigurationJson against the node's ProcessElementType.ConfigurationSchema
    /// (JSON Schema) before persisting. On success, delegates to the existing, unchanged
    /// IProcessElementService.UpdateNodeConfigurationAsync — this method never duplicates that
    /// method's persistence logic, only adds the validation step in front of it.
    /// On schema violation, returns validation errors and does NOT write.
    /// </summary>
    Task<UpdateWebResponse> UpdateNodeConfigurationValidatedAsync(
        UpdateNodeConfigurationRequest request, CancellationToken ct = default);

    /// <summary>
    /// CONDITIONAL — only needed if Decision #5 (below) confirms the Connector-pairing gap must be
    /// closed for v1. Creates one ProcessElement AND its paired Connector atomically, composing
    /// IProcessElementService.CreateAsync + IConnectorService.CreateAsync the same way
    /// WorkflowTransactionCoordinator.InsertNodesAsync already does privately during a whole-workflow
    /// save — exposed here as a single call safe for a granular add_workflow_node MCP tool.
    /// </summary>
    Task<InsertWebResponse> AddNodeWithConnectorAsync(
        AddWorkflowNodeRequest request, CancellationToken ct = default);

    /// <summary>
    /// CONDITIONAL — mirrors AddNodeWithConnectorAsync. Deletes one ProcessElement and its paired
    /// Connector (best-effort on the Connector delete, matching DeleteConnectorForNodeAsync's own
    /// "don't throw — this is a cleanup operation" behavior).
    /// </summary>
    Task<UpdateWebResponse> DeleteNodeWithConnectorAsync(
        DeleteWorkflowNodeRequest request, CancellationToken ct = default);
}
```

New project: `BizFirst.Ai.Process.Extended.{Domain,Services}` (Process has no `.Extended` split
today — this pilot creates it, matching Atlas Forms having created its own `Extended.Api.Base`).
Constructor-injects the existing `IProcessElementService` (for the delegated write) and
`IProcessElementTypeService` (to fetch `ConfigurationSchema` by the node's `ProcessElementTypeID`).
JSON Schema validation needs a validator library — this codebase already parses JSON with
`System.Text.Json.Nodes` elsewhere (`FormSchemaResolver.cs`) but does not currently reference a JSON
Schema *validation* library; adding one (e.g. `JsonSchema.Net` or `NJsonSchema`) is a new dependency
decision, flagged for Binoy as Decision #1 below rather than assumed.

`.Extended.Api.Base` (class library, no HTTP host, same Non-goal shape as Atlas Forms' pilot — see
"Non-goals" below) is optional for this pilot; the MCP tool module can call
`IProcessElementExtendedService` in-process directly without it existing at all. Included here only if
Binoy wants a documented seam for a future human-facing HTTP surface; not required to ship the MCP
module.

### 4. MCP tool module: `BizFirst.Ai.Mcp.Tools.Workflow`

References `BizFirst.Ai.Process.Extended.Services` (new, for the one validated-write tool) directly,
plus `IProcessElementService`/`IConnectionService`/`IProcessElementTypeService` (existing, `Ai.Process`),
`IWorkflowSaveService`/`IStudioProjectService`/`IWorkflowDataRefreshService` (existing, `ProcessStudio`),
and `ICredentialService` (existing, `AIExtension`, for the one credential-linking tool only — creating/
finding credentials themselves is the shared `BizFirst.Ai.Mcp.Tools.Credentials` module's job, not
this one's) — all in-process, no HTTP hop, matching `architecture.md`'s hosting model (merged into the
platform server via project reference, not a separate process). Curated to 12 tools:

| Tool | Backing call | New or existing |
|---|---|---|
| `create_workflow_project(name, description)` | `IStudioProjectService.CreateProjectWithStructureAsync` | existing |
| `get_workflow(processThreadId)` | `IWorkflowDataRefreshService.RefreshWorkflowAsync` | existing |
| `save_workflow(processThreadId, versionId, nodes[], edges[])` | `IWorkflowSaveService.SaveWorkflowAsync` | existing — the one-shot whole-workflow create/replace path |
| `list_node_types(category?, search?)` | `IProcessElementTypeService` list/search | existing |
| `get_node_type_schema(nodeTypeCode)` | `IProcessElementTypeService.GetByCodeAsync` → `ConfigurationSchema`/ports schemas | existing |
| `add_workflow_node(processThreadVersionId, nodeTypeCode, key, position, configuration)` | `IProcessElementExtendedService.AddNodeWithConnectorAsync` if Decision #5 confirms the Connector gap must close for v1, else `IProcessElementService.CreateAsync` directly | **new, conditional** on Decision #5 — otherwise existing |
| `update_workflow_node(processElementId, patch)` | `IProcessElementService.UpdateAsync` | existing |
| `update_node_configuration(processElementId, configurationJson)` | `IProcessElementExtendedService.UpdateNodeConfigurationValidatedAsync` | **new** |
| `delete_workflow_node(processElementId)` | `IProcessElementExtendedService.DeleteNodeWithConnectorAsync` if Decision #5 applies, else `IProcessElementService.SoftDeleteAsync` directly | **new, conditional** on Decision #5 — otherwise existing |
| `add_connection(sourceElementId, sourcePort, targetElementId, targetPort)` | `IConnectionService.CreateAsync` | existing |
| `delete_connection(connectionId)` | `IConnectionService.SoftDeleteAsync` | existing |
| `attach_node_credential(processElementId, credentialId)` | `IProcessElementService.UpdateCredentialAsync` | existing |

Credential *creation* is deliberately absent from this table — an agent building a workflow that needs
a new credential calls the shared `BizFirst.Ai.Mcp.Tools.Credentials` module's own tools (both MCP
servers are visible to the same Octopus agent via its granted tool set, so this is a cross-module call,
not a missing capability), then this module's `attach_node_credential` to link the result to a node.

Deliberately **not** included, matching `architecture.md`'s curation-not-1:1 rule: raw `ProcessElementParameter`
CRUD (§3.2's open question — not confirmed live at execution time), `ProcessElementGroup`/
`ProcessElementBreakpoint`/`ProcessElementWebhook` CRUD (design-time grouping/debugging/webhook-binding
concerns, not core to "build me a workflow"), and per-field-variant search endpoints (collapsed into
`list_node_types`'s filter params, same pattern Atlas Forms used for `find_forms`).

## Agent conversation flow

Same two-phase shape as Atlas Forms (`atlas-forms-design.md`), adapted for the node-graph domain:

**Phase 1 — initial creation, one shot.** User describes a desired workflow in conversation; the agent
asks clarifying questions, and *before* calling any node-creation tool, calls `get_node_type_schema`
once per distinct node type it plans to use (not once per node instance — a workflow with five HTTP
Request nodes needs one schema lookup, reused five times). Once the agent has the full node/edge list
assembled in its own context, it calls `create_workflow_project` (if starting fresh) then **one**
`save_workflow` with the complete `{Nodes[], Edges[]}` — not N `add_workflow_node` calls. This mirrors
Atlas Forms' "don't loop per-field" guidance and additionally reuses ProcessStudio's own atomic,
delta-detected, validated bulk-save path rather than re-implementing bulk-create as a loop of
single-node calls.

**Phase 2 — the view/feedback/edit loop.** After `save_workflow` returns, user feedback ("add a Slack
node after the approval step," "change the SMTP node's `toEmail`") becomes single targeted tool calls:
`get_workflow` to re-ground in current server state (defends against drift the same way Atlas Forms'
`get_form_schema` does), then `add_workflow_node`/`update_node_configuration`/`delete_workflow_node`/
`add_connection`/`delete_connection` as appropriate — never a full-workflow resubmission for a
single-node edit. `update_node_configuration` is the one tool in this list backed by new validation
code (§4.3); every other Phase 2 tool is a thin wrapper already proven in production via the FlowStudio
UI that calls these same underlying endpoints today.

## Decisions needed from Binoy (not guessed)

1. **JSON Schema validator library** — `IProcessElementExtendedService`'s validation step needs one;
   this codebase doesn't currently reference a JSON Schema validation package. Recommend
   `JsonSchema.Net` (actively maintained, `System.Text.Json`-native, no legacy `Newtonsoft.Json`
   dependency this codebase would otherwise have to add) but this is a new third-party dependency and
   should be confirmed, not assumed.
2. **`ProcessElementParameter` — live or unused?** (§3.2). If a node executor genuinely reads it at
   runtime somewhere this pass didn't find, it changes the tool list (§4.4) and possibly the
   validation design (`UpdateNodeConfigurationValidatedAsync` would need a parameter-table counterpart).
   Recommend a targeted follow-up grep across every `*NodeExecutorSettings` class's `ReadConfigByKey`
   implementation (not just the three sampled here) before treating this as settled.
3. **Which node types get their `ConfigurationSchema` audited first.** The finding above confirmed
   `ai-agent`'s seeded schema is stale; unconfirmed for the other ~106 live node types. Recommend
   prioritizing by expected agent-authored-workflow frequency (triggers, HTTP Request, SMTP/email,
   Slack, if/switch, AI Agent, Flow AI Agent) rather than auditing all ~107 before this module ships.
4. **`.Extended.Api.Base` for `IProcessElementExtendedService`** — build it now (unreachable HTTP
   class library, matching Atlas Forms' pilot shape) or skip it entirely since the MCP tool module
   calls the Extended service in-process either way? Atlas Forms built it as a documented future seam;
   this spec defaults to the same unless Binoy wants it skipped to reduce scope.
5. **Does `add_workflow_node`/`delete_workflow_node` need to close the `Connector`-pairing gap for v1?**
   (§2's Connector caveat, gap table above.) Two real options, both defensible: (a) compose
   `AddNodeWithConnectorAsync`/`DeleteNodeWithConnectorAsync` now, so every MCP-created node is
   indistinguishable from a UI-created one (safer, more code, matches
   `WorkflowTransactionCoordinator`'s existing invariant exactly); or (b) ship `add_workflow_node`/
   `delete_workflow_node` as pure thin wrappers over raw `IProcessElementService.CreateAsync`/
   `SoftDeleteAsync` for v1, accept that MCP-created nodes needing the connector-backed config dialog
   (extension/connector-type nodes) won't get one until a human opens the node in FlowStudio and saves
   once (which backfills the `Connector` via `WorkflowTransactionCoordinator.UpdateNodesAsync`'s own
   backfill path — already-real behavior, confirmed by reading it), and revisit only if this proves to
   be a real problem in practice. Recommend (a) for parity with the production UI, but this is a scope
   trade Binoy should make explicitly, not one this spec should assume.

## Non-goals for this pass

- **Not touching `WorkflowValidator.cs`'s six existing rules.** The new `Configuration`-vs-schema
  validation is additive, in the new Extended service, not inserted into ProcessStudio's existing
  validator.
- **Not fixing `BaseFormBuilderController`'s commented-out `by-node-type` handler** (§3.1). Real,
  pre-existing, unrelated gap in the UI-config-*form*-rendering story (Atlas-Forms-shaped dialogs),
  separate from this spec's JSON-Schema-validation gap. Flagged, not fixed here.
- **Not auditing or regenerating `ConfigurationSchema` for all ~107 live node types.** One confirmed-stale
  example (`ai-agent`) is evidence of a real problem category, not a mandate to fix all of them in this
  pass — see Decision #3.
- **Not building `ProcessElementParameter`, `ProcessElementGroup`, `ProcessElementBreakpoint`, or
  `ProcessElementWebhook` MCP tools.** Out of curated scope per the MCP tool module's tool table above;
  `ProcessElementParameter` additionally has an unresolved liveness question (Decision #2).
- **Not designing `BizFirst.Ai.Mcp.Tools.Credentials`'s tool list.** Confirmed shared infrastructure
  per Binoy's clarification recorded in `octopus-agent-mcp-design.md` — this doc only consumes it
  (via `attach_node_credential`, §4.4), it does not design its `create_credential`/`find_credentials`
  tools.
- **Not building a runnable HTTP host for `.Extended.Api.Base`** if it's built at all (Decision #4) —
  same shape as Atlas Forms' pilot Non-goal: a class library the MCP tool module calls in-process,
  not reachable over HTTP by anything else in this pass.

## Testing

Convention matches `Ai\Process\BizFirst.Ai.Process.Tests`/`.IntegrationTests` (already real, already
following `MethodName_Scenario_ExpectedResult`, Arrange/Act/Assert, `{X}ServiceTests.cs`/
`{X}ControllerTests.cs` split) — the new `BizFirst.Ai.Process.Extended.Tests` project mirrors it:

- `UpdateNodeConfigurationValidatedAsync` — valid config against a real seeded schema (e.g.
  `email-smtp`) succeeds and delegates to the mocked `IProcessElementService
  .UpdateNodeConfigurationAsync`; a config missing a `required` field (e.g. `toEmail`) is rejected
  with no write (assert the mock was never called, same "concurrency check must short-circuit before
  persistence" pattern Atlas Forms' tests use); a config with a value violating an `enum` (e.g.
  `priority: "urgent"`) is rejected; a `ProcessElementTypeID` whose `ConfigurationSchema` is null/empty
  is treated as "no schema to validate against" and passes through unchanged (a node type that hasn't
  been schema-audited yet must not become unusable).
- **Not testing in this pass**: the MCP tool module itself (once `overview.md`'s gateway
  placement/hosting questions are resolved, same deferral Atlas Forms made) and
  `list_node_types`/`get_node_type_schema` (pure existing-service reads, no new logic to test).

## Open questions for Binoy

1. Decisions #1–#5 above.
2. **Second-pilot sequencing** — `overview.md`'s open question #4 asked to confirm Atlas Forms ships
   and is validated before starting a second module. This spec was written in parallel per this
   session's explicit task; confirm whether implementation should wait for that gate too, or whether
   design-only work for both pilots proceeding in parallel (implementation still sequenced) is the
   intended reading.
3. **`BizFirst.Ai.Mcp.Tools.Credentials`'s own companion spec** — both this doc and
   `octopus-agent-mcp-design.md` defer its tool-level design to a short, focused note neither domain
   spec should own; confirm who writes that note and when, so neither pilot blocks on it.
