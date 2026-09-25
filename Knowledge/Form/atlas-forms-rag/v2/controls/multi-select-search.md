# `multi-select-search`

Searchable multi-select: type to filter, click to add as a chip, backspace on empty search
removes the last chip. Value is an array of `option.value` strings.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `{ value?, id?, label }[]` | Accepts either `value` or `id` as the option key (normalized to `value` internally). |

## Example

```json
{ "id": "assignees", "type": "multi-select-search", "label": "Assignees", "order": 5,
  "config": { "options": [
    { "value": "u1", "label": "Alice Johnson" },
    { "value": "u2", "label": "Bob Smith" }
  ] } }
```
