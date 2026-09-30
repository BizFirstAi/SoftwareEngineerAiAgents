# `expression`

A field whose value is always authored through Expressions Studio's modal editor, not typed
directly. Deliberately has no inline case in `FormField.tsx` — it is only reachable through
the `default:` → `ReactControlRegistry` path, by design (per an explicit code comment
warning future maintainers not to add an inline case, since that would silently shadow the
registered component — this already happened by accident to `color-picker`/
`rich-text-editor`/`code-editor`, which is why those three are simpler fallbacks today
rather than their originally-intended richer components).

## Config

No documented `config` schema was found — this control's authoring surface is the
Expressions Studio modal, not a JSON `config` object you should hand-author. Only emit
`type: "expression"` when you specifically mean "this value must be built with the
Expression Builder," not as a general-purpose computed field — for a computed value
without the modal-editing requirement, use `binding.expression` on a plain field instead
(see `advanced-capabilities.md` §2).

## Example

```json
{ "id": "computed_total", "type": "expression", "label": "Total", "order": 9, "readonly": true }
```
