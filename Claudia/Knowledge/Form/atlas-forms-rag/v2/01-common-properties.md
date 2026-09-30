# FormControl — Common Properties

Every object in `controls[]` has these fields regardless of `type`. Control-specific fields live under `config` — see `controls/{type}.md`. Validation rules: `validation-rules.md`. Visibility/conditional rules: `conditional-logic.md`.

## Identity & display

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `id` | string | Yes | — | unique within the form |
| `type` | string | Yes | — | one of the types in `00-overview.md` |
| `order` | number | Yes | — | render position; lower first |
| `label` | string | No | — | shown above the control |
| `placeholder` | string | No | — | input controls only |
| `description` | string | No | — | secondary text under the label |
| `helpText` | string | No | — | tooltip/inline help |
| `defaultValue` | any | No | — | initial value on load |
| `sectionId` | string | No | — | must match a `FormSection.id` |

## State flags

| Property | Type | Default | Effect |
|---|---|---|---|
| `required` | boolean | `false` | **The engine actually checks this flag** (`ValidationEngine.validateField()` gates on `control.required`, not `control.validation.required`) and drives the `*` label marker. Set both together for clarity — but if you must pick one, `control.required` is load-bearing. |
| `readonly` | boolean | `false` | visible, not editable, value still submitted |
| `disabled` | boolean | `false` | fully disabled, value not submitted |
| `hidden` | boolean | `false` | not rendered; overrides everything else in `conditional-logic.md` |

## Layout

| Property | Type | Allowed values | Notes |
|---|---|---|---|
| `width` | string | `full` \| `half` \| `third` \| `quarter` | ignored if `columnSpan` set |
| `columnSpan` | number | 1–12 | explicit grid column span |
| `rowSpan` | number | positive int | explicit grid row span |
| `forceNewRow` | boolean | — | starts a new layout row |
| `gridPosition` | object | `{column?, row?, colSpan?, rowSpan?}` | explicit placement, all 1-based |

## Validation & binding

| Property | Type | Notes |
|---|---|---|
| `validation` | FieldValidation | see `validation-rules.md` |
| `binding` | FieldBinding | `{source?, path?, expression?}`. `path`: dot-notation (`items[0].name`). `expression`: `{{ ... }}`, highest priority, evaluated first. `source`: the type doc-comment (`control.types.ts`) claims `"$json"\|"$context"\|"$api"`, but the actual runtime resolver `DataBindingEngine` (`form-engine-js`) matches it against **registered `DataSource.id` values** of type `json`\|`api`\|`variable`\|`form`\|`computed` (no `$` prefix) — see `advanced-capabilities.md` §2. Trust the runtime behavior, not the doc-comment: treat `source` as a host-registered data-source id, not a fixed enum. |
| `config` | object | control-type-specific — see `controls/{type}.md` |

## Visibility & mode

| Property | Type | Notes |
|---|---|---|
| `visibility` | string | `always` \| `edit-only` \| `view-only` |
| `modeVisibilitySettings` | object | per-mode boolean map — keys from `edit`\|`view`\|`design`\|`admin`\|`preview`; `false` hides in that mode |
| `visibilityRule` | object | conditional show/hide — see `conditional-logic.md` |
| `responsiveVisibility` | string | `large-only` (hidden < 768px) \| `small-only` (hidden ≥ 768px) |

## Inheritance (form composition)

| Property | Type | Notes |
|---|---|---|
| `referredFormID` | number | base form ID to inherit from |
| `referredFormPath` | string | alternative to `referredFormID`: `"ipfs://Qm..."` or a URL |
| `referredControlID` | string[] | control ID(s) in the base form; `["*"]` means all, valid only with `import` |
| `controlInheritType` | string | `override` (merge base into this control, local wins) \| `import` (replace this placeholder with the listed base controls) |

## Scope & actions

| Property | Type | Notes |
|---|---|---|
| `scope` | string | `field` (default, visible input) \| `form` (non-visual, form-level plugin — see `00-overview.md` form-scope list) |
| `fieldActions` | FieldAction[] | field-event actions — `trigger`: `OnChange`\|`OnBlur`\|`OnFocus`\|`OnClick`, plus `actionKey`, `payload`, `when`; rarely needed for a first-draft form, omit unless asked |

## Styling

| Property | Type | Notes |
|---|---|---|
| `styles` | ControlStyleSet | 5 optional slots (CSS-like property bags): `containerStyle` (wrapper), `headerStyle` (label), `bodyStyle` (main content), `contentStyle` (inner scroll region), `buttonStyle` (action buttons). Inherits parent container → form root (`FormSchema.styles`). Omit unless the user asks for custom styling — don't guess CSS values. |

## Minimal valid control

```json
{ "id": "full_name", "type": "text", "label": "Full Name", "order": 1, "required": true }
```
