# `tree-select`

Single-value select from hierarchical data — a dropdown that expands/collapses nested
children; clicking any node (leaf or branch) selects it.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `TreeNode[]` | Primary source. `TreeNode = { value: string, label: string, children?: TreeNode[] }`. |
| `dataSource` | `config.dataSource` | `TreeNode[]` | Alternate key name — read only if `options` is absent. Prefer `options`. |

## Example

```json
{ "id": "department", "type": "tree-select", "label": "Department", "order": 3,
  "config": { "options": [
    { "value": "eng", "label": "Engineering", "children": [
      { "value": "eng-fe", "label": "Frontend" },
      { "value": "eng-be", "label": "Backend" }
    ] },
    { "value": "sales", "label": "Sales" }
  ] } }
```
