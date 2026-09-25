# Atlas Forms — Schema Overview

Source of truth: `atlas-forms` monorepo (`packages/types-js`, `packages/controls-builtin-js`), scanned 2026-08-19.
Always load this file whole; see `01-common-properties.md` for fields shared by every control and `controls/{type}.md` for control-specific `config` properties.

## Top-level FormSchema

```json
{
  "version": "1.0",
  "metadata": { "formID": "string", "title": "string" },
  "sections": [ { "id": "string", "title": "string", "order": 1 } ],
  "controls": [ { "id": "string", "type": "text", "label": "string", "order": 1 } ],
  "apiActions": [ ],
  "styles": { }
}
```

| Key | Type | Required | Notes |
|---|---|---|---|
| `version` | string | Yes | e.g. `"1.0"` |
| `metadata` | FormMetadata | Yes | `formID`, `title` required. Optional: `description`, `subtitle`, `numberOfColumns` (default 1), `formContentStyle` (`'input'\|'web-content'\|'dashboard'\|'data'`), `formBehavior` (`'interactive'\|'static'`), `formStyle` (`'default'\|'webpage'`, + `webpageConfig` if `'webpage'`). ~15 more DB/decoration-linkage fields exist (`formCategoryId`, `htmlCardId`, etc.) — persistence-layer only, omit from generated schemas. |
| `sections` | FormSection[] | No | `{id, title, order, description?, collapsible?, defaultExpanded?}` |
| `controls` | FormControl[] | Yes | flat array; group via `control.sectionId` |
| `apiActions` | FormAction[] | No | form-level API calls (`trigger`: OnSubmit\|OnLoad\|OnChange\|OnValidation) — rarely needed for a first draft |
| `styles` | ControlStyleSet | No | form-root style override, 5 slots — see `01-common-properties.md` |

No top-level `layout` or `actions` field exists — do not emit them.

## Critical: not every real `Atlas_Forms` row uses this FormSchema shape

Confirmed live (2026-09-10) by reading real rows directly from the database: forms whose
`FormTypeID` is 8 (`NODE-FORM-CONFIGURATION`, category `NODE_CONFIG` — the auto-generated
per-node-executor config forms, e.g. every `RedisNode_*` row) store a **plain JSON Schema**
(`{"type":"object","properties":{...},"required":[...]}`) in their `[Schema]` column instead of
the `version`/`metadata`/`sections`/`controls` shape documented above. Forms of every other
`FormTypeID` (`STANDARD`, `MODAL`, `WORKFLOW`, `DYNAMIC`, etc. — confirmed by reading a real
`MODAL`-type row, `FormID 20717`) do use this doc's real FormSchema shape correctly. **If you're
sampling an existing `Atlas_Forms` row to learn the schema shape from, check its `FormTypeID`
first** — a `NODE-FORM-CONFIGURATION` row will teach you the wrong convention entirely. The `[Schema]`
column itself is legacy `ntext`, not `nvarchar(max)` — an explicit `CAST(...AS NVARCHAR(MAX))` is
required before any SQL JSON function (`OPENJSON`, etc.) will read it.

## Control type decision table

**Verified count**: `FormControlType` (`types-js/src/control.types.ts`) declares 115 string
literals — not the "12" an earlier stale doc claimed. 113 have a confirmed render path
(explicit case/`if` in `FormField.tsx` — `css` uses `if (control.type === 'css')`, not a
`switch case`; a registration in `ControlRegistry.ts`/`ReactControlRegistry`; or, for the 9
form-scope plugins, `registerFormScopePlugins()`). Only `editable-grid`/`display-grid` are
unusable — implemented in `controls-form-actions-react` but **not wired into
`registerAllControls()`** in the shipping app. Use `grid` instead.

Group = design-time palette category. Pick the narrowest type that fits; fall back to
`text`/`label` only if nothing else matches.

### Input (14)
| type | use when |
|---|---|
| `text` | single-line free text |
| `textarea` | multi-line free text |
| `number` | numeric input |
| `email` | email address — `type` alone doesn't enforce format; add `validation.pattern` (see `validation-rules.md`) |
| `url` | URL — same caveat as `email` (no automatic format check) |
| `password` | masked secret input |
| `select` | pick one from a fixed list |
| `multiselect` | pick multiple from a fixed list |
| `checkbox` | single boolean |
| `radio` | pick one, all options visible |
| `switch` | boolean toggle styled as a switch |
| `date` | calendar date |
| `datetime` | date + time |
| `json-editor` | raw JSON blob input |

