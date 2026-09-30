# Validation Rules

`control.validation` (type `FieldValidation`) supports exactly these keys — verified against `packages/validation-js/src/validators.ts` and `packages/types-js/src/control.types.ts`. Unlisted keys are ignored by the engine.

| Rule | Type | Applies to (checked at runtime) | Behavior |
|---|---|---|---|
| `required` | boolean | all | fails on `null`/`undefined`/`""`/empty array. **Gated on `control.required`, not `control.validation.required`** — `validateField()` checks `if (control.required) {...}` directly; set the top-level `control.required: true` (see `01-common-properties.md`), and set `validation.required: true` too for schema clarity, but the top-level flag is what the engine actually reads. |
| `minLength` | number | string or array values (`text`, `textarea`, `password`, `tag-input`, `multiselect`, …) | fails if `value.length < minLength` |
| `maxLength` | number | string or array values | fails if `value.length > maxLength` |
| `min` | number | numeric values (`number`, `slider-range`, …) | fails if `value < min`; ignored on non-numbers |
| `max` | number | numeric values | fails if `value > max`; ignored on non-numbers |
| `pattern` | string (regex source, no slashes) | string values | tested with the `u` flag; strings over 10,000 chars are rejected outright (ReDoS guard) |
| `message` | string | all | custom message returned as-is when `validation.message` is set, overriding the default text |

Only `required` and `pattern` map to a built-in browser-style check; `min`/`max`/`minLength`/`maxLength` are purely numeric/length comparisons — they do not coerce types.

## `type: 'email'` / `type: 'url'` do NOT auto-validate format

Verified directly against `ValidationEngine.validateField()` in
`packages/validation-js/src/validation.engine.ts` (lines ~171–329): it only ever checks
`required`/`minLength`/`maxLength`/`min`/`max`/`pattern` off `control.validation`, with
**no branch on `control.type` anywhere in that method**. Setting `type: 'email'` gives you
an `<input type="email">` (browser-level hint only, no engine enforcement). `validators.ts`
does define standalone `emailValidator`/`urlValidator` functions, but `validateField()`
never calls them — they are dead code unless a host app wires them in manually (see next
section). If you need format enforcement, add an explicit `pattern` to `validation`.

## Registered validator names

`required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, `url`, `custom`, `passwordConfirm`, `dateRange`, `dependentRequired`, `passwordStrength` are all defined in `validators.ts`, but **only the first 6 are invoked automatically** by `validateField()`. `email`, `url`, `custom`, and the four cross-field validators below only run if a host app calls `engine.registerValidator(name, fn)` — do not assume they fire in a generated schema. The last four take their extra parameters from `control.config`, not `validation`:

| Validator | Trigger | Config keys (on `control.config`) |
|---|---|---|
| `passwordConfirm` | control type intended to confirm another password field | `confirmFieldId` (default `"password"`) |
| `dateRange` | end-date field must be after/before another field | `compareFieldId` (default `"startDate"`), `operator`: `"after"` (default) \| `"before"` |
| `dependentRequired` | field required only when another field equals a value | `dependsOn`, `dependsOnValue` |
| `passwordStrength` | pairs with `password-strength-meter`, see below | `passwordStrengthRules: { minLength?, requireUppercase?, requireLowercase?, requireNumber?, requireSpecialChar?, specialCharPattern? }` |

`passwordStrengthRules` defaults: `minLength: 8, requireUppercase: true, requireLowercase: true, requireNumber: true, requireSpecialChar: false, specialCharPattern: "!@#$%^&*"`.

## Example

```json
{
  "id": "email",
  "type": "email",
  "label": "Work Email",
  "order": 2,
  "required": true,
  "validation": { "required": true, "maxLength": 254 }
}
```

```json
{
  "id": "age",
  "type": "number",
  "label": "Age",
  "order": 3,
  "validation": { "min": 18, "max": 120, "message": "Must be an adult under 120." }
}
```
