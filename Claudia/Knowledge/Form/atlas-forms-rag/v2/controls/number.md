# `number`

Native numeric input; emits a JS `number` (`e.target.valueAsNumber`), not a string.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `min` | `validation.min` | number | — | Also sets the native `min` attribute. |
| `max` | `validation.max` | number | — | Also sets the native `max` attribute. |
| `step` | `config.step` | number \| `'any'` | `'any'` | Increment granularity, e.g. `1` for integers, `0.01` for currency. |

## Example

```json
{ "id": "quantity", "type": "number", "label": "Quantity", "order": 3, "required": true,
  "defaultValue": 1, "validation": { "required": true, "min": 1, "max": 999 },
  "config": { "step": 1 } }
```
