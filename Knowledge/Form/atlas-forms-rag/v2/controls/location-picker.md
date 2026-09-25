# `location-picker`

Declared as an Advanced Input control, but the current renderer draws it through the same
shared placeholder block as the read-only media controls (dashed box with a map emoji and
the current `value` echoed as text) — there is no interactive map/geocoding UI wired in
today. No `config` keys are read.

Use this type to reserve the field in the schema (e.g. "we'll wire up a real map picker
later"), but do not describe it to a user as an interactive map — it currently behaves as a
display placeholder bound to a plain value.

## Example

```json
{ "id": "site_location", "type": "location-picker", "label": "Site Location", "order": 4 }
```
