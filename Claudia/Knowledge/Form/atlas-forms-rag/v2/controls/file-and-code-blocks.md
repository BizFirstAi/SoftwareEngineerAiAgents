# File selectors & code blocks

Two small families that share render code. Config: only `config.multiple` (boolean) is
read by the selector family; `accept` is fixed per type, not configurable. The code-block
family reads no config at all — plain monospace textareas.

## File-selector family (same drag-and-drop mechanism as `file-upload`)

| type | fixed `accept` | use when |
|---|---|---|
| `document-scanner` | `image/*,.pdf` | capture/upload a scanned document |
| `css-file-selector` | `.css,text/css` | pick a CSS file (CMS/theming contexts) |
| `js-file-selector` | `.js,.mjs,application/javascript` | pick a JS file |
| `asset-manager` | `image/*,video/*,audio/*,.pdf,.svg` | pick from a general media asset library |

```json
{ "id": "scan", "type": "document-scanner", "label": "Scan ID Document", "order": 4 }
```

## Code-block family (plain monospace textarea, string value)

| type | placeholder shown | use when |
|---|---|---|
| `javascript-block` | `// JavaScript...` | inline JS snippet |
| `style-block` | `// CSS...` | inline CSS snippet |
| `html-block` | `// HTML...` | inline HTML snippet |

No syntax highlighting or validation in the base renderer — value is a raw string, no
sanitization applied (unlike `html`/`article`, which DOMPurify-sanitize their output).
These are for **authoring** code to be used elsewhere, not for displaying untrusted HTML.

```json
{ "id": "custom_css", "type": "style-block", "label": "Custom CSS", "order": 9 }
```
