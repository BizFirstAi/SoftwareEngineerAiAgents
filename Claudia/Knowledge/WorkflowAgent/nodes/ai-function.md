# `ai-function`

Invokes a single named tool/function on an Octopus tool server (MCP-style) directly from a workflow
— distinct from `ai-agent`, which invokes a whole conversational agent. Executor:
`AiFunctionNodeExecutor` (`BizFirst.Ai.ExecutionNodes.Octopus.OctopusAi.AiFunction.Executor`);
settings class: `OctopusAiFunctionNodeExecutorSettings` (resource/operation dispatch,
`resourceDefault = "action"`, `operationDefault = "execute"`). Output ports: `main` (success),
`error`. Parameter resolution priority (highest to lowest): `parameters` (static overrides) →
`parameterMappings` (dynamic bindings pulled from `InputData`) → the tool's own declared
`DefaultValue` on the server's `OctopusToolParamInfo`.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `functionName` | string | **Yes** | — | Name of the tool/function to invoke on the server. `Validate()` fails the node if empty. |
| `server` | object `{ url, transport, type, tools: [...] }` (`OctopusToolServerInfo`) | No (but needed to actually reach a server) | empty `OctopusToolServerInfo` if omitted | Connection details + declared tool schema for the server hosting `functionName`. Replaces an older flat `AgentId`/`InvocationStrategy` shape — do not use those. |
| `parameters` | object, arbitrary key/value | No | `{}` | Static argument overrides, always passed regardless of `InputData`. Highest priority — wins over `parameterMappings` and the tool's own default for the same key. |
| `parameterMappings` | object, string → string | No | `{}` | Dynamic bindings: parameter name → a path into `InputData` (JSONPath or a plain key) to pull the value from at execution time. |
| `validation` | object `{ enabled, onMissingRequired, requiredParameters }` | No | `enabled=true`; `onMissingRequired` unset (executor defaults to `fail` when unset) | Runtime parameter validation before the call is made. `requiredParameters` is a list of parameter names that must resolve to a non-null value from the priority chain above. |

## Example

```json
{
  "functionName": "get-employee-payroll-summary",
  "server": {
    "url": "https://octopus.internal/mcp/hr-tools",
    "transport": "http",
    "type": "mcp"
  },
  "parameters": { "companyID": "BF001" },
  "parameterMappings": { "employeeID": "input.empId" },
  "validation": { "enabled": true, "onMissingRequired": "fail", "requiredParameters": ["employeeID"] }
}
```

## Gotchas

- **DB schema gap (confirmed, severe — looks fabricated, not just stale):** the seeded
  `ConfigurationSchema` for `ai-function` (`Process_ProcessElementTypes_AI-Function.data.sql`) lists
  `FunctionID`, `FunctionName`, `Parameters`, `ModelProvider`, `MaxTokens`. Of these, only
  `FunctionName`/`Parameters` overlap in name with real fields (`functionName`/`parameters`) — and
  even those have the wrong casing (PascalCase vs. the real lowerCamelCase wire format) and, for
  `Parameters`, an implied top-level meaning the real field doesn't have (the real `parameters` is
  specifically *static overrides*, one part of a 3-tier priority system, not "the" parameters).
  `FunctionID`, `ModelProvider`, and `MaxTokens` do not exist anywhere in the real settings class —
  this node has no model/token-limit config of its own (that belongs to whichever LLM the target tool
  server itself uses, not this node). The schema is also missing `server` and `parameterMappings` and
  `validation` entirely — 3 of the 5 real fields, including the one genuinely complex one (`server`).
  Do not trust this DB column for `ai-function`.
- Don't confuse this with `ai-agent`: `ai-function` calls one tool/function directly with resolved
  parameters and gets a structured result back; `ai-agent` calls a whole conversational agent with a
  natural-language message and lets the agent itself decide which tools to call.
- `parameters` vs `parameterMappings` is a common mistake: a literal value (e.g. a hardcoded company
  ID) belongs in `parameters`; a value that should be pulled from the current workflow item at
  execution time belongs in `parameterMappings`, pointing at where to read it from `InputData`. Don't
  put a JSONPath expression string inside `parameters` expecting it to be evaluated — `parameters`
  values are passed through as literals.
