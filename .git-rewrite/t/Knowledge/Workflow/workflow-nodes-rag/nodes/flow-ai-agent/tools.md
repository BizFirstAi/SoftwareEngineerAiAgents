# `flow-ai-agent` — Tools

Sub-feature of `flow-ai-agent` (see `00-index.md`). Only meaningful when `agentType` is `tools` or
`reAct` — the two strategies that run a function-calling/action loop. Source: `FlowAiAgentSettings.cs`,
the `─── Tools ───` region, and `GetEnabledToolNames()`.

## Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `enabledTools` | string — comma-separated, or a JSON array string | No | `""` (none) | Built-ins: `workflow`, `httpRequest`, `calculator`, `customCode`. Any other name resolves against the MCP tool registry. Parsed by `GetEnabledToolNames()`: if the trimmed value starts with `[`, parsed as a JSON string array; otherwise split on commas (empty entries trimmed and removed). |
| `toolWorkflowId` | string | No | — | Workflow ID the built-in `workflow` tool triggers. Wire key stays lowercase `toolWorkflowId` — the C# property is `ToolWorkflowID` per repo convention, but the JSON key is unchanged. |
| `toolWorkflowDescription` | string | No | — | Overrides the built-in default tool description shown to the LLM for the `workflow` tool. |
| `toolWorkflowBaseUrl` | string | Required if `workflow` tool enabled | — | Absolute base URL for the internal workflow-trigger API. |
| `toolHttpRequestAllowedDomains` | string, comma-separated | No | — | Domain allowlist for the built-in `httpRequest` tool. |

## Example

```json
{
  "agentType": "reAct",
  "llmProvider": "openai",
  "llmModelId": "gpt-4o",
  "llmCredentialID": 17,
  "prompt": "Trigger the monthly-close workflow and report its status.",
  "enabledTools": "[\"workflow\",\"httpRequest\"]",
  "toolWorkflowId": "monthly-close-v3",
  "toolWorkflowBaseUrl": "https://internal-api.bizfirst.local/workflows",
  "toolHttpRequestAllowedDomains": "internal-api.bizfirst.local"
}
```

## Gotchas

- Setting these fields for `agentType` values other than `tools`/`reAct` is harmless but inert — the
  execution strategy simply never reads them.
- `enabledTools` accepts two different wire shapes (comma-separated string or JSON-array string) —
  author whichever is more convenient; both are parsed identically downstream.
