Type: `toggle`
Category: Other Controls — boolean pill, same visual family as `switch` but a self-contained `<button role="switch">` with the on/off label rendered *inside* the pill (does not use the common `label` beside it the way `switch` does). Value emitted is `boolean`.
Common properties: see `01-common-properties.md`.

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `onLabel` | string | No | `"On"` | text shown inside the pill when true |
| `offLabel` | string | No | `"Off"` | text shown inside the pill when false |

## Minimal example

```json
{ "id": "dark_mode", "type": "toggle", "label": "Dark Mode", "order": 1 }
```

## Full example

```json
{
  "id": "notifications_on",
  "type": "toggle",
  "label": "Notifications",
  "order": 1,
  "defaultValue": true,
  "config": { "onLabel": "Enabled", "offLabel": "Disabled" }
}
```
