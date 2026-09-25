# Runbook: Test an Atlas Forms Control Type via MCP + Form Studio

**Use this when asked to test/document one or more Atlas Forms control types' real rendered
behavior** — building a property-combination reference page, verifying a control renders correctly,
or extending `Documentation\Employees\agentic-development-engineers\form-development-engineer\
test-results\test2-control-reference\` to a new category. Written from a real, live pilot run
(2026-09-10, Input category, 14 controls) — every step below was actually executed, not theorized.

## 0. Read before you build anything

1. `..\..\..\Knowledge\Form\atlas-forms-rag\v2\00-overview.md` — the control type index and the FormSchema top-level shape. **Read the
   "not every real Atlas_Forms row uses this shape" section** before sampling any existing form from
   the database for reference — `NODE-FORM-CONFIGURATION`-type rows use a completely different,
   incompatible raw JSON Schema convention.
2. `..\..\..\Knowledge\Form\atlas-forms-rag\v2\01-common-properties.md` — every control's shared fields (id/type/order/label/required/
   validation/etc.) so you don't reinvent field names per control.
3. `..\v2\controls\{type}.md` for every control type you're about to test — these are the real,
   code-verified `config` shapes. If a doc is missing or looks wrong once you've tested it live,
   **fix it directly** — you're the one with fresh ground truth, don't just note the gap and move on.

## 1. Batch controls into forms — don't create one form per control

Real, measured result from the pilot: 3 forms covered 14 controls (21 property-combination
instances) instead of 14 separate `create_form` calls. Group by category (Input/Display/Charts/
Gauges/Layout/etc., per `00-overview.md`'s own grouping), ~5-8 controls per form. Put multiple
property variants of the same control type as separate control instances in the same form (e.g.
three `text` controls — minimal, pattern-validated, autoComplete-off) rather than three separate
forms — one screenshot then shows every variant at once.

## 2. The real MCP call sequence (proven working, use exactly this shape)

Raw JSON-RPC 2.0 over HTTP via curl against `http://localhost:5001/mcp` (Streamable HTTP, plain
HTTP — no TLS complications), header `X-Api-Key: <a real scoped key>`:

1. `initialize` → capture the `mcp-session-id` response header.
2. `notifications/initialized` (same session header).
3. `tools/call` → `create_form` with `arguments: {name, schema: <FormSchema JSON as a STRING>,
   formCode, title, formCategoryID: null, formTypeID: null}`. **Every optional parameter must be
   sent as explicit JSON `null` if unused — omitting the key entirely throws inside the SDK's
   argument binder before your call ever reaches the tool.** This is a documented, general
   calling-convention gotcha (see `Documentation\Employees\agentic-coding\test-plan\
   04-09-mcp-optional-params-must-be-explicit-null.md`), not specific to `create_form`.
4. Build the request JSON via a small Node script (`JSON.stringify`), never hand-escaped shell
   strings — the schema-within-a-JSON-string nesting makes manual escaping error-prone and easy to
   get subtly wrong.

## 3. Verify against the real database, not just the tool's own "success" response

A `dotnet`/MCP tool returning `{"success": true}` proves the call didn't error — it doesn't prove
the data landed the way you intended. Cross-check with `sqlcmd`:

