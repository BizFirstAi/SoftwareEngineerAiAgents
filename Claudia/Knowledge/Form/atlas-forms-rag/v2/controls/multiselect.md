# `multiselect`

Multiple-value select rendered as a tag/chip picker (click to open a dropdown of
not-yet-selected options, click a chip's × to remove). Value is always an array of
`option.value` strings.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `{ value: string, label: string }[]` | Static list. Same "no API shorthand" caveat as `select`. |

## Example

```json
{ "id": "tags", "type": "multiselect", "label": "Categories", "order": 5,
  "config": { "options": [
    { "value": "sales", "label": "Sales" },
    { "value": "support", "label": "Support" },
    { "value": "billing", "label": "Billing" }
  ] } }
```
