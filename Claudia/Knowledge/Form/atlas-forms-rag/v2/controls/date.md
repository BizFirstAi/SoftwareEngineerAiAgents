Type: `date`
Category: Input Controls
Common properties: see `01-common-properties.md`. Renders native `<input type="date">`. Value is a string in `YYYY-MM-DD` form.

## `config`

No control-specific `config` properties. Min/max come from `validation.min`/`validation.max` as `YYYY-MM-DD` date strings (not numbers, despite `FieldValidation.min/max` being typed `number` — pass the date string, the engine only forwards it to the HTML attribute for this control).

## Minimal example

```json
{ "id": "start_date", "type": "date", "label": "Start Date", "order": 1 }
```

## Full example

```json
{
  "id": "birth_date",
  "type": "date",
  "label": "Date of Birth",
  "order": 1,
  "required": true,
  "validation": { "required": true, "max": "2015-01-01" }
}
```
