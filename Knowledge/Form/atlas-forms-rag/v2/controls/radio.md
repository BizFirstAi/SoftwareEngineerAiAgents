# `radio`

Single-value radio button group, all options visible at once (no dropdown). Use `select`
instead when the option list is long or screen space is tight.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `{ value: string, label: string }[]` | Required for a usable control — an empty/missing list renders "No options configured". |

## Example

```json
{ "id": "priority", "type": "radio", "label": "Priority", "order": 2, "required": true,
  "validation": { "required": true },
  "config": { "options": [
    { "value": "low", "label": "Low" },
    { "value": "medium", "label": "Medium" },
    { "value": "high", "label": "High" }
  ] } }
```
