# `flow-ai-agent` — Loop Control & Memory

Sub-feature of `flow-ai-agent` (see `00-index.md`). Governs how many iterations an agent loop may run
and whether/how conversational state persists across invocations. Source: `FlowAiAgentSettings.cs`,
the `─── Loop Control ───` and `─── Memory ───` regions.

## Loop control

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `maxIterations` | integer, 1–50 | No | `10` | Maximum agent loop iterations. `Validate()` rejects values outside this range. |
| `returnIntermediateSteps` | boolean | No | `false` | Include per-iteration snapshots in the `items[]` output array. |

## Memory

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `memoryBackend` | string, enum `none`\|`postgres`\|`redis`\|`mongodb` | No | `"none"` | Where conversational memory is persisted. |
| `sessionId` | string | No | — | Wire key is lowercase `sessionId` (not `sessionID`) — an intentional exception to the repo's ID-casing convention, kept for backward wire compatibility. C# property is `SessionID`. |
| `conversationId` | string | No | — | Same casing exception as `sessionId`. C# property is `ConversationID`. |
| `memoryWindowSize` | integer | No | `10` | Number of past messages loaded from memory. |

## Example

```json
{
  "agentType": "conversational",
  "llmProvider": "anthropic",
  "llmModelId": "claude-sonnet-4-6",
  "llmCredentialID": 17,
  "prompt": "Continue helping the user reconcile this month's ledger.",
  "memoryBackend": "redis",
  "sessionId": "ledger-recon-2026-08",
  "memoryWindowSize": 20,
  "maxIterations": 15,
  "returnIntermediateSteps": true
}
```

## Gotchas

- `sessionId`/`conversationId` intentionally break the repo's `ID`-suffix casing convention at the
  wire-format level — a documented, deliberate backward-compatibility exception, not an inconsistency
  to "fix" when authoring config. Every other identifier field across `flow-ai-agent` and `ai-agent`
  uses the `ID`-suffix convention; these two are the sole confirmed exceptions.
- `maxIterations` outside `1`–`50` fails `Validate()` regardless of `agentType`.
- `memoryBackend: "none"` (the default) means `sessionId`/`conversationId`/`memoryWindowSize` are
  effectively inert — nothing persists to look them up against.