```
sqlcmd -S "localhost\SQLEXPRESS" -d data-ocean-platform-prod -E -C -Q "<query>"
```
(find the real binary under `C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\{170,180}\Tools\
Binn\` if not on PATH; connection details also at `C:\BizFirstGO_FI_AI\BizFirstFiDB\.claude\
connectonstring.md`). The `Atlas_Forms.[Schema]` column is legacy `ntext` — wrap it in
`CAST([Schema] AS NVARCHAR(MAX))` before any `OPENJSON`/JSON function will touch it, and bracket-quote
`[Schema]` (it's a reserved word). **Only ever `SELECT`** — this is a real, shared database other
sessions may be using; never `UPDATE`/`DELETE` anything you didn't create yourself via MCP in this
same run.

## 4. Screenshot in Form Studio — real gotchas, in order encountered

1. Navigate to `http://localhost:6121/formstudio/design`, use the search box (search by **FormID**,
   not name — the name-search backend bug wasn't live-fixed as of this pilot, check
   `test1-mcp-coverage.html`'s findings for current status).
2. **Always `triple_click` (or click + `ctrl+a`) the search box before typing a new FormID** — a
   plain click-then-type concatenates onto whatever text is already there from a prior search.
3. Click "View" (identical to "Open" — confirmed same component, `FormPreviewModal` →
   `FormRenderer` in `mode="view"`) to see the schema rendered.
4. **After any MCP write to a form you already have open/cached, close the modal AND fully
   `navigate()` to the list URL again — not just close-and-reopen the same modal.** The dashboard
   caches its fetched form list in React state and does not invalidate it on modal reopen; only a
   real page navigation forces a fresh fetch. Confirmed live: an `add_form_control` call was
   completely invisible through reopen-the-same-modal, but appeared immediately after a full
   navigation + re-search.
5. **This "View" preview is structural, not a true fill-and-render simulation.** Confirmed
   limitations found this pass: it does not render `placeholder` text, cannot visually distinguish
   `checkbox`'s boolean vs. group mode (both show "No"), and does not render display-only content
   controls' actual `config.content`/`config.src` (a gap already flagged from a prior session's
   testing). It DOES correctly resolve computed values — `defaultValue`, boolean states — even for
   controls whose other `config` properties it otherwise ignores visually. For anything whose whole
   point is visual config, cross-check the real Designer/Edit canvas or a live fill session, don't
   rely on this preview alone.
6. Take one screenshot per logical group of controls (a full form, or a scrolled section) rather
   than one screenshot per control — most categories fit 5-8 controls per screenshot at 1568px
   width before scrolling is needed.

## 5. Write the deliverables

- One `{control-type}.html` per control tested, in `test-results\test2-control-reference\` (or the
  next category's own subfolder if this becomes a larger, multi-pass effort) — real config table,
  every variant's real JSON, a labeled screenshot per variant (never a bare `<img>` with no
  caption), and a gotchas section for anything the preview couldn't show or got wrong.
- One `00-test-cases.md` per category batch — a durable, HTML-independent test-case table (property
  combination → expected behavior → real result) so a future pass can extend coverage without
  re-deriving the config shapes or the batching ratio.
- **Feed real findings back into `..\v2\controls\{type}.md` and `..\..\..\Knowledge\Form\atlas-forms-rag\v2\00-overview.md`/
  `01-common-properties.md` directly** — don't let a doc correction live only in your own test
  report. This runbook itself should be updated the same way if you find a step here that's now
  wrong or incomplete.

## 6. Known open items from the pilot run (2026-09-10, Input category — now complete, 14/14)

- **Session-expiry gotcha (resolved for this run, keep documenting for future ones)**: mid-run, the
  browser session expired and redirected to the Passport login page. Do **not** click through a
  pre-filled login form yourself — entering credentials or submitting a login is off-limits even when
  a field is already populated by browser autofill. This was a transient auth-session issue, not a
  standing blocker: once the human re-authenticated and enabled auto-login, a plain page refresh
  restored an authenticated session with no further action needed. If this recurs, stop and report it
  rather than attempting to work around it — don't assume it's unrecoverable, but don't try to log in
  either.
- The checkbox group-vs-boolean preview bug (§4.5) and a second, newly-confirmed one — `json-editor`
  with an object `defaultValue` renders the literal text "[object Object]" instead of `{}` (the
  preview's value formatter needs `JSON.stringify()` for object values on this control, matching what
  `EndUserFormView` already does correctly elsewhere) — were both found but not root-caused/fixed in
  code. Worth a real fix if this preview keeps being used for verification work, not just documented
  as a standing gap indefinitely.
- Remaining categories, in the same "~1 form per 5-8 controls" ratio: Display (~15), Charts (13),
  Gauges (6), Layout (18), Advanced Input (15), File/Code (6), Media (10), Other (~7), Form-Scope
  Plugins (9) — roughly 99 controls, ~15-18 forms at this pilot's ratio.
