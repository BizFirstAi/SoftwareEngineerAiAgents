# `flow-ai-agent` — SQL Agent (FA05)

Sub-feature of `flow-ai-agent` (see `00-index.md`). Only applies when `agentType: "sql"` — the
natural-language-to-SQL strategy. Source: `FlowAiAgentSettings.cs`, the `─── SQL Agent (FA05) ───`
region and the `agentType == "sql"` branch of `Validate()`.

## Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `sqlConnectionString` | string | Required when `agentType=sql` | — | `Validate()` fails if empty and `agentType` is `sql`. |
| `sqlProvider` | string, enum `postgres`\|`sqlserver` | No | `"postgres"` | |
| `sqlReadOnly` | boolean | No | `true` | Blocks any non-`SELECT` SQL the agent generates. |
| `sqlTopK` | integer, 1–1000 | No | `50` | Max rows returned per query; `Validate()` (when `agentType=sql`) rejects out-of-range values. |
| `sqlAllowedTables` | string, comma-separated | No | — (all tables) | Restricts which tables the agent may reference. |
| `sqlIncludeSchema` | boolean | No | `true` | Include DB schema info in the LLM prompt. |

## Example

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
  "sqlTopK": 100,
  "sqlAllowedTables": "PayrollRuns,Clients",
  "sqlIncludeSchema": true
}
```

## Gotchas

- `sqlConnectionString` is the only field in this group `Validate()` actively requires — but only
  conditionally, when `agentType == "sql"`. Setting `agentType` to anything else with these fields
  present is harmless but inert.
- `sqlTopK` outside `1`–`1000` fails `Validate()`, but **only** when `agentType` is `sql` — the range
  check itself is inside the `agentType == "sql"` branch, not global.
- `sqlReadOnly` defaulting to `true` is a safety default — an author must explicitly set it `false` to
  allow non-`SELECT` statements.
