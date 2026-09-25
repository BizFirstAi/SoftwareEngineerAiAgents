# `rich-text-editor`

WYSIWYG rich text editor. Supports the same optional Expression Builder trigger as `text`
(see below) but is otherwise a plain rich text field — no special `config` keys are read by
the base renderer.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `expressionBuilder.enabled` | `config.expressionBuilder.enabled` | boolean | Opt-in only — adds an inline "Edit using Expression Builder" trigger next to the field. Leave unset for a plain rich-text field; this is an advanced authoring aid, not something to enable by default. |

## Example

```json
{ "id": "email_body", "type": "rich-text-editor", "label": "Email Body", "order": 5,
  "validation": { "required": true, "maxLength": 5000 } }
```
