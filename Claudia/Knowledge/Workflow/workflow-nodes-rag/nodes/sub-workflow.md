# `sub-workflow`

Invokes another workflow (`ProcessThread`) by numeric ID as a child execution, running it
**inline and synchronously** — the parent node blocks until the child completes, there is no
fire-and-forget mode. All of the parent's currently-visible memory variables are automatically
inherited into the child's input (plus explicit `parent.output.*` / `parent.var.*` prefixed
copies for backward compatibility) — there is no manual input-mapping config. On success, every
variable and node-output the child produced is written back into the parent's memory prefixed
with `subworkflow.` (configurable — see `targetDataRootPath`) and also included in
`OutputData`. Output ports (`SubWorkflowOutputPortMapping`): **`main`** (child completed
successfully; outputs available as `subworkflow.*`) and **`error`** (child failed to resolve an
ID, had no definition, failed, was cancelled, or the nesting-depth guard tripped). Requires no
credentials (it invokes another internal workflow, not an external system).

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `subWorkflowId` | integer | Effectively required (see resolution order below) | none | Static `ProcessThread` ID of the child workflow to run. |
| `subWorkflowVersionId` | integer | No | `1` | Version of the child workflow definition to run. |
| `sourceDirectivePath` / `sourceDataRootPath` / `sourceDataLeafPath` | SmartPath triple | No | unset | If `sourceDataRootPath` is configured, resolves the child workflow ID at runtime via SmartPath, taking priority over everything else below. |
| `targetDirectivePath` / `targetDataRootPath` | SmartPath pair | No | unset (defaults to prefix `"subworkflow"`) | If `targetDataRootPath` is set, it replaces `"subworkflow"` as the prefix under which child outputs/variables are written back to parent memory, e.g. `targetDataRootPath: "invoiceRun"` → `invoiceRun.*`. |

**Resolution order for the child workflow ID at runtime** (`GetSubWorkflowId`), first match wins:
1. SmartPath-resolved value (only evaluated if `sourceDataRootPath` is configured).
2. `InputData["subWorkflowId"]` (i.e. a value flowing in from an upstream node).
3. `ParentMemory.Variables["subWorkflowId"]`.
4. The static `subWorkflowId` config value.
If none resolve to a positive integer, the node throws and routes to `error` with message
`"Sub-workflow ID not resolved. Provide 'subWorkflowId' in configuration, InputData, or memory variables."`

`subWorkflowVersionId` resolves the same way minus the SmartPath step (InputData → memory →
static config, default `1`).

## Example

```json
{
  "subWorkflowId": 42,
  "subWorkflowVersionId": 1
}
```

Runtime-resolved child ID with a custom output prefix:

```json
{
  "sourceDataRootPath": "targetWorkflowId",
  "targetDataRootPath": "invoiceRun"
}
```

## Gotchas

- **DB schema gap — significant.** `ConfigurationSchema` in `Process_ProcessElementTypes_SubWorkflow.data.sql` declares `WorkflowId` (string), `InputMapping` (object), and `WaitForCompletion` (boolean). None of these exist in the real settings class. The real field is `subWorkflowId` (integer, not a string), there is no manual `InputMapping` — the child automatically inherits every visible parent memory variable plus `parent.output.*`/`parent.var.*` — and there is no `WaitForCompletion` toggle: the node **always** waits inline for the child to finish; asynchronous/fire-and-forget sub-workflow execution is not supported by this node.
- **Nesting guard (important safety limit).** A static, process-wide nesting-depth counter (keyed by root execution ID) is incremented before each sub-workflow call and decremented after. Default max depth is 10 (`ProcessEngineOptions.MaxSubWorkflowNestingDepth`, overridable at the host level, not per-node). Exceeding it throws `InvalidOperationException` with error code `RUNTIME_NESTING_LIMIT` and routes to `error` — this is the primary protection against circular/self-referencing sub-workflow chains. A config-authoring agent building recursive or deeply chained sub-workflow graphs should budget for this ceiling; it cannot be raised from node config.
- The child ID must be a **positive integer** `ProcessThread` ID, not a workflow name/slug/GUID — despite the DB schema suggesting a string `WorkflowId`.
- If the resolved `subWorkflowId` has no corresponding `ProcessThread` definition, the node throws with error code `CFG_WORKFLOW_DEFINITION_NOT_FOUND` rather than silently no-op-ing.
- Output ports in the DB schema (`main`, `error`) are accurate — no gap there.
