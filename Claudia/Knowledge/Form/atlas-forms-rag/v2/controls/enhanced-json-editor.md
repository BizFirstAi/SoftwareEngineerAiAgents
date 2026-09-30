# `enhanced-json-editor`

Monospace JSON editor (Advanced Input tier). Functionally similar rendering to
`json-editor` in the current build, with one extra config-driven behavior: the placeholder
text adapts to whether the expected shape is an array or object.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `schema` | `config.schema` | object | Only `schema.type` is read today (`'array'` selects an array-shaped placeholder, anything else defaults to object-shaped). Full JSON-Schema validation against this is **not** wired into the renderer — treat `schema` as a placeholder hint only, not enforced validation. |

## Example

```json
{ "id": "line_items_json", "type": "enhanced-json-editor", "label": "Line Items (JSON)",
  "order": 9, "config": { "schema": { "type": "array" } } }
```
