# Atlas Forms Control Reference — Test Plan (remaining ~96 controls)

Forward-looking plan, for review before further execution. The Input-category pilot (14/14
controls, `00-test-cases.md` in this folder) proved the method; this plan extends it to every
other real control category using the exact same batching ratio, corrected for one real bug found
after the pilot shipped.

## Methodology correction — RESOLVED, read before starting the next category

**Update: fixed, not a workaround.** Binoy found directly in the real UI that `View` rendered
images/content-controls incorrectly while `Open` worked. A follow-up investigation found the real
root cause: `View` (`mode="view"`) and `Open` (`mode="edit"`) do share one engine (`FormRenderer`/
`FormField`), but `FormField.tsx` had a view-mode-only early-return that skipped the correct
renderer for most display-only control types (`label`, `header`, `article`, `html`, `css`, `audio`,
`iframe-viewer`, `pdf-viewer`, `mermaid`), falling through to a generic input-field renderer that
shows nothing for a control with no bound value. **Fixed in `FormField.tsx`, confirmed live via
Vite HMR** (screenshotted before/after on form 10001136). A second, deeper bug was found and fixed
in the same pass: `header`/`label` never actually read their own documented `config.content` field
in EITHER mode — only `Open`'s different code path happened to mask it. Both are now correct.

**Practical result: either `View` or `Open` is now a valid way to validate a control** — use
whichever is more convenient per category, no special-casing needed. The remaining categories in
this plan can proceed as originally scoped. It's still worth a quick pass re-checking the Input
pilot's own "NOT OBSERVABLE" findings (`00-test-cases.md`) under the fixed renderer, since a few of
those (anything display/content-related) may now show correctly where they previously couldn't.

## Proven batching ratio (carry forward unchanged)

~1 form per 5-8 controls in a category, multiple property-variant instances of each control
placed together in the same form. The pilot covered 14 controls across 3 forms (21 instances) —
apply the same ratio below rather than one form per control.

## Remaining categories, in recommended priority order

Ordered by how likely a form-building agent is to actually need the control day-to-day — general
building blocks first, specialist/visualization controls after, config-only plugins last (mirrors
the priority reasoning `workflow-nodes-rag` already used for its own 107 node types).

| # | Category | Controls | Count | Suggested forms |
|---|---|---|---|---|
| 1 | **Display** | `label`, `header`, `image`, `video`, `audio`, `mermaid`, `article`, `html`, `css`, `file-upload`, `pdf-viewer`, `tel`, `iframe-viewer`, `tree-view`, `org-chart` | 15 | 2-3 |
| 2 | **Layout / structure** | `card-container`, `collapsible-panel`, `modal`, `enhanced-tabs`, `tab`, `accordion`, `stepper`, `breadcrumb`, `sidebar-nav`, `timeline`, `data-table`, `table`, `grid`, `api-response-viewer`, `variable-inspector`, `conditional-logic-viewer`, `database-query-builder`, `analytics-dashboard`, `form-container` | 19 | 3-4 |
| 3 | **Advanced input** | `rich-text-editor`, `code-editor`, `color-picker`, `slider-range`, `date-range-picker`, `time-picker`, `location-picker`, `tree-select`, `cascading-select`, `multi-select-search`, `tag-input`, `enhanced-json-editor`, `key-value-pairs`, `form-picker`, `expression` | 15 | 2-3 |
| 4 | **Media** | `image-gallery`, `enhanced-video-player`, `audio-playlist`, `document-viewer`, `map`, `qr-code-generator`, `barcode-generator`, `captcha-widget`, `signature-pad`, `document-scanner` | 10 | 2 |
| 5 | **Other rendered types** | `button`, `link`, `toggle`, `user-picker`, `actor-list`, `custom` (only if a host app is confirmed to register a handler — skip otherwise, per its own doc caveat) | 5-6 | 1 |
| 6 | **File & code blocks** | `css-file-selector`, `js-file-selector`, `javascript-block`, `style-block`, `html-block`, `asset-manager` | 6 | 1 |
| 7 | **Charts** | `bar-chart`, `line-chart`, `pie-chart`, `area-chart`, `scatter-plot`, `bubble-chart`, `histogram`, `waterfall-chart`, `tree-map`, `heatmap`, `sankey-diagram`, `network-graph`, `gantt-chart` | 13 | 2-3 |
| 8 | **Gauges** | `circular-gauge`, `linear-gauge`, `thermometer`, `progress-ring`, `password-strength-meter`, `kpi-card` | 6 | 1 |
| 9 | **Form-scope plugins** | `seo-settings`, `analytics-settings`, `security-settings`, `compliance-settings`, `branding-settings`, `behavior-settings`, `notification-settings`, `embed-settings`, `custom-code` | 9 | 1-2 |

**Total: ~98 controls, ~9 categories, estimated ~16-21 forms** (vs. 98 if done one-per-control —
the same order-of-magnitude saving the pilot already demonstrated).

## Known risks per category — read the real `controls\{type}.md` doc before assuming a shape

- **Charts/Gauges (rows 7-8)**: these are display-only and feed from `binding`/`config.data` — an
  empty chart with no data may render as a blank box with nothing to screenshot meaningfully.
  Plan to seed each with a small real (or clearly-labeled-fake) dataset so the screenshot actually
  shows something, not just an empty canvas.
- **Layout (row 2)**: `grid`/`data-table`/`table` need sample rows to render meaningfully, same
  reasoning as charts. `form-container` embeds another form by reference — needs a second, real
  target form to exist first (reuse one of the pilot's or Test 1's forms rather than creating a
  throwaway).
- **Media (row 4)**: `image-gallery`/`enhanced-video-player`/`audio-playlist`/`document-viewer`/
  `map` share one placeholder renderer per `controls\media-placeholders.md` — confirm this doc
  before assuming these need 5 separate visual treatments; they may only need 1-2 forms total to
  demonstrate the shared behavior once.
- **Form-scope plugins (row 9)**: `scope: "form"`, no visible field — these can't be screenshotted
  as a rendered control at all (per the overview's own description). The "test" for these is
  confirming the `Configuration` JSON round-trips correctly via `get_form_schema`, not a screenshot.
  Plan accordingly — this category's HTML pages will look structurally different from the others
  (no image, just before/after config JSON).
- **`custom` control**: explicitly a reserved escape hatch with no fixed schema. Only test if a
  real host-app handler is confirmed registered somewhere in this codebase; otherwise document it
  as "not testable without a registered handler" and move on — don't fabricate one.

## Sequencing recommendation

Given tonight's rate-limiting pressure and the explicit instruction to run one agent at a time:
tackle **one category per dispatch**, in the priority order above, each producing its own set of
`{type}.html` pages plus an update to a running `00-test-cases.md`. Confirm the Open-vs-View fix
is live before starting category 1. Re-verify the pilot's own flagged "NOT OBSERVABLE" cases via
`Open` as part of (or right before) category 1's pass, since that's effectively free — same forms,
same session, corrected viewing method.
