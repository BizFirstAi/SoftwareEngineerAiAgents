Type: `table`
Category: Layout Controls — literal alias of `data-table`. Identical render path, identical `config` shape (`FormField.tsx`: `case 'data-table': case 'table':`). See `controls/data-table.md` for the full config table and examples — repeated here only as a pointer so retrieval by the exact type name `table` finds this file.
Common properties: see `01-common-properties.md`.

## Minimal example

```json
{ "id": "team_table", "type": "table", "label": "Team Members", "order": 1,
  "config": { "columns": [ { "key": "name", "label": "Name" } ], "data": [ { "name": "Alice" } ] } }
```
