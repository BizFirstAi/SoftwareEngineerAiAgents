Type: `grid`
Category: Layout Controls
Common properties: see `01-common-properties.md`. Value emitted to the form is always `Array<Record<string, unknown>>` (one object per row).

Config-driven interactive data grid — add/delete/edit/import/export. This is the primary/most-complete repeating-row control; prefer it over `editable-grid`/`display-grid`/`table`/`data-table` unless the target app specifically wires those alternates. Source: `packages/player-components-react/src/controls/inputs/GridControl/`.

## `config` (GridConfig)

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `columns` | GridColumn[] | Yes (practically) | `[]` | see below |
| `title` | string | No | — | table `aria-label` |
| `gridType` | `"table"` \| `"card"` \| `"list"` | No | — | declared but only `table` is rendered today |
| `idField` | string | No | — | column key used as each row's stable identifier on export/serialize |
| `pageSize` | number | No | — | pagination page size; pagination only activates if `features.pagination` is also `true` |
| `emptyMessage` | string | No | `"No rows yet."` | shown when 0 rows |
| `editFormID` | number \| null | No | `null` | Atlas Form ID opened in a modal to edit a row; omit to use the built-in inline modal |
| `bulkEditEnabled` | boolean | No | `false` | when `true`, every non-computed/non-selector cell is inline-editable |
| `tableClass` | string | No | — | extra CSS class on the outer wrapper |
| `altRowClass` | string | No | — | CSS class applied to every other row |
| `newEntityTemplate` | object | No | `{}` | default field values for a row created via the `add` button |
| `buttons` | GridButton[] | No | `[]` | toolbar buttons, see below |
| `features` | GridFeatures | No | `{}` | `{ reorder?, pagination?, exportFormats?: ("json"\|"csv")[], importFormats?: ("json"\|"csv")[] }` |
| `dataBinding` | object | No | — | `{ source?: "static" }` — only `"static"` is implemented |

### `GridColumn` (each entry in `config.columns`)

| Property | Type | Required | Notes |
|---|---|---|---|
| `key` | string | Yes | row field name (accepts `id` as an alias, normalized to `key`) |
| `label` | string | Yes | header text |
| `type` | `"text"` \| `"number"` \| `"date"` \| `"select"` \| `"toggle"` \| `"computed"` \| `"selector"` \| `"css-class"` \| `"link"` | No | default `"text"` |
| `width` | number | No | column width |
| `required` | boolean | No | shows a `*` in the header |
| `placeholder` | string | No | inline-edit placeholder |
| `default` | any | No | default cell value for new rows |
| `columnCss` | string | No | static class on every `<td>` |
| `cellClassExpr` | string | No | JS expression `(value, row) => string` for a dynamic per-cell class |
| `min` / `max` / `step` | number | No | for `type: "number"` |
| `options` | `{value, label}[]` | No | required for `type: "select"` |
| `selectorType` | `"checkbox"` \| `"radio"` | No | only for the one `type: "selector"` column; radio makes the grid single-select |
| `compute` | string | No | JS expression `row => value`, required for `type: "computed"` |
| `renderer` | string | No | named renderer for computed columns; only `"statusBadge"` exists today |
| `validation` | `{minLength?, maxLength?, min?, max?, message?}` | No | per-cell validation, checked on blur |
| `dataBinding` | `{fieldPath?}` | No | dot-notation path into a nested row object |
| `link` | LinkColumnConfig | No | required for `type: "link"`, see below |

`LinkColumnConfig`: `{ label?, action?: {kind:"form", formId, params?, target?} | {kind:"url", urlTemplate, target?:"_blank"|"_self"} | {kind:"expression", expression} | {kind:"matrix", rules:[{label?,condition,action}], fallback}, showAs?: "button"|"link", variant?: "primary"|"secondary"|"ghost"|"danger", icon?, visible? }`. `label` supports `{{row.fieldName}}` interpolation.

### `GridButton` (each entry in `config.buttons`)

| Property | Type | Required | Notes |
|---|---|---|---|
| `label` | string | Yes | button text |
| `buttonAction` | `"add"` \| `"deleteSelected"` \| `"editSelected"` \| `"addQuickItems"` \| custom string | Yes | built-ins listed; any other string is delegated to a registered plugin handler |
| `icon` / `emoji` | string | No | `emoji` takes priority over `icon` |
| `requiresSelection` | boolean | No | disables the button until ≥1 row selected |
| `selectionLimit` | number | No | button only enabled when selection count exactly matches |
| `items` | object[] | No | inline row templates for `addQuickItems`, takes priority over `itemsPreset` |
| `itemsPreset` | string | No | name of a preset registered in `GridItemPresetsRegistry` |

`requiresSelection`/checkboxes auto-show even without an explicit `selector` column when any button sets `requiresSelection: true`.

## Minimal example

```json
{
  "id": "line_items",
  "type": "grid",
  "label": "Line Items",
  "order": 5,
  "config": {
    "idField": "sku",
    "columns": [
      { "key": "sku", "label": "SKU", "type": "text", "required": true },
      { "key": "qty", "label": "Qty", "type": "number", "min": 1, "default": 1 }
    ],
    "buttons": [
      { "label": "Add Row", "buttonAction": "add", "icon": "plus" },
      { "label": "Delete", "buttonAction": "deleteSelected", "requiresSelection": true }
    ]
  }
}
```

## Full example (selection, computed column, link column, export)

```json
{
  "id": "invoices",
  "type": "grid",
  "label": "Invoices",
  "order": 5,
  "config": {
    "idField": "invoiceId",
    "bulkEditEnabled": true,
    "emptyMessage": "No invoices yet.",
    "columns": [
      { "key": "sel", "type": "selector", "label": "", "selectorType": "checkbox" },
      { "key": "invoiceId", "label": "Invoice #", "type": "text", "required": true },
      { "key": "status", "label": "Status", "type": "select",
        "options": [ { "value": "open", "label": "Open" }, { "value": "paid", "label": "Paid" } ] },
      { "key": "amount", "label": "Amount", "type": "number", "min": 0, "step": 0.01 },
      { "key": "total", "label": "Total (w/ tax)", "type": "computed", "compute": "row => (row.amount || 0) * 1.08" },
      { "key": "open", "label": "", "type": "link",
        "link": { "label": "Open", "showAs": "button", "action": { "kind": "form", "formId": 4102 } } }
    ],
    "buttons": [
      { "label": "Add", "buttonAction": "add" },
      { "label": "Delete Selected", "buttonAction": "deleteSelected", "requiresSelection": true }
    ],
    "features": { "reorder": true, "pagination": true, "exportFormats": ["json", "csv"], "importFormats": ["json"] },
    "pageSize": 25
  }
}
```
