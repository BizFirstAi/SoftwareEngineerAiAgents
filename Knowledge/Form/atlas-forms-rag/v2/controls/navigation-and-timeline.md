# Navigation & timeline (display-only)

Small display widgets, each with a simple `items[]` config and hardcoded sample fallback
content if `items` is omitted — always supply `items` explicitly.

| type | config | item shape |
|---|---|---|
| `breadcrumb` | `config.items` | `{ label: string }[]` — rendered as a `/`-separated trail, last item bold. |
| `sidebar-nav` | `config.items` | `{ label: string }[]` — vertical nav list, first item highlighted as active (static, not click-routed by config). |
| `timeline` | `config.items` | `{ label: string, date?: string }[]` — vertical chronological list with connector line. |

## Example

```json
{ "id": "order_timeline", "type": "timeline", "label": "Order Status", "order": 2,
  "config": { "items": [
    { "label": "Order Placed", "date": "2026-08-01" },
    { "label": "Shipped", "date": "2026-08-03" },
    { "label": "Delivered" }
  ] } }
```
