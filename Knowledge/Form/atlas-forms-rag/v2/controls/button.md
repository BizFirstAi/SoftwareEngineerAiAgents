# `button`

An inline, non-value action trigger inside the field grid (distinct from the form-level
Save/Reset buttons — those live in `schema.apiActions`/form actions, not as a `button`
control). Clicking it fires `onButtonClick(control.id, formValues)` in the host app and also
sets this control's own value to `true`.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `label` | `config.label` | string | Falls back to `control.label`, then `'Click'`. |

## Example

```json
{ "id": "recalculate_btn", "type": "button", "order": 8,
  "config": { "label": "Recalculate Total" } }
```
