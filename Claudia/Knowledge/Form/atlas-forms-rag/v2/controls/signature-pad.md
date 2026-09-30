# `signature-pad`

Displays a signature image (value is a data-URL string) with a "Clear Signature" button in
edit mode. The base renderer displays/clears an existing signature but does **not** include
actual drawing/capture UI (no `<canvas>` drawing surface in the guaranteed fallback path) —
treat as "signature value holder + clear action" for schema-authoring purposes; capture UI
is provided by the advanced-controls package if loaded.

## Config

None — no type-specific `config` keys are read by the base renderer.

## Example

```json
{ "id": "signature", "type": "signature-pad", "label": "Signature", "order": 12,
  "required": true, "validation": { "required": true } }
```
