# `textarea`

Multi-line free text.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `rows` | `config.rows` | number | `4` | Visible text lines. |
| `maxLength` | `config.maxLength` | number | — | Falls back to `validation.maxLength`; prefer setting `validation.maxLength` directly (engine-enforced, not just attribute-enforced). |

## Example

```json
{ "id": "notes", "type": "textarea", "label": "Additional Notes", "order": 6,
  "placeholder": "Anything else we should know?",
  "validation": { "maxLength": 2000 }, "config": { "rows": 6 } }
```
