Type: `tel`
Category: Input Controls (declared in the type union; not in the default palette registry, but fully rendered — shares its case with `text`/`email`/`url` in `FormField.tsx`)
Common properties: see `01-common-properties.md`. Renders `<input type="tel">`.

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `maxLength` | number | No | — | same as `text` |
| `autoComplete` | string | No | `"tel"` | HTML `autocomplete` value |

No built-in phone-format validation — use `validation.pattern` for a specific format.

## Minimal example

```json
{ "id": "phone", "type": "tel", "label": "Phone Number", "order": 2 }
```

## Full example

```json
{
  "id": "phone",
  "type": "tel",
  "label": "Phone Number",
  "order": 2,
  "placeholder": "+1 555 123 4567",
  "validation": { "pattern": "^\\+?[0-9 ()-]{7,20}$", "message": "Enter a valid phone number" }
}
```
