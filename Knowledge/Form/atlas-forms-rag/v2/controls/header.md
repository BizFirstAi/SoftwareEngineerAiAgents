# `header`

Section heading text, rendered as a real `<h1>`–`<h6>` tag.

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `content` | `config.content` | string | falls back to `label` | The heading text. |
| `level` | `config.level` | number (1–6) | `2` | Clamped to 1–6. Accepts a numeric string too. |
| `alignment` | `config.alignment` | CSS `text-align` value | — | |
| `color` | `config.color` | string (CSS color) | — | |

## Example

```json
{ "id": "section_header_contact", "type": "header", "order": 1,
  "config": { "content": "Contact Information", "level": 2 } }
```
