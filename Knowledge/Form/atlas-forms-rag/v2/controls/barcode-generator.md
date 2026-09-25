# `barcode-generator`

Renders a linear barcode.

## Config

| Property | Type | Default | Notes |
|---|---|---|---|
| `value` | string | falls back to bound `value` | Content encoded. |
| `format` | `'CODE128'\|'CODE39'\|'EAN13'\|'EAN8'\|'UPC'\|'ITF'` | `'CODE128'` | |
| `width` | number | `2` | Bar width multiplier. |
| `height` | number | `100` | Px. |
| `displayValue` | boolean | `true` | Show the encoded text under the bars. |
| `fontSize` | number | `14` | |
| `margin` | number | `10` | |
| `lineColor` / `backgroundColor` | string (CSS color) | `'#000000'` / `'#FFFFFF'` | |
| `enableDownload` | boolean | `true` | |
| `downloadFormat` | `'png'\|'jpeg'\|'svg'` | — | |

## Example

```json
{ "id": "sku_barcode", "type": "barcode-generator", "order": 4,
  "config": { "value": "0123456789012", "format": "EAN13" } }
```
