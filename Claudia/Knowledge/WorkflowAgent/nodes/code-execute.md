# `code-execute`

Runs an inline script through the shared expression orchestrator and returns its result. Use
it for small transforms/computations that don't warrant a dedicated node (e.g. reshaping data,
computing a derived value) — not for long-running or I/O-heavy logic, since the script runs
inside a sandboxed, timeout-limited engine. The script receives the full current execution
context (input data, memory variables) via the expression evaluation context; it must produce
a result (assigned to a variable named `result` in JavaScript mode). Output ports
(`CodeExecuteOutputPortMapping`): **`main`** (script ran to completion; result in
`OutputData["result"]`) and **`error`** (missing script, exception, or timeout). Requires no
credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `script` | string | Yes | none | The code to run. Validation fails with `"code-execute node requires a non-empty 'script' configuration value."` if blank. In JavaScript mode, must assign its output to a variable named `result`, e.g. `"var result = input * 2;"`. |
| `language` | string enum: `javascript` (default), `cs`, `vb`, `python` | No | `javascript` | Read by the shared `ScriptLanguageInfo` helper (`ScriptNodeExecutorBase`), not by `CodeExecuteNodeSettings` itself. Only JavaScript (via the Jint engine) is confirmed wired end-to-end in this codebase — see Gotchas. |
| `isExpression` | boolean | No | `false` | `false` (default): `script` is a bare script body, automatically wrapped as `{%language:script%}` before evaluation. `true`: `script` is already a full `{%language:...%}` directive string and is passed through unchanged. |
| `targetDataRootPath` | string | No | unset | If set, the script's raw result is additionally written to this memory variable via `Memory.SetVariable`. The result is *always* available on the success port as `OutputData["result"]` regardless of this setting. |

## Example

```json
{
  "script": "var result = input.price * input.quantity;",
  "language": "javascript",
  "isExpression": false
}
```

Writing the result to a named memory variable for downstream nodes:

```json
{
  "script": "var result = items.filter(i => i.active).length;",
  "targetDataRootPath": "activeCount"
}
```

## Gotchas

- **`timeout` is not a real config key — it is silently ignored.** Team documentation (`Docs/Website/design.html` under this node's folder) describes a `timeout` (int, seconds) config field, but `CodeExecuteNodeSettings` has no `Timeout` property and nothing reads a `"timeout"` key from config. The actual execution time limit is fixed by the JavaScript engine's isolation mode (`JintSecurityConfiguration`): **5 seconds / 10 MB** for the default "high isolation" (uncertified) engine, or **30 seconds / 50 MB** for a "low isolation" engine granted to certified scripts via a separate node-certification service — neither is controllable from this node's `Configuration` JSON. Do not author a `timeout` field expecting it to change the limit.
- **Sandboxing is real and restrictive in the default (high-isolation) mode**: no file system, no network, no process spawning, no reflection; only `Math`, `String`, `Array`, `Object`, `JSON`, `Date` are exposed. Scripts attempting I/O or requiring other globals will fail or throw inside the sandbox.
- **`language` values beyond `javascript` should be treated with caution.** `ScriptLanguageInfo.Languages` structurally defines `cs`/`vb`/`python` as valid strings, but this node type's own description (both in code comments and the DB seed row) is "Runs an inline JavaScript snippet via Jint" — the concretely verified, production execution path is JavaScript through Jint. Don't assume `cs`/`vb`/`python` are fully supported without separately verifying the specific `IExpressionOrchestrator` implementation in use.
- **DB schema gap.** `ConfigurationSchema` in `Process_ProcessElementTypes_CodeExecute.data.sql` is an empty stub — `{"type":"object","properties":{}}` — documenting none of `script`, `language`, `isExpression`, or `targetDataRootPath`. Output ports in the DB schema (`main`, `error`) are accurate.
- The `result` produced by the script is duplicated into the node's output in two shapes: a flat `OutputData["result"]` (what downstream nodes reading `InputData["result"]` will see, and what `targetDataRootPath` writes) and a richer per-item record `{ result, language, timestamp }` wrapped into the standard `items` array — don't be confused if you see the value appear twice in the raw output.
