Type: `text`
Category: Input Controls
Common properties: see `01-common-properties.md`. Renders `<input type="text">`.

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `maxLength` | number | No | — | overrides `validation.maxLength` for the HTML attribute only; set `validation.maxLength` too if you want it enforced by the engine |
| `autoComplete` | string | No | — | HTML `autocomplete` value |
| `expressionBuilder` | `{enabled: boolean}` | No | `{enabled:false}` | when `true`, adds an "Edit with Expression Builder" trigger beside the field — opt-in only, leave unset for a plain text field |

## Minimal example

```json
{ "id": "full_name", "type": "text", "label": "Full Name", "order": 1, "required": true }
```

## Full example

```json
{
  "id": "reference_code",
  "type": "text",
  "label": "Reference Code",
  "order": 1,
  "placeholder": "e.g. REF-0001",
  "required": true,
  "validation": { "required": true, "pattern": "^REF-[0-9]{4}$", "message": "Format: REF-0000" },
  "config": { "autoComplete": "off" }
}
```
