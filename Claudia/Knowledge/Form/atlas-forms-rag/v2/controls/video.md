Type: `video`
Category: Display Controls — embeds a native `<video>` element.
Common properties: see `01-common-properties.md`.

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `src` | string (URL) | Yes (or bind a value) | — | falls back to bound `value`, then `defaultValue` |
| `controls` | boolean | No | `true` | shows native player controls |
| `autoPlay` | boolean | No | `false` | |
| `loop` | boolean | No | `false` | |

## Minimal example

```json
{ "id": "product_demo", "type": "video", "label": "Product Demo", "order": 1,
  "config": { "src": "https://cdn.example.com/demo.mp4" } }
```

## Full example

```json
{
  "id": "intro_video",
  "type": "video",
  "label": "Welcome",
  "order": 1,
  "config": { "src": "https://cdn.example.com/intro.mp4", "controls": true, "autoPlay": false, "loop": false }
}
```
