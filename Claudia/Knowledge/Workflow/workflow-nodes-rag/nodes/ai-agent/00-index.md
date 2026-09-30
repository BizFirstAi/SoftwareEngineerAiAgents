# `ai-agent` — Index

Invokes an existing Octopus Agent (an `AgentID` on the V21 Octopus Core side) from a Flow Studio
workflow, either as a one-shot message (`operation=send`) or as a multi-turn, suspend/resume chat
(`operation=chat`, HIL-enabled). Executor: `AiAgentNodeExecutor` (`BizFirst.Ai.ExecutionNodes.
Octopus.OctopusAi.AiAgent.Executor`), extends `BaseHilNodeExecutor<OctopusAiAgentNodeExecutorSettings>`.
Output ports: `main` (success — send mode returns immediately here), `error`, plus HIL ports on chat
mode (`waiting`/suspend port from the base HIL executor — see `hil-features.md`). `RequiresCredentials
= 0` at the node level — the credential lives on the target Agent's own LLM config, not on this node,
unless the `llm` override in `tool-servers-and-llm.md` replaces it.

Real config is split across two C# classes: `OctopusAiAgentNodeExecutorSettings` (the small set of
fields the settings class itself reads) and `OctopusAiAgentBridgeOriginReader` (everything else —
instructions, LLM override, MCP/tool servers, sub-agents, prompts, memory/session identity, action-
context flags). Both read from the same `Configuration` JSON; the split is an internal code-
organization detail, not a config-shape distinction — treat all fields across every sub-feature doc
below as one flat config object.

## This node qualifies for the split-doc pattern

`OctopusAiAgentNodeExecutorSettings`/`OctopusAiAgentBridgeOriginReader` together expose more than 5
genuinely independent sub-objects/concerns (not just scalar fields): a nested `ConversationScope`
object, hardcoded HIL feature-flag overrides, an `llm` override object, a `toolServers` merge object,
canvas-wired team-member sub-agents, and 9 independent prompt-segment overrides. Per the qualifying
rule in `..\..\..\..\..\Procedure\Workflow\add-new-node-type.md`, this is documented as a lean index (this file) + one doc
per sub-feature, rather than one flat file.

## Core / always-relevant fields

These don't belong to any one sub-feature below — they're the minimal shape every invocation needs.

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `resource` | string, enum `"message"` | implicit | `"message"` | Only value ever routed; anything else falls to the error port. |
| `agentID` | integer | **Yes** | — | The Octopus `AgentID` to invoke. `Validate()` fails the node if null/≤0. **Casing note**: the executor's own header doc comment shows `agentId` (lowercase d) but the actual reader (`OctopusAiAgentBridgeOriginReader.AgentID`) reads config key `agentID` (capital ID) — use `agentID`. |
| `message` | string | Conditionally | — | The message text sent to the agent. Read directly off `Configuration` (`StringVariableHolder("message")`), not gated by a `messageSource` flag — there is no `MessageSource`/`config`-vs-`inputData` toggle in the current code (removed; see Gotchas below). |
| `sampleData` | string | No | — | Read via `StringVariableHolder("sampleData")` on the reader alongside `message`; not covered by the old single-file doc — purpose is sample/example data passthrough, exact consumption not traced in this pass. |

## Sub-features

| Sub-feature | What it covers | Doc |
|---|---|---|
| Conversation scope & identity | `send`/`chat` operation selection, the nested `ConversationScope` object (`Scope`/`Mode`/`Isolation`/`AlwaysStartNewConversation`), `conversationID`, `isNewConversation`, postback fields for resuming a paused tool call | `conversation-scope.md` |
| HIL / suspend-resume behavior | Fixed (non-configurable) HIL feature-flag overrides that determine when the node suspends on the `waiting` port and how it resumes | `hil-features.md` |
| Invocation & agent resolution | `invocationMode`, agent-ID resolution (`AgentID`/`AgentResID`/`AgentName`), channel routing (`channel`, `agentChannels`, `additionalAgentChannels`), memory/owner-axis qualifiers (`memoryID`/`tenantID`/`roleID`/`appID`), user-instruction override, action-context inclusion flags | `invocation-and-agent-resolution.md` |
| Prompt-segment overrides | 9 independent, optional prompt-segment fields (`systemPrompt`, `goalPrompt`, ...) merged additively into the target agent's prompt | `prompt-overrides.md` |
| Tool servers, LLM override & sub-agents | The `llm` object (replaces the target agent's LLM config), the `toolServers` object (merges MCP/tool servers), and canvas-wired team-member sub-agents (merges the routable sub-agent set) | `tool-servers-and-llm.md` |

## Example — one-shot send

```json
{
  "resource": "message",
  "operation": "send",
  "agentID": 42,
  "message": "Summarize this week's failed payroll runs and flag any needing manual review.",
  "invocationMode": "sync",
  "channel": "flow-engine"
}
```

## Example — chat, resuming an existing conversation

```json
{
  "resource": "message",
  "operation": "chat",
  "agentID": 42,
  "message": "What about last week?",
  "conversationID": "chat:user123:session456",
  "isNewConversation": false
}
```

See `conversation-scope.md` and `hil-features.md` for what happens under the hood on each turn of a
chat-mode invocation.

## Gotchas (cross-cutting — applies to the whole node, not one sub-feature)

- **DB schema gap (confirmed, severe):** the seeded `ConfigurationSchema` for `ai-agent`
  (`Process_ProcessElementTypes_AI-Agent.data.sql`) lists `AgentID`, `MessageSource` (enum
  `config`/`inputData`), `Message`, `ConversationScope` as a **flat enum string**
  (`ProcessElement`/`ProcessDefinition`), `ConversationMode`, `IncludeInputData`,
  `InstanceInstructions`, `InstanceMcpServerIds`, `InjectExecutionEnv`,
  `EnableObservabilityLogging` — this reflects an older API shape. Confirmed wrong against current
  code on multiple points: `MessageSource`/`IncludeInputData`/`InstanceInstructions`/
  `InstanceMcpServerIds`/`InjectExecutionEnv`/`EnableObservabilityLogging` do not exist anywhere in
  the current settings/reader classes (the commented-out code in `OctopusAiAgentNodeExecutorSettings`
  shows they were retired); `ConversationScope` is actually a **nested object** with 4 sub-fields
  (`Scope`/`Mode`/`Isolation`/`AlwaysStartNewConversation`) whose real `Scope` enum has **11** values,
  not the 2 (`ProcessElement`/`ProcessDefinition`) the DB schema implies — see `conversation-scope.md`;
  and the schema is missing `invocationMode`, `sampleData`, `conversationID`, `channel`,
  `agentChannels`/`additionalAgentChannels`, `memoryID`/`tenantID`/`roleID`/`appID`,
  `userInstructions`/`userInstructionsFieldName`, action-context flags, postback fields, all 9
  prompt-segment fields, `llm`, and `toolServers` entirely. Do not trust this DB column for `ai-agent`
  under any circumstance — use these docs or read the source directly.
- Sub-agents/team-members are a canvas wiring concept, not something you can express purely inside
  this node's own `Configuration` JSON — see `tool-servers-and-llm.md`.
- This node's config surface is genuinely large: when authoring a workflow programmatically, only set
  the sub-feature fields the use case actually needs — every field documented across these docs is
  optional except `agentID` (and `message` for a normal send/chat turn).
