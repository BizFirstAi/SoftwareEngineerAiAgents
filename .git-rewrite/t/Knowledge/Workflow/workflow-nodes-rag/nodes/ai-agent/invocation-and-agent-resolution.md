# `ai-agent` — Invocation & Agent Resolution

Sub-feature of `ai-agent` (see `00-index.md`). Covers how the node decides *whether to wait*
(`invocationMode`), *which agent record* it's actually calling (`AgentID`/`AgentResID`/`AgentName`,
`userInstructions`), *where the invocation is attributed* (`channel` + channel-merge keys,
`memoryID`/`tenantID`/`roleID`/`appID`), and *what execution context gets exposed to the agent*
(action-context inclusion flags).

Source: `OctopusAiAgentNodeExecutorSettings.InvocationMode`/`Validate()`,
`OctopusAiAgentBridgeOriginReader.cs` (AgentID/AgentInfo/Channel/FinalAgentChannels/memory-owner
fields), `OctopusAgentIDInfo.cs`, `UserInstructionsInfo.cs`, `OctopusAgentChannelsGroupInfo.cs`,
`OctopusAiAgentBridgeOriginReader.ContextExtraction.cs`.

## Invocation mode

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `invocationMode` | string, enum `"sync"` \| `"async"` | No | `"sync"` | `sync` waits for the agent's result before continuing the workflow. `async` fires and continues the workflow without waiting. |

## Agent resolution

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `agentID` | integer | **Yes** | — | The Octopus `AgentID` to invoke. `Validate()` (`OctopusAgentIDInfo.CreateInstance(ConfigReader).AgentID is null or <= 0`) fails the node if missing/non-positive. Also documented in `00-index.md` as a core field since it's the one truly mandatory value. |
| `agentResID` | string | No | — | Read directly off config (`ReadConfigByKeyDefaultNull("agentResID")`) alongside `agentID`. Exposed as `AgentResID` on the reader; not derived from a lookup within this class. |
| `agentName` | string | No | — | Same pattern as `agentResID` — read directly, exposed as `AgentName`. |
| `userInstructions` | string | No | — | Static instruction text prepended to the agent's base instruction at execution time (merged, additive — the base `Instruction` is left untouched). |
| `userInstructionsFieldName` | string | No | — | InputData key to read the instruction text from when `userInstructions` isn't set directly. |

## Channel routing

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `channel` | string | No | `"flow-engine"` | Routing/audit label for where this invocation originated. |
| `agentChannels` | array (loaded by `OctopusAgentChannelsInfo.LoadFrom`) | No | empty | Base channel list. |
| `additionalAgentChannels` | array (same shape, `isAdditional: true`) | No | empty | Additional channels, merged with `agentChannels` into `FinalAgentChannels`. Exposed on the reader as `AdditionalChannels` (a flat list of channel names) — `null` when the merged set is empty. |

## Memory / owner-axis qualifiers

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `memoryID` | string | No | — | Origin qualifier for agent memory scoping (agent-memory-redesign design). Omitted = no origin qualifier, memory scope stays plain-Agent. |
| `tenantID` / `roleID` / `appID` | string | No | — | Owner-axis qualifiers for memory/state/log scoping — plain config passthrough, not an IAM lookup. |

## Action-context inclusion flags

Not present in the original single-file `ai-agent.md` doc — found on this pass by reading
`OctopusAiAgentBridgeOriginReader.ContextExtraction.cs` directly. Declarative flags read from the
node's own config keys; combined with live `InputData`/`Items`/`ExecutionMemory` by
`OctopusAgentInternalNodeExecutionContext.Calculate_NodeDataInActionContext` (which needs the full
runtime context, not just this reader) to produce `NodeDataInActionContext`.

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `includeInputDataInActionContext` | boolean | No | — (nullable, unset = not included) | Whether the node's `InputData` is included in the action context handed to the agent. |
| `includeInputItemsInActionContext` | boolean | No | — | Whether input `Items` are included. |
| `includeWorkflowMemoryInActionContext` | boolean | No | — | Whether workflow `ExecutionMemory` is included. |
| `customDataInActionContext` | string | No | — | Free-form custom data string merged into the action context. |

## Gotchas

- **`sampleData`** (documented as a core field in `00-index.md`) is read by the same reader alongside
  `message` but its consumption wasn't traced further in this pass — treat as present-but-unverified
  if authoring against it.
- `agentResID`/`agentName` being plain config-readable fields (not a resolved lookup inside this
  class) means a workflow author *could* pass a stale or mismatched `agentResID`/`agentName` alongside
  a valid `agentID` — nothing in `OctopusAgentIDInfo` cross-validates them against each other.
- None of the action-context flags, memory qualifiers, or channel-merge fields appear in the DB
  `ConfigurationSchema` for `ai-agent` — see the schema-gap note in `00-index.md`.