### Display (11 + tel/iframe/tree/org, rendered but not in default palette)
| type | use when |
|---|---|
| `label` | static text, no input |
| `header` | section-style heading text |
| `image` | show a single image |
| `video` | embed a video file |
| `audio` | embed an audio file |
| `mermaid` | render a mermaid diagram from text |
| `article` | rich static HTML/article block |
| `html` | raw custom HTML block |
| `css` | inline styling block (display-only) |
| `file-upload` | let user upload a file |
| `pdf-viewer` | embed a PDF |
| `tel` | phone number (same widget as `text`, not in default palette) |
| `iframe-viewer` | embed an external page in an iframe |
| `tree-view` | hierarchical read-only tree |
| `org-chart` | organization-chart visualization |

### Charts (13) — display-only, feed via `binding` or `config.data`; see `controls/charts.md`
`bar-chart`, `line-chart`, `pie-chart`, `area-chart`, `scatter-plot`, `bubble-chart`, `histogram`, `waterfall-chart`, `tree-map`, `heatmap`, `sankey-diagram`, `network-graph`, `gantt-chart`

### Gauges (6) — single-value indicators; see `controls/gauges-and-kpi.md`
`circular-gauge`, `linear-gauge`, `thermometer`, `progress-ring`, `password-strength-meter` (pairs with a `password` field), `kpi-card`

### Layout / structure (18)
| type | use when |
|---|---|
| `card-container`, `collapsible-panel`, `modal`, `enhanced-tabs`/`tab`, `accordion`, `stepper` | containers that group/organize other controls — see `controls/layout-containers.md` |
| `breadcrumb`, `sidebar-nav`, `timeline` | small nav/list display widgets — see `controls/navigation-and-timeline.md` |
| `data-table` / `table` | read-only sortable table |
| `grid` | **primary choice for editable repeating rows** — add/delete/edit/import/export; see `controls/grid.md`. (`editable-grid`/`display-grid` not wired in, don't use — see note above) |
| `api-response-viewer`, `variable-inspector`, `conditional-logic-viewer`, `database-query-builder`, `analytics-dashboard` | debug/admin viewers, not end-user widgets — see `controls/dev-tool-viewers.md` |
| `form-container` | embed another form by reference |

### Advanced input (14 + expression)
| type | use when |
|---|---|
| `rich-text-editor` | WYSIWYG text |
| `code-editor` | syntax-highlighted code |
| `color-picker` | pick a color |
| `slider-range` | numeric value via slider |
| `date-range-picker` | start+end date pair |
| `time-picker` | time only |
| `location-picker` | map-based location |
| `tree-select` | pick from a hierarchical tree |
| `cascading-select` | dependent chained dropdowns |
| `multi-select-search` | searchable multi-select |
| `tag-input` | free-form tags/tokens |
| `enhanced-json-editor` | JSON with schema-aware validation |
| `key-value-pairs` | dynamic key/value list |
| `form-picker` | search & pick another Form by ID |
| `expression` | value always authored via Expressions Studio modal |

### File & code blocks (6) — see `controls/file-and-code-blocks.md`
`css-file-selector`, `js-file-selector`, `javascript-block`, `style-block`, `html-block`, `asset-manager`

### Media (10)
`image-gallery`, `enhanced-video-player`, `audio-playlist`, `document-viewer`, `map` (these 5 share one placeholder renderer — see `controls/media-placeholders.md`), `qr-code-generator`, `barcode-generator`, `captcha-widget`, `signature-pad`, `document-scanner` (individually documented; also in the file-selector family, `controls/file-and-code-blocks.md`)

### Other rendered types
`button` (action trigger, non-value), `link` (navigable link cell/control), `toggle` (alternate boolean widget, identical config to `switch`), `user-picker` (pick a user), `actor-list` (pick multiple actors/roles), `custom` (reserved escape hatch for a host-app-registered renderer — no fixed schema; only emit if the target app is confirmed to have registered a handler for the exact type name you use)

### Form-scope plugins (scope:"form", no visible field — config applied at form level)
`seo-settings`, `analytics-settings`, `security-settings`, `compliance-settings`, `branding-settings`, `behavior-settings`, `notification-settings`, `embed-settings`, `custom-code` — 9 singleton, form-level plugins, live-registered via `registerFormScopePlugins()`. Each has a real, fully-specified `defaultConfig` — see `controls/form-scope-plugins.md` for the exact key list per type. Requires `"scope": "form"` on the control object in addition to `type`.

`credential` is **not** a real Atlas Forms control type — do not use it. Store secrets via `ICredentialResolver` at the node/executor level, never as a form field.
