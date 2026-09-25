# `image`

Static image display.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `src` | `config.src` | string (URL) | — | Falls back to the control's bound `value`, then `defaultValue`. |
| `alt` | `config.alt` | string | `label` or `'Image'` | |
| `width` | `config.width` | string \| number | `'auto'` | Number is treated as px. |
| `height` | `config.height` | string \| number | `'auto'` | Number is treated as px. |
| `maxWidth` | `config.maxWidth` | string | `'100%'` | |
| `objectFit` | `config.objectFit` | CSS `object-fit` value | `'contain'` | |

## Example

```json
{ "id": "logo", "type": "image", "order": 1,
  "config": { "src": "https://cdn.example.com/logo.png", "alt": "Company Logo", "maxWidth": "240px" } }
```
