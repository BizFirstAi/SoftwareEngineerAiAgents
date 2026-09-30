# `user-picker`

Currently a plain text input in the base renderer (placeholder "Enter user name or email")
— not a searchable user-lookup widget. Value is a free-typed string. Use this type to mark
semantic intent ("this field identifies a user") even though today it behaves like `text`;
don't describe it as an autocomplete/search picker.

## Config

None — no type-specific `config` keys are read.

## Example

```json
{ "id": "assigned_to", "type": "user-picker", "label": "Assign To", "order": 6 }
```
