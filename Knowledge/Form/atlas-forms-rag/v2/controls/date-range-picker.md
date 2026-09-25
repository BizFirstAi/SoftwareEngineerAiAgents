Type: `date-range-picker`
Category: Advanced Input — two linked native `<input type="date">` fields (start/end). Value is an object `{ start?: string, end?: string }`, each a `YYYY-MM-DD` string. The start input's `max` is bound to the current `end` value and the end input's `min` to the current `start` value, so the UI itself prevents an inverted range — no separate validation config is needed for that.
Common properties: see `01-common-properties.md`.

## `config`

No control-specific `config` properties — verified against `FormField.tsx` (`case 'date-range-picker':`).

## Minimal example

```json
{ "id": "trip_dates", "type": "date-range-picker", "label": "Trip Dates", "order": 1 }
```

## Full example

```json
{
  "id": "employment_period",
  "type": "date-range-picker",
  "label": "Employment Period",
  "order": 1,
  "defaultValue": { "start": "2026-01-01" }
}
```
