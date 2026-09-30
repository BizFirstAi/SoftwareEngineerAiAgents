# `manual-trigger`

Entry-point node that starts a workflow on demand — either an explicit API call to
`POST /api/process-engine/execute` or a "Run" action from the Flow Studio editor. It performs no
transformation: whatever `InputData` the run was started with is forwarded unchanged to the next
node via the `main` output port. This is the only trigger node type that **cannot fail** — every
code path (including unexpected exceptions) is caught internally and converted into a success
result on `main`, so there is no `error` port. Requires no credentials.

Node type code: `manual-trigger` (matches DB `Process_ProcessElementTypes.Code` and the executor's
`ProcessElementTypeCode`).

Output ports: `main` only.

## Config

`ManualTriggerNodeSettings` defines no fields of its own — `Validate()` always returns `null`
(nothing is required). The only readable keys are the generic scope-binding fields every
`BaseNodeExecutorSettings` subclass inherits, and they are optional and rarely set on this node:

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `sourceDirectivePath` | string | No | `"input"` | One of `input`, `memory`, `nodeOutput`, `dataStateMachine`, `output`, `localMemory`, `cache`. Where to read the trigger payload from instead of the run's raw `InputData`. |
| `sourceDataRootPath` | string | No | `"items"` | Root variable/key name within the source directive. |
| `sourceDataLeafPath` | string | No | (none) | Dot-notation path within the root. |
| `targetDirectivePath` | string | No | (none — no write-back) | Where to write the resolved trigger payload back to (e.g. `memory`, `nodeOutput`). |
| `targetDataRootPath` | string | No | (none) | Variable/key name to write to. |
| `targetDataLeafPath` | string | No | (none) | Dot-notation path within the root. |

## Example

The typical, and fully valid, configuration is empty:

```json
{ "type": "manual-trigger", "configuration": {} }
```

Overriding the source payload location (rare) looks like:

```json
{
  "type": "manual-trigger",
  "configuration": {
    "sourceDirectivePath": "memory",
    "sourceDataRootPath": "seedPayload"
  }
}
```

## Gotchas

- DB schema gap: none of consequence. `ConfigurationSchema` in the seed
  (`Process_ProcessElementTypes_ManualTrigger.data.sql`) is `{"type":"object","properties":{}}`,
  which correctly reflects that the node has zero required fields. It just doesn't document the
  optional generic `source*`/`target*` scope keys shown above — those are shared by every trigger
  node and aren't node-specific.
- The node cannot fail. `ExecuteInternalAsync` catches `OperationCanceledException`,
  `InvalidOperationException`, and every other `Exception` and returns `SetResultAsSuccess(...)`
  on the `main` port in all three cases. Do not design downstream error-handling paths expecting
  this node to ever route to an error port — it has none.
- Output data keys written are `timestamp`, `triggerTime`, `resource` (`"trigger"`), `operation`
  (`"manual-trigger"`), `status` (`"success"`), `portName`, plus the standard `items` array
  wrapping the forwarded payload. Note the key is `triggerTime` (camelCase), not the snake_case
  `trigger_time` used by `webhook-trigger` and `scheduled-trigger`.
