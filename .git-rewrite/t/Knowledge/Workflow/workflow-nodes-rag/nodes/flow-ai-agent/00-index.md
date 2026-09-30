# `flow-ai-agent` — Index

A self-contained AI agent node that talks directly to an LLM provider (not an Octopus Agent — no
`AgentID`) and runs one of six execution strategies (FA01–FA06) entirely inside the node: `tools`
(native function-calling loop), `reAct` (Thought/Action/Observation loop), `conversational`
(single-pass with persistent memory), `planExecute` (plan-then-execute), `sql`
(natural-language-to-SQL), `stream` (streaming with a callback URL). Executor:
`FlowAiAgentNodeExecutor` (`BizFirst.Ai.ExecutionNodes.FlowAiAgent`); settings:
`FlowAiAgentSettings` (`BaseNodeExecutorSettings`, lazy `ReadConfigByKey` pattern throughout, one
region per sub-feature below). Output ports: `main` (success), `error`. `RequiresCredentials = 1` —
the LLM API key is resolved through `llmCredentialID` (a vault credential ID, never a raw key in
config).

Use this instead of `ai-agent` when the workflow needs its own LLM call/tool-loop/SQL-agent without
depending on an existing Octopus Agent record — `flow-ai-agent` is fully self-contained per node.

## This node qualifies for the split-doc pattern

`FlowAiAgentSettings` is organized into 8 real, independently-relevant config regions in source
(`─── Agent Type ───`, `─── LLM Configuration ───`, `─── Prompt ───`, `─── Tools ───`,
`─── Loop Control ───`, `─── Memory ───`, `─── SQL Agent (FA05) ───`, `─── Streaming Agent (FA06) ───`)
— several of which (SQL agent, streaming agent) only apply under one specific `agentType` value and
are meaningless noise for every other strategy. Per the qualifying rule in
`..\..\..\..\..\Procedure\Workflow\add-new-node-type.md`, this is documented as a lean index (this file) + one doc per
grouped sub-feature, rather than one flat file.

## Agent type (selects the strategy)

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `agentType` | string, enum `tools`\|`reAct`\|`conversational`\|`planExecute`\|`sql`\|`stream` | No | `"tools"` | Selects the execution strategy (FA01–FA06). `Validate()` rejects any other value (case-insensitive match against this exact list). |

## Sub-features

| Sub-feature | What it covers | Applies to | Doc |
|---|---|---|---|
| LLM & prompt | Provider/model/credential/temperature/token config, plus the task prompt and system message — needed for every `agentType` | All | `llm-and-prompt.md` |
| Tools | Built-in and MCP-registry tool wiring for the function-calling loop | `tools`, `reAct` only (harmless-but-inert otherwise) | `tools.md` |
| Loop control & memory | Iteration limits, intermediate-step reporting, and conversation memory backend/session identity | All (memory only matters when persistence is wanted) | `loop-and-memory.md` |
| SQL agent | Natural-language-to-SQL connection, safety, and result-shaping config | `agentType: "sql"` only | `sql-agent.md` |
| Streaming agent | Streaming callback URL and event-inclusion flags | `agentType: "stream"` only | `streaming-agent.md` |

## Example

```json
{
  "agentType": "tools",
  "llmProvider": "anthropic",
  "llmModelId": "claude-sonnet-4-6",
  "llmCredentialID": 17,
  "temperature": 0.7,
  "prompt": "Draft a summary of this week's flagged transactions and recommend next actions.",
  "systemMessage": "You are a financial operations assistant. Be concise and cite transaction IDs.",
  "enabledTools": "httpRequest,calculator",
  "toolHttpRequestAllowedDomains": "internal-api.bizfirst.local",
  "maxIterations": 10
}
```

SQL agent variant:

```json
{
  "agentType": "sql",
  "llmProvider": "openai",
  "llmModelId": "gpt-4o",
  "llmCredentialID": 17,
  "prompt": "How many payroll runs failed last month, broken down by client?",
  "sqlConnectionString": "Server=...;Database=Payroll;...",
  "sqlProvider": "sqlserver",
  "sqlReadOnly": true,
  "sqlTopK": 100
}
```

## Gotchas (cross-cutting — applies to the whole node, not one sub-feature)

- **DB schema: genuinely accurate and complete — a positive counter-example, not a gap.** The seeded
  `ConfigurationSchema` (`Process_ProcessElementTypes_FlowAiAgent.data.sql`) mirrors
  `FlowAiAgentSettings.cs` field-for-field, including the correct `required: [llmModelId,
  llmCredentialID, prompt]`, matching enums, and matching per-field descriptions. Its own header
  comment records it was explicitly regenerated post-refactor ("as of the FA01-FA06 →
  AgentExecution.cs consolidation and the llmCredentialID vault-credential security fix") and the
  seed file's `INSERT ... ELSE UPDATE` branch actively repairs a stale pre-restructure row rather than
  silently skipping it. This is proof the DB column CAN be trusted when actively maintained — the
  problem is that maintenance is inconsistent across node types, not that it's impossible. Confirmed
  still valid after this pass re-read the real source field-for-field.
- `llmCredentialID` is a **vault credential ID**, never the raw API key — same
  `ICredentialResolver`/vault-ID pattern as every other node in this system. Passing a raw key string
  here will not work and is also a real prior security bug this exact node had, now fixed.
- `sessionId`/`conversationId` (see `loop-and-memory.md`) intentionally break the repo's `ID`-suffix
  casing convention at the wire-format level — a documented, deliberate backward-compatibility
  exception, not an inconsistency to "fix" when authoring config.
- The `sql*` fields only matter when `agentType: "sql"`; the `stream*` fields only matter when
  `agentType: "stream"` — setting them for other agent types is harmless but inert.
