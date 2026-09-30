Type: `css`
Category: Display Controls — display-only, injects a `<style>` block. All output is regex-stripped of `@import`, `@charset`, `expression(`, `javascript:`, `-moz-binding:`, `behavior:`, `url(`, HTML tags, and hex escapes before injection (defense-in-depth, not full CSS parsing — don't rely on it to allow anything those patterns would otherwise touch).
Common properties: see `01-common-properties.md`.

## `config`

| Property | Type | Required | Notes |
|---|---|---|---|
| `css` | string | Yes (or bind a value) | raw CSS text; falls back to bound `value`, then to nothing |

## Minimal example

```json
{ "id": "custom_styles", "type": "css", "label": "Custom Styles", "order": 1,
  "config": { "css": ".highlight { background: #fffbe6; }" } }
```
