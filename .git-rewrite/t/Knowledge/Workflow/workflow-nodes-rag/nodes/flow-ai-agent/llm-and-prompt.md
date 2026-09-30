# `flow-ai-agent` — LLM & Prompt

Sub-feature of `flow-ai-agent` (see `00-index.md`). The core generation config needed for every
`agentType` — which LLM to call, and what to ask it. Source: `FlowAiAgentSettings.cs`, the
`─── LLM Configuration ───` and `─── Prompt ───` regions.

## LLM

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `llmProvider` | string, enum `openai`\|`anthropic`\|`azureOpenAI`\|`gemini`\|`groq`\|`ollama` | No | `"openai"` | |
| `llmModelId` | string | **Yes** | — | e.g. `"gpt-4o"`, `"claude-sonnet-4-6"`. `Validate()` fails if empty. |
| `llmCredentialID` | integer | **Yes** | — | Vault credential ID (`Credentials.ID`) holding the LLM API key — NOT the raw key. Resolved through `ReadCredentialValueByIdAsync` (alias `"primary-llm"`) before building `AgentRunRequest.ApiKey`. `Validate()` fails if null or ≤ 0. |
| `llmBaseUrl` | string | No | — | Base URL override, for Azure OpenAI / Groq / Ollama endpoints. |
| `temperature` | number, 0.0–2.0 | No | `0.7` | `Validate()` rejects values outside this range. |
| `maxTokens` | integer, ≥ 1 | No | provider default (unset) | Null/absent means no explicit cap is sent — the provider's own default applies. |

## Prompt

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `prompt` | string | **Yes** | — | The user's task/question. `Validate()` fails if empty. |
| `systemMessage` | string | No | — | System-level instructions for the agent. |

## Example

```json
{
  "agentType": "conversational",
  "llmProvider": "azureOpenAI",
  "llmModelId": "gpt-4o-mini",
  "llmCredentialID": 17,
  "llmBaseUrl": "https://my-azure-endpoint.openai.azure.com",
  "temperature": 0.5,
  "maxTokens": 800,
  "prompt": "Summarize the client's open support tickets.",
  "systemMessage": "You are a support operations assistant. Be brief and factual."
}
```

## Gotchas

- `llmCredentialID` is a vault credential ID, never a raw API key — see the security-fix note in
  `00-index.md`.
- `temperature` outside `0.0`–`2.0` and a missing/empty `llmModelId`, `llmCredentialID`, or `prompt`
  all fail `Validate()` — these are the only cross-field-independent required checks in this sub-set.
