# `ai-agent` — Tool Servers, LLM Override & Sub-Agents

Sub-feature of `ai-agent` (see `00-index.md`). Covers the three ways this node can extend or override
the target agent's own capabilities at invocation time: an LLM **override** (`llm`, replaces), a tool
server **merge** (`toolServers`, additive), and a sub-agent **merge** (canvas-wired team members,
additive). Grouped together because all three share the same override-vs-merge split implemented by
`ProcessEngineAgentOverrideSource`.

Source: `OctopusAiAgentBridgeOriginReader.Llm.cs`, `OctopusAiAgentBridgeOriginReader.McpServers.cs`,
`OctopusAiAgentBridgeOriginReader.SubAgents.cs`, `OctopusToolServersInfo.cs`.

## `llm` — LLM override (replaces, not merges)

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `llm.enabled` | boolean | No | `true` **once the `llm` object is present at all** | If `true`, this replaces the target agent's own `LlmConfig.Provider`/`Model`/`MaxOutputTokens`/`Temperature`. |
| `llm.provider` | string | No | — | Provider override. |
| `llm.providerId` | integer | No | — | Provider ID override. |
| `llm.model` | string | No | — | Model override. |
| `llm.temperature` | number | No | — | Temperature override. |
| `llm.maxTokens` | integer | No | — | Max-token override. |
| `llm.topP` | number | No | — | Top-P override. |

This is the **override** side of the override-vs-merge split (`ProcessEngineAgentOverrideSource.Apply`):
when `IsConfigured && Enabled`, it **replaces** the target agent's LLM config — it does not merge with
it. Omit the whole `llm` key entirely to leave the target agent's own LLM config untouched.

## `toolServers` — MCP/tool server merge (additive)

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `toolServers` | object `{ name, servers: [...] }` | No | none | Container shape per `OctopusToolServersInfo`: optional `name`, plus a `servers` array. |
| `toolServers.servers[]` | array of server descriptors | No | `[]` | Each entry parsed via `McpServerInfo.FromJson` (raw JSON view also available as `McpServersJson`, reading the same `toolServers.servers` path). |

This is the **merge** side of the split: unlike `llm`, this is additive into the target agent's
existing tool set, never replacing it — canvas tool-role satellites are array-merged into this same
`toolServers` config key (`NodeConfigMergeTypeInfo.ForArray("toolServers")`).

## Team-member sub-agents (canvas-wired, not a `Configuration` key)

| Concept | Notes |
|---|---|
| Wiring | Sub-agents are **not** a JSON config field — they're wired as satellite/team-member nodes on the canvas (`SatellitePortKeys.TeamMember`), each carrying its own resolved config recursively (same shape as the host node, including its own `llm`/`toolServers`/prompts). |
| Merge behavior | `SubAgents` is the **merge** side of the split (`ProcessEngineAgentOverrideSource.GetRoutableSeedsFor`): canvas-wired team members are unioned into the router's routable set, never replacing DB-discovered sub-agents. |
| `SubAgentRef` shape | `AgentId` (int?, read from the satellite's merged config — checks `agentID` at top level, falling back to a nested `nodeFormValues.agentID`), `Name` (satellite node name), `Role` (`SatellitePortKeys.TeamMember`), `ConfigOverrides` (the satellite's full merged config as a dictionary). |
| Recursion | Each team-member's resolved config builds a full recursive `OctopusAiAgentBridgeOriginReader` (`SubAgentReaders`) — so a team member can itself have its own `llm`/`toolServers`/prompts/sub-agents, recursing indefinitely (the satellite gatherer already cycle-guards the tree). |

## `HasOverrides`

The reader exposes a convenience flag: `true` if any of `ExtraInstructions`, `McpServers`,
`ExtraData`, `SubAgents` are non-empty, or `LlmInfo` is configured and enabled. Consumers use this to
short-circuit override-application logic when the node carries no overrides at all.

## Example — LLM override + one MCP tool server

```json
{
  "resource": "message",
  "operation": "send",
  "agentID": 42,
  "message": "Look up the client's latest invoice status.",
  "llm": { "enabled": true, "provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3 },
  "toolServers": {
    "servers": [
      { "serverID": "invoicing-mcp", "type": "mcp", "description": "Invoicing lookups" }
    ]
  }
}
```

## Gotchas

- **`llm.enabled` defaults to `true` once the `llm` object is present at all** — including a
  near-empty `{"llm": {}}` will still attempt an override with all-null fields. Omit the `llm` key
  entirely rather than passing an empty object if you don't intend to override the target agent's LLM.
- Sub-agents/team-members cannot be expressed purely inside this node's own `Configuration` JSON — an
  agent authoring a workflow programmatically (e.g. via `save_workflow`) needs to also emit the
  satellite node + its `TeamMember`-role connection, not just set a config key.
- None of `llm`, `toolServers`, or sub-agent wiring appear in the DB `ConfigurationSchema` for
  `ai-agent` — see the schema-gap note in `00-index.md`.
