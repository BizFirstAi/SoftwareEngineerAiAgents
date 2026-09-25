# Create Entity Search + Edit Form (Table → App Studio, end to end)

**@agent** — Reusable agent for turning any real SQL Server table into a working
**Search + Edit** experience in App Studio: two Atlas Forms (search/results/edit), an
`Entity_Entities` registration, a test app with a bound Form Widget, and a real,
screenshot-verified E2E pass. This is "Task 12" in Binoy's own numbering (2026-09-04) —
the formalized, reusable version of the manual process first done for `Jobs_Definitions`
("Task 19", same night). That run is this doc's own worked example — every convention
and gotcha below was learned building it, not theorized.

**Reference Implementation:** `Jobs_Definitions` — `Atlas_Forms_30600`/`30601`
(`BizFirstFiDB/.../dbo/Data/AtlasForms/06_GenericCrud/`), `Entity_Entities` row
`jobs-definitions` (`dbo/Data/GenericCrud/Entity_Entities.JobsDefinitionsTask19.data.sql`).
Where this doc says "see the reference," it means these exact files.

**Reference control-type/schema library:**
`Documentation\Employees\agentic-coding\atlas-form-automation-project\atlas-forms-rag\v2\`
— `controls/*.md` documents every Atlas Forms control type in depth (one file per
control, e.g. `controls/checkbox.md`, `controls/number.md`, `controls/grid.md`,
`controls/select.md`), `worked-examples/*.json` are full real form schemas, and
`00-overview.md`/`01-common-properties.md`/`validation-rules.md`/`conditional-logic.md`
cover the schema format itself. **Consult this folder for the authoritative control-type
reference — don't guess a control's config shape.** (On "and rag" in Binoy's original
request: this existing folder appears to already be exactly what he meant — a
well-structured, standing reference collection for Atlas Forms authoring. This agent
doesn't build a new/separate RAG pipeline; it reads from and adds worked-example value to
this one. If Binoy meant something more specific — e.g. an actual vector-embedded
retrieval index over these files — that's an open question, not something this doc
assumes; ask him directly if it comes up.)

**Maintains:** nothing external yet — no `list-of-entity-forms@agent.md` sibling index
exists (unlike `create-community-node@agent.md`'s `list-of-community-nodes@agent.md`).
Consider creating one after the 2nd or 3rd real run, once there's enough to index.

---

## How to Use This Agent

Your programmer gives you a table. Everything else is either derived by inspecting the
real schema, or asked as an explicit question below — **never guessed**, because wrong
guesses here fail silently or corrupt data (see §Gotchas).

### Step 0 — Ask the user these specific questions, in this order

Don't paraphrase this into a vague "any preferences?" — ask each one:

1. **"Which table? Give me the schema+table name (e.g. `dbo.Jobs_Definitions`) or the
   path to its `.sql` file under `BizFirstFiDB/.../dbo/Tables/`."**
   - If they only give a table name, find the real `.sql` file yourself
     (`BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Tables/{TableName}.sql`) and read it
     — don't assume columns, read the real DDL.
   - **Check the table actually exists in the target dev database** (see §Gotchas — the
     `.sql` file existing in the repo does NOT mean the table exists yet; `Jobs_Definitions`
     didn't, and its FK dependency `Jobs_ExecutionStatuses` didn't either). If it's
     missing, tell the user and confirm before creating it — that's a bigger, more
     consequential action than seeding form data.

2. **"What's the Project Name?"** — used verbatim for the output folder:
   `C:\BizFirstGO_FI_AI\Documentation\Employees\agentic-testing-app-studio\widgets\form\entity-based-search\{Project-Name}\`
   (see Step 9 below for exactly what goes in it).

3. **"Which columns should be searchable (free-text and/or specific filters), and which
   are editable vs. read-only?"** Propose a default from the schema (every `nvarchar`
   column → free-text searchable via the built-in `SearchText`/LIKE mechanism if the
   target API supports it, see Step 2; every non-PK/non-audit column → editable) and let
   the user confirm or override — don't silently apply the default without showing it.

4. **"Any columns that need a specific control type beyond the SQL-type default?"** State
   your inferred defaults explicitly and ask for confirmation:
   - `BIT` → `checkbox` (top-level form) / `toggle` (grid column, read-only display)
   - `INT`/`BIGINT`/`DECIMAL` → `number`
   - `NVARCHAR`/`VARCHAR` → `text` (or `textarea` for long/description-like columns —
     ask, don't guess which)
   - `DATETIME`/`DATETIME2` → `text` (Atlas Forms date controls exist —
     `controls/date.md`/`controls/datetime.md` — but the reference form used plain `text`
     for display-only datetime columns like `LastRunAtUtc`; ask whether the user wants a
     real date picker for an EDITABLE date column, since that's a real control-type
     decision, not a display one)
   - A column that's a foreign key to a lookup table → offer a real `select` bound to
     that lookup's own list/search endpoint via `optionsSource` (see the reference form's
     `filter-document-type`/`documentTypeID` controls in `Atlas_Forms_30500`/`30501` for
     the exact `optionsSource` shape), not a bare numeric field. **This is a standing
     principle across this whole codebase this session — bare-ID fields are a known,
     repeatedly-flagged regression pattern.**

5. **"Confirm the CRUD permission flags"** — state your proposed
   `AllowRead`/`AllowSearch`/`AllowInsert`/`AllowUpdate`/`AllowDelete` values plainly (the
   reference used all five `= 1`, full CRUD, appropriate for an admin/internal table) and
   get explicit confirmation, especially before setting `AllowDelete = 1` on anything
   that isn't clearly safe to delete.

Do not proceed past this point until all 5 are answered.

---

## Agent Prompt

```
I need to build a Search + Edit Atlas Forms experience for a real SQL Server table,
register it through the generic entity API, stand up (or reuse) a test app with a bound
Form Widget, and run a real E2E test with screenshots, following the same process used
for Jobs_Definitions (Task 19, 2026-09-04).

**INPUTS (see Step 0 above — get all 5 before starting):**
- Table: [SCHEMA.TABLE — e.g. "dbo.Jobs_Definitions"]
- Project Name: [PROJECT_NAME — output folder name]
- Searchable/editable columns: [confirmed list]
- Control-type overrides: [confirmed list, if any]
- CRUD flags: [AllowRead/AllowSearch/AllowInsert/AllowUpdate/AllowDelete, confirmed]

**WHAT TO DO:**

1. **Read the real table schema.**
   Read `BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Tables/{TableName}.sql` directly
   — every column name, type, nullability, PK, FKs. Never assume a column exists or
   guess its type. Note the PK column name (needed for every `{{row.*}}` template below).
   Confirm the table (and any FK-referenced tables) actually exist in the target dev
   database (`sqlcmd -S ".\SQLEXPRESS" -d "data-ocean-platform-prod" -E -Q "SELECT COUNT(*)
   FROM {TableName}"` — if it errors "Invalid object name," it doesn't exist yet; apply
   the table's own `.sql` DDL file, and any FK-referenced table's DDL first, same as the
   reference run needed for `Jobs_ExecutionStatuses` before `Jobs_Definitions`). Watch for
   the filtered-unique-index `QUOTED_IDENTIFIER` gotcha — see §Gotchas.

2. **Detect the target API's response shape — this decides `dataRootPath` and is the
   single most important step to get right.**
   Two real API families exist in this codebase:
   - **The generic entity CRUD API** (`BizFirst.NoCode.Entities.*`, already live in the
     Consolidated WebApi at `POST/PUT/DELETE /api/v1/entities/{entityName}/...`) — the
     default choice for a table with no existing bespoke API (which is most tables).
     Returns records **wrapped**: `{ fields: { ColumnName: value, ... } }`, keyed by the
     real PascalCase column names (case-insensitive). Requires `dataRootPath: "fields"`
     on every grid link action that opens an edit/view sub-form, AND on every grid
     column's `dataBinding.fieldPath` (e.g. `"fields.JobName"`, not `"jobName"`).
   - **A bespoke module API** (e.g. Documents' `/api/v1/documents/*`) — only relevant if
     the table already has one; check first (`grep` the relevant `Base*Controller.cs`
     under `mvc-server/Go/{Module}/*.Api.Base/Controllers/`). Returns records **flat**:
     `{ documentName: ..., ... }`. No `dataRootPath` needed — omit it.
   Confirm which one applies by reading the real controller code (`BaseEntityController.cs`
   for the generic path, or the module's own `Base*Controller.cs` for a bespoke one) —
   don't infer from the table name alone.

3. **If using the generic entity API, write and apply the `Entity_Entities` insert.**
   New file at `BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/GenericCrud/
   Entity_Entities.{DescriptiveName}.data.sql`, following
   `Entity_Entities.JobsDefinitionsTask19.data.sql` verbatim as the template. Set
   deliberately, never leave defaulted:
   - `EntityName` — a kebab-case slug (e.g. `jobs-definitions`), this is the literal
     `{entityName}` route segment.
   - `SourceTypeID = 1` ("Table" — check `Entity_EntitySourceTypes.Table.data.sql` if the
     table needs a View or Query source instead, rare).
   - `SchemaName`/`TableName` — the real values from Step 1.
   - `TypeID` — `1` (Business Entity, transactional/domain data), `2` (Lookup Entity), or
     `3` (System Entity, platform/internal-infrastructure) — pick based on what the table
     actually is, state your reasoning.
   - `CategoryID` — leave `NULL` unless an existing `Entity_EntityCategories` row
     genuinely fits; don't invent a new category speculatively (see that seed file's own
     comment: "more categories get added whenever a real entity needs one").
   - The five `Allow*` flags — from the user's Step 0 answer #5, exactly.
   - `StatusID = 2` ("Allowed" — the allowlist gate; always this value for a reachable
     entity).
   `SET QUOTED_IDENTIFIER ON` at the top of the file (needed before any filtered-index
   creation elsewhere in the same session — see §Gotchas). Apply with `sqlcmd ... -i
   {file} -b`, then verify with a direct `SELECT` against `Entity_Entities`.

4. **Write the two Atlas Forms (Search + Edit) and insert them live.**
   New folder `BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/AtlasForms/
   06_GenericCrud/` (reuse it — Jobs_Definitions' forms already live there; this is the
   established home for generic-entity-API-backed forms, parallel to `03_Documents/` for
   the bespoke-API pattern) if it doesn't already exist for this run. Two files, following
   `Atlas_Forms_30600_*`/`Atlas_Forms_30601_*` as the structural template line for line:
   - **Search form**: filter section (SearchText + Step 0 #3's confirmed filters) +
     results grid (Step 0 #3's confirmed display columns, each with `dataBinding.
     fieldPath` if `dataRootPath` applies) + row actions (View/Edit/Delete links) + an
     "Add New" button (`createForm` config, targeting the Edit form's FormID) +
     `apiActions[0]` with `trigger: "search"`, real `payloadMapping`/`responseMapping`.
   - **Edit form**: one control per editable/viewable column, using the confirmed
     control-type mapping from Step 0 #4. Control IDs must exactly match the real column
     names the target API expects (PascalCase for the generic entity API; whatever the
     real DTO property names are for a bespoke API — check the DTO class directly, same
     as this doc's own author had to for `Document.cs`).
   - **On the Edit action inside the Search form**, wire real Save persistence — see
     Step 5, don't skip it (this was the exact gap this whole agent process exists to
     avoid repeating).
   Pick two unused `FormID`s (query `SELECT MAX(FormID) FROM Atlas_Forms WHERE FormID
   BETWEEN {range}` in whichever numeric block your target folder already uses — 305xx is
   Documents, 306xx is GenericCrud as of this doc). Use `SET IDENTITY_INSERT [dbo].
   [Atlas_Forms] ON` + `IF NOT EXISTS(...) INSERT` **followed by an unconditional
   `UPDATE ... WHERE FormID = {id}`** in the same file (see §Gotchas — without the UPDATE,
   re-running the file after the first apply is a silent no-op and a fix never reaches
   the live row). Apply both files with `sqlcmd`, then verify with `SELECT FormID,
   ISJSON(CAST([Schema] AS NVARCHAR(MAX))) FROM Atlas_Forms WHERE FormID IN (...)` — must
   return `1` for both.

5. **Wire real Save persistence on the Edit action — do not skip this.**
   The Atlas Forms grid's row-level "Edit" action, by default, only updates the grid's
   own local browser state — it never calls a backend endpoint (a real, confirmed gap in
   `atlas-forms/packages/player-components-react`'s `GridControl.tsx`/`GridEditModal.tsx`,
   found and fixed 2026-09-04). The fix already exists as a real, shared, opt-in
   capability on the grid link's `kind: "form"` action — set these two/three fields on
   the `_actionEdit` link's `action` object in the Search form:
   - `saveEndpointTemplate` — e.g. `"/api/v1/entities/{entityName}/{{row.fields.
     {PKColumnName}}}"` (generic entity API) or `"/api/v1/{module}/{{row.
     {pkFieldName}}}"` (bespoke API, flat row — no `fields.` prefix). Same `{{row.*}}`
     interpolation the `delete` action already uses.
   - `saveMethod` — `"PUT"` (the generic entity API's real convention; check the bespoke
     module's real controller for its own verb if different — Documents also uses `PUT`).
   - `dataRootPath` — `"fields"` for the generic entity API, omit entirely for a flat
     bespoke API. Get this from Step 2's detection, not a guess.
   Verify the real update endpoint's request-body shape by reading the controller
   directly before wiring — the generic entity API expects `{ data: {ColumnName: value,
   ...} }` (loosely typed, `GenericEntityRecordMapper` coerces JSON types — this is why
   Step 0 #4's control-type choices matter: a `text` control on a `BIT` column sends a
   JSON string `"true"`, which does NOT implicitly convert to SQL `BIT` and the save will
   fail); a bespoke module API's `UpdateWebRequest.Data` typically deserializes straight
   into a real typed C# entity — read that entity class's real property names directly
   (do not assume they match the form's control IDs without checking) before wiring the
   endpoint.

6. **Stand up an app to host the test widget.**
   Prefer reusing an existing App Studio test app if one already fits (check for one
   before creating a new one — ask the user if unsure which to use). Otherwise clone the
   standard template: `src\app-templates\apps\app-template` →
   `src\{new-project}\apps\{new-project}-studio` (mirror the FlowInsights build's own
   process from the same night: rename package/title identifiers, pick an unused dev port
   by checking sibling apps' `vite.config.ts` files first, wire into the monorepo
   workspace file). This is heavier than Step 3/4 — if a lighter existing App Studio test
   app (e.g. one already used for prior widget testing this session) genuinely covers the
   need, use that instead and say so; don't default to a fresh app clone if the task
   doesn't need one.

7. **Insert a test widget bound to the Search form.**
   In App Studio Designer: add a **Form Widget** (`widgetType: 'form'`,
   `widget-handlers-form-widget`), bind its `Form` field to the Search form's FormID, set
   **Render Mode = View** (not List/Edit/Create — those route through a different,
   non-FormRenderer code path (`ListView`) that doesn't understand this form's own
   internal search/grid/apiActions; "View" mode renders via `FormRenderer` directly and
   still fully executes the form's own `search`/`button-click` apiActions regardless of
   the render mode — confirmed by reading `FormWidgetRenderer.tsx`'s `FormView` directly).

8. **Run a real E2E test and take screenshots.**
   Open the app in App Player (not just the Designer canvas) via claude-in-chrome:
   - Load the page with the Search form widget. Screenshot.
   - Type into the search filter, submit, confirm real rows come back. Screenshot.
   - Click a row's **Edit** action, change a field, Save. **Confirm it actually
     persisted** — reload the page / re-run the search and check the new value is still
     there, don't just trust the modal closing without an error. Screenshot the saved
     result.
   - If `AllowInsert=1`, exercise "Add New" too and confirm the new row appears in a
     subsequent search. Screenshot.
   - Check the browser console for errors on every step (`read_console_messages`,
     `onlyErrors: true`) — a page that "looks right" with a silent console error is not a
     pass.
   If the WebApi is down when you reach this step: do NOT attempt to restart it yourself
   unless the user has explicitly said this session owns that responsibility — check
   status first (`curl --max-time 5 http://localhost:10001/api/v1/health`), report if
   down, do every step up through static/DB-level verification (JSON validity, DB row
   confirmation) so the work is ready to test the instant it's back up, and say so plainly
   rather than silently marking anything "done."

9. **Write logs/screenshots to the run's output folder and report to the user.**
   `C:\BizFirstGO_FI_AI\Documentation\Employees\agentic-testing-app-studio\widgets\form\
   entity-based-search\{Project-Name}\` — create it if it doesn't exist. At minimum:
   - `README.md` — what table, what was built (FormIDs, EntityID, app/widget location),
     pass/fail per E2E step from Step 8, any open issues.
   - Screenshots from Step 8, named by step (e.g. `01-search-form.png`,
     `02-search-results.png`, `03-edit-saved.png`).
   Report back to the user with a summary and the screenshots, and where the run's folder
     lives.

---

## Widget-instance overrides and alternate result views (added 2026-09-04, real & verified)

Two platform capabilities landed the same night as this doc, on the SAME Form Widget
mechanism this whole process builds against (`widget-handlers-form-widget`). Both are
real, live-verified, and safe to reference/offer in Step 0 — but they're new; if a future
run of this agent finds either behaves differently than described here, trust the live
code over this doc and flag the drift.

**1. `formOverrides` — per-widget-instance behavior overrides, no form-schema edits.**
When placing a Form Widget bound to a Search-style form (Step 7), the widget's own
Configuration JSON can carry a `formOverrides` block that overrides three of the bound
form's `FormMetadata` flags for THIS placement only — the same form definition can be a
full search UI in one widget and a filtered, list-only view in another:
```json
"formOverrides": {
  "hideSearchFilterArea": true,
  "autoSearchOnLoad": true,
  "searchResultViewMode": "grid"
}
```
- `hideSearchFilterArea` → CSS-hides the filter section (fields stay mounted/bound, so a
  hidden filter can still be pre-populated programmatically) — maps to schema
  `metadata.hideFilterArea`.
- `autoSearchOnLoad` → fires the real search on mount instead of waiting for a button
  click — maps to schema `metadata.searchOnLoad`.
- `searchResultViewMode` → `'grid' | 'cards' | 'gallery'` (see next section) — maps onto
  every `type: 'grid'` control found in the bound form's schema.
An omitted `formOverrides` (or any omitted field within it) leaves the form's own schema
value completely unchanged — this is additive, not a replacement. Designer UI: open the
Form Widget's edit screen, a master "Override this form's search behavior for this widget
instance only" toggle gates dedicated checkboxes/dropdown for these three, PLUS a generic
"Additional Parameters" key-value list for any other override (see that section's own
edit for the exact data-shape decision it landed on — check `WidgetEditorFields.tsx`
directly if this doc and the code ever disagree).

**2. Grid `viewMode` — cards/galleries instead of a plain data table.**
Any `type: 'grid'` control in a form's own schema can set (independent of the widget
override above — this also works authored directly into the form, e.g. for a form never
embedded as a widget):
```json
"config": {
  "viewMode": "cards",
  "cardTemplate": {
    "titleField": "documentName",
    "imageField": "thumbnailUrl",
    "subtitleField": "originalFileName",
    "descriptionField": "description",
    "metaFields": ["documentType", "fileSizeBytes"]
  }
}
```
`viewMode` defaults to `'grid'` (today's plain table, zero change if unset). `'cards'` and
`'gallery'` reuse the exact same data-fetch/pagination/row-action plumbing as the table —
row actions (View/Edit/Delete) and pagination all still work identically. `titleField` is
the only required `cardTemplate` field; everything else is optional. `'gallery'` always
reserves an image slot (its defining trait vs. `'cards'`, which only shows an image when
`imageField` is explicitly set). Designer UI: `GridEditor.tsx`'s "View mode" selector,
with a conditional card-template field-picker section populated from the grid's own known
columns.
**Known gotcha inherited from this feature's own build**: the card-template field pickers
(and the grid's other column tooling) read `config.columns` — a schema authored with
`"id"` instead of `"key"` on its column definitions needs the same `id`→`key` fallback
`GridControl.tsx` already applies at render time, or the pickers show zero options. If a
future form's field pickers come up empty, check which key name its `columns` array
actually uses before assuming a bug.

---

## Gotchas (learned building the Jobs_Definitions reference run — real, not theoretical)

- **A `.sql` file existing in the repo's `dbo/Tables/` folder does NOT mean the table
  exists in the target dev database.** Check first; don't assume.
- **Filtered unique indexes (`WHERE [Deleted] = 0`) fail with a `QUOTED_IDENTIFIER` error
  under `sqlcmd` unless `SET QUOTED_IDENTIFIER ON;` is the first statement in the file/
  batch.** Every seed/DDL file this process writes should start with it.
- **`IF NOT EXISTS(...) INSERT` alone makes a seed file a one-time-only operation** — a
  real fix authored after the first apply silently never reaches the live database on a
  re-run. Always pair it with an unconditional `UPDATE` for anything meant to be
  iteratively refined (forms especially, since schema authoring is inherently iterative).
- **Control-type choice is not cosmetic for the generic entity API** — a `text` control on
  a `BIT`/`INT` column sends a JSON string, which the generic API's `GenericEntityRecordMapper`
  stores as a literal string; SQL Server does not implicitly convert a string like `'true'`
  to `BIT` (numeric strings to `INT` often do implicitly convert, but don't rely on it —
  use real `checkbox`/`number` controls).
- **Grid Edit ≠ persisted, by default.** Never assume a `kind: "form"` link action's Save
  button calls a backend endpoint unless `saveEndpointTemplate` is explicitly set (Step
  5). This was true of the ORIGINAL Documents reference forms too until fixed the same
  night this doc was written — don't copy an old form's Edit action config without
  checking whether it actually has `saveEndpointTemplate` set.
- **A row's field values may be flat or `fields`-wrapped depending on which API backs the
  form** — this is the #1 place a copy-pasted form breaks silently (fields render blank
  on Edit, or Search results show nothing where a value should be). Always confirm which
  shape via Step 2, never assume it matches whatever the last form you wrote used.
