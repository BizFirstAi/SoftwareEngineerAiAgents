# `checkbox`

Dual-mode control depending on whether `config.options` is set:

| `config.options` | Value type | Behavior |
|---|---|---|
| absent | boolean | Single checkbox (agree-to-terms style). |
| present | string[] | Group of checkboxes, value is the array of checked `option.value`s. |

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `{ value: string, label: string }[]` | Omit for a plain boolean checkbox; set for a multi-check group. |

## Examples

Boolean checkbox:
```json
{ "id": "agree_terms", "type": "checkbox", "label": "I agree to the Terms of Service",
  "order": 9, "required": true, "validation": { "required": true } }
```

Checkbox group:
```json
{ "id": "interests", "type": "checkbox", "label": "Interests", "order": 10,
  "config": { "options": [
    { "value": "newsletter", "label": "Newsletter" },
    { "value": "product_updates", "label": "Product Updates" }
  ] } }
```

## Known display gap — Form Studio's read-only "View" preview only

Confirmed live (2026-09-10): the Form Studio Form Definitions dashboard's schema-preview modal
(`FormPreviewModal` → `FormRenderer` in `mode="view"`) renders a group-mode checkbox (`config.options`
set) identically to boolean mode — it shows "No" regardless of mode, even though a group's real value
is an array, not a boolean. This was observed only in that specific read-only preview; it was not
verified against real submitted-record data (`EndUserFormView`, a different component) or the live
fill/edit mode, so treat it as a preview-only display quirk to be aware of, not a confirmed
data-correctness bug — don't use this preview alone to judge whether a checkbox group is configured
or storing values correctly.
