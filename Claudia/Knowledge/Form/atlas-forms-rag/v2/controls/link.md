# `link`

Renders either a plain hyperlink, or — when configured with a `form` action — a button that
opens another form. `href`/URL values are restricted to `http(s)://`, `mailto:`, or `tel:`
schemes; anything else is neutralized to `#`.

## Config

Nested under `config.link` (a schema loaded through the parser) — for schemas built by
hand, the same object also works as a top-level `link` key on the control (fallback path).

| Property | Location | Type | Notes |
|---|---|---|---|
| `label` | `config.link.label` | string | Falls back to `control.label`, then the resolved `href`. |
| `showAs` | `config.link.showAs` | string | Visual variant hint (consumed by the advanced link renderer). |
| `variant` | `config.link.variant` | string | |
| `icon` | `config.link.icon` | string | |
| `action` | `config.link.action` | object | `{ kind: 'form', formId: number, target?, binding? }` opens another form (via `LinkFormButton`). Any other/absent `action` falls back to a plain `<a href>`. |
| `href` | `config.href` | string | Used only when `action` isn't a `form` action. Falls back to the control's bound `value`. |

## Example

```json
{ "id": "help_link", "type": "link", "label": "Need help?", "order": 15,
  "config": { "href": "https://support.example.com" } }
```

Open another form from a link:
```json
{ "id": "open_details", "type": "link", "order": 16,
  "config": { "link": { "label": "View Details", "showAs": "button",
    "action": { "kind": "form", "formId": 4021, "target": "modal" } } } }
```
