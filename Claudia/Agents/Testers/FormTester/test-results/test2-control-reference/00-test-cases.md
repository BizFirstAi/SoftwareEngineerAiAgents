# Atlas Forms Control Reference — Test Cases (Pilot: Input Category)

Durable test-case record for the 14 "Input" category controls, independent of the HTML pages
(`{type}.html` in this same folder) — reusable to extend coverage to the remaining ~96 controls
across Display, Charts, Gauges, Layout, Advanced Input, File/Code, Media, Other, and Form-Scope
Plugins without re-deriving the batching approach or the config shapes from scratch.

**Method proven this pass**: build a small number of forms, each hosting several controls/variants
of the *same category* together — one `create_form` call, one screenshot, shows every variant at
once. 3 forms covered all 14 controls (21 total control instances) instead of 14 separate forms —
real, measured savings: ~14 `create_form` calls avoided, ~11 fewer forms to search/open/screenshot
in Form Studio. Recommend the same ratio (~1 form per 5-8 controls in a category) for the
remaining categories.

**Real limitation of this method, found this pass, note before reusing**: the Form Studio "View"
preview modal (`FormPreviewModal` → `FormRenderer` in `mode="view"`) is a **structural preview**,
not a true fill-and-render simulation — it shows correct labels and correctly resolves computed
*values* (`defaultValue`, boolean states) but does **not** render `placeholder` text, does not
visually distinguish `checkbox`'s boolean vs. group mode, and (confirmed in the parent session,
not re-verified here) does not render display-only content controls' `config.content`/`config.src`
at all. For controls whose whole point is visual config (colors, custom labels on switches, media
embeds), this preview alone is insufficient — cross-check in the real Designer/Edit view or a live
fill session before asserting a config property "works."

## Environment used

- MCP endpoint: `http://localhost:5001/mcp` (Streamable HTTP), `X-Api-Key` auth.
- 3 forms created: FormID 10001138 (Text Family), 10001139 (Choice Controls), 10001140 (Numeric/Date/JSON).
- Verified against the real `Atlas_Forms` table via `sqlcmd` (see Test 1's report for the query pattern) — not just trusting MCP's own success responses.

## Test cases

| # | Control | Property combination | Expected behavior | Result |
|---|---|---|---|---|
| 1 | `text` | minimal (no config) | Renders labeled empty text input | PASS |
| 2 | `text` | `placeholder` + `required` + `validation.pattern` + `config.autoComplete:"off"` | Renders labeled input; placeholder/pattern enforcement not visible in read-only preview | PASS (render) / **NOT OBSERVABLE** (placeholder, pattern — preview limitation) |
| 3 | `textarea` | default (no config) | Renders labeled textarea, default 4 rows | PASS (render) / rows count not visually distinguishable in preview |
| 4 | `textarea` | `config.rows:6` + `validation.maxLength:200` | Same as above, taller box expected | PASS (render) / row-count difference not visually confirmed |
| 5 | `email` | minimal | Renders labeled input; no automatic format validation (confirmed intentional, per real code — `ValidationEngine` never branches on `control.type`) | PASS |
| 6 | `email` | `required` + `validation.pattern` (RFC-lite regex) | Renders labeled input; pattern enforcement is a submit-time behavior, not visible in this preview | PASS (render) |
| 7 | `url` | minimal | Renders labeled input, no format enforcement (same caveat as `email`) | PASS |
| 8 | `password` | `required` + `validation.minLength:8` + `config.autoComplete:"new-password"` | Renders labeled input; masking/show-hide toggle is a live-fill behavior, not visible here | PASS (render) |
| 9 | `select` | `config.options` (3 static entries) | Renders labeled dropdown-style field | PASS |
| 10 | `multiselect` | `config.options` (3 static entries) | Renders labeled field, real value would be an array | PASS (render) |
| 11 | `checkbox` | boolean mode (no `config.options`), `required` | Renders "No" (correct default-false boolean rendering) | PASS |
| 12 | `checkbox` | group mode (`config.options`, 2 entries) | Should render some empty/none-selected state distinct from boolean | **FAIL (preview only)** — renders "No", identical to boolean mode; real submitted-data behavior not verified, flagged as a preview-only display bug, not confirmed as a data-correctness bug |
| 13 | `radio` | `config.options` (3 entries) + `required` | Renders labeled field, generic empty state (no default selection) | PASS |
| 14 | `switch` | default on/off labels, no `defaultValue` | Renders "No" | PASS |
| 15 | `switch` | `defaultValue:true` + custom `config.onLabel`/`offLabel` | Renders "Yes"; custom pill labels not visible in this preview | PASS (value) / custom labels **NOT OBSERVABLE** (preview limitation) |
| 16 | `number` | minimal | Renders labeled numeric input | PASS |
| 17 | `number` | `required` + `defaultValue:1` + `validation.min/max` + `config.step:1` | Renders labeled input, default value 1 expected | PASS — shows "1" |
| 18 | `date` | minimal | Renders labeled date input | PASS |
| 19 | `date` | `validation.max` | Renders labeled date input | PASS (render) / max-date constraint not visible in unfilled static preview |
| 20 | `datetime` | minimal | Renders labeled datetime-local input | PASS |
| 21 | `json-editor` | `defaultValue:{}` | Renders labeled JSON editor with default empty object | **FAIL (preview bug)** — renders the literal text "[object Object]" instead of `{}`; the preview's value formatter appears to use plain `String()` coercion instead of `JSON.stringify()` for object-typed values on this control specifically |

**Pilot complete: 14/14 Input controls, all screenshotted and documented** (cases 16-21 completed in
a follow-up pass once a transient browser-session expiry cleared — see the runbook's session-expiry
note for what happened and why it wasn't a standing blocker).

## Known follow-ups (not yet actioned)

1. **Confirm/deny the checkbox group-mode preview bug (case 12) against real submitted data** — create a `Atlas_Forms` record with a checkbox group value set, then check whether `EndUserFormView`'s rendering (the *record* viewer, a different component from the schema preview used here) correctly shows the array, to determine if this is preview-only or reaches actual data display too.
2. **Fix the `json-editor` "[object Object]" preview bug (case 21)** — a real, confirmed display defect, not just a documentation gap. The preview's value formatter needs `JSON.stringify()` for object-typed values on this control, matching what `EndUserFormView` already does correctly for its own object-value case.
3. **Extend this same batching pattern to the remaining ~96 controls** (Display, Charts, Gauges, Layout, Advanced Input, File/Code, Media, Other, Form-Scope Plugins) — recommend ~1 form per 5-8 controls in a category, matching this pilot's ratio.
