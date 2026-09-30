# `label`

Static, non-interactive text display — no value, no submission. For a bigger section
heading use `header` instead.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `content` | `config.content` | string | falls back to `label`, then `description`, then `defaultValue` | The actual text shown. |
| `fontSize` | `config.fontSize` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | |
| `fontWeight` | `config.fontWeight` | string (CSS) | `'normal'` | |
| `alignment` | `config.alignment` | CSS `text-align` value | — | |
| `color` | `config.color` | string (CSS color) | — | |

## Example

```json
{ "id": "note_1", "type": "label", "order": 1,
  "config": { "content": "All fields marked * are required.", "fontSize": "sm", "color": "#94a3b8" } }
```
