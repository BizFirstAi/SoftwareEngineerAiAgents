# Conditional Logic (Visibility)

Verified against `packages/schema-js/src/visibility.resolver.ts`. There is no separate show/hide/enable/disable "action" system — conditional behavior is entirely the `control.visibilityRule` object, evaluated per control, per render, against current form values and the operating mode.

## `visibilityRule` shape

```json
{
  "type": "always | never | expression | mode-based | dependency",
  "condition": "{{ country === 'US' }}",
  "modes": ["edit", "admin"],
  "dependsOn": ["country"]
}
```

| Field | Used by `type` | Notes |
|---|---|---|
| `type` | always | one of the 5 values below |
| `condition` | `expression` | JS-like boolean expression, must be wrapped in `{{ }}` |
| `modes` | `mode-based` | array of `FormOperatingMode` values: `edit`\|`view`\|`design`\|`admin`\|`preview` |
| `dependsOn` | `dependency` | array of other control `id`s |

## Rule types

| `type` | Visible when |
|---|---|
| `always` | always visible (short-circuits, ignores other rules) |
| `never` | always hidden (short-circuits) |
| `mode-based` | current operating mode is in `modes` |
| `expression` | `condition` evaluates truthy against current form values |
| `dependency` | every field listed in `dependsOn` currently has a non-empty value (not `undefined`/`null`/`""`) — this checks presence only, not a specific value; use `expression` to compare against a specific value |

`control.hidden: true` always wins over `visibilityRule` (short-circuits to hidden). If `visibilityRule` is absent, `control.visibility` (`always`\|`edit-only`\|`view-only`) and `control.modeVisibilitySettings` (per-mode boolean map) are checked instead — see `01-common-properties.md`.

## Expression syntax (`type: "expression"`)

Expressions run through a whitelist-only parser (`SafeExpressionEvaluator`) — no `eval`, no arbitrary JS. Must be wrapped in `{{ ... }}`.

**Allowed operators:** `===` `!==` `==` `!=` `<=` `>=` `<` `>` `&&` `||` `!` `?` `:` `(` `)`
**Allowed operands:** identifiers (resolve to a value from the current form values, e.g. `country`), string literals (`'US'` or `"US"`), number literals.
**Forbidden identifiers** (expression is rejected, control defaults to visible): `eval`, `Function`, `require`, `import`, `export`, `this`, `window`, `document`, `constructor`, `prototype`, `__proto__`.
**Not supported:** method calls (`.includes(...)`), arithmetic operators (`+ - * /`), array/object literals, nested property access beyond a plain identifier.

An invalid or unparseable expression makes the control default to **visible**, not hidden — write expressions defensively.

## Examples

Show only when another field equals a value:
```json
{ "visibilityRule": { "type": "expression", "condition": "{{ country === 'US' }}" } }
```

Show only in edit/admin mode:
```json
{ "visibilityRule": { "type": "mode-based", "modes": ["edit", "admin"] } }
```

Show only after a prerequisite field is filled in:
```json
{ "visibilityRule": { "type": "dependency", "dependsOn": ["customerId"] } }
```

Combine two conditions:
```json
{ "visibilityRule": { "type": "expression", "condition": "{{ country === 'US' && state !== '' }}" } }
```
