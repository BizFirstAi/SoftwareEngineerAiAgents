# `parallel-fork`

Pure flow-control node that begins concurrent execution of every outgoing branch from this
node. It does **not** enumerate or configure the branches itself — the orchestrator detects
`Memory.IsParallelExecutionActive = true` (set by this node) and spawns one concurrent
execution task per outgoing connection drawn from this node in the workflow graph. Every lane
spawned this way must reconverge at a paired **`parallel-join`** node downstream, which reads
back `Memory.IsParallelExecutionActive` and merges lane outputs. Output ports
(`ParallelForkOutputPortMapping`): a single **`main`** port (all outgoing wires connect from
this one port — parallelism comes from having multiple wires out of `main`, not from multiple
named ports). ParallelFork cannot itself fail under normal conditions (any unhandled exception
is caught by the base executor). Requires no credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `failFast` | boolean | No | `false` | When `true`, the orchestrator aborts all remaining branches as soon as any one branch fails. Read via `ParallelForkNodeSettings.FailFast`; the flag is stored on settings but branch-abort behavior is implemented by the orchestrator, not this node. |
| `maxParallelism` | integer | No | `0` (unlimited — all branches start simultaneously via `Task.WhenAll`) | Throttles concurrent branch count to a positive value if set. Validation fails if negative. |
| `sourceDirectivePath` / `sourceDataRootPath` / `sourceDataLeafPath` | SmartPath triple | No | directive defaults to `memory` | Optional override for reading fork configuration from memory instead of the default location. Rarely needed — all settings are otherwise static config. |
| `targetDirectivePath` / `targetDataRootPath` | SmartPath pair | No | unset | Optional write-back location for fork metadata (`fork_id`, `lanes_initialized`) in addition to `OutputData`. |

All settings are optional — a bare `{}` config is valid; the node carries no required
configuration because the orchestrator drives the actual parallel lane spawning from the
node's outgoing graph connections, not from any config field here.

`OutputData` on the `main` port always contains `fork_id` (this node's element key) and
`lanes_initialized` (ISO-8601 UTC timestamp).

## Example

```json
{
  "failFast": false,
  "maxParallelism": 0
}
```

Throttled, fail-fast fork:

```json
{
  "failFast": true,
  "maxParallelism": 3
}
```

## Gotchas

- **DB schema gap — significant, on both config and ports.** `ConfigurationSchema` in `Process_ProcessElementTypes_ParallelFork.data.sql` declares a single required-looking field `BranchCount` (integer, minimum 2) — this field does not exist anywhere in `ParallelForkNodeSettings`. Branch count is never configured; it is implicit in how many wires you draw out of the node's `main` port. The real (optional) config keys are `failFast` and `maxParallelism`, both absent from the DB schema.
- **DB schema gap — output ports.** `OutputPortsSchema` for `parallel-fork` lists three named ports: `branch1`, `branch2`, `error`. The real executor registers exactly one output port, `main` (via `GetOrCreatePortSuccess()`, which aliases to `main`). There is no `branch1`/`branch2`/`error` port in the code — connecting to those DB-suggested port keys will not route anywhere. To fan out N branches, draw N separate wires from the single `main` port.
- This node has no true "fan-out count" config — adding/removing branches is done by editing the graph's connections, not a config field.
- `failFast`/`maxParallelism` only take effect through orchestrator-level branch scheduling; they have no observable effect on this node's own single-invocation behavior (it always returns `main` immediately after signaling `IsParallelExecutionActive = true`).
