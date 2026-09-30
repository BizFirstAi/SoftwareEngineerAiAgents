# `slider-range`

Single-value numeric slider (native `<input type="range">` with a live value readout above
it). For a start/end pair, use `date-range-picker` (dates only) — there is no numeric
two-handle range slider.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `min` | `config.min` | number | `0` | Falls back to `validation.min` if `config.min` unset. |
| `max` | `config.max` | number | `100` | Falls back to `validation.max` if `config.max` unset. |
| `step` | `config.step` | number | `1` | |

## Example

```json
{ "id": "satisfaction", "type": "slider-range", "label": "Satisfaction (0-10)", "order": 6,
  "config": { "min": 0, "max": 10, "step": 1 }, "defaultValue": 5 }
```
