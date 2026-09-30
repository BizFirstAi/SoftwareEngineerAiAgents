# `loop`

Iterates over a collection and routes each item to the loop body branch, then routes once
more to the completion branch when the collection is exhausted. Use it whenever a portion of
the workflow must run once per element of an array (e.g. "for each invoice, send a reminder").
By default the node runs in **external loop** mode: the orchestrator re-invokes this node once
per item (so the execution stack — and therefore pause/resume — is preserved across
iterations), and the node itself never calls the body nodes directly. Output ports (see
`ExecutionConstants.LoopPorts` and `LoopNodeExecutor`): the iteration port key is **`main`**
(carries the current item — connect the loop-body subgraph here) and the completion port key
is **`done`** (fires once, after the last item, with no more items to process — connect
whatever should run after the loop here). There is no dedicated `error` output port key wired
by this node's `ValidateExecutorSettings` (it is intentionally empty — the base
`ExecuteInternalAsync` catch block still returns `ExecutionConstants.OutputPorts.Error` =
`"error"` on an unhandled exception, but no port is pre-registered for it). Requires no
credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `sourceDirectivePath` | string enum: `input`, `memory`, `nodeOutput`, `dataStateMachine`, `output`, `localMemory`, `cache` | No | `input` | Where the collection lives. With the default `input` + `sourceDataRootPath: "items"`, the loop uses the fast built-in `ObjectQualifier` path instead of a generic SmartPath resolve (see Gotchas). |
| `sourceDataRootPath` | string | Effectively required | `"items"` | Top-level key (under the chosen directive) that holds the array. Validation fails with `"sourceDataRootPath is required..."` if this resolves empty after defaulting. |
| `sourceDataLeafPath` | string | No | none | Optional nested path/array-index expression inside the root value, e.g. `data.items`, `results[]`. |
| `isExternalLoop` | boolean | No | `true` | `true`: orchestrator-driven multi-invocation loop (see description). `false`: single invocation — the node resolves the whole list once and hands it to the framework's internal `ExecuteItemsAsync` iterator instead of routing through the `main`/`done` ports per item. |
| `supportsItemIteration` | boolean | No | `true` | Loop always supports per-item iteration; only relevant if you are deliberately disabling it. |
| `isInputArray` | boolean | No | `false` | Base-class flag, rarely set on Loop directly. |

The collection is materialized via `ConvertCollectionToList` — arrays/`IEnumerable` are
flattened item-by-item, a bare string is treated as a single scalar item (not split into
characters), and any other scalar becomes a single-item list.

Each iteration writes onto the item's `OutputData`: `items` (a one-element list containing the
current item), `currentItem`, and `currentIndex` (0-based). On completion (`done`), `OutputData`
contains `itemCount`, `processedCount`, `interruptedByBreak` (bool), and `loopStatus`
(`"completed"`, `"interrupted"`, or `"empty"`).

## Example

```json
{
  "sourceDirectivePath": "input",
  "sourceDataRootPath": "items",
  "isExternalLoop": true
}
```

Sourcing from a named memory variable instead of `input.items`:

```json
{
  "sourceDirectivePath": "memory",
  "sourceDataRootPath": "customerList",
  "sourceDataLeafPath": "records"
}
```

## Gotchas

- **The iteration output port key is `main`, not `body`.** `LoopNodeExecutor.ExecutionInfo.OutputPorts` (in `LoopNodeExecutor.ExecutionInfo.cs`) defines `Body = "body"`, `Done = "done"`, `Error = "error"` constants, but nothing in the executor ever uses `OutputPorts.Body` — the real per-iteration port comes from the base class's `GetLoopIterationPortKey()`, which returns `ExecutionConstants.LoopPorts.Iteration = "main"`. Treat the `LoopNodeExecutor.ExecutionInfo` class as dead/aspirational code; wire loop-body connections to port `main`.
- **DB schema gap:** `Process_ProcessElementTypes.ConfigurationSchema` for `loop` is a bare stub — `{"type":"object","properties":{}}` — it documents no fields at all. Worse, `OutputPortsSchema` in the seed data (`Process_ProcessElementTypes_Loop.data.sql`) lists port keys `"loop"` and `"done"`, but the real iteration port emitted by the executor is `"main"` (see above), not `"loop"`. A config-authoring agent that trusts the DB port schema will wire the wrong port.
- `sourceDataRootPath` is validated as "required" but has a non-empty default (`"items"` under `input`), so a bare `{}` config is actually valid — don't add a redundant default value.
- When `sourceDirectivePath`/`sourceDataRootPath` resolve to exactly `input` + `items` with no leaf path, the executor takes a different internal code path (`ObjectQualifier`-based `$`/`item.*` expression access) than any custom path — functionally equivalent for iteration purposes, but relevant if you're debugging expression evaluation inside the loop body.
- `isExternalLoop: false` changes the wiring model entirely: items are NOT delivered one at a time to a `main` port; instead the whole list is returned in one `OutputData["items"]` and the *framework's* generic per-item iteration (`ExecuteItemsAsync`, shared by any node with `supportsItemIteration`) takes over. Don't mix expectations from the two modes.
- `Break`/`Continue` signals raised by nodes inside the loop body are detected each re-invocation; a `Break` short-circuits straight to `done` with `interruptedByBreak: true` and `loopStatus: "interrupted"`, skipping remaining items.
