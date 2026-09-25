# `cascading-select`

Linked chain of dropdowns where each level filters the next (e.g. Country → State → City).
Value is an array, one entry per level, in level order. Supports two independent data
shapes — use exactly one:

## Config — nested-tree shape

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `CascadeNode[]` | `CascadeNode = { value?, id?, label, children?: CascadeNode[] }`. Each level derives from the previous level's selection. |
| `levelLabels` | `config.levelLabels` | string[] | Header label per level, e.g. `["Country", "State"]`. |

## Config — flat-levels shape (alternative to nested-tree)

| Property | Location | Type | Notes |
|---|---|---|---|
| `levels` | `config.levels` | `{ id, label, parentId? }[]` | One entry per dropdown level; `parentId` links a level to its parent level's `id`. |
| `dataSource` | `config.dataSource` | `Record<string, {id,label}[]>` | Keyed by `"${parentId}:${parentSelectedValue}"` for child levels, or by the level's own `id` for a root level. |

## Example (nested-tree shape)

```json
{ "id": "region", "type": "cascading-select", "label": "Region", "order": 4,
  "config": { "levelLabels": ["Country", "State"], "options": [
    { "value": "US", "label": "United States", "children": [
      { "value": "CA", "label": "California" }, { "value": "TX", "label": "Texas" }
    ] }
  ] } }
```
