# `data-table` / `table`

Read-only tabular display (not editable — for an editable/interactive grid, use
`controls/grid.md` instead). `table` is a literal alias of `data-table`: identical render
path, same config.

Source: `FormField.tsx` (`case 'data-table': case 'table':`).

## Config

| Property | Type | Notes |
|---|---|---|
| `data` | object[] | Row data. Falls back to the control's bound `value` if omitted, and to built-in sample data if neither is present — always supply `data` explicitly. |
| `columns` | `{key, label?}[]` | Falls back to inferring columns from the keys of the first row if omitted. Always supply explicitly for predictable output. |

No pagination/sort/filter config exists — those controls in the rendered UI are visual
only (no `config` keys drive them). Cell values matching `"active"`/`"inactive"`
(case-insensitive) render as a colored status badge automatically; no config needed.

## Example

```json
{
  "id": "users_table",
  "type": "data-table",
  "label": "Team Members",
  "order": 3,
  "config": {
    "columns": [
      { "key": "name", "label": "Name" },
      { "key": "role", "label": "Role" },
      { "key": "status", "label": "Status" }
    ],
    "data": [
      { "name": "Alice Johnson", "role": "Admin", "status": "Active" },
      { "name": "Bob Smith", "role": "Editor", "status": "Inactive" }
    ]
  }
}
```
