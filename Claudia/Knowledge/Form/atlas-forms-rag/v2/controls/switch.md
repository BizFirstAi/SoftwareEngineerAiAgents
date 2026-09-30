Type: `switch`
Category: Input Controls
Common properties: see `01-common-properties.md`. Value emitted is `boolean`. Visually a pill toggle with the on/off label rendered inside it (label text sits beside the control, not inside — same visual pattern as `toggle` but wider).

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `onLabel` | string | No | `"On"` | text shown inside the pill when on |
| `offLabel` | string | No | `"Off"` | text shown inside the pill when off |

## Minimal example

```json
{ "id": "is_active", "type": "switch", "label": "Active", "order": 10 }
```

## Full example

```json
{
  "id": "auto_renew",
  "type": "switch",
  "label": "Auto-Renew Subscription",
  "order": 10,
  "defaultValue": true,
  "config": { "onLabel": "Enabled", "offLabel": "Disabled" }
}
```
