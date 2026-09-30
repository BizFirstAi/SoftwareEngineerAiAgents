# `parallel-join`

Synchronization point that waits for the concurrent branches spawned by a paired
**`parallel-fork`** node to complete, then merges their outputs into a single sequential
continuation. Reads lane completion status and lane outputs exclusively from
`ExecutionMemory` (`GetParallelLaneStatus()`, `GetParallelLaneOutputs()`) — it does not enumerate
branches from its own config. On execution it sets `Memory.IsParallelExecutionActive = false`,
ending parallel mode for the thread. Output ports (`ParallelJoinOutputPortMapping`): **`main`**
(join succeeded — even if not all lanes reported complete, which only logs a warning, it does
not fail the node) and **`error`** (an exception occurred while joining). Requires no
credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `sourceDirectivePath` / `sourceDataRootPath` / `sourceDataLeafPath` | SmartPath triple | No | unset — reads directly from `ExecutionMemory.GetParallelLaneOutputs()` | If `sourceDataRootPath` is set, the node instead tries `Memory.GetVariable(sourceDataRootPath)` and expects a `Dictionary<string, Dictionary<string, object>>` of lane outputs; if that resolution fails or the type doesn't match, it logs a warning and falls back to the ExecutionMemory default. |
| `targetDirectivePath` / `targetDataRootPath` | SmartPath pair | No | unset (no write-back) | If `targetDataRootPath` is set, the merged join output (`joinId`, `lanes_completed`, lane count, `lane_outputs`) is additionally written to that memory variable via `Memory.SetVariable`. |

**`parallel-join` has no other configuration keys.** It is designed to carry zero required
config — all join behavior is driven by `ExecutionMemory` state left behind by the paired
`parallel-fork` node and the lanes that ran between them.

`OutputData` on the `main` port contains: `join_id` (this node's element key),
`lanes_completed` (ISO-8601 UTC timestamp), `lane_count` (int), and `lane_outputs` (dictionary
keyed `lane_{originalLaneKey}` → that lane's output).

## Example

```json
{}
```

With optional scope-based lane sourcing/write-back:

```json
{
  "sourceDataRootPath": "customLaneBucket",
  "targetDataRootPath": "joinResult"
}
```

## Gotchas

- **DB schema gap — configuration.** `ConfigurationSchema` in `Process_ProcessElementTypes_ParallelJoin.data.sql` declares a `JoinStrategy` enum field (`waitAll`/`waitAny`/`waitFirst`). This field does not exist anywhere in `ParallelJoinNodeSettings` or the executor — there is no join-strategy switch in the real implementation. The node always attempts to join whatever lanes are present in `ExecutionMemory` and only logs a warning (does not branch behavior) if `all_complete` is false. Do not author a `JoinStrategy` field; it will be silently ignored.
- **DB schema gap — input ports, partially.** `InputPortsSchema` for `parallel-join` hard-codes exactly two named input ports, `branch1` and `branch2`. The real join does not read from named input ports at all — it pulls lane outputs from `ExecutionMemory` regardless of how many upstream branches actually connect to it or what they're named. Treat the DB's fixed 2-branch input port list as illustrative UI wiring only, not an implementation constraint; joins with more or fewer than two incoming lanes are handled the same way.
- **DB schema is accurate for output ports** (`main`, `error`) — matches `ParallelJoinOutputPortMapping` exactly; no gap there.
- A "partial join" (not all lanes reporting `all_complete`) does not fail the node — it only logs a warning and proceeds. If your workflow requires strict all-lanes-complete semantics, that must be enforced elsewhere (e.g. in the fork's `failFast`), not by this node.
