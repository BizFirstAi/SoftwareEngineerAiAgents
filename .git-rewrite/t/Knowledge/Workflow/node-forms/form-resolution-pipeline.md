# Form Resolution Pipeline

Verified 2026-09-20 (code read + live API calls).

## Call chain

```
Flow Studio designer (ConnectorConfigDialog.tsx)
  GET /api/v1/process-engine/node-forms/standard/GetNodeForms/{nodeSubUsage}/{processElementID}?includeSchema=false
      nodeSubUsage = DesignTime
  -> BaseNodeFormsController
  -> BaseNodeFormsService.GetFormsAsync
  -> INodeServerFactory.CreateAsync
        loads the executor + the 3-layer config
          Layer 1  Extension.Configuration
          Layer 2  Connector.Configuration        <- holds profileName
          Layer 3  ProcessElement.Configuration
  -> BaseNodeExecutor.GetNodeFormsAsync
        (BizFirst.Ai.ProcessEngine.Service\06_BaseNodeExecutor\Capabilities\BaseNodeExecutor.Forms.cs)
  -> NodeFormResolver
        (...\Services\Executor\Service\Base\Forms\NodeFormResolver.cs)
```

## Resolver tiers

Each tier does an **exact** match `Atlas_Forms.PrimaryUsage = 'node-form-' + <name>`
(`NodeFormConstants.PrimaryUsage.ForNodeType`, `IFormService.GetByPrimaryUsageAsync`). **An empty name skips the tier.**

| Tier | Name source | Typical result |
|---|---|---|
| Settings | in-memory settings on the executor | usually nothing |
| Avatar | avatar name | usually nothing |
| **Profile** | config key `profileName` (`BaseNodeExecutorSettings.ProfileDesignFormCatalog`, line ~114) | the operation form |
| NodeType | `nodeTypeDesignFormCatalog` or `ProcessElementTypeCode` | `node-form-<nodeType>` if such a row exists |
| Common | fixed | 24 common forms, `PrimaryUsage = node-form-common` |

## Why operation forms need the Profile tier

Per-operation forms are stored as `PrimaryUsage = node-form-<node>-<resource>-<operation>`, `NodeUsage = PrimaryConfigPage`,
`NodeSubUsage = DesignTime`, `FormCode` like `SQLSERVER_QUERY_EXECUTE`. There is **no** `node-form-<nodeType>` row for these
nodes, so the NodeType tier finds nothing. Only a node whose connector config has
`profileName = <PrimaryUsage minus 'node-form-'>` gets its operation form.

## Reading the result (diagnostic evidence)

The response contains `resolutionSummary.formsBySource`, counts per tier:

| Observation | Meaning |
|---|---|
| `Tier (Common): 24` only | No profile/nodeType form resolved: the node has no (or non-matching) profileName |
| plus `Tier (Profile): 1` | The profileName matched exactly one form. **Check it is the RIGHT one.** |
| Profile form for another operation | Stale profileName on the connector (Odoo/Apify nodes built via MCP showed `odoo-custom-delete` / `apify-key-value-store-get-record`) |

## Frontend side

`ConnectorConfigDialog.tsx` (~line 395) calls `getNodeFormsBySubUsage`, sorts by `displayOrder`, uses the first form as the
schema and the rest as tabs. It **does not select by resource/operation**: the server-side profile match is the only
selector. `workflowStore.ts` (~lines 274-320) merges the template's default connector config into the node's connector
config on save (template found by `designer.ui.dataTemplateID`, else by node type code).

## Cache note

`NodeFormResolver` caches per-usage form sets for 24 h in `IMemoryCache`; the cache-hit return is commented out in the code
read on 2026-09-20 so it refetches every time (unverified whether that is still true: re-read the file). See `caching-layers.md`.
