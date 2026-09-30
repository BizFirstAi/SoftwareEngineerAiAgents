# `qr-code-generator`

Renders a QR code from a value, with an optional download button.

## Config

| Property | Type | Default | Notes |
|---|---|---|---|
| `value` | string | falls back to the control's bound `value` | Content encoded in the QR code. |
| `size` | number | `200` | Px, square. |
| `errorCorrectionLevel` | `'L'\|'M'\|'Q'\|'H'` | `'M'` | |
| `darkColor` / `lightColor` | string (CSS color) | `'#000000'` / `'#FFFFFF'` | |
| `includeMargin` | boolean | `true` | |
| `margin` | number | `10` | |
| `logoUrl` | string | — | Center logo overlay. |
| `logoSize` | number | — | |
| `enableDownload` | boolean | `true` | Shows a download button. |
| `downloadFormat` | `'png'\|'jpeg'\|'svg'` | — | |

## Example

```json
{ "id": "invite_qr", "type": "qr-code-generator", "order": 3,
  "config": { "value": "https://example.com/invite/abc123", "size": 160 } }
```
