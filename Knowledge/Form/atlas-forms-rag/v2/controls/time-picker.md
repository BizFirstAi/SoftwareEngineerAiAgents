Type: `time-picker`
Category: Advanced Input — renders a native `<input type="time">`. Value is a string in `HH:MM` (24-hour) form.
Common properties: see `01-common-properties.md`.

## `config`

No control-specific `config` properties — verified against `FormField.tsx` (`case 'time-picker':`), which reads only common properties (`value`, `disabled`, `readonly`, `required`).

## Minimal example

```json
{ "id": "appointment_time", "type": "time-picker", "label": "Appointment Time", "order": 1 }
```
