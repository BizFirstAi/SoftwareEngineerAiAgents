# `html`

Custom HTML display block, sanitized through DOMPurify before render (defense-in-depth:
whitelist tags only, event-handler stripping, dangerous-protocol blocking, SVG/CSS
injection blocking).

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `html` | `config.html` | string | The HTML source. Falls back to the control's bound `value`, then `defaultValue`. |

Allowed tags only: `p br strong em u h1-h6 ul ol li a blockquote code pre span div hr img`.
Allowed attributes: `href/title/target/rel` on `<a>`, `src/alt/title/width/height` on
`<img>`, `class/id` on `<span>`/`<div>`. Everything else (scripts, iframes, forms, inputs,
event handlers, `style` tags, dangerous URL protocols) is stripped — do not rely on any tag
or attribute outside this list surviving.

## Example

```json
{ "id": "disclaimer", "type": "html", "order": 20,
  "config": { "html": "<p>By submitting you agree to our <a href=\"https://example.com/terms\">Terms</a>.</p>" } }
```
