# `password`

Masked text input with a show/hide toggle button built into the renderer (no config needed
for that). Pair with `password-strength-meter` for a visual strength bar bound to the same
value, and see `validation-rules.md` for the `passwordStrength`/`passwordConfirm`
cross-field validators (host-registration required, not automatic).

## Config

| Property | Location | Type | Default | Notes |
|---|---|---|---|---|
| `autoComplete` | `config.autoComplete` | string | `'current-password'` | Set to `'new-password'` for signup/change-password forms so browsers don't offer autofill from a saved login. |

## Example

```json
{ "id": "password", "type": "password", "label": "Password", "order": 4, "required": true,
  "validation": { "required": true, "minLength": 8 },
  "config": { "autoComplete": "new-password" } }
```
