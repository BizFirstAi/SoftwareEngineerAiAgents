# `iframe-viewer`

Embeds an external page in a sandboxed `<iframe>`.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `src` | `config.src` | string (URL) | — | Required — empty renders "No URL configured". |
| `height` | `config.height` | number | `400` | |
| `title` | `config.title` | string | `label` or `id` | Accessibility title. |
| `sandbox` | `config.sandbox` | boolean | `true` | When true, applies `sandbox="allow-same-origin allow-forms"` (a restrictive sandbox — no scripts, no top navigation). Set `false` only if you specifically need an unsandboxed iframe and trust the source. |

## Example

```json
{ "id": "embedded_map", "type": "iframe-viewer", "order": 5,
  "config": { "src": "https://maps.example.com/embed?id=123", "height": 300 } }
```
