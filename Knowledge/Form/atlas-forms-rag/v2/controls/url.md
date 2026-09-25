Type: `url`
Category: Input Controls
Common properties: see `01-common-properties.md`. Renders `<input type="url">` — shares its case with `text`/`email`/`tel`.

## `config`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `maxLength` | number | No | — | same as `text` |
| `autoComplete` | string | No | — | HTML `autocomplete` value |

Same caveat as `email`: `type: "url"` gives no automatic format enforcement from the validation engine, only the browser's `type="url"` hint. Add `validation.pattern` for real enforcement.

## Minimal example

```json
{ "id": "website", "type": "url", "label": "Website", "order": 5 }
```

## Full example

```json
{
  "id": "website",
  "type": "url",
  "label": "Company Website",
  "order": 5,
  "placeholder": "https://example.com",
  "validation": { "pattern": "^https?://.+" }
}
```
