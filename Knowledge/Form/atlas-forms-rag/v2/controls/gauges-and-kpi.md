# Gauge & KPI controls (single-value indicators)

| type | config | notes |
|---|---|---|
| `circular-gauge` | `config.value` (number 0-100) | Falls back to bound `value`, then `65`. Ring/donut style. |
| `progress-ring` | `config.value` (number 0-100) | Identical rendering to `circular-gauge` (literal alias). |
| `linear-gauge` | `config.value` (number 0-100) | Horizontal bar style. |
| `thermometer` | `config.value` (number 0-100) | Identical rendering to `linear-gauge` (literal alias, despite the name no thermometer graphic is drawn). |
| `kpi-card` | `config.value` (number\|string), `config.label` (string, falls back to `control.label`) | Big-number card, no 0-100 constraint. |

All gauge types clamp to 0-100 and default to `65` if no value is available. None read a
`min`/`max`/`unit`/`color-thresholds` config — if you need a different scale, normalize
your value to 0-100 before binding it.

## Example

```json
{ "id": "capacity_gauge", "type": "circular-gauge", "label": "Capacity Used", "order": 2,
  "config": { "value": 82 } }
```

```json
{ "id": "total_revenue_kpi", "type": "kpi-card", "order": 1,
  "config": { "value": "$84,200", "label": "Total Revenue" } }
```
