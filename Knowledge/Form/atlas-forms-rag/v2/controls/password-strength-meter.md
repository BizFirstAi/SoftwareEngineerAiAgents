# `password-strength-meter`

Visual 5-segment strength bar. Reads its own bound `value` as a number `0`–`5` (it does
**not** compute strength from a password string itself) — pair it with a `password` field
via `binding` (or a `fieldActions`/host-side calculation that writes a 0-5 score into this
control's value). Segment colors: 1=red("Very Weak") … 5=green("Very Strong").

## Config

None — no type-specific `config` keys are read.

## Example

```json
{ "id": "pw_strength", "type": "password-strength-meter", "label": "Password Strength",
  "order": 5, "binding": { "expression": "{{ passwordStrengthScore }}" } }
```
