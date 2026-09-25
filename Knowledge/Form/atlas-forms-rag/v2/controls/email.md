Type: `email`
Category: Input Controls
Common properties: see `01-common-properties.md`. Renders `<input type="email">` — shares its case with `text`/`url`/`tel`.

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `maxLength` | number | No | — | same as `text` |
| `autoComplete` | string | No | `"email"` | HTML `autocomplete` value |

**Important:** setting `type: "email"` does NOT get you automatic email-format validation from the validation engine — `ValidationEngine.validateField()` never branches on `control.type` (see `validation-rules.md`). It only gives the browser's built-in `type="email"` UI hint. Add `validation.pattern` if you need format enforcement, e.g. `"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"`.

## Minimal example

```json
{ "id": "email", "type": "email", "label": "Email", "order": 2, "required": true }
```

## Full example

```json
{
  "id": "work_email",
  "type": "email",
  "label": "Work Email",
  "order": 2,
  "required": true,
  "validation": { "required": true, "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", "message": "Enter a valid email address" },
  "config": { "autoComplete": "email" }
}
```
