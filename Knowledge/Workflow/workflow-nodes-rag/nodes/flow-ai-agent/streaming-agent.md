# `flow-ai-agent` — Streaming Agent (FA06)

Sub-feature of `flow-ai-agent` (see `00-index.md`). Only applies when `agentType: "stream"`. Source:
`FlowAiAgentSettings.cs`, the `─── Streaming Agent (FA06) ───` region.

## Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `streamCallbackUrl` | string | No | — | URL to POST streaming text chunks to. The node still returns full output on `main` either way — this is an additional side-channel, not a replacement for the normal output port. |
| `streamIncludeToolEvents` | boolean | No | `false` | Include tool-call events in the stream callback. |
| `streamIncludeTokens` | boolean | No | `false` | Include token usage in the final stream callback event. |

## Example

```json
{
  "agentType": "stream",
  "llmProvider": "anthropic",
  "llmModelId": "claude-sonnet-4-6",
  "llmCredentialID": 17,
  "prompt": "Draft a live status update for the current batch run.",
  "streamCallbackUrl": "https://internal-api.bizfirst.local/hooks/stream-status",
  "streamIncludeToolEvents": true,
  "streamIncludeTokens": true
}
```

## Gotchas

- `streamCallbackUrl` is optional even for `agentType: "stream"` — omitting it means no streaming
  side-channel is used, but the node still runs the streaming strategy internally and returns full
  output on `main` as normal.
- Setting these fields for any other `agentType` is harmless but inert.
