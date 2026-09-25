# Advanced Capabilities

Non-obvious mechanisms beyond the basic control-type catalogue. Checked deliberately
against source, not assumed absent. Skip this file for a plain data-entry form; read it
when the request involves dynamic data, cross-field behavior, or form-level settings.

## 1. The control catalogue is extensible, not closed

`packages/control-registry-js` (`DefaultControlRegistry`) and
`player-components-react`'s `ReactControlRegistry` are real plugin registries —
`register()` / `registerReact()`, `unregister()`, `deprecate()`, `has()`, `count()`,
`subscribe()`. `registerAllControls()` dynamically `import()`s
`@atlas-forms/controls-advanced-react` at runtime and merges its controls in.

Practical implication: the list in `00-overview.md` and `controls/` is the set of types
**confirmed registered in the shipping app today**. A host application can register
additional custom types (`type: 'custom'` is the reserved escape hatch for this — it has
no fixed schema and no default renderer; only emit it if you know the target app has
registered a handler for it). Do not invent config for `type: 'custom'`.

Two control types declared in the `FormControlType` union — `editable-grid` and
`display-grid` — are fully implemented in `controls-form-actions-react` but **not
currently wired into `registerAllControls()`**, so they have no render path in the
shipping app today. Prefer `grid` (see `controls/grid.md`), which is the one confirmed
live.

## 2. Computed / dynamic values

`FormControl.binding` (`FieldBinding`) resolves through `DataBindingEngine`
(`packages/form-engine-js`). Priority order: `expression` first, then `source`+`path`,
then bare `path` (treated as a reference to another field's current value).

```json
"binding": { "expression": "{{ quantity * unitPrice }}" }
```

Named data sources (registered separately, referenced by `binding.source`) support 5
types:

| `type` | `path` means | Notes |
|---|---|---|
| `json` | key into supplied static data | |
| `variable` | key into runtime variables | |
| `form` | another field's `id` | Cross-field reference. |
| `api` | endpoint (supports `{param}` interpolation from `params`) | `method` GET/POST/PUT/PATCH/DELETE, optional `cache`+`ttl`. Requires the host app to supply an HTTP client — don't assume it's always available. |
| `computed` | an expression string | Same evaluator as `binding.expression`. |

`defaultValue` gets the same treatment for free: if it's a string starting with `{{` and
ending with `}}`, it is evaluated once as an expression when bindings resolve — you don't
need `binding` just to compute a default.

## 3. Field/form action pipeline (beyond show/hide)

`FormControl.fieldActions` (`FieldAction[]`, `packages/types-js/src/form.types.ts`) is a
real event → action system, distinct from `visibilityRule`:

- Triggers: `OnChange`, `OnBlur`, `OnFocus`, `OnClick` (field-level). Form-level `actions`
  add `OnSubmit`, `OnLoad`, `OnValidation`.
- Each action references an `actionKey` (a catalog entry — API call, typically), with
  optional `payload` (field→API param mapping), `auth`, `successActions`
  (`redirect`/`message`/`field_update`/`form_reset`/`custom`), `errorActions`
  (`message`/`field_error`/`retry`/`custom`).
- Each action can be gated by `when: ActionCondition` — `{ field, operator, value }` where
  `operator` is one of `=== !== > < >= <= contains in isEmpty isNotEmpty`. This is a
  **richer** operator set than the `visibilityRule` expression grammar — `contains`/`in`/
  `isEmpty`/`isNotEmpty` only exist here, not in `conditional-logic.md`'s expressions.

This is an API-call action pipeline, not a lightweight `enable`/`disable` toggle system —
there is no `enable`/`disable`/`setValue` action type. Only use `fieldActions` when the
request genuinely needs to call an external action on a field event; for pure show/hide,
use `visibilityRule`.

## 4. Custom validators (extension point, not schema-declarable)

`ValidationEngine.registerValidator(name, fn)` lets a host app add rule names beyond the 6
listed in `validation-rules.md`. This happens in application code, not in the JSON schema
— a generated schema cannot register a validator, it can only reference one that the host
has already registered (and per `validation-rules.md`, don't assume any of the 7
non-auto-firing validators are registered unless told so).

## 5. Form-scope plugins (form-level, non-visual)

9 control types have `scope: 'form'` and render nothing in the field grid — they apply a
side effect to the whole form via a `formEffect` handler (SEO tags, analytics scripts,
security settings, etc.). See `controls/form-scope-plugins.md`. Each is a singleton — at
most one instance per form.

## 6. Form inheritance / composition

A control can import or override fields from a different, already-defined form via
`referredFormID` (or `referredFormPath`) + `referredControlID` + `controlInheritType`
(`import` replaces the placeholder control with the referenced ones; `override` merges the
base control's properties under this one, local properties winning). See
`01-common-properties.md`. Useful for reusing a "contact block" or "address block" across
many forms without copy-pasting controls.

## 7. Dynamic/API-backed options are not automatic for select/radio/etc.

`select`/`radio`/`checkbox`/`multiselect`/`tree-select`/`multi-select-search` all read
`config.options` as a **static array** at render time (`{value,label}[]`, or nested
`{value,label,children}[]` for `tree-select`/`cascading-select`). There is no
`config.optionsSource`/`optionsUrl` shorthand. If options must come from an API, resolve
them into `config.options` yourself (e.g. via a `binding` with an `api` data source feeding
a pre-render step) — don't invent a dynamic-options config key that isn't documented per
type.
