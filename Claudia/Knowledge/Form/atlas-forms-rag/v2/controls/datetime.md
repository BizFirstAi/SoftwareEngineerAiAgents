Type: `datetime`
Category: Input Controls
Common properties: see `01-common-properties.md`. Renders native `<input type="datetime-local">`. Value is a string like `2026-08-19T14:30`.

## `config`

No control-specific `config` properties. Min/max come from `validation.min`/`validation.max` as datetime-local strings.

## Minimal example

```json
{ "id": "appointment_at", "type": "datetime", "label": "Appointment Time", "order": 2 }
```

## Full example

```json
{
  "id": "meeting_at",
  "type": "datetime",
  "label": "Meeting Start",
  "order": 2,
  "required": true,
  "validation": { "required": true, "min": "2026-01-01T00:00" }
}
```
