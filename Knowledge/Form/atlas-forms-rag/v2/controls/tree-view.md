# `tree-view`

Read-only collapsible hierarchical tree display with optional per-node action buttons and
links (not a value picker — for that use `tree-select`). Data resolves from the control's
bound `value`, else `config.data`, else `defaultValue`. Max 500 rendered nodes (deeper data
is truncated with a warning banner); max 20 levels deep.

## Config

| Property | Type | Default | Notes |
|---|---|---|---|
| `data` | any | — | Tree data (array of nodes, or a single root node). Prefer binding `value` instead. |
| `idField` | string | `'id'` | Field read as each node's unique id. |
| `labelField` | string | `'name'` | Field read as each node's display label. |
| `descriptionField` | string | `'description'` | |
| `childrenField` | string | `'children'` | Field holding the nested child array. |
| `iconField` | string | — | Per-node custom icon field; omit to use built-in folder/file icons. |
| `showLines` | boolean | `true` | Connector lines. |
| `showIcons` | boolean | `true` | |
| `indentSize` | number | `20` | Px per depth level. |
| `maxHeight` | string (CSS) | — | Enables internal scrolling when set. |
| `defaultExpanded` | boolean \| number | `true` | `true` = all expanded, `false` = all collapsed, a number = expand nodes shallower than that depth. |
| `collapsible` | boolean | `true` | |
| `selectable` | boolean | `false` | Enables row selection (visual only unless paired with `fieldActions`). |
| `multiSelect` | boolean | `false` | Ctrl/Cmd/Shift-click multi-select, only when `selectable`. |
| `nodeActions` | `{id,label,actionType:'url'\|'form'\|'event',urlTemplate?,openIn?,formId?,formIdField?,eventName?}[]` | — | Per-node action buttons. `urlTemplate` supports `{{fieldName}}` interpolation from the node's raw data. |
| `nodeLinkUrlField` / `nodeLinkLabelField` / `nodeLinkOpenIn` | string / string / `'same-tab'|'new-tab'` | — | Renders a per-node link when the node's data has a URL at `nodeLinkUrlField`. |

## Example

```json
{ "id": "category_tree", "type": "tree-view", "label": "Categories", "order": 3,
  "config": { "labelField": "name", "childrenField": "children", "defaultExpanded": 1 },
  "defaultValue": [ { "id": "1", "name": "Electronics", "children": [
    { "id": "1a", "name": "Phones" } ] } ] }
```
