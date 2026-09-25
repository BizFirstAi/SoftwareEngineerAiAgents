# `org-chart`

Card-based organization chart with collapsible subtrees. Data resolves from bound `value`,
else `config.data`, else `defaultValue`. Max 15 levels deep.

## Config

| Property | Type | Default | Notes |
|---|---|---|---|
| `data` | any | — | Root node (single object with nested children), prefer binding `value` instead. |
| `idField` / `nameField` / `titleField` / `descriptionField` / `childrenField` / `avatarField` / `colorField` | string | `id`/`name`/`title`/`description`/`children`/`avatar`/`color` | Field-name mappings into your data shape. `colorField` value must start with `#` or the default accent is used. |
| `layout` | `'vertical' \| 'horizontal'` | `'vertical'` | Top-down vs left-right. |
| `cardStyle` | `'detailed' \| 'compact' \| 'minimal'` | `'detailed'` | `minimal` hides avatar; only `detailed` shows description. |
| `showDescription` | boolean | `true` | Only takes effect when `cardStyle: 'detailed'`. |
| `showAvatar` | boolean | `true` | Falls back to initials-in-circle when no `avatarField` image URL. |
| `connectorColor` | string (CSS color) | `'#94a3b8'` | |
| `cardMinWidth` / `cardMaxWidth` | number (px) | `180` / `240` | |
| `collapsible` | boolean | `true` | |
| `defaultExpanded` | boolean \| number | `true` | Same semantics as `tree-view`. |
| `nodeActions` | same shape as `tree-view`'s `nodeActions` | — | |
| `nodeLinkUrlField` / `nodeLinkLabelField` / `nodeLinkOpenIn` | string / string / `'same-tab'|'new-tab'` | — | |

## Example

```json
{ "id": "reporting_chart", "type": "org-chart", "label": "Reporting Structure", "order": 2,
  "config": { "layout": "vertical", "cardStyle": "compact" },
  "defaultValue": { "id": "1", "name": "Jane Doe", "title": "CEO", "children": [
    { "id": "2", "name": "John Smith", "title": "CTO" } ] } }
```
