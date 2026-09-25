# `pdf-viewer`

Embeds a PDF via the browser's native PDF viewer (`<object type="application/pdf">`), with
an "Open PDF" link fallback for browsers that can't render it inline.

## Config

The source is read from the control object directly, not from `config`:
`(control as any).src` and `(control as any).height` (default `600`). Put these as
top-level keys on the control object, not inside `config`.

## Example

```json
{ "id": "contract_pdf", "type": "pdf-viewer", "order": 1,
  "src": "https://cdn.example.com/contract.pdf", "height": 500 }
```
