# `file-upload`

Drag-and-drop / click-to-browse file input. Value is a `File`, `File[]`, or a string
(existing filename) depending on mode.

## Config

| Property | Type | Default | Notes |
|---|---|---|---|
| `accept` | string | `'*/*'` | Native `accept` attribute, e.g. `"image/*,.pdf"`. |
| `multiple` | boolean | `false` | Allow multiple files; value becomes an array. |

Uploads are validated host-side against file count/size limits before `onChange` fires
(oversized/too-many selections are rejected with an alert and never reach form state) — do
not assume unlimited file size/count.

## Example

```json
{ "id": "resume", "type": "file-upload", "label": "Resume", "order": 5, "required": true,
  "config": { "accept": ".pdf,.doc,.docx" } }
```

## Related types sharing the identical drag-and-drop mechanism

`document-scanner` (camera capture, `accept: 'image/*,.pdf'`), `css-file-selector`
(`.css,text/css`), `js-file-selector` (`.js,.mjs,application/javascript`), `asset-manager`
(`image/*,video/*,audio/*,.pdf,.svg`) — same `config.multiple`, fixed `accept` per type
(not overridable via `config.accept` for these four). See `controls/file-and-code-blocks.md`.
