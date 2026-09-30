# Atlas Forms — Search / Results / Edit Form: Design & Schema for Review

**Status: draft, for review.** Built entirely on capabilities confirmed real in
`atlas-forms-architecture-overview.md` and the repo's own `FORM_SCHEMA_CORRECTED.json`
worked example — not guessed from control-type names. §5's three trigger/mapping
questions were open as of the first draft; they were resolved 2026-09-01 by directly
reading the real runtime source (see §5 for the full evidence). §8's auth question was a
genuine build item as of that date — **now RESOLVED 2026-09-02**, along with §5 Q2's
outgoing-`payloadMapping` inversion bug and §5 Q3's `load`-only response-mapping gap (via
a new `'search'` trigger, not by extending `'submit'`/`'button-click'` — see the update
notes inline in §1, §5 Q2/Q3, and §8 below, and `pages-player-react`'s and
`pages-studio-react`'s own `DevelopmentHistoryLog.md` 2026-09-02 entries for full
implementation/verification detail). Everything else is grounded in code that was
actually read.

## 1. Goal

**Regrounded 2026-09-01 against a real table and a real, shipped app** — replacing the
earlier "Page search" placeholder. Table: `Doc_Documents`
(`BizFirstFiV3DB\dbo\Tables\Doc_Documents.sql`). Reference app: **Document Manager**
(`BizFirstAiStudio\src\doc-app\apps\document-manager`), specifically its
`DocumentsExplorer` page component (`@doc-app/react`). Full sourcing/citations in §7.

A form that lets a user:
1. See a list of the tenant's documents (loaded automatically when the form opens —
   the real app has no separate "Search" click; see the grounding note below).
2. Narrow the list down by document name / filename / description / classification
   text, and by Document Type / Document Category — in the real app this filtering is
   **100% client-side** over the already-loaded list, not a server round-trip (§7).
3. Open a document and edit its light metadata (name, description, type, category,
   classification tag) — the real editable field set, per `DocumentEditForm.tsx`.

**Grounding note that changes this design from the earlier placeholder version:** the
real Document Manager app has **no free-text search API**.
`DocumentSearchBar.tsx`'s own code comment says so directly: *"there is no free-text
search endpoint on the backend (`BaseDocumentController` only exposes list/type/
category/submission lookups)."* The real UI fetches the entire document list once
(`DocumentClient.list()` → `POST /api/v1/documents/list`) and filters in the browser
on every keystroke/dropdown change. §3's schema below is adjusted to match that
reality: one `load`-triggered `apiAction` populates the grid with the full list; the
filter controls are correspondingly **not** wired to a `submit` apiAction, because the
real app they're modeled on doesn't have one either.

This form is destined to become an App Studio widget (a separate, later step) — the
schema below is scoped to Atlas Forms alone, no App Studio-specific wiring in it.

## 2. Why it's designed the way it is

- **Filters are plain input controls.** Atlas Forms has no dedicated "filter" control
  type — confirmed. Each filter criterion below is an ordinary `select`/`text`/
  `date-range-picker` control.
- **Results table is the `grid` control**, not `editable-grid`/`display-grid` —
  confirmed those two are built but never registered in the shipping Player, so they
  render nothing. `grid` is the real, working editable-table control (add/delete/edit
  via `config.buttons[]`, columns via `config.columns[]`).
- **Search is modeled as a form `submit`, not a button `click` — now confirmed
  correct, not just the safer inference.** A per-button trigger does exist in the
  schema-authoring type (`ApiAction.trigger` in `controls-form-actions-react`
  includes `'button-click'`, offered in the Studio's own action-editor dropdowns),
  but direct reading of every real runtime consumer (`AtlasFormsStudioApp.tsx`'s
  preview, `FormPlayerPage.tsx`'s trigger handling) found **no code path that
  actually fires a `trigger: 'button-click'` action** — it's authorable but dead at
  runtime. `submit` is the most mature, closest-to-working trigger that real code
  actually checks for. Full evidence in §5 Q1.
- **This schema assumes the Form-Actions Player bug is fixed — and one further,
  newly-found runtime gap is also fixed.** As currently shipped, `apiActions[]` are
  authored correctly but never fire in the real deployed Player (confirmed bug,
  separate fix in progress — see the architecture overview §7). **This pass found a
  second, independent gap while confirming §5's questions**: even where
  `apiActions[]` *do* fire (e.g. in the Studio's own preview, which already has the
  metadata-field bug worked around), the code that maps an API response back onto a
  control only runs for `load`-triggered actions — never for `submit`. That means,
  as of today's code, a `submit`-triggered search action can never populate
  `results-grid`, independent of the already-known Player bug. See §5 Q3 for the
  full trace and exactly what needs to change. This schema is written against the
  *intended*, correct behavior for both gaps — don't try to use it against
  unpatched code.
  - **Update 2026-09-01 — precise status, one blocker resolved, two remain.** The
    base Form-Actions Player bug referenced above (the `schema.metadata?.formActions`/
    PascalCase-trigger read, real Player never firing any `apiActions[]` at all) is
    now **fixed** — see `pages-player-react/DevelopmentHistoryLog.md`'s 2026-09-01
    entry and `atlas-forms-form-actions-player-bug-fix-design.md`'s RESOLVED status
    note. This does **not** remove either blocker this schema still depends on:
    the `load`-only response→control mapping gap (§5 Q3, directly referenced above)
    and the outgoing-`payloadMapping` inversion bug (§5 Q2) are both explicitly
    unchanged, confirmed carried-forward-as-is by that fix's own scope (it targeted
    only the base metadata-field bug, not these two separately-flagged items). This
    schema's §3 (`load`-triggered, response-mapping only) is therefore now real,
    working, and buildable against current code; §4B's `submit`-triggered redesign
    (§4B.3 items 2/3) still is not — the same two items previously listed there
    remain accurate and unresolved.
  - **Update 2026-09-02 — both remaining blockers now RESOLVED, plus the auth gap —
    with one important nuance for §4B's schema.** §5 Q2's outgoing-`payloadMapping`
    inversion bug and §5 Q3's `load`-only response-mapping gap are both fixed, in both
    `FormPlayerPage.tsx` (the real Player) and `AtlasFormsStudioApp.tsx` (the Studio's
    own preview) — see each package's own `DevelopmentHistoryLog.md` 2026-09-02 entry
    for full detail, live-verification evidence, and exact diffs. **The response-mapping
    fix did NOT extend to the `submit` trigger** (§4B.1's schema uses `trigger:
    "submit"`) — instead, per the task's explicit direction, a new, separate `'search'`
    trigger was added (`ApiAction.trigger` now includes `'search'` alongside the
    existing values), which fires the same way `'button-click'` already does (bound to a
    `type: 'button'` control's `onClick`) but DOES map its response back onto a control,
    unlike `'button-click'`. **§4B.1's schema as currently written (`"trigger":
    "submit"`) will still not populate `results-grid` — it needs `"trigger": "search"`
    instead**, and its `search-submit` control (`type: 'submit'`) needs to become a
    `type: 'button'` control instead, to actually fire via the now-working mechanism.
    This is a small, mechanical schema-authoring correction, not a design change — the
    actual "build the Documents search form" step (still explicitly out of scope, queued
    as a follow-up) should author it with `trigger: "search"` and a `button` control
    from the start. §8's auth gap is also now resolved — see §8's own 2026-09-02 update
    note below.
- **Update (real Documents grounding, §7): the "click Search"-as-submit assumption
  above doesn't match the real reference app.** Document Manager has no search
  button/submit at all — it loads everything when the page opens and filters
  client-side from then on (see §1's grounding note). §3's `apiActions[]` entry below
  therefore uses `trigger: "load"`, and the filter controls have no apiAction attached.
  The `submit`-vs-`click` trigger question from §5 is unaffected by this — it just
  doesn't end up mattering for this particular real-world example, since neither is
  used here.

## 3. The schema

```json
{
  "version": "1.0",
  "metadata": {
    "formID": "form-documents-search-results-edit",
    "title": "Documents",
    "code": "documents_search_results_edit_v1"
  },
  "sections": [
    {
      "id": "section-filters",
      "title": "Filters",
      "order": 0
    },
    {
      "id": "section-results",
      "title": "Documents",
      "order": 1
    }
  ],
  "controls": [
    {
      "id": "filter-search",
      "type": "text",
      "label": "Search (name, filename, description, classification)",
      "sectionId": "section-filters",
      "order": 0,
      "required": false,
      "readonly": false,
      "disabled": false,
      "hidden": false
    },
    {
      "id": "filter-document-type",
      "type": "select",
      "label": "Document Type",
      "sectionId": "section-filters",
      "order": 1,
      "required": false,
      "readonly": false,
      "disabled": false,
      "hidden": false,
      "config": {
        "options": [
          { "label": "Any", "value": "" },
          { "label": "Identity Document", "value": "ID_DOCUMENT" },
          { "label": "Proof of Address", "value": "PROOF_ADDRESS" },
          { "label": "Contract", "value": "CONTRACT" },
          { "label": "Invoice", "value": "INVOICE" },
          { "label": "Bank Statement", "value": "BANK_STATEMENT" }
        ]
      }
    },
    {
      "id": "filter-document-category",
      "type": "select",
      "label": "Document Category",
      "sectionId": "section-filters",
      "order": 2,
      "required": false,
      "readonly": false,
      "disabled": false,
      "hidden": false,
      "config": {
        "options": [
          { "label": "Any", "value": "" },
          { "label": "Legal", "value": "LEGAL" },
          { "label": "Financial", "value": "FINANCIAL" },
          { "label": "Identity", "value": "IDENTITY" },
          { "label": "Compliance", "value": "COMPLIANCE" },
          { "label": "HR", "value": "HR" }
        ]
      }
    },
    {
      "id": "results-grid",
      "type": "grid",
      "label": "Documents",
      "sectionId": "section-results",
      "order": 0,
      "required": false,
      "readonly": false,
      "disabled": false,
      "hidden": false,
      "config": {
        "columns": [
          { "field": "documentName", "label": "Name", "type": "text" },
          { "field": "originalFileName", "label": "File name", "type": "text" },
          { "field": "documentTypeID", "label": "Type", "type": "text" },
          { "field": "documentCategoryID", "label": "Category", "type": "text" },
          { "field": "fileSizeBytes", "label": "Size (bytes)", "type": "text" },
          { "field": "lastModifiedOn", "label": "Last Modified", "type": "text" }
        ],
        "buttons": ["edit", "delete"]
      }
    }
  ],
  "apiActions": [
    {
      "id": "action-load-documents",
      "name": "Load Documents",
      "trigger": "load",
      "endpoint": "/api/v1/documents/list",
      "method": "POST",
      "payloadMapping": {
        "results-grid": "data"
      },
      "headers": {},
      "onSuccess": "none",
      "onError": "none"
    }
  ],
  "styles": {}
}
```

**Notes on the JSON above:**
- `sections[]` groups the filter controls apart from the results grid — confirmed
  `FormSchema.sections?` is a real, optional top-level field.
- **The real endpoint (`/api/v1/documents/list`, `POST`) is confirmed live**, not a
  placeholder: `DocumentClient.list()`
  (`packages/@doc-app/api-client/src/documentClient.ts`) calls it, and it's backed by
  `BaseDocumentController.GetAll` (`[HttpPost("list")]`,
  `BizFirstFi.Go.Documents.Api.Base.Controllers.BaseDocumentController`). It's relative
  (no host/scheme baked in) because the real `HttpClient` is constructed with a
  separate `baseURL` — see §7.
- `payloadMapping` now has exactly **one entry, `"results-grid": "data"`** — this is
  the *response*-direction mapping (control ID → response path), now confirmed
  correct end-to-end; see §5 Q3 for the full evidence chain (both the Atlas Forms
  path syntax and the real backend envelope shape). There is still nothing to map on
  the *request*/outgoing side: the real `DocumentClient.list({ pageNumber?,
  pageSize? })` sends only pagination fields, never derived from any form control —
  this schema has no pagination controls, so there is no outgoing mapping to add yet.
  If pagination controls are added later, `pageNumber`/`pageSize` are the real
  request field names to map to (confirmed request-direction key/value semantics for
  when that's added: see §5 Q2).
- **The `results-grid` control has no `apiActions` of its own** — same shape as the
  earlier draft — but the meaning of that flipped: here it's populated by
  `action-load-documents` firing on `trigger: "load"` (page open), matching the real
  app's own on-mount fetch (`useDocumentsByTypeCode.ts` calls `documentClient.list()`
  in a `useEffect` with no dependency on any filter value). The earlier placeholder
  assumed the grid stays empty until a `submit`-triggered search runs; the real app
  does the opposite — it's never empty-by-design, filtering only ever narrows an
  already-loaded set. **This also turns out to be the only trigger for which
  response→control mapping is wired up at all today** — see §5 Q3 — so `load` isn't
  just the better fit for this real app's UX, it's also the only currently-working
  choice for getting the response into `results-grid` at all.
- **`filter-search` / `filter-document-type` / `filter-document-category` are
  deliberately not wired to any `apiAction`.** In the real app these filter the
  already-loaded list entirely client-side (`filterDocuments()` plus two in-memory
  `.filter()` calls in `DocumentsExplorer.tsx`) — there is no round trip to re-run.
  Whether Atlas Forms has any confirmed mechanism for a plain control's value to
  live-filter an already-populated `grid`'s rows without an `apiAction` was not found
  this pass (or in the architecture overview) — flagged as a genuine open gap in §7,
  additional to §5's list, not smoothed over by inventing a filtering mechanism.
- The dropdown `options[]` values above are real `DocumentTypeCode`/
  `DocumentCategoryCode` values from the seed data (`Doc_DocumentTypes.data.sql` /
  `Doc_DocumentCategories.data.sql`), shown as a representative subset — the real app
  does **not** hardcode these; it loads the live, tenant-scoped list via
  `DocumentTaxonomyClient.listTypes()`/`listCategories()` at runtime (see §7). Whether
  Atlas Forms' `select` control can source `options[]` dynamically from an API (versus
  the fixed list shown here) is unconfirmed this pass.
- `documentTypeID`/`documentCategoryID` grid columns show the raw numeric FK as
  authored here — the real `DocumentList.tsx` instead resolves these to names via a
  `typeNameByID`/`categoryNameByID` lookup map built from the same taxonomy calls
  above. No confirmed Atlas Forms `grid` column capability for resolving a foreign-key
  column to a joined display name was found this pass — flagged as another concrete
  gap, not invented around.

## 4. How this is meant to work end-to-end

1. **Form loads.** `action-load-documents` (`trigger: "load"`) fires immediately,
   calling `POST /api/v1/documents/list` with no filter payload. The response maps
   into `results-grid` via `payloadMapping: {"results-grid": "data"}` — both the
   response-direction convention (control ID → response path) and the exact `"data"`
   path for this specific endpoint are now confirmed; see §5 Q3 for the full evidence
   chain (the Atlas Forms path-parser behavior plus a direct trace of
   `BaseDocumentController.GetAll`'s real, unwrapped response shape). This matches the
   real app: `useDocumentsByTypeCode.ts` calls `documentClient.list()` once on mount,
   unconditionally.
2. `results-grid` renders every one of the tenant's documents — name, file name,
   type, category, size, last modified — the same columns Document Manager's own
   `DocumentList.tsx` renders (§7).
3. User types into `filter-search` and/or picks `filter-document-type` /
   `filter-document-category`. **In the real reference app this filters the
   already-loaded rows on every keystroke/change, with zero additional network
   calls** (`filterDocuments()` plus two `.filter()` calls in
   `DocumentsExplorer.tsx`). As flagged in §3's notes, no confirmed Atlas Forms
   mechanism was found this pass for a plain control's value to live-filter an
   already-populated `grid`'s rows without a round trip — this is the one part of the
   real app's behavior this schema cannot yet faithfully reproduce, and it's called
   out rather than glossed over.
4. User clicks the grid's built-in **Edit** button on a row (confirmed native
   capability of the `grid` control). **Note a real difference from the shipped app**:
   Document Manager doesn't edit inline in the grid at all — a row click navigates to
   a full document detail page (`DocumentDetailPage.tsx`), where a separate "Edit"
   button reveals `DocumentEditForm`. True inline-in-grid editing, as modeled here, is
   more ambitious than what's shipped today, but targets the exact same real,
   confirmed update contract: `PUT /api/v1/documents/{id}` with a partial body of
   `documentName` / `documentDescription` / `documentTypeID` / `documentCategoryID` /
   `classificationName` (the real editable field set, per `DocumentEditForm.tsx`'s
   `onSubmit` patch and `DocumentClient.update()`).
5. Saving calls that same real `PUT` endpoint and — once the Form-Actions Player bug
   is fixed — should refresh the corresponding row in `results-grid`.

## 4B. ENTERPRISE REDESIGN (2026-09-01) — supersedes §1-§4's client-filter design

**Binoy rejected §1-§4's design outright: "I dont like the design. We need
pagination, an explicit search/reset button and also server side filter. this is
enterprise system."** §1-§4 above are kept for history/comparison (they were an
accurate mirror of Document Manager's real, shipped UX), but this section is now the
live design. Three concrete changes:

1. **Explicit Search + Reset buttons**, not automatic load-and-filter.
2. **Server-side filtering** — filter values go to the backend as request
   parameters; the grid only ever shows what the server already filtered, never a
   client-side `.filter()` over a fully-loaded set.
3. **Pagination** — the grid shows one page of results at a time, not the whole
   tenant document set.

**Two things this redesign needs that §1-§4's design conveniently avoided needing —
stated plainly, not glossed over:**

- **Whether the real backend actually supports server-side filtering at all is
  UNVERIFIED as of this edit** — a dedicated research pass is running now (see the
  new §10 once it lands) to confirm whether `DocumentService.GetAllAsync` honors the
  `Filters: Dictionary<string, object>` field `StandardListRequest.cs` already
  carries, or whether real backend work is needed first. The schema below uses
  `nameContains`/`documentTypeID`/`documentCategoryID` as the outgoing filter keys —
  **these are a reasonable guess based on the confirmed request DTO shape, not yet
  confirmed against what the service layer actually reads.** Revise once §10 lands.
- **Switching to `submit` requires two currently-broken mechanisms to be fixed
  first**, both already documented in §5: (a) response→control mapping is wired only
  for the `load` trigger today — a `submit`-triggered search's response cannot reach
  `results-grid` until that's extended (§5 Q3); (b) the one real implementation that
  builds an outgoing request from `payloadMapping` does it backwards (§5 Q2, the
  `executeApiAction` key/value inversion bug). **This design is not buildable against
  today's code as-is — both are real, scoped, pre-existing gaps this redesign now
  depends on, not new problems it introduces.**

### 4B.1 Revised schema

```json
{
  "version": "1.0",
  "metadata": {
    "formID": "form-documents-search-results-edit",
    "title": "Documents",
    "code": "documents_search_results_edit_v2"
  },
  "sections": [
    { "id": "section-filters", "title": "Filters", "order": 0 },
    { "id": "section-results", "title": "Documents", "order": 1 }
  ],
  "controls": [
    {
      "id": "filter-search",
      "type": "text",
      "label": "Search (name, filename, description, classification)",
      "sectionId": "section-filters",
      "order": 0,
      "required": false, "readonly": false, "disabled": false, "hidden": false
    },
    {
      "id": "filter-document-type",
      "type": "select",
      "label": "Document Type",
      "sectionId": "section-filters",
      "order": 1,
      "required": false, "readonly": false, "disabled": false, "hidden": false,
      "config": {
        "options": [
          { "label": "Any", "value": "" },
          { "label": "Identity Document", "value": "ID_DOCUMENT" },
          { "label": "Proof of Address", "value": "PROOF_ADDRESS" },
          { "label": "Contract", "value": "CONTRACT" },
          { "label": "Invoice", "value": "INVOICE" },
          { "label": "Bank Statement", "value": "BANK_STATEMENT" }
        ]
      }
    },
    {
      "id": "filter-document-category",
      "type": "select",
      "label": "Document Category",
      "sectionId": "section-filters",
      "order": 2,
      "required": false, "readonly": false, "disabled": false, "hidden": false,
      "config": {
        "options": [
          { "label": "Any", "value": "" },
          { "label": "Legal", "value": "LEGAL" },
          { "label": "Financial", "value": "FINANCIAL" },
          { "label": "Identity", "value": "IDENTITY" },
          { "label": "Compliance", "value": "COMPLIANCE" },
          { "label": "HR", "value": "HR" }
        ]
      }
    },
    {
      "id": "search-submit",
      "type": "submit",
      "label": "Search",
      "sectionId": "section-filters",
      "order": 3,
      "required": false, "readonly": false, "disabled": false, "hidden": false
    },
    {
      "id": "search-reset",
      "type": "button",
      "label": "Reset",
      "sectionId": "section-filters",
      "order": 4,
      "required": false, "readonly": false, "disabled": false, "hidden": false,
      "config": {
        "resetForm": true
      }
    },
    {
      "id": "page-number",
      "type": "number",
      "label": "Page",
      "sectionId": "section-filters",
      "order": 5,
      "required": false, "readonly": false, "disabled": false, "hidden": false,
      "defaultValue": 1
    },
    {
      "id": "results-grid",
      "type": "grid",
      "label": "Documents",
      "sectionId": "section-results",
      "order": 0,
      "required": false, "readonly": false, "disabled": false, "hidden": false,
      "config": {
        "columns": [
          { "field": "documentName", "label": "Name", "type": "text" },
          { "field": "originalFileName", "label": "File name", "type": "text" },
          { "field": "documentTypeID", "label": "Type", "type": "text" },
          { "field": "documentCategoryID", "label": "Category", "type": "text" },
          { "field": "fileSizeBytes", "label": "Size (bytes)", "type": "text" },
          { "field": "lastModifiedOn", "label": "Last Modified", "type": "text" }
        ],
        "buttons": ["edit", "delete"],
        "pageSize": 25
      }
    }
  ],
  "apiActions": [
    {
      "id": "action-search-documents",
      "name": "Search Documents",
      "trigger": "submit",
      "endpoint": "/api/v1/documents/list",
      "method": "POST",
      "payloadMapping": {
        "filter-search": "filters.nameContains",
        "filter-document-type": "filters.documentTypeID",
        "filter-document-category": "filters.documentCategoryID",
        "page-number": "pageInfo.pageNumber",
        "results-grid": "data"
      },
      "auth": "passport",
      "headers": {},
      "onSuccess": "none",
      "onError": "none"
    }
  ],
  "styles": {}
}
```

### 4B.2 What changed vs. §1-§4, and why

- **`search-submit` (type `submit`) replaces the automatic `load` action.** Nothing
  fetches until the user clicks Search — matches "explicit search button," but means
  `results-grid` is genuinely empty on first render (a real UX tradeoff worth
  confirming is acceptable, since it's a deliberate departure from Document Manager's
  own "always show something" pattern).
- **`search-reset` (type `button`, `config.resetForm: true`) is a best-guess
  design, not a confirmed capability.** No prior research pass checked whether Atlas
  Forms has a real, working "reset all fields to default" mechanism on a `button`
  control — `config.resetForm` is written here as the obviously-correct shape for
  this to have, not as something read from real source. **Flagged as unconfirmed —
  needs the same reading-the-real-code treatment §5/§9 already got before this is
  trusted.**
- **`page-number` is a plain `number` control, not a dedicated pagination
  widget.** No prior research pass checked whether Atlas Forms' `grid` control (or
  any control) has a built-in Prev/Next/page-picker UI wired to re-triggering a
  search — the earlier client-side-filtering research (§9) mentioned the grid has a
  `features.pagination` capability, but explicitly in the context of paginating rows
  the grid *already has client-side* (via `getPage`/`totalPages` helpers), not
  server-driven "fetch page 2 from the API" pagination. Using a plain input control
  wired into `payloadMapping`'s outgoing side is the safest, most-certain-to-work
  pattern given what's actually confirmed, but a real dedicated pagination
  UI/control would be nicer — flagged as a possible follow-up, not blocking.
- **`payloadMapping`'s outgoing keys now use dotted paths** (`filters.nameContains`,
  `pageInfo.pageNumber`) to match `StandardListRequest.cs`'s real nested shape
  (`Filters`/`PageInfo` sub-objects) — **this nesting assumption is exactly what §10
  needs to confirm or correct.** If the backend doesn't actually read a nested
  `Filters` dictionary the way this assumes, these paths will need to change to
  match whatever §10 finds instead.
- **`results-grid`'s `config.pageSize: 25`** is carried over from the grid's own
  existing, confirmed `pageSize` field (§9.1's read of `GridConfig`) — this still
  only governs how the grid paginates whatever array it currently holds, not how
  many rows the server returns; the two need to agree once §10 confirms the real
  server-side page-size parameter name.

### 4B.3 Still open before this can be built for real

1. §10 (dispatched, running) — does the backend actually honor `Filters`, what keys,
   and what's the real pagination response shape (a total count field is needed to
   show "page X of Y" meaningfully, not just "next page exists or not").
2. ~~§5 Q2's outgoing-`payloadMapping` inversion bug — must be fixed for filter values
   to actually reach the backend correctly.~~ **RESOLVED 2026-09-02** — see §5 Q2.
3. ~~§5 Q3's `load`-only response-mapping gap — must be extended to `submit` for
   search results to ever reach `results-grid`.~~ **RESOLVED 2026-09-02** — via a new
   `'search'` trigger, not by extending `submit` itself; see §5 Q3. **This schema's
   §4B.1 JSON must be updated to use `"trigger": "search"` (and a `type: 'button'`
   control, not `type: 'submit'`) to actually benefit** — as still written with
   `"trigger": "submit"`, it remains unfixed by this resolution. Not corrected in
   §4B.1 itself yet, since actually building this form is still explicitly out of
   scope (queued as a follow-up) — flagged here so whoever picks that up doesn't
   assume the schema below is already correct.
4. ~~§8's auth gap — this form's action needs a real bearer token regardless of
   trigger.~~ **RESOLVED 2026-09-02** — see §8.
5. `search-reset`'s `config.resetForm` and true server-driven pagination UI — both
   unconfirmed capabilities, need their own verification pass before being trusted.

## 5. Open questions — now resolved by directly reading the real runtime code (2026-09-01)

All three were resolved by reading the actual source, not inferred from the one
worked example alone: `form-actions-runtime-js`'s `PayloadMapper`/`FormActionsEngine`/
`ActionResultProcessor`/`types/index.ts`; the two real consumers that actually execute
`schema.apiActions[]` (`AtlasFormsStudioApp.tsx`'s preview `executeApiAction`, and
`FormPlayerPage.tsx`'s `mapResponseToFormFields`/`handleSubmit`/`handleButtonClick`);
the three real authoring UIs (`controls-form-actions-react`'s `ApiActionForm.tsx` +
`PayloadMapper.tsx`, `designer-components-react`'s `PluginsTab.tsx`/`ApiActionsModal.tsx`)
and their shared canonical type, `controls-form-actions-react/src/plugins/api-actions/
definition.ts`'s `ApiAction`; and `player-components-react`'s `GridControl.tsx`/
`grid.types.ts` for the consuming side.

1. **A per-button trigger does exist and is authorable today — but it's `'button-click'`,
   not `'click'`, and no real code fires it.** The canonical `ApiAction.trigger` union
   (`definition.ts:10`) is `'submit' | 'load' | 'save' | 'field-change' | 'button-click'
   | 'validation'`, and `'button-click'` is a real, selectable option in **all three**
   authoring UIs found (`ApiActionForm.tsx:26` — `{ value: 'button-click', label: 'On
   Button Click' }`; `designer-components-react`'s `ApiActionsModal.tsx:235` and
   `PluginsTab.tsx:534` — both have a matching `<option value="button-click">`). So an
   author genuinely can save `trigger: "button-click"` into `schema.apiActions[]` today.
   **But it doesn't fire anywhere.** The Studio's own preview (`AtlasFormsStudioApp.tsx`)
   only ever checks `schema.apiActions[]` entries for `trigger === 'load'`, `'submit'`,
   or `'field-change'` (`getApiActionsByTrigger`, the load-effect, and the submit
   handler) — `'button-click'` never appears in any comparison in that file. The real
   Player (`FormPlayerPage.tsx`) *does* have a working per-button-click mechanism
   (`handleButtonClick`, wired to `FormRenderer`'s `onButtonClick` prop, which fires
   with the clicked `button`-type control's ID) — but it reads from
   `schema.metadata?.formActions` with the PascalCase `trigger === 'OnClick'`, i.e. the
   *other*, incompatible action representation (§7 of the architecture overview), not
   `schema.apiActions[]`'s lowercase `'button-click'`. Net: `'button-click'` is real,
   type-safe, and authorable, but is a third, independently-dead trigger value — not
   evidence that `submit` was the wrong choice. `submit` remains the right call: it's
   the only trigger with a real, working (once the metadata-field bug is fixed)
   execution path in the actual Player.
2. **`payloadMapping`'s direction and syntax are now fully confirmed — flat key = a
   control ID, flat value = a dot/bracket-notation path — but there is a real,
   independent bug in the one runtime consumer that builds outgoing requests from it.**
   All three authoring UIs agree unambiguously: `controls-form-actions-react`'s
   `PayloadMapper.tsx` (`handleAddMapping`, line 56) does `newMapping[selectedField] =
   targetPath` where `selectedField` is chosen from the form's own control IDs and
   `targetPath` is a free-text, `validateJsonPath`-checked string (placeholder text:
   *"e.g., data.email or user.profile.email"*); `designer-components-react`'s
   `PluginsTab.tsx` (line 619, 702) uses the same `[formField, apiField]` destructuring
   and the same default placeholder mapping `{ 'field_id': 'apiFieldName' }`. This
   matches `FORM_SCHEMA_CORRECTED.json`'s two real examples exactly (`{"control-...":
   "email"}` for the `POST`, `{"control-...": "[0].id"}` for the `GET`) — **key = control
   ID, value = path**, for both directions; only which direction the value is
   interpreted in depends on the action's trigger (outgoing/request field name for
   `submit`, incoming/response path for `load`). **The bug**: the one real code that
   builds the outgoing request payload for a `submit` action —
   `AtlasFormsStudioApp.tsx`'s `executeApiAction` (lines 156-159) — actually does
   `Object.entries(action.payloadMapping).forEach(([fieldPath, controlId]) => {
   payload[fieldPath] = formValuesData[controlId]; })`, i.e. it treats the dict's *key*
   as the destination request field and the *value* as the control ID to look up — the
   **exact inverse** of the confirmed authoring convention (and the inverse of this
   same file's own response-mapping code 100 lines later, which correctly does
   `updates[controlId] = extractNestedValue(result.data, fieldPath)`). Applied to the
   real `"Submit Comment"` example, this bug means `formValuesData["email"]` is looked
   up (undefined — form values are keyed by control ID, not `"email"`) and written to
   `payload["control-1779348206082"]` (not a sensible outgoing field name). This is a
   genuine, reproducible defect, separate from the already-known metadata-field-name
   Player bug, and it means outgoing `payloadMapping` does not actually work correctly
   in the one place it's currently wired up at all. **On GET vs. POST**: neither real
   implementation supports query-string params for a GET action — `executeApiAction`
   only ever attaches `payload` as a JSON `body`, and only `if (method !== 'GET')`; for
   GET, the computed payload is silently discarded and the endpoint URL is called as-is
   with no params appended. (`form-actions-runtime-js`'s separate `FormActionsApiClient`
   attaches `body` unconditionally regardless of method — which would violate the Fetch
   spec for a real GET — but this is moot in practice since, per the already-known bug,
   this engine never receives real `schema.apiActions[]` entries at all.) **Net: this
   schema's filter-mapping should still be authored as key = control ID, value =
   request-field name (the confirmed-correct convention) — but flag that the one real
   consumer currently applies it backwards, and that's a concrete, separate bug to fix
   before relying on it, distinct from §4/§8's other known gaps.**

   **RESOLVED 2026-09-02.** Both real consumers' `executeApiAction` now build the
   outgoing payload correctly — `Object.entries(action.payloadMapping).forEach
   (([controlId, destPath]) => { setValueAtPath(payload, destPath,
   formValuesData[controlId]); })` — key = control ID (source), value = destination
   path, matching the confirmed authoring convention. A new `setValueAtPath` helper
   (the write-side counterpart of `extractValueFromResponse`/`extractNestedValue`)
   supports dotted destination paths (e.g. `"filters.nameContains"`, per §4B.1's
   schema), not just flat field names. Live-verified: a real outgoing `POST` request
   body was captured and confirmed to match the fixed direction exactly (not the
   pre-fix `{}` the inverted logic would have produced, since `JSON.stringify` drops
   `undefined`-valued keys). See `pages-player-react`'s and `pages-studio-react`'s own
   `DevelopmentHistoryLog.md` 2026-09-02 entries for the full diff and verification
   evidence. The GET-vs-POST query-string-params gap noted above is unrelated and
   remains unresolved/out of scope.
3. **Mapping a whole array of rows into a `grid` control's value is mechanically
   supported — but only for the `load` trigger, never `submit` or `button-click`, in
   either real implementation.** Two separate findings:
   - *Mechanically*: `GridControl.tsx` (`player-components-react`) takes its data
     through the exact same generic `value`/`onChange` contract every other control
     uses (`GridControl: React.FC<ControlRendererProps> = ({ control, value, onChange,
     mode })`), and explicitly handles an array: `Array.isArray(value) ? value : []`
     seeds its rows, and a `useEffect` re-syncs whenever `value` changes and is an
     array. So if `payloadMapping` successfully extracts an array from a response and
     assigns it to `updates['results-grid']`, the grid **will** render it — no
     grid-specific API is needed. The path parser itself
     (`extractNestedValue`/`extractValueFromResponse` — near-identical implementations
     in both `AtlasFormsStudioApp.tsx` and `FormPlayerPage.tsx`) is plain dot-notation
     with `[N]` bracket-index support (e.g. `"data.items"`, `"[0].id"`) and returns
     whatever it finds at that path — an array, object, or scalar, no type coercion —
     so a nested array field is reachable. **There is no `"$"`/root/whole-response
     shorthand in either parser** — every path must name at least one property, so if
     an endpoint ever returns a bare top-level array with no wrapper field, this
     mechanism cannot select "the whole response body" as-is; the response needs a
     named field (as `Doc_Documents.list()`'s response does — see below).
   - *But the wiring gap*: response→control mapping (`mapResponseToFormFields` in
     `FormPlayerPage.tsx`, and the inline equivalent in `AtlasFormsStudioApp.tsx`'s
     load-effect) is called **exactly once in each file, and only from the `load`-
     trigger handler.** Neither file's `submit` handler, nor `FormPlayerPage.tsx`'s
     `handleButtonClick`, ever calls it — confirmed by checking every call site
     (`grep` found a single call to `mapResponseToFormFields(` in the whole
     `FormPlayerPage.tsx`, inside `executeLoadActions`). So a `submit`- or
     `button-click`-triggered action's response is never mapped into any control
     today — not a scalar, not an array — regardless of path syntax. This is why §3's
     schema uses `trigger: "load"` for `action-load-documents`, and why the same note
     applies if this form ever needs a *re-run* search (e.g. a "Refresh" button):
     that would need this exact response-mapping logic extended to fire after a
     successful `submit`/`button-click` action too — a small, well-scoped change (the
     working reference implementation to copy already exists in the `load` path in
     both files) but a real, unbuilt gap, independent of the already-known
     metadata-field-name Player bug.

     **RESOLVED 2026-09-02 — via a new `'search'` trigger, not by extending `submit`/
     `button-click`.** Per explicit task direction, response-mapping was wired for a
     new, separate `'search'` trigger value (added to `ApiAction.trigger` alongside the
     existing values) rather than extending `submit`/`button-click` directly.
     `'search'` fires on the identical real UI event `button-click` already uses (a
     `type: 'button'` control's `onClick`, via `FormRenderer`'s `onButtonClick` prop —
     confirmed unchanged from the mechanism described above) and, once its request
     succeeds, maps the response back onto form fields via the exact same
     `mapResponseToFormFields`/`extractNestedValue` call the `load` path already used
     (in `FormPlayerPage.tsx`) / a new, parallel `handleButtonClick` (in
     `AtlasFormsStudioApp.tsx`, which had no button-click mechanism at all before this).
     `submit` and `button-click` themselves remain exactly as described above — no
     response mapping for either. **Practical implication for this schema (§3/§4B):**
     a "Refresh"/explicit-search button should be authored with `trigger: "search"` and
     a `type: 'button'` control — not `trigger: "submit"` with a `type: 'submit'`
     control, which §4B.1's schema currently uses and which still will not populate
     `results-grid` even after this fix (see §1's 2026-09-02 update note above for the
     exact correction needed). Live-verified end-to-end (fires on click, not on load;
     response correctly mapped into a control) in both `FormPlayerPage.tsx` and
     `AtlasFormsStudioApp.tsx` — see each package's `DevelopmentHistoryLog.md`
     2026-09-02 entry for full verification evidence.
   - **The alternative — binding `results-grid` directly to a live API `DataSource`
     instead of `payloadMapping` — was checked and confirmed not available either.**
     `GridConfig.dataBinding` (`grid.types.ts:142-145`) is `{ source?: 'static' }` with
     an explicit doc-comment: *"V1: 'static' only. API / parent-field are V2."* — an
     `api`-sourced grid binding is a documented future feature, not built. The more
     generic `FormControl.binding = {source, path, expression}`/`DataBindingEngine`
     mechanism the architecture overview flags (§8) lives only in `form-engine-js`,
     which has no confirmed live consumer and is not what the real Player
     (`player-components-react`'s `FormRenderer`) renders through. So there is
     currently no working substitute for `payloadMapping` here — extending the
     response-mapping call to the `submit`/`button-click` triggers (as flagged above)
     is the correct, most-scoped fix, not building a new grid-binding capability.
   - **Applied to this schema's real endpoint**: `BaseDocumentController.GetAll`
     (`[HttpPost("list")]`) calls `DocumentService.GetAllAsync` and returns straight
     through `WebResponse_StandardList`, which does `return Ok(response)` with **no
     extra envelope wrapping** (`GoControllerBase.cs:136-139`) — unlike the generic
     `WebResponse<T>` helper, which *does* wrap in an outer `GoWebResponse<T>{ Data =
     data }`. The `response` object here is a `GoWebStandardListResponse : 
     GoWebBaseSearchResponse` whose only payload field is `public object? Data`
     (`BaseSearchRequest.cs:12`) — camelCase-serialized as top-level `data`. So the raw
     JSON Atlas Forms' `fetch()` receives from `POST /api/v1/documents/list` is a
     single-level `{ data: [...documents], errors: {...}, ... }`, and the correct
     `payloadMapping` response path is simply **`"data"`** (added to §3's schema) —
     not `"$"`, not a double-nested `"data.data"`. (This traces the C# source
     end-to-end; it wasn't confirmed against a live HTTP call this pass — worth one
     real round-trip test before treating as final, per this doc's own "for review"
     standard.)
4. **Whether `apiActions[]` can be scoped to fire from one specific control** — partially
   clarified as a side effect of Q1/Q3's research, though not the main target of this
   pass. The real Player's `handleButtonClick` mechanism *does* support per-control
   scoping via a `buttonId` field (`a.buttonId === buttonId || !a.buttonId`,
   `FormPlayerPage.tsx:556`) — but that field lives only on the PascalCase
   `schema.metadata?.formActions` shape (§7 of the architecture overview), not on the
   real, canonical `ApiAction` type (`definition.ts`), which has no `buttonId`-equivalent
   field at all. So today, a real `schema.apiActions[]` entry has no way to scope itself
   to one specific control — every `submit`-triggered action fires on any form submit,
   full stop. Not a concern for this specific schema (only one submit-capable control
   exists), but confirmed as a real, currently-nonexistent capability rather than an
   unconfirmed one — flagged for whoever picks this up if the form ever grows a second
   submit-capable control.

## 6. Next steps

- §5's trigger/mapping questions are now resolved (2026-09-01) — resolving them
  surfaced two real, unbuilt engine gaps that blocked this schema working end-to-end,
  beyond the already-known Form-Actions Player metadata-field bug. **Both now RESOLVED
  2026-09-02:**
  1. ~~The outgoing-`payloadMapping` key/value inversion bug in `AtlasFormsStudioApp.tsx`'s
     `executeApiAction` (§5 Q2) — not currently load-bearing for *this* schema (it has
     no outgoing mapping yet), but will bite the moment pagination or an edit action
     with outgoing fields is added.~~ Fixed in both real consumers — see §5 Q2.
  2. ~~Response→control mapping is wired only for the `load` trigger (§5 Q3) — this
     schema works around it by using `load` for the initial list, but a future
     "Refresh"/re-search action would need this extended to `submit`/`button-click`
     first.~~ Fixed via a new `'search'` trigger (not by extending `submit`/
     `button-click` themselves) — see §5 Q3, and §4B.3 item 3 above for the schema
     correction (`trigger: "search"` + `type: 'button'`, not `trigger: "submit"` +
     `type: 'submit'`) this schema's own §4B.1 JSON still needs before it benefits.
- ~~§8's auth gap (no live session token reaches any `apiActions[]` call today) is a
  separate, independently-confirmed build item — see §8.2's table for the specific
  files that need changes.~~ **RESOLVED 2026-09-02** — see §8.
- Build a 2-control spike (one filter input, one `grid`) against a Player with the
  metadata-field bug, the `search`-trigger response-mapping gap, and the auth gap all
  now fixed, to prove the end-to-end flow works before committing to the full form
  above. (This spike itself is still not built — the three underlying gaps being fixed
  is a prerequisite for it, not a substitute.)
- Only then wrap this as an App Studio widget.
- Resolve the two new gaps §3/§4 flagged (client-side live-filter of an
  already-populated `grid`; foreign-key-to-name resolution in a `grid` column) — not
  found confirmed anywhere in Atlas Forms this pass, and not invented around here.

## 7. Sourcing — where these facts came from (2026-09-01 Documents-grounding pass)

Everything in §1/§3/§4 above was independently confirmed by reading the following real
files (all read-only; nothing in them was modified):

- **`Doc_Documents` table schema**:
  `C:\BizFirstGO_FI_AI\BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Tables\Doc_Documents.sql`
  (SSDT source — `DocumentID` PK identity, `DocumentName`/`DocumentTypeID`/
  `DocumentCategoryID`/`OriginalFileName`/`DocumentDescription`/`FilePath`/`FileUrl`/
  `MimeTypeID`/`FileSizeBytes`/`FileHash`, verification/OCR/quality-check/processing/
  access-tracking/legal-hold columns, `IsPublicAsset`/`PublicAssetKey`/
  `PublicAssetPublishedOn` (digital-assets-library, added 2026-08-30), plus the full
  standard audit/multi-tenancy set: `TenantID`, `Deleted`, `Archived`,
  `LastModifiedOn`/`LastModifiedBy`, `CreatedOn`/`CreatedBy`, `SourceAppID`,
  `ClientAccountID`, `AppDomainID`, `DataDomainID`, `DataSegmentID`, `ResID`).
- **Real seed values for the two dropdowns**:
  `Doc_DocumentTypes.data.sql` and `Doc_DocumentCategories.data.sql`
  (`BizFirstFiV3DB\dbo\Data\Master\`) — real `DocumentTypeCode`/`DocumentCategoryCode`
  values (`ID_DOCUMENT`, `CONTRACT`, `LEGAL`, `FINANCIAL`, etc.), tenant-scoped and
  IDENTITY-keyed (not fixed numeric IDs — confirms why the real app resolves these at
  runtime instead of hardcoding them).
- **Real API client**:
  `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\doc-app\packages\@doc-app\api-client\src\documentClient.ts`
  (`DocumentClient` — `list()`, `listByType()`, `listByCategory()`, `getByID()`,
  `update()`, `remove()`, `upload()`/`uploadMany()`, `download()`,
  `publishAsPublicAsset()`/`unpublishPublicAsset()`, `getPresignedViewUrl()`) and its
  companion `types.ts` (`DocumentRecord`, `DocumentType`, `DocumentCategory` — confirms
  the real camelCase wire shape, e.g. `documentID`, `documentTypeID`).
- **Real backend controller**:
  `C:\BizFirstGO_FI_AI\BizFirstPayrollV3\src\mvc-server\Go\Documents\BizFirstFi.Go.Documents.Api.Base\Controllers\BaseDocumentController.cs`
  (`[Route("api/v1/documents")]`; `[HttpPost("list")] GetAll` backs `list()`,
  `[HttpPost("{id:int}")] GetById`, `[HttpPut("{id:int}")] Update`, plus type/category/
  submission/verification-status/expired/pending-OCR/legal-hold query endpoints — none
  of which take free-text filter parameters).
- **The request envelope `list()` actually sends**:
  `C:\BizFirstGO_FI_AI\BizFirstPayrollV3\src\mvc-server\Go\Essentials\BizFirstFi.Go.Essentials.Domain\Request\Request\Search\StandardListRequest.cs`
  and its base classes (`BaseSearchRequest.cs`, `SuperBaseSearchRequest.cs`) — confirms
  `GoWebStandardListRequest` carries a generic `PageInfo` and a `Filters: Dictionary
  <string, object>`, but `DocumentClient.list()` never populates `Filters` and whether
  `DocumentService.GetAllAsync` interprets it wasn't checked this pass — treat
  server-side generic filtering as unconfirmed/unused, not as a hidden capability this
  design could lean on today.
- **Document Manager reference app** (confirms real search/list/edit UX):
  - Route wrapper: `apps\document-manager\src\pages\DocumentsPage.tsx`
  - Real search/list page: `packages\@doc-app\react\src\pages\DocumentsExplorer.tsx`
    (fetch-then-client-filter composition)
  - Real filter input + the "no free-text search endpoint" comment:
    `packages\@doc-app\react\src\components\DocumentSearchBar.tsx`
  - Real fetch hook (confirms unconditional on-mount `list()` call):
    `packages\@doc-app\react\src\hooks\useDocumentsByTypeCode.ts`
  - Real results table (confirms the 5 real display columns — Name/File name/Type/
    Category/Size/Modified): `packages\@doc-app\react\src\components\DocumentList.tsx`
  - Real edit page + real editable field set:
    `apps\document-manager\src\pages\DocumentDetailPage.tsx` and
    `packages\@doc-app\react\src\components\DocumentEditForm.tsx`
    (all paths rooted at `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\doc-app\`)

## 8. Auth: how `apiActions` calls get authenticated

**Definitive answer: today, real, live-session auth is NOT attached to any
`apiActions[]` call, in either the real Player or the Studio's own preview.** This
matters directly for this schema — `/api/v1/documents/list` and
`PUT /api/v1/documents/{id}` are real, tenant-scoped, `[AuthorizeRegularUserAttribute]`-
gated BizFirst endpoints (§7), so as authored in §3 (`"headers": {}`), the
`action-load-documents` call would be rejected by the real backend today. This section
traces exactly why, and — per an explicit product decision made mid-investigation —
specifies the target contract this needs to be built against: every `apiActions[]`
entry gets an `auth` field with exactly two values, **`"passport"`** (default — the
live session JWT is attached automatically) and **`"none"`** (explicit opt-out for
genuinely public endpoints).

**RESOLVED 2026-09-02 — built exactly against this target contract, in both real
consumers, but NOT via `FormActionsApiClient`/`FormActionsEngine` (§8.1 below still
accurately describes that package's own, still-unextended `buildAuthHeader()` switch —
it remains bypassed/unused, per the 2026-09-01 fix's Option A, not fixed here).**
Instead, `ApiAction.auth?: 'passport' | 'none'` was added directly to the canonical
schema type, and both `FormPlayerPage.tsx` and `AtlasFormsStudioApp.tsx` gained a new
`buildAuthHeaders(action)` helper that calls `@passport/auth-session`'s
`fetchAuthToken()` (fresh at request time) and attaches `Authorization: Bearer <token>`
when a live session exists and `action.auth !== 'none'` — falling back to no header
(never blocking/erroring) if `fetchAuthToken()` returns `null`/throws, exactly matching
§8.2's target contract row-by-row. `@passport/auth-session` was added as a real
`workspace:*` dependency to both `pages-player-react` and `pages-studio-react`.
Live-verified with a real (fake-auth-bypass-sourced, since no real login credentials
were available to this pass) session token: a default/`'passport'` action's request
carried a real `Authorization: Bearer <token>` header; an `auth: 'none'` action's
request carried none. See §8.2's table below for the piece-by-piece mapping (still
accurate as the target contract that was built against) and each package's
`DevelopmentHistoryLog.md` 2026-09-02 entry for the full diff/verification.

### 8.1 What exists in code today (traced, with citations) — historical, describes the
pre-2026-09-02 state; `FormActionsApiClient`/`FormActionsEngine` themselves are
unchanged (still bypassed) as of the resolution above

- **`FormActionsApiClient`** (`atlas-forms\packages\form-actions-runtime-js\src\api\FormActionsApiClient.ts`)
  genuinely does build an `Authorization` header — `buildHeaders()` (line 152) calls
  `buildAuthHeader(config.auth)` (line 169-174) when `config.auth.type !== 'none'`, and
  `buildAuthHeader()` (line 182-217) switches on `auth.type`: `'bearer'` → reads
  `auth.bearer.token`, `'api_key'` → `auth.apiKey.key`/`.value`, `'basic'` → base64 of
  `auth.basic.username`/`.password`. **The mechanism is real; the token source is not
  the live session** — every one of those fields (`ActionAuth`, same file's sibling
  `types\index.ts` lines 64-77) is either a **literal string baked into the schema** or
  a `{ field: string }` reference that resolves against **the current form's own field
  values**, not against any session/auth store. There is no `'passport'` (or any
  session-derived) case in `buildAuthHeader()`'s switch today — only
  `'bearer' | 'api_key' | 'basic'`; the type also declares `'none'`.
- **`FormActionsEngine`** (`...\form-actions-runtime-js\src\engine\FormActionsEngine.ts`)
  passes `auth: action.auth || actionDef.auth` straight through to the API client
  (line 154) — `action.auth` is whatever the schema author wrote in `apiActions[].auth`,
  `actionDef.auth` is whatever a server-resolved `actionKey` definition returned
  (`ActionDefinitionClient`, itself schema/config-driven, not session-driven). The
  `FormActionsEngine` constructor (`FormActionsEngineConfig`, lines 22-28) accepts only
  `logger`/`resultProcessor`/`resultProcessorConfig`/`csrfToken`/`debug` — **no
  token-provider parameter exists anywhere in this package**, and the package has
  **zero import of `@passport/store`, `zustand`, or any auth abstraction** — it is
  intentionally headless/host-agnostic.
- **`FormPlayerPage.tsx`** (`atlas-forms\packages\pages-player-react\src\pages\FormPlayerPage.tsx`,
  the real, deployed Player) instantiates `FormActionsEngine` at line 121 with only
  `{ logger, debug, csrfToken, resultProcessorConfig }` (lines 131-158) — **no auth/token
  field of any kind**. The file has no `useAuthStore`/`@passport` import at all. Its
  `csrfToken` (line 67, loaded via `client-js`'s `getCsrfToken()` at line 171) is an
  anti-CSRF token, unrelated to bearer/session auth. `pages-player-react/package.json`
  *does* list `@passport/auth-core` as a dependency (line 45), but the only real usage
  of it in the whole package is `ChangePasswordModal.tsx` re-exporting
  `@passport/auth-core`'s `ChangePasswordPage` UI component — nothing to do with
  tokens. **Conclusion: every real `apiActions[]` call fired by the shipped Player
  today goes out with no `Authorization` header at all**, unless the schema author
  hardcoded one in `auth`/`headers` (see §8.2 below for why that's the wrong answer).
- **Studio's own live-preview path** (`pages-studio-react\src\pages\AtlasFormsStudioApp.tsx`,
  `executeApiAction()`, lines 138-193) doesn't even go through `FormActionsEngine` — it's
  a hand-rolled `fetch(action.endpoint, { method, headers: { 'Content-Type':
  'application/json', ...action.headers } })` (lines 164-171). **No `auth` field is read
  at all in this function** — only the schema's literal `headers{}` is merged in. No
  CSRF, no bearer, no cookie option (`credentials` is not set, so it defaults to
  `same-origin` — incidental, not a designed auth path). `pages-studio-react`'s
  `package.json` has **no `@passport` dependency of any kind**, and no file in that
  package imports `useAuthStore` from anywhere.
- **`@passport/store`'s real `useAuthStore` (the one actually holding the live session
  JWT) is a genuine, working dependency in this monorepo — but only one level up, in
  the host shell app, and only feeding a different client.** `examples\form-studio\src\App.tsx`
  imports it (line 24), reads `useAuthStore.getState().token` (line 65), and calls
  `updateAtlasApiConfig({ baseUrl, tenantId, token: authToken })` (lines 73-77) — an
  `api-client-js` function. `api-client-js\src\http.client.ts` (lines 731-738) then
  builds `Authorization`/tenant headers from that config on every request. This is
  exactly the working, correct pattern (matches the `getAuthToken: () =>
  useAuthStore.getState().token` shape used elsewhere in this monorepo family) — **but
  it only powers `api-client-js`'s `FormDefinitionApiClient`/`FormDataApiClient`
  (schema CRUD, form-records CRUD), a completely separate code path from
  `apiActions[]`/`FormActionsEngine`.** `examples\form-studio\src\layout\StudioShell.tsx`
  (line 19, 47) also reads `useAuthStore` for the same token, again only for that
  outer-app layer, not for anything inside `atlas-forms`'s own action-execution
  packages. Also worth noting: `atlas-forms\packages\state-react\src\auth.store.ts`
  defines a second, package-local `useAuthStore` (with its own `token: string | null`)
  — a full-tree grep found it is **never imported anywhere** (dead, same class of
  finding as `themes-js`'s `getThemeResolver()` in the architecture overview §15.4);
  it is not the one actually holding the live session.

**Net: the plumbing to get a live session token into a fetch call exists and works
correctly in this monorepo (`@passport/store` → `updateAtlasApiConfig` →
`api-client-js`'s `http.client.ts`), but it has never been connected to the
`apiActions[]`/`FormActionsEngine`/`FormActionsApiClient` path at all — not in the
Player, not in the Studio preview.** Today, the *only* way a bearer token reaches an
`apiActions[]` call is if a form author pastes a literal token into
`auth.bearer.token` or `headers.Authorization` in the saved schema — exactly the
"real, serious problem" this investigation was asked to flag: a hardcoded token would
be wrong for every user other than whoever authored the form, would go stale the
moment that session's token rotates/expires, and would sit in plaintext inside a
saved `Atlas_Forms.Schema` blob.

### 8.2 Target contract: `auth: "passport" | "none"` — what's already true vs. what needs building

Per an explicit product decision: `apiActions[]` entries should declare `"auth":
"passport"` (the default when the field is omitted) or `"auth": "none"` (explicit
opt-out for genuinely public/open endpoints). Assessed against §8.1's findings, piece
by piece:

| Piece | Status today | What's needed |
|---|---|---|
| A live, working session-token source (`@passport/store`'s `useAuthStore`) exists in this monorepo | **Already works** — confirmed real and correct at the `examples/form-studio` host-app level (§8.1) | Nothing — reuse this, don't rebuild it |
| `ActionAuth.type` supports a `'passport'` value | **Does not exist** — today's union is `'none' \| 'bearer' \| 'api_key' \| 'basic'` (`form-actions-runtime-js/src/types/index.ts:65`, mirrored in `types-js`'s `apiActions[]` shape) | Add `'passport'` as a fifth `ActionAuth.type` value in both places |
| Omitting `auth` entirely defaults to "attach the live token" | **Does not exist — defaults the opposite way today.** `buildHeaders()` only adds `Authorization` `if (config.auth && config.auth.type !== 'none')` (`FormActionsApiClient.ts:169`) — an omitted `auth` field is currently equivalent to `'none'`, not to an implicit passport-token attach | Flip the default: no `auth` field (or `auth` omitted) must behave as `type: 'passport'`; only an explicit `type: 'none'` should suppress the header |
| A way for the headless `FormActionsApiClient`/`FormActionsEngine` to obtain the live token at call time | **Does not exist** — the package has zero auth-store dependency and the engine constructor takes no token-provider (§8.1) | Add a `getAuthToken?: () => string \| null \| undefined` (or `Promise<...>`) callback to `FormActionsEngineConfig` and thread it into `FormActionsApiClient`'s constructor; add a `case 'passport':` in `buildAuthHeader()` that calls it at request time (not a captured/frozen token — avoids the staleness problem a memoized engine + static token would have) |
| The real Player supplying that callback | **Does not exist** — `FormPlayerPage.tsx` never imports `@passport/store` today (§8.1) | Add `@passport/store` (not just the already-present `@passport/auth-core`) as a dependency of `pages-player-react`, import `useAuthStore`, and pass `getAuthToken: () => useAuthStore.getState().token` into the `FormActionsEngine` config alongside the existing `csrfToken` |
| Studio's own preview supplying the same | **Does not exist** — `pages-studio-react` has no `@passport` dependency at all and `executeApiAction()` is a raw `fetch()` with no auth field read (§8.1) | Add `@passport/store` as a dependency of `pages-studio-react`, and in `executeApiAction()` branch on `action.auth?.type` (default `'passport'` when absent) to conditionally add `Authorization: Bearer ${useAuthStore.getState().token}` — otherwise Studio-preview-tested actions will keep silently "working" against open endpoints and then fail differently in the real Player once its own fix lands |
| `'none'` actually suppressing the header for real public endpoints | **Partially exists** — `'none'` is already a valid `ActionAuth.type` and `buildHeaders()` already skips `Authorization` for it (`FormActionsApiClient.ts:169`) | No change needed here once the default flips — `'none'` already means "no header," it just needs to become the *only* way to get that behavior instead of the current accidental default |

**Bottom line for this contract**: the session-token plumbing this design wants already
exists and works correctly elsewhere in the monorepo, but nothing in the
`apiActions[]` execution path — `ActionAuth`'s type union, `FormActionsApiClient`'s
`buildAuthHeader()`, `FormActionsEngine`'s config, `FormPlayerPage.tsx`'s engine
construction, or the Studio preview's `executeApiAction()` — currently implements or
even partially implements `auth: "passport"`. This is a **build item**, not a
misconfiguration or a wiring gap to flip a flag on; five specific, named files need
changes (all listed in the table above), and none of them should be attempted by
hand-editing a schema JSON alone.

**RESOLVED 2026-09-02 — same target contract, different (simpler) implementation
route than this table's literal file list.** The actual fix did NOT touch
`FormActionsApiClient`/`FormActionsEngine`/`FormActionsEngineConfig` at all (rows 3-4
of the table above describe a route that was never taken) — consistent with the
2026-09-01 fix's Option A (that engine remains bypassed, unused by either real
consumer). Instead: `ApiAction.auth?: 'passport' | 'none'` was added directly to the
canonical schema type (not `ActionAuth`, a different, still-unused type on the
bypassed engine); each consumer file's own local `executeApiAction` gained a
`buildAuthHeaders(action)` helper that calls `fetchAuthToken()` at request time
directly (no `getAuthToken` callback/config-threading needed, since there's no engine
instance to configure); and `@passport/auth-session` (not `@passport/store` directly)
was added as each package's new dependency — `fetchAuthToken()` is the shared
accessor `@passport/store`'s own `useAuthStore` registers itself into (see that
package's `authStore.ts`), so consuming it directly avoids each app needing its own
`@passport/store` import/Zustand-selector wiring. Net effect matches every row of the
table above (default-passport, live token at call time, `'none'` opt-out, no header on
missing/failed token) — just via two smaller, local changes instead of five files
including the engine package.

### 8.3 What this means for this schema specifically (§3)

**RESOLVED 2026-09-02 — this is no longer a "once §8.2 is built" hypothetical; §8.2 is
built.** `action-load-documents` in §3 (using `trigger: "load"`, which already had
response-mapping) works exactly as written below today, auth included. The `"auth":
"passport"` field is honored by both real consumers. (Recall from §1's/§5 Q3's
2026-09-02 update notes above: if this form's search/filter action is rewritten to use
the new `'search'` trigger per §4B's redesign, it also needs `"auth": "passport"`
exactly the same way — the auth fix applies uniformly to every trigger, not just
`load`.)

```json
{
  "id": "action-load-documents",
  "name": "Load Documents",
  "trigger": "load",
  "endpoint": "/api/v1/documents/list",
  "method": "POST",
  "payloadMapping": {
    "results-grid": "data"
  },
  "auth": "passport",
  "headers": {},
  "onSuccess": "none",
  "onError": "none"
}
```

`"auth": "passport"` is written explicitly here for clarity even though it's the
proposed default — this endpoint is real, tenant-scoped, and
`[AuthorizeRegularUserAttribute]`-gated (§7), so it genuinely needs the live session
token, not a hardcoded one. The same applies to the edit/save action this form will
need for `PUT /api/v1/documents/{id}` (§4 step 5, not yet added to §3's JSON). Do
**not** add a `headers.Authorization` literal or an `auth.bearer.token` literal to
this schema as a workaround before §8.2 is built — that would reproduce exactly the
hardcoded-token problem this section exists to flag, and would need to be found and
removed later. Until §8.2 ships, this schema's `apiActions[]` calls will fail
authentication against the real backend no matter what trigger-wiring bugs (§5/§4) are
also fixed first.

## 9. Client-side grid filtering: is a declarative (schema-only) approach possible?

**Answer: NO — confirmed, not "not found yet."** As of this pass (2026-09-01), there is
no declarative, schema-only mechanism anywhere in Atlas Forms for "a filter control's
value narrows an already-loaded `grid`'s rows, client-side, with zero server
round-trip." All four candidate mechanisms were traced to their real source and each
one either doesn't exist, is dead code with zero runtime consumers, or is structurally
incapable of the job even where it is live. The user's own question — "does atlas
form need react state? can we do this using Atlas Forms way?" — has a direct answer:
**yes, it needs React state (or an equivalent host-app data-manipulation layer)
today; there is no "Atlas Forms way" to do this from JSON alone.**

### 9.1 The four mechanisms checked

**1. `grid` control's own `config` — no filter/search capability at all.**
`GridConfig` (`player-components-react/src/controls/inputs/GridControl/grid.types.ts:149-168`)
was read in full. Its complete field list is: `title`, `gridType`, `idField`,
`pageSize`, `emptyMessage`, `editFormID`, `bulkEditEnabled`, `tableClass`,
`altRowClass`, `columns`, `newEntityTemplate`, `buttons`, `features` (`{reorder,
pagination, exportFormats, importFormats}`, lines 133-138), and `dataBinding`
(`{source?: 'static'}` only — line 142-145's own doc-comment: *"V1: 'static' only. API
/ parent-field are V2"*). **There is no `filterable`, `quickFilter`, `searchable`, or
any per-column filter-input field anywhere in this type.** `GridControl.tsx` (851
lines, read in full) confirms the runtime matches the type: its toolbar
(lines 601-652) renders only action buttons and export/import buttons — no search
input, ever — and the imported pure-logic helpers (`createNewRow`, `stampRowId`,
`evaluateCellClass`, `evaluateCompute`, `getCellValue`, `setCellValue`, `validateCell`,
`serializeRow`, `exportToJson`/`exportToCsv`, `importFromJson`/`importFromCsv`,
`reorderRows`, `getPage`, `totalPages`, `resolveLinkAction`, `interpolateTemplate` —
`grid.helpers.ts`) contain no filter/predicate logic of any kind. `rows`/`displayRows`
are derived only via pagination slicing (`getPage`), never via any filter step.

Two near-misses worth flagging precisely because they look like prior art but aren't:
- A **different**, dead `GridConfig` (`form-actions-js/src/advanced-controls/EditableGridControl.ts:19`)
  declares a `filterable: boolean` field — but this belongs to the `editable-grid`
  advanced-control family the architecture overview already confirmed is never
  registered in `registerAllControls()` (dead in the shipping Player), and a full grep
  for `filter` (case-insensitive) inside that entire file finds **only the type
  declaration and one unrelated `Array.prototype.filter()` call** — the flag has zero
  implementation even within its own dead file. It was never built out, not even once.
- `designer-components-react/src/components/PropertyEditors/EditorImplementations/DataTableEditor.tsx`
  is a real, working Studio property editor with its own `filterable?: boolean` field
  (line 40) and a checkbox UI for it (line 157) — but its own header comment says it's
  *"Property editor for **data-table** control type"* (line 4), and `FormField.tsx`'s
  live `case 'data-table': case 'table':` render path (lines 3126-3139) never reads
  `config.filterable` at all — it only reads `config.data`/`config.columns` (falling
  back to hardcoded demo rows if `config.data` is absent). This is the same
  "authorable in the Studio, silently does nothing at runtime" pattern the
  architecture overview already found repeatedly (§6 styling slots, §7 form actions) —
  a third confirmed instance of it, this time for grid/table filtering specifically.

**2. `fieldActions[]` — fundamentally an HTTP-action wrapper, and has zero runtime
consumers anywhere in the monorepo, so the question of "can it filter client-side" is
moot before it's even reached.** A full-tree grep for `fieldActions` across the entire
`atlas-forms` monorepo (not just one package) finds exactly **one file**:
`types-js/src/control.types.ts:381` (`fieldActions?: FieldAction[]` on `FormControl`).
No consumer — not `form-actions-runtime-js` (the real Player's action engine), not
`form-actions-js`, not `FormPlayerPage.tsx`, not `AtlasFormsStudioApp.tsx` — reads
`control.fieldActions` anywhere. It is a declared-but-fully-dead schema field, the
same class of finding as `common`/`form-manager-react` in the architecture overview.
Even setting liveness aside, `FieldAction`'s own shape (`types-js/src/form.types.ts:151-176`)
confirms it was never designed for client-side-only data manipulation: `trigger:
'OnChange'|'OnBlur'|'OnFocus'|'OnClick'`, `payload?: FormActionPayload`, `headers?:
Record<string,string>` (doc-commented *"Custom headers for **API call**"*), `auth?:
ActionAuth`, `successActions?: SuccessAction[]` — every field on it exists to shape an
outgoing HTTP request and its response handling. There is no "target another control
and mutate its in-memory value with no network call" primitive anywhere in the type.
**Net: `fieldActions[]`/`apiActions[]` are fundamentally about firing HTTP requests —
confirmed, not just inferred — and `fieldActions[]` additionally doesn't fire at all
today, HTTP or otherwise.**

**3. `binding.expression` / `FormulaEvaluator`/`ConditionEvaluator`/`FormDerivedFieldEngine`
— scoped to plain field values, and (separately) not wired into the real Player at
all.** `binding.expression` is resolved exclusively by `form-engine-js`'s
`DataBindingEngine.resolveBinding()` (`DataBindingEngine.ts:204-208`,
`form.engine.ts:170,244,260`) — and `form-engine-js` is the same package the
architecture overview already confirmed has **no live consumer**: the real Player
(`pages-player-react/FormPlayerPage.tsx`) renders through `player-components-react`'s
`FormRenderer`, not through `form-engine-js`'s `FormEngine`/`useAtlasForm`. So even a
perfectly-designed `binding.expression` mechanism for grid filtering would not reach
the shipped app today. But it isn't perfectly designed for this either:
`resolveBinding()` takes one `FieldBinding` and returns one `BindingResolutionResult`
— a single resolved value for a single control, not a row-set transform over another
control's data. `FormDerivedFieldEngine` (`form-actions-js/src/engines/FormDerivedFieldEngine.ts`,
read in full) computes named scalar/array *values* (`concat`/`uppercase`/`sum`/`avg`/
`count`/`join`/`conditional`/etc., lines 176-269) from a flat `context.fieldValues`
map — it has no concept of a "control" or a "grid" at all, just field-key → value.
`FormulaEvaluator` (`form-actions-js/src/engines/FormulaEvaluator.ts:62,102`) supports
reading *from* a grid field via `gridField[].subField` array-access syntax (e.g. to
sum a column) but has no mechanism to write a filtered row-subset *back into* a grid's
displayed value. `ConditionEvaluator` evaluates boolean conditions over field values
(used for visibility rules), same scope limitation. **And a `package.json` check
confirms the wiring gap is structural, not incidental**: `pages-player-react/package.json`
depends on `@atlas-forms/form-actions-runtime` (the narrower HTTP-action engine) but
has **no dependency on `@atlas-forms/form-actions`** (the package containing
`FormulaEvaluator`/`ConditionEvaluator`/`FormDerivedFieldEngine`/`UniversalFormOrchestrator`)
at all — only `controls-form-actions-react` depends on it. So even disregarding the
scope limitation, this whole engine suite cannot reach the real, deployed Player's
grid rendering; it's a separate SDK consumed by Flow Studio's `atlas-forms-bridge`,
not by Atlas Forms' own shipped Studio/Player.

**4. `custom` control type — real, and the one genuine escape hatch, but it means
leaving the schema-driven model entirely for this one control.** `FormField.tsx`'s
`default:` case (lines 3503-3524 — the fallback for *any* `control.type` not matched
by the ~3500-line hardcoded switch, `custom` included) calls
`getGlobalReactRegistry().getComponent(control.type, mode)`
(`ReactControlRegistry.ts:57`, extends `control-registry-js`'s
`DefaultControlRegistry`) and, if a component is registered for that type, renders it
with the standard `{control, value, onChange, onBlur, onFocus, error, touched,
disabled, mode}` props contract every other control uses. This is real, working,
dynamic dispatch — confirmed, matching the architecture overview's claim that `custom`
is the one control genuinely routed through registry lookup rather than the hardcoded
switch. A form author *can* declare `{"id": "results-grid", "type": "custom", ...}`
(or any other type string with no built-in handler) and have a host app supply the
actual filtering behavior.

### 9.2 What this costs — the tradeoff, stated plainly

Going the `custom`-control route is real, but it is **not** "schema-configured
filtering" — it is dropping out of the pure-schema model for this one control,
exactly as the research prompt anticipated:

- The component registered via `registerReact()`/`register()` for a given
  `control.type` string lives in **host-app source code**, not in the portable JSON
  `FormSchema`. Nothing about *how* the filtering works (what fields it matches
  against, whether it's substring/prefix/fuzzy, debounce behavior, empty-state text)
  is expressible in the schema — only the bare `type` string and whatever ad hoc
  `config` object an author chooses to hand-author for that specific component to
  interpret, by private convention between the schema author and the component author.
- Each host app that wants to render this form correctly (`examples/form-studio`'s
  Player, its Studio preview, App Studio's `app-player` embedding a form-widget,
  Flow Studio's `atlas-forms-bridge` HIL rendering) must **independently register the
  same component under the same type string** via its own call to
  `ReactControlRegistry.registerReact()`/`registerAllControls()`. Miss one, and that
  host renders nothing for `results-grid` (there is no fallback beyond the
  `KNOWN_ADVANCED_TYPES` loading-placeholder path, and an unrecognized custom type
  falls further than that). This is the concrete cost of the property the user's
  question is really getting at: **"one JSON schema, one behavior everywhere" is lost**
  for this control — the filtering behavior now lives in N separately-maintained
  React components (one per host app, or one shared component that all N hosts must
  remember to import and register), not in the one schema blob stored in
  `Atlas_Forms.Schema`. The `useState`/`useEffect`/`.filter()` logic the user was
  trying to avoid per-form is still required — it just moves from "written once per
  form" to "written once per *component*, registered per host app," which is better
  than per-form but is exactly the custom-React-code path the question was asking
  whether Atlas Forms could avoid entirely. It cannot, today.

### 9.3 What would need to be built for a genuine declarative answer

None of the above is a dead end for the *product* — it's a confirmed, scoped gap. Two
independent, non-mutually-exclusive options, in order of how well each matches the
user's actual goal (schema-only, no custom React per form):

1. **A new `GridConfig.filterable`/`quickFilter` capability, implemented for real this
   time.** Add a field to the *live* `GridConfig` (`grid.types.ts`) — e.g.
   `quickFilter?: { fields: string[]; placeholder?: string }` — and implement it
   directly inside `GridControl.tsx`: a `useState<string>` for the filter text
   *already living inside this one, generic, reusable control* (not per-form,
   analogous to how `bulkEditEnabled`/pagination/export are already generic,
   config-driven capabilities of this same component), a `useMemo`-derived
   `displayRows` that additionally filters `rows` by the typed text against
   `quickFilter.fields` before pagination. This gets the exact "type into a box,
   narrow the grid's own already-loaded rows, zero network calls" behavior with
   **zero new schema concepts** beyond one more `grid.config` field — the closest
   match to "the Atlas Forms way." It only filters the grid's *own* embedded search
   box, though — it doesn't cover the reference design's separate filter *controls*
   (`filter-search`/`filter-document-type`/`filter-document-category` living outside
   the grid, matching Document Manager's actual UI) driving the grid from elsewhere on
   the form.
2. **A new, genuinely client-side-only `fieldActions[]`/`apiActions[]` trigger or
   action-type — e.g. `action: "client-filter"`, no `endpoint` — that names a target
   control ID and a filter expression/field-mapping, evaluated locally against the
   target's current in-memory value on every `OnChange` of the source control(s), no
   HTTP round-trip involved.** This is the more general fix and the one that actually
   matches this reference design's shape (three independent filter controls outside
   the grid, not one embedded quick-filter box): it would need (a) a new field on
   `ApiAction`/`FieldAction`'s type (both currently API-call-only per §9.1's finding
   2) to distinguish "call an endpoint" from "recompute a target control's displayed
   value from other controls' current values, in-process," (b) an actual engine that
   fires on `OnChange` of the filter controls and calls the grid's `onChange` with a
   filtered array (the exact same `value: array in → GridControl renders it` contract
   already confirmed live and working in §5 Q3 — no new grid-side plumbing needed,
   just a new *trigger source* for it that isn't an HTTP response), and (c) that
   engine actually wired into the real Player (`FormPlayerPage.tsx`) and Studio
   preview (`AtlasFormsStudioApp.tsx`), unlike `fieldActions[]` today. This is a
   materially bigger lift than option 1 (new type-level trigger semantics, not just
   one grid config field) but is the more faithful "Atlas Forms way" answer to a
   filter-controls-plus-grid layout like this schema's.

Until either is built, the definitive guidance for anyone implementing this specific
form today is: **the `custom` control type (§9.1 item 4) is the only way to get live
client-side grid filtering inside Atlas Forms right now, and choosing it means
writing and registering a real React component per host app — the exact
`useState`/component-logic pattern Document Manager itself uses outside Atlas Forms
entirely (§1, §7). There is no way to keep this specific behavior schema-configured
with today's code.**

## 10. Server-side filtering & pagination — real backend capability

**Answer to §4B/§7's open question: `Filters` is NOT honored — confirmed dead, not
just unconfirmed.** The full call chain from `BaseDocumentController.GetAll` down to
the actual EF query was read end-to-end, file by file. `Filters: Dictionary<string,
object>` is a real field that reaches the repository layer intact, but nothing in that
chain ever reads it. Pagination, by contrast, is real, working, and already returns a
true total-row count — the design in §4B.1 can be built once the filtering gap below
is closed, and the pagination half of it needs no backend work at all.

### 10.1 The full call chain, traced

1. `BaseDocumentController.GetAll` (`BizFirstFi.Go.Documents.Api.Base\Controllers\BaseDocumentController.cs:28-32`) —
   `[HttpPost("list")]`, binds `GoWebStandardListRequest request` from the body, calls
   `DocumentService.GetAllAsync(request, cancellationToken)`, returns it via
   `WebResponse_StandardList` which is a bare `Ok(response)`
   (`GoControllerBase.cs:136-139`) — no extra envelope wrapping.
2. `DocumentService` (`BizFirstFi.Go.Documents.Service\Services\DocumentService.cs`)
   does **not** override `GetAllAsync` at all — its own class doc comment says why:
   *"Service layer is pass-through to repository - all processing happens in
   repository."* It only overrides `CreateAsync`/`UpdateAsync`/`SoftDeleteAsync` (for
   processor hooks and cascade deletes), none of which touch `GetAllAsync`.
3. Documents' own `BaseService<TEntity,TKey>`
   (`BizFirstFi.Go.Documents.Service\Base\BaseService.cs`) also adds nothing — its
   entire body is a pass-through comment: *"All CRUD operations are inherited from
   BizFirstFi.Go.Essentials.Domain.BaseService. Override methods here only if
   Documents-specific behavior is needed."*
4. The real `GetAllAsync` implementation is
   `BizFirstFi.Go.Essentials.Domain.BaseService<TEntity,TKey>.GetAllAsync`
   (`BizFirstFi.Go.Essentials.Domain\Services\BaseService\BaseService.cs:124-135`) —
   it does nothing but log and call `Repository.GetAllAsync(request, cancellationToken)`.
5. `DocumentRepository` (`BizFirstFi.Go.Documents.Infrastructure\Repositories\DocumentRepository.cs`)
   does **not** override `GetAllAsync` either — its class doc comment: *"Inherits all
   operations from BaseRepository with automatic TenantID, Deleted, Archived
   filtering."* Its own `Repository<TEntity,TKey>` intermediate base
   (`BizFirstFi.Go.Documents.Infrastructure\Repositories\Base\Repository.cs`)
   overrides exactly two things — `ApplyTenantFilter` (fixes an `int` vs `int?` type
   mismatch in the shared base) and adds `ApplyOrderedPaginationAsync` (a
   pagination helper used by the *other* query methods, not `GetAllAsync`) — neither
   touches `Filters`.
6. The actual query is built in the shared generic
   `BizFirstFi.Go.Essentials.Domain.Repositories.BaseRepository<TEntity,TKey,TContext>.GetAllAsync`
   (`BizFirstFi.Go.Essentials.Domain\Repositories\BaseRepository.cs:98-127`) — read in
   full:
   ```csharp
   public virtual async Task<GoWebStandardListResponse> GetAllAsync(GoWebStandardListRequest request, CancellationToken cancellationToken = default)
   {
       var query = ApplyStandardFilters(DbSet.AsQueryable());
       var totalCount = await query.CountAsync(cancellationToken);
       if (request.PageInfo?.PageSize > 0) { /* Skip/Take pagination only */ }
       IEnumerable<TEntity> data = await query.ToListAsync(cancellationToken);
       return request.CreateResponse(data, totalCount);
   }
   ```
   `request` (the `GoWebStandardListRequest`, `Filters` included) is used for exactly
   two things here: `request.PageInfo` (pagination) and `request.CreateResponse(...)`
   (building the response envelope). **`request.Filters` is never read.**
   `ApplyStandardFilters` (`BaseRepository.cs:951-968`) applies only three predicates,
   each via a reflection existence-check on the entity type, not the request: `Deleted
   == false`, `Archived == false`, and (via `ApplyTenantFilter`) `TenantID ==
   <ambient tenant>`. No `Dictionary<string,object>`-driven predicate-building code
   exists anywhere in this class — confirmed by grepping the entire 1000+-line file
   for `Filters`; every hit is one of the three calls to `ApplyStandardFilters`/
   `ApplyTenantFilter` above, none reference the request's `Filters` property.

**Net: `Filters` is plumbed all the way from the HTTP request body down to the
repository call and then silently dropped — never read, never applied, never even
logged.** This is a fully-dead field for `Document`, not merely an unconfirmed one.

### 10.2 Is this generic-infra-wide, or Documents-specific? — checked, it's platform-wide dead

The task asked specifically whether a shared `BaseRepository`/`GoRepositoryBase`-style
mechanism reflects over `Filters` generically. It does not, and this isn't
Documents-specific: `BaseRepository<TEntity,TKey,TContext>` lives in
`BizFirstFi.Go.Essentials.Domain` and is the actual shared base for the whole
platform's `Go.*` module family (Documents' own `Repository<TEntity,TKey>` extends it
directly, as do the equivalent per-module bases for `Plan`, `Payment`, `WhiteLabel`,
`Common`, etc. — same class, same file). Its `ApplyStandardFilters` only ever does
existence-checked reflection for three fixed, hardcoded property names (`Deleted`,
`Archived`, `TenantID`) — never a general "for each key in `Filters`, find a matching
property and apply `.Where()`" loop. A repo-wide grep for any code that actually reads
a `GoWebStandardListRequest`/`GoWebStandardSearchRequest`'s `.Filters` as a real query
predicate turned up exactly two other real usages, both irrelevant precedent:
- `BizFirst.Ai.AiConversation.Service\Services\ConversationService.cs:92` — copies
  `request.Filters` verbatim into a *different* request object it constructs
  (`GetByUserIdSearchRequest.Filters = request.Filters`) and passes it along — the
  receiving method never reads it either; this is a passthrough, not an application.
- `BizFirst.Integration.GSheets.Services\Sheet\GSheetsSheetService.cs` — a real,
  working `Filters`-driven row-matching engine (`ApplyFiltersOnRows`,
  `SheetFilter`/`FilterCombineMode`), but this is an **unrelated type** on an
  unrelated request class (Google Sheets row lookups) that merely happens to share the
  property name `Filters` — it is `List<SheetFilter>`, not the
  `Dictionary<string,object>` on `SuperBaseSearchRequest` that `Document`'s endpoints
  use. Not prior art for this problem, just a name collision.

**Conclusion: there is no generic, reflection-based `Filters`-application mechanism
anywhere in this codebase for the `GoWebStandardListRequest`/`SuperBaseSearchRequest`
family. It would need to be built, either generically (shared base, platform-wide
blast radius) or per-module (Documents-only, contained blast radius) — see §10.4.**

### 10.3 Other real query endpoints on `BaseDocumentController` — each checked individually

Beyond `GetAll`, `BaseDocumentController` exposes 9 more `[HttpPost]` "Document
Queries" endpoints. Every one of them was traced to its real repository
implementation (`DocumentRepository.cs`, "Document Queries" region) — each is a
single, hardcoded, non-combinable `.Where()` predicate, backed by real pagination
(`ApplyPaginationAsync`, a private helper structurally identical to the shared base's
pagination — real `CountAsync` + `Skip`/`Take` + `GoPageInfoFull` with
`TotalRecords`/`TotalPages`):

| Route | Repository method | Real predicate |
|---|---|---|
| `submission/{submissionId}` | `GetBySubmissionIdAsync` | `d.SubmissionID == submissionId` |
| `type/{documentTypeId}` | `GetByTypeAsync` | `d.DocumentTypeID == documentTypeId` |
| `category/{documentCategoryId}` | `GetByCategoryAsync` | `d.DocumentCategoryID == documentCategoryId` |
| `tenant/verification-status/{status}` | `GetByVerificationStatusAsync` | `d.VerificationStatus == request.VerificationStatus` |
| `tenant/verified` | (same, status hardcoded) | `VerificationStatus == "Verified"` (set by the controller before calling) |
| `tenant/rejected` | (same, status hardcoded) | `VerificationStatus == "Rejected"` |
| `tenant/pending-verification` | `GetPendingVerificationAsync` | `d.VerificationStatus == "Pending"` |
| `tenant/expired` | `GetExpiredDocumentsAsync` | `d.ExpiryDate.HasValue && d.ExpiryDate < now` |
| `tenant/pending-ocr` | `GetPendingOCRProcessingAsync` | `!d.OCRProcessed` |
| `tenant/legal-hold` | `GetDocumentsUnderLegalHoldAsync` | `d.LegalHoldFlag` |

None of these accept free text. None can be combined with each other (each is its own
independent `Where()` over `ApplyStandardFilters(DbSet.AsQueryable())`, not a
composable query builder) — combining "type X AND category Y" today would require two
separate round trips and an intersection computed client-side, which defeats the
point of server-side filtering. Their request DTOs
(`BizFirstFi.Go.Documents.Domain\WebRequests\Document\DocumentSearchRequests.cs`) each
add exactly one strongly-typed field on top of the same unused `Filters`/`PageInfo`
base (e.g. `GetByDocumentTypeSearchRequest.DocumentTypeID : IDInfo`) — so even these
more targeted endpoints don't read `Filters` either; they use their own dedicated
property instead.

**No hidden, not-yet-exposed internal search capability exists in
`DocumentService`/`DocumentRepository` beyond what's listed above** — the "Document
Queries" region of `DocumentRepository.cs` was read in full; these 10 methods (`GetAll`
plus the 9 above) are the entire real query surface for `Document`.

### 10.4 What would need to change — concrete, scoped

**The idiomatic place to add this, per the codebase's own established pattern, is the
repository layer, not the service layer** — `DocumentService`'s own doc comment
(*"Service layer is pass-through to repository - all processing happens in
repository"*) and the existing precedent of `Repository<TEntity,TKey>`
(`BizFirstFi.Go.Documents.Infrastructure\Repositories\Base\Repository.cs`) already
overriding two other shared-base behaviors specifically to keep Documents-only fixes
out of the platform-wide `BaseRepository` (its own doc comment: *"deliberately local
to this module rather than fixes to the shared base, which would change query results
for every other module at once"*) — both point at the same fix location:

- **File**: `BizFirstFi.Go.Documents.Infrastructure\Repositories\DocumentRepository.cs`
- **Change**: override `GetAllAsync(GoWebStandardListRequest request, ...)` (currently
  not overridden at all — inherited unmodified from `BaseRepository`). New body reads
  `request.Filters` and applies real `.Where()` clauses before counting/paging, mirroring
  the exact style already used by `GetByTypeAsync`/`GetByCategoryAsync` in the same
  file:
  ```csharp
  public override async Task<GoWebStandardListResponse> GetAllAsync(GoWebStandardListRequest request, CancellationToken cancellationToken = default)
  {
      var query = ApplyStandardFilters(DbSet.AsQueryable());

      if (request.Filters.TryGetValue("documentTypeID", out var typeVal) && typeVal is not null
          && int.TryParse(typeVal.ToString(), out var typeID))
          query = query.Where(d => d.DocumentTypeID == typeID);

      if (request.Filters.TryGetValue("documentCategoryID", out var catVal) && catVal is not null
          && int.TryParse(catVal.ToString(), out var catID))
          query = query.Where(d => d.DocumentCategoryID == catID);

      if (request.Filters.TryGetValue("nameContains", out var nameVal) && nameVal is string term
          && !string.IsNullOrWhiteSpace(term))
          query = query.Where(d =>
              EF.Functions.Like(d.DocumentName, $"%{term}%") ||
              EF.Functions.Like(d.OriginalFileName, $"%{term}%") ||
              (d.DocumentDescription != null && EF.Functions.Like(d.DocumentDescription, $"%{term}%")) ||
              (d.ClassificationName != null && EF.Functions.Like(d.ClassificationName, $"%{term}%")));

      var totalCount = await query.CountAsync(cancellationToken);
      // ...existing PageInfo/Skip/Take/ToListAsync/CreateResponse logic, unchanged...
  }
  ```
  `documentTypeID`/`documentCategoryID`/`nameContains` above are proposed keys, not
  discovered ones — nothing today defines a recognized key vocabulary for `Filters`
  because nothing reads it (§10.1). These three specifically match §4B.1's schema
  guess (`filters.nameContains`/`filters.documentTypeID`/`filters.documentCategoryID`)
  and the four text fields §1's original design named as in-scope
  (name/filename/description/classification).
- **No change needed** in `BaseDocumentController.cs`, `DocumentService.cs`, or
  Documents' `BaseService.cs` — the pass-through chain (§10.1 steps 1-4) already
  forwards `request` (with its `Filters`) untouched all the way to the repository;
  only the repository ever needs to start reading it.
- **No change needed** to `GoWebStandardListRequest`/`SuperBaseSearchRequest` — the
  `Filters: Dictionary<string, object>` field the frontend would populate already
  exists on the wire contract (§7); this is purely a "start reading a field that's
  already there" change, not a DTO change.
- **Alternative (not recommended)**: fixing this generically in the shared
  `BaseRepository<TEntity,TKey,TContext>.GetAllAsync`
  (`BizFirstFi.Go.Essentials.Domain\Repositories\BaseRepository.cs:98-127`) via a new
  `virtual ApplyRequestFilters(query, request.Filters)` reflection hook (parallel to
  the existing `ApplyStandardFilters` reflection pattern) would make this available to
  every module at once, but changes query results platform-wide and needs its own,
  much larger review — the Documents module's own `Repository<TEntity,TKey>` file
  explicitly avoids this exact move for a different, already-fixed bug (see its
  `ApplyTenantFilter` doc comment), which is direct in-codebase precedent for keeping
  this fix module-local instead.

### 10.5 Pagination — real response shape, confirmed complete (no backend work needed)

Contrary to §7's summary that `GoWebStandardListResponse`'s "only payload field is
`Data`" — that was correct about what's needed to reach `results-grid` (§5 Q3's
`"data"` path), but incomplete about the full envelope. The response class hierarchy
was traced in full:

```
GoWebStandardListResponse           (StandardListRequest.cs — empty, all fields inherited)
  : GoWebBaseSearchResponse         (BaseSearchRequest.cs)  adds: Data (object?)
    : SuperGoWebBaseSearchResponse  (SuperBaseSearchRequest.cs)  adds: PageInfo (GoPageInfoFull)
      : GoWebResponse               (GoWebRequest.cs)  adds: Metadata, Errors, Success (computed)
```

`GoPageInfoFull` (`BizFirstFi.Go.Essentials.Domain\Request\Pages\PageInfo.cs:54-93`) —
the real, populated pagination object, built by
`request.PageInfo.CreatePageInfoFull(totalRecords)` inside
`GoWebStandardListRequest.CreateResponse` (`StandardListRequest.cs:6-10`), where
`totalRecords` comes from a real `query.CountAsync()` executed **before** `Skip`/`Take`
(`BaseRepository.cs:105`) — i.e. it already reflects the full filtered row count, not
just the current page's row count:

- `pageNumber` (int)
- `pageSize` (int)
- `sortBy` (string?) — accepted on the request but never actually applied as an
  `OrderBy` anywhere in `GetAllAsync` (only `type`/`category`/etc. queries hardcode
  their own `.OrderBy()`) — a real, separate gap if sortable columns are wanted later,
  not addressed by this section.
- `sortOrder` (string, default `"asc"`) — same caveat as `sortBy`.
- **`totalRecords`** (int) — the real total-row count needed for "page X of Y" UI.
- **`totalPages`** (int) — precomputed as `Ceiling(totalRecords / pageSize)`.
- `hasPreviousPage` (bool, computed: `pageNumber > 1`)
- `hasNextPage` (bool, computed: `pageNumber < totalPages`)

So the full JSON envelope `POST /api/v1/documents/list` returns today (camelCase,
confirmed via `Ok(response)` with no extra wrapping, §10.1 step 1) is:

```json
{
  "data": [ /* Document[] */ ],
  "pageInfo": {
    "pageNumber": 1,
    "pageSize": 25,
    "sortBy": null,
    "sortOrder": "asc",
    "totalRecords": 137,
    "totalPages": 6,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "metadata": { /* GoWebRequestMetadata */ },
  "errors": { /* GoWebErrors */ },
  "success": true
}
```

**This fully supports real "page X of Y" pagination UI today, independent of the
filtering gap** — `MAX_PAGE_SIZE = 200` / `DEFAULT_PAGE_SIZE = 50` are enforced
server-side (`BaseRepository.cs:22-23`, clamped in `GetAllAsync` if the caller
requests more). §4B.1's `page-number` control mapping to `pageInfo.pageNumber` in the
outgoing request, and reading `pageInfo.totalRecords`/`pageInfo.totalPages` back for
display, is the right shape and needs no backend change — only the (separate,
frontend-side, Atlas Forms) work already flagged in §4B.3 items 2-3 to get a
`submit`-triggered response mapped into any control at all.

### 10.6 Summary

| Question | Answer |
|---|---|
| Does `Filters` get read/applied anywhere in the real call chain? | **No — confirmed dead**, traced controller → service (pass-through, no override) → Documents `BaseService` (pass-through) → Essentials `BaseService.GetAllAsync` (pass-through) → `DocumentRepository` (no override) → shared `BaseRepository.GetAllAsync` (reads only `PageInfo`, never `Filters`) |
| Generic reflection-based `Filters` mechanism in shared repo infra? | **No** — `ApplyStandardFilters` only handles 3 hardcoded properties (`Deleted`/`Archived`/`TenantID`); no `Filters`-driven predicate builder exists anywhere in the platform for this request family |
| Any other real way to filter documents server-side today? | **Yes, but narrow**: 9 single-predicate, non-combinable, non-free-text query endpoints (type/category/submission/status/expired/pending-OCR/legal-hold) — real and paginated, but can't answer "name contains X AND type = Y" in one call |
| Pagination response shape | **Real and complete**: `pageInfo: { pageNumber, pageSize, sortBy, sortOrder, totalRecords, totalPages, hasPreviousPage, hasNextPage }` alongside `data`, `metadata`, `errors`, `success` — `totalRecords` is a true pre-`Skip`/`Take` `COUNT`, ready for "page X of Y" UI as-is |
| What needs to change for real server-side filtering | **One file**: override `GetAllAsync` in `BizFirstFi.Go.Documents.Infrastructure\Repositories\DocumentRepository.cs` to read `request.Filters["documentTypeID"]`/`["documentCategoryID"]`/`["nameContains"]` and apply `.Where()` clauses before the existing count/page/list logic — no controller, service, or DTO changes required |

## 11. Search endpoint — real existing pattern or new-build, and what it should look like

**STATUS: BUILT/RESOLVED (2026-09-02).** §11.3's plan below was implemented exactly as written,
6 files (the 5 from §11.3 plus a new `DocumentServiceTests.cs` "Search Tests" region, not
originally counted). Full details, build/test results, and the explicit live-verification caveat
are in `BizFirstFi.Go.Documents`'s own `DevelopmentHistoryLog.md` (2026-09-02 entry) — summary for
whoever builds the actual search form schema next:

- **Final endpoint**: `POST /api/v1/documents/search` (distinct from, and does not change,
  `POST /api/v1/documents/list`).
- **Final request shape** (`DocumentSearchRequest : GoWebStandardSearchRequest`, all fields
  optional/AND-combined): `{ "nameContains": "invoice", "documentTypeID": { "id": 3 },
  "documentCategoryID": { "id": 7 }, "pageInfo": { "pageNumber": 1, "pageSize": 25 } }` — confirms
  §11.4's guessed shape exactly, including `documentTypeID`/`documentCategoryID` as nested
  `{ "id": N }` objects (camelCase `IDInfo` serialization — `id`, not `ID`), not bare integers.
- **Final response shape** (`GoWebStandardSearchResponse`, same envelope as every other Document
  Query endpoint on this controller): `{ "data": [...Document[]], "pageInfo": { "pageNumber",
  "pageSize", "totalRecords", "totalPages", "hasPreviousPage", "hasNextPage" }, "metadata": {...},
  "errors": {...}, "success": true }`.
- **Verified**: clean builds of all 5 touched/rebuilt C# projects (`dotnet build -m:2`, 0 errors, 0
  new warnings) and a full `BizFirstFi.Go.Documents.Tests` run — **145/145 pass** (142 pre-existing
  + 3 new). **NOT verified**: a real live HTTP round-trip — the shared dev machine had only 0.78 GB
  RAM free at build time, so the already-running Consolidated WebApi instance (confirmed serving
  the Documents module — `/api/v1/documents/list` returns a real 401, not 404) was deliberately not
  restarted, to avoid an OOM risk to the shared environment. Whoever next restarts that process (or
  runs `BizFirstFi.Go.Documents.Api` standalone) should do one real round-trip with a live JWT
  before treating the exact wire shape above (particularly the `IDInfo` `id` casing) as final.
- **Not built this pass, still open**: `DocumentClient.search()` on `@doc-app/api-client`, and this
  file's own §4B.1/§11.4 schema `apiActions[].endpoint`/`payloadMapping` update — both frontend-side
  and explicitly out of scope for the backend-only task that resolved this section.

**Binoy's redirect on §10.4's recommendation: "GetAllAsync instead of this, use Search
endpoint."** — i.e. don't hand-build filter logic into `GetAllAsync`; wire this to a
`Search` endpoint instead. **Answer, confirmed by direct code reading: this is
option 1, reuse — a real, already-working, server-side-filtering "Search" pattern
already exists in this codebase, used by multiple sibling modules (Atlas Forms
Manager's `Form`/`FormType`/`FormGroup`/`FormGroupType`/`FormGroupCategory`, and
`Go.WhiteLabel`'s `WhiteLabel`/`WhiteLabelSetting`/`WhiteLabelStatus`). Documents should
be wired to the SAME pattern, not have bespoke logic invented for it, and specifically
NOT via the `Filters: Dictionary<string,object>` field §10 already proved dead — the
real pattern never uses `Filters` at all.**

### 11.1 The real, working pattern — traced end-to-end on two independent modules

**Routing/naming convention**: a dedicated `[HttpPost("search")]` action, separate from
`[HttpPost("list")]`, on the same controller. Confirmed on two unrelated modules:

- `BizFirst.Atlas.Forms.Manager.Api.Base\Controllers\BaseFormController.cs:121-128` —
  ```csharp
  [HttpPost("search")]
  [ApiLimit("Form.SearchByName", eOperationLimitType.List)]
  [AuthorizeRegularUserAttribute]
  public virtual async Task<IActionResult> SearchByName([FromBody] FormSearchByNameRequest request, CancellationToken cancellationToken = default)
  {
      GoWebStandardSearchResponse response = await FormService.SearchByNameAsync(request, cancellationToken);
      return await WebResponse_Search(response, request);
  }
  ```
  The same `[HttpPost("search")]` + `SearchByNameAsync`/`FormXSearchByNameRequest` shape
  is repeated verbatim in `BaseFormTypeController.cs:89`,
  `BaseFormGroupController.cs:89`, `BaseFormGroupTypeController.cs:89`, and
  `BaseFormGroupCategoryController.cs:89` — five controllers, same convention, not a
  one-off.
- `BizFirstFi.Go.WhiteLabel.Api.Base\Controllers\BaseWhiteLabelController.cs:168-175` —
  ```csharp
  [HttpPost("search")]
  [ApiLimit("WhiteLabel.Search", eOperationLimitType.Search)]
  [AuthorizeRegularUserAttribute]
  public virtual async Task<IActionResult> Search([FromBody] WhiteLabelSearchRequest request, CancellationToken cancellationToken = default)
  {
      GoWebStandardSearchResponse response = await WhiteLabelService.SearchAsync(request, cancellationToken);
      return await WebResponse_Search(response, request);
  }
  ```
  Same shape again in `BaseWhiteLabelSettingController.cs:129` and
  `BaseWhiteLabelStatusController.cs:107`. **`eOperationLimitType` even has a dedicated
  `Search = 3` enum value**, distinct from `List`/`Fetch`
  (`BizFirst.Platform.RateLimiting.Execution.Attributes\eOperationLimitType.cs:19`), with
  an explicit doc comment on the attribute itself: *"List = high-concurrency reads. Fetch
  = lightweight reads. Search = filtered queries."*
  (`ApiLimitAttribute.cs:35`) — direct, platform-level evidence that "a filtered-query
  endpoint is its own recognized operation category," not an improvised label.

**The request/response type family — a real sibling of the dead one, not the dead one
itself.** `GoWebStandardSearchRequest`/`GoWebStandardSearchResponse`
(`BizFirstFi.Go.Essentials.Domain\Request\Request\Search\Standard\StandardSearchRequest.cs`)
are a separate class pair from `GoWebStandardListRequest`/`GoWebStandardListResponse`
(`...\Search\StandardListRequest.cs`) — both extend the same
`GoWebBaseSearchRequest`/`GoWebBaseSearchResponse`, but **`GoWebStandardSearchRequest`
is the one every real search endpoint above actually binds to**, not
`GoWebStandardListRequest` (which is what `BaseDocumentController.GetAll` and
`BaseWhiteLabelController.GetAll`/`GetActive` still use, per §10).

**The mechanism that makes it actually work, and why it doesn't hit §10's dead-`Filters`
trap**: every real search request DTO is a concrete subclass of
`GoWebStandardSearchRequest` that declares its **own strongly-typed, nullable filter
properties** — never the generic `Filters: Dictionary<string, object>` bag. Two
confirmed examples, read in full:
- `FormListRequest : GoWebStandardSearchRequest`
  (`BizFirst.Atlas.Forms.Manager.Domain\WebRequests\Form\FormSearchRequests.cs:50-75`) —
  `SearchTitle`/`FormID`/`CreatedBy`/`IsEnabled`/`IsSystem`/`ResolvedSchemaEnabled`/
  `CreatedFrom`/`CreatedTo`, all nullable. Its repository method,
  `FormRepository.SearchListAsync`
  (`BizFirst.Atlas.Forms.Manager.Infrastructure\Repositories\FormRepository.cs:113-148`),
  reads each property directly (`if (!string.IsNullOrWhiteSpace(request.SearchTitle)) query = query.Where(f => f.Title != null && f.Title.Contains(request.SearchTitle));` etc.) — 7
  independent, combinable, conditionally-applied `.Where()` clauses, genuinely
  server-side, genuinely AND-combinable (unlike Documents' 9 existing single-predicate
  query endpoints, per §10.3).
- `WhiteLabelSearchRequest : GoWebStandardSearchRequest`
  (`BizFirstFi.Go.WhiteLabel.Domain\WebRequests\WhiteLabel\WhiteLabelSearchRequests.cs:97-105`)
  — one `SearchTerm` field. `WhiteLabelRepository.SearchAsync`
  (`BizFirstFi.Go.WhiteLabel.Infrastructure\Repositories\WhiteLabelRepository.cs:217-234`)
  applies it as a real, OR-combined, multi-column free-text match: `.Where(w =>
  w.TenantID == request.TenantID && (w.Name.Contains(request.SearchTerm) ||
  w.CompanyName.Contains(request.SearchTerm) || w.DomainName.Contains(request.SearchTerm)
  || w.WhiteLabelCode.Contains(request.SearchTerm)))` — exactly the
  "name/filename/description/classification" free-text match §1/§10.4 wanted for
  Documents, proven working elsewhere, not hypothetical.

Also confirmed real and reusable: `FormSearchByNameRequest`
(`FormSearchRequests.cs:27-31`, one required `Name` field) →
`FormRepository.SearchByNameAsync` (`FormRepository.cs:72-83`) — `.Where(f =>
f.Name.Contains(request.Name))` — the narrower, single-field "search" companion to the
broader multi-field "list" request, both real, both server-applied, both on the same
controller.

**Pagination for the search family is not bespoke per module — it's the same shared
helper `BaseDocumentController`'s own repository already inherits.**
`BaseRepository<TEntity,TKey,TContext>.ApplyPaginationAsync(IQueryable<TEntity> query,
GoWebStandardSearchRequest request, CancellationToken)`
(`BizFirstFi.Go.Essentials.Domain\Repositories\BaseRepository.cs:1190-1261`) does a real
`CountAsync` before `Skip`/`Take`, clamps `pageSize` to `MAX_PAGE_SIZE`, and returns a
populated `GoWebStandardSearchResponse` with `PageInfo.TotalRecords`/`TotalPages` — every
example above calls exactly this method as their last line. **`DocumentRepository.cs`
does not need to newly acquire this capability — it already has it by inheritance, and
in fact already has its own local, near-identical private copy**
(`DocumentRepository.cs:721`, `private async Task<GoWebStandardSearchResponse>
ApplyPaginationAsync(IQueryable<Document> query, GoWebStandardSearchRequest request, ...)`)
used today by all 9 of its existing "Document Queries" methods (§10.3's table) — so
Documents is already 90% of the way onto this exact pattern; it has simply never added a
combinable, multi-field `Search`/`search` action on top of it.

### 11.2 Confirmed: `BaseDocumentController`/`DocumentRepository`/`IDocumentService` have no `Search` method today, partially built or otherwise

A full check of `IDocumentRepository.cs`, `IDocumentService.cs`, and
`DocumentRepository.cs` (all in `BizFirstFi.Go.Documents.Domain`/`.Infrastructure`) finds
every method with "Search" in its name belongs to the 9 already-catalogued single-predicate
query methods from §10.3 (`GetBySubmissionIdAsync`, `GetByTypeAsync`, `GetByCategoryAsync`,
`GetByVerificationStatusAsync`, `GetExpiredDocumentsAsync`, `GetPendingOCRProcessingAsync`,
`GetPendingVerificationAsync`, `GetDocumentsUnderLegalHoldAsync`,
`GetDocumentsDueForRetentionAsync` — the last one not previously listed in §10.3's table,
same shape as the rest) plus the module's own local `ApplyPaginationAsync` helper. There is
no `SearchAsync`/`Search` method anywhere in the Documents module, started or otherwise —
this is a clean, from-scratch addition, not a resume-an-unfinished-method situation.
`BizFirstFi.Go.Documents.Domain\WebRequests\Document\DocumentSearchRequests.cs` already
holds all 9 existing single-field search DTOs (e.g. `GetByDocumentTypeSearchRequest :
GoWebStandardSearchRequest { public IDInfo DocumentTypeID { get; set; } }`) — this is the
right file to add the new multi-field `DocumentSearchRequest` DTO to, matching the file's
own existing convention.

### 11.3 Concrete plan: wire Documents onto the real `Search` pattern

Five files, mirroring the `Form`/`WhiteLabel` precedent exactly — no changes needed to
`GoWebStandardSearchRequest`/`GoWebBaseSearchRequest`/`BaseRepository` (all shared infra
already does what's needed):

1. **`BizFirstFi.Go.Documents.Domain\WebRequests\Document\DocumentSearchRequests.cs`** —
   add a new class alongside the existing 9:
   ```csharp
   /// <summary>
   /// Request for combinable, server-side document search (name/type/category).
   /// </summary>
   public class DocumentSearchRequest : GoWebStandardSearchRequest
   {
       /// <summary>Free-text match against DocumentName/OriginalFileName/DocumentDescription/ClassificationName.</summary>
       public string? NameContains { get; set; }
       public IDInfo? DocumentTypeID { get; set; }
       public IDInfo? DocumentCategoryID { get; set; }
   }
   ```
   `IDInfo?` (nullable wrapper) matches this file's own existing convention for ID filter
   fields (`GetByDocumentTypeSearchRequest.DocumentTypeID`, non-nullable because that
   endpoint requires it) rather than Forms' raw `int?` — Documents' own house style, kept
   consistent within its own file rather than copied verbatim from a different module.

2. **`IDocumentRepository.cs` and `IDocumentService.cs`**
   (`BizFirstFi.Go.Documents.Domain\Interfaces\Repositories` /
   `...\Interfaces\Services`) — add, next to the 9 existing `GetByXAsync` signatures:
   ```csharp
   Task<GoWebStandardSearchResponse> SearchAsync(DocumentSearchRequest request, CancellationToken cancellationToken = default);
   ```

3. **`BizFirstFi.Go.Documents.Service\Services\DocumentService.cs`** — add the
   pass-through, consistent with this class's own doc comment ("Service layer is
   pass-through to repository"):
   ```csharp
   public async Task<GoWebStandardSearchResponse> SearchAsync(DocumentSearchRequest request, CancellationToken cancellationToken = default)
       => await _repository.SearchAsync(request, cancellationToken);
   ```

4. **`BizFirstFi.Go.Documents.Infrastructure\Repositories\DocumentRepository.cs`** — add a
   new method in the "Document Queries" region, following the exact conditional-`.Where()`
   shape `FormRepository.SearchListAsync` already proved works, and reusing this file's own
   existing local `ApplyPaginationAsync` (line 721) as every other method in this region
   already does:
   ```csharp
   public async Task<GoWebStandardSearchResponse> SearchAsync(
       DocumentSearchRequest request,
       CancellationToken cancellationToken = default)
   {
       Logger.LogDebug("Searching Documents for TenantID: {TenantID}", TenantID);

       var query = ApplyStandardFilters(DbSet.AsQueryable());

       if (!string.IsNullOrWhiteSpace(request.NameContains))
       {
           var term = request.NameContains;
           query = query.Where(d =>
               d.DocumentName.Contains(term) ||
               d.OriginalFileName.Contains(term) ||
               (d.DocumentDescription != null && d.DocumentDescription.Contains(term)) ||
               (d.ClassificationName != null && d.ClassificationName.Contains(term)));
       }

       if (request.DocumentTypeID?.ID > 0)
           query = query.Where(d => d.DocumentTypeID == request.DocumentTypeID.ID);

       if (request.DocumentCategoryID?.ID > 0)
           query = query.Where(d => d.DocumentCategoryID == request.DocumentCategoryID.ID);

       query = query.OrderByDescending(d => d.LastModifiedOn);

       return await ApplyPaginationAsync(query, request, cancellationToken);
   }
   ```
   (`.Contains()` here mirrors `WhiteLabelRepository.SearchAsync`'s real, working
   free-text pattern exactly — EF Core translates `string.Contains` to SQL `LIKE`
   natively, so `EF.Functions.Like` isn't required to get server-side substring
   matching, though it remains an option if a case-insensitivity/collation nuance
   surfaces during implementation.)

5. **`BizFirstFi.Go.Documents.Api.Base\Controllers\BaseDocumentController.cs`** — add a
   new action in the "Document Queries" region (`#region`, alongside `GetByType`/
   `GetByCategory` etc.), matching `BaseFormController.SearchByName`/
   `BaseWhiteLabelController.Search` exactly:
   ```csharp
   [HttpPost("search")]
   [ApiLimit("Document.Search", eOperationLimitType.Search)]
   [AuthorizeRegularUserAttribute]
   public virtual async Task<IActionResult> Search([FromBody] DocumentSearchRequest request, CancellationToken cancellationToken = default)
   {
       GoWebStandardSearchResponse response = await DocumentService.SearchAsync(request, cancellationToken);
       return await WebResponse_Search(response, request);
   }
   ```

**No change needed** to `GoWebStandardSearchRequest`, `GoWebBaseSearchRequest`, or
`BaseRepository<TEntity,TKey,TContext>` — all already do exactly what this needs, already
proven working by the `Form`/`WhiteLabel` precedent. **§10.4's originally-recommended fix
(override `GetAllAsync` to read the dead `Filters` dictionary) is superseded by this plan
and should NOT also be done** — `GetAllAsync`/`POST /api/v1/documents/list` stays exactly
as-is (unfiltered list, per §10), and the new `POST /api/v1/documents/search` action is
the one and only place server-side filtering lives, per Binoy's explicit redirect.

### 11.4 What this changes in §4B.1's schema and the Document Manager frontend

- **Endpoint**: §4B.1's `apiActions[].endpoint` changes from `/api/v1/documents/list` to
  **`/api/v1/documents/search`**.
- **`payloadMapping`'s outgoing keys lose the `filters.` prefix.** §4B.1 guessed
  `filters.nameContains`/`filters.documentTypeID`/`filters.documentCategoryID` on the
  assumption the backend would read a nested `Filters` dictionary (§4B.2's own text
  flagged this as the exact thing §10 needed to confirm or correct). §10 confirmed
  `Filters` is dead; §11.3's new `DocumentSearchRequest` puts these as **flat, top-level**
  properties instead. The corrected outgoing mapping is:
  ```json
  "payloadMapping": {
    "filter-search": "nameContains",
    "filter-document-type": "documentTypeID.id",
    "filter-document-category": "documentCategoryID.id",
    "page-number": "pageInfo.pageNumber",
    "results-grid": "data"
  }
  ```
  (`documentTypeID.id`/`documentCategoryID.id` reflect `IDInfo`'s own shape — confirm the
  exact casing of `IDInfo`'s serialized property name against a live payload before
  finalizing, same "worth one real round-trip test" caveat §5 Q3 already flagged for the
  `data` response path.)
- **Frontend API client**: `DocumentClient`
  (`BizFirstAiStudio\src\doc-app\packages\@doc-app\api-client\src\documentClient.ts`) has
  no `search()` method today — only `list()`/`listByType()`/`listByCategory()`/etc. (§7).
  A real Documents search UI (Atlas Forms-driven or the existing React Document Manager
  app) needs a new `DocumentClient.search({ nameContains?, documentTypeID?,
  documentCategoryID?, pageNumber?, pageSize? })` method calling the new endpoint —
  mirroring `list()`'s existing shape, not a new client pattern.
- **§10.4's proposed `.Where()` snippet (inside `GetAllAsync`) is now moot** — superseded
  by §11.3 item 4's `SearchAsync` method; do not implement both.

### 11.5 Summary

| Question | Answer |
|---|---|
| Does a real, working, server-applied "Search" pattern already exist in this codebase? | **Yes** — `GoWebStandardSearchRequest`/`GoWebStandardSearchResponse` + a dedicated `[HttpPost("search")]` action, used today by `Form`/`FormType`/`FormGroup`/`FormGroupType`/`FormGroupCategory` (Atlas Forms Manager) and `WhiteLabel`/`WhiteLabelSetting`/`WhiteLabelStatus` (Go.WhiteLabel) |
| Reuse or build-new? | **Reuse the pattern** (routing convention, request/response types, shared `ApplyPaginationAsync`); **build-new only the Documents-specific pieces** (the `DocumentSearchRequest` DTO and its repository predicate logic) — same balance every other module above already struck |
| Does it avoid §10's dead-`Filters` trap? | **Yes, structurally** — the real pattern never reads a generic `Filters` dictionary; each request DTO declares its own strongly-typed nullable properties, read directly by name in the repository method |
| Does `BaseDocumentController`/`DocumentRepository` already have unfinished Search groundwork? | **No** — confirmed clean-slate; the module already has the supporting local `ApplyPaginationAsync` helper (used by its 9 other query methods) but no `Search`-named method of any kind |
| What needs to change | **5 files**: `DocumentSearchRequests.cs` (new `DocumentSearchRequest` class), `IDocumentRepository.cs`, `IDocumentService.cs`, `DocumentService.cs` (pass-through), `DocumentRepository.cs` (new `SearchAsync` with real conditional `.Where()`), plus `BaseDocumentController.cs` (new `[HttpPost("search")]` action) — 6 files total including the controller |
| Does this replace or add to §10.4's fix? | **Replaces it** — `GetAllAsync`/`/documents/list` stays unfiltered exactly as today; all server-side filtering moves to the new `/documents/search` action instead, per Binoy's explicit direction |

## 12. 2026-09-02 — Live-testing UI fixes (FormID 30500) + new Document View/Edit form (FormID 30501)

Real issues found live-testing the seeded FormID 30500 form via Atlas Forms Studio, fixed at the
platform level in `@atlas-forms/player-components-react` (runtime) and
`@atlas-forms/designer-components-react` (Studio authoring UI), not one-off schema hacks. Full
narrative and code-level detail lives in each package's own `DevelopmentHistoryLog.md` — this
section is the schema/DB-facing summary.

1. **Duplicate "Search" label** — `FormField.tsx`'s generic field wrapper unconditionally
   rendered a `<label>{control.label}</label>` above every control, including `type: "button"`
   controls whose own text already comes from `control.config.label ?? control.label`. Fixed by
   adding a `control.type === 'button'` branch that skips the label wrapper entirely. Platform
   fix — every Atlas Form with a button control benefits, not just this one.
2. **Right-aligning the Search button** — no new field added. `FormControl.styles.containerStyle`
   (`ControlStyleSet`/`StyleProperties`, already real, already applied by `FormRenderer` to
   every control's wrapper) already supports `display: 'flex'` + `justifyContent: 'flex-end'`.
   `search-submit` now sets `"styles": {"containerStyle": {"display": "flex", "justifyContent":
   "flex-end"}}` plus `"gridPosition": {"column": 3}` to land in the last column of its row.
   Already editable in Studio today via PropertiesTab → StyleBuilderPanel → Effects tab →
   "Layout (containers)" section (Display/Direction/Justify/Align/Wrap) — zero new UI needed.
3. **Filters one-per-row instead of 2–3 per row** — `FormRenderer` previously ignored
   `schema.sections` entirely at render time (a pre-existing, unrelated `FormSection` component
   existed but was never used). Added real per-section grouping plus a new
   `FormSection.columns?: number` (types-js), defaulting to the form's existing
   `metadata.numberOfColumns` when omitted — a straight extension of the *already-existing*
   form-level column mechanism down to section granularity, not a parallel one. `section-filters`
   now sets `"columns": 3`. Editable in Studio's Settings tab (section list) alongside
   title/description/collapsible.
4. **Raw editable "Page" number box, no real pagination** — `GridControl`'s own
   `config.pageSize`/`features.pagination` genuinely works but is client-side-only (re-slices
   rows already in hand) and was never enabled here — irrelevant to this form, which is
   server-paginated (`apiActions[].payloadMapping` sends `pageInfo.pageNumber`). Added a real new
   Atlas Forms control type, `type: "server-pagination"` (new `FormControlType` union member,
   `control.types.ts`), rendering Prev/Next + "Page N", wired through the exact same
   `onButtonClick` → `apiActions[trigger:'search']` → `mapResponseToFormFields` path the Search
   button itself already uses. `page-number` control's `type` changed from `"number"` to
   `"server-pagination"`, moved to `section-results`, `config.resultsControlID: "results-grid"`.
   Registered a matching Studio property editor
   (`ServerPaginationEditor.tsx`, `resultsControlID` field).
5. **Grid row View/Edit/Delete actions** — the schema's old `"buttons": ["edit", "delete"]` was
   dead: `GridConfig.buttons` expects `GridButton[]` objects, not bare strings, so both rendered
   as broken, non-functional toolbar buttons. Replaced with 3 real `type: "link"` grid columns
   (`_actionView`/`_actionEdit`/`_actionDelete`) using `GridControl`'s existing, already-working
   `GridEditModal` (confirmed real: `client.getFormById(editFormID)` + `FormRenderer`, not dead
   code). Extended `LinkActionLeaf`'s `kind: 'form'` with `mode?: 'view'|'edit'` — reusing **one**
   form (FormID 30501, below) for both View (`FormRenderer mode="view"`, read-only, no Save) and
   Edit (interactive, real Save via a new modal footer — `nested` mode suppresses
   `FormRenderer`'s own footer, so `GridEditModal`'s `FormModalBody` now tracks draft values via
   `onValuesChange` and supplies its own Save/Cancel). Added a new `LinkActionLeaf` variant,
   `kind: 'delete'`, with schema-configurable `endpointTemplate` (`{{row.fieldName}}`
   interpolation, URL-encoded for the delete case specifically) and `method` (default `DELETE`)
   — not hardcoded to Documents, reusable by any grid. `LinkColumnConfig.requiredRoles?: string[]`
   gates Edit/Delete: disabled (never hidden) unless `fetchAuthToken()?.user.roles` includes one
   of the listed roles — `["Admin", "TenantSuperAdmin", "PlatformSuperAdmin"]` here, a judgment
   call (no pre-existing per-grid-action role convention found; mirrors the real roles seen in
   this session's own JWT). All of the above (mode, delete kind, requiredRoles) is now editable
   in Studio via `GridEditor.tsx`'s per-column link-action panel — no hand-editing schema JSON
   required.
   - **Known real gap, not fixed here**: `/api/v1/documents/{{row.documentID}}` DELETE and the
     `documentID` row field name are both **assumed**, not confirmed — no `DocumentClient` delete
     method or Documents API surface exists in `@atlas-forms/api-client-js`/`client-js` today
     (see §11 above re: the Documents Search endpoint itself also being new/in-progress). The
     schema's endpoint may need correcting once the real backend Delete endpoint exists.

**New form — FormID 30501** ("Documents View / Edit",
`atlas-forms-documents-edit-form.schema.json`, same docs folder): `documentID` (readonly),
`documentName`, `documentDescription`, `documentTypeID`, `documentCategoryID`,
`classificationName` — the real Document Manager editable field set already established
elsewhere in this doc. One form serves both View and Edit via the `mode` mechanism above; no
second form needed.

**DB**: both `atlas-forms-documents-search-form.schema.json` (FormID 30500, `UPDATE ... SET
[Schema]`) and `atlas-forms-documents-edit-form.schema.json` (FormID 30501, new row,
`IDENTITY_INSERT` on) were written to `data-ocean-platform-prod`'s `Atlas_Forms` table via a
parameterized `SqlCommand` (an `sqlcmd -i` file-based `UPDATE` with the JSON inlined as a
literal silently truncated ntext content well under 4000 chars — a real, separate sqlcmd/ntext
literal-length gotcha worth knowing about for future large-schema seeds; the parameterized
`NText` approach avoided it entirely and round-tripped byte-for-byte). Round-tripped and
verified char-for-char after each write.

**Verified**: `tsc --noEmit` clean in `player-components-react` and `designer-components-react`
(only pre-existing, unrelated errors remain — `qrcode.react` types,
`@bizfirst/expressions-*` module resolution, an unrelated `FormBuilderCanvas`/`hideDesignerTab`
prop mismatch). Live browser verification was blocked, in order: (1) a pre-existing, unrelated
`@bizfirst/common-js` package `exports` bug (`"require": "./dist/index.js"` pointing at a file
its own build never emits) that prevented the entire Atlas Forms Studio dev app from loading at
all — fixed (package.json `exports` now uses `"default"` instead of the dead `"require"` entry);
(2) the Passport Login app (port 8001) not running — started per
`agents/testing-flow-studio-ai-agent.md`'s documented startup order; (3) the real Consolidated
WebApi (port 10001) being down, which the login app itself depends on ("Failed to fetch" on
sign-in) — out of scope per this task's own instructions, and still down as of this writing.
Confirmed via direct HTTP/`curl` against the dev server and via `tsc` that the fixed code itself
is reachable and correct; could not confirm the final rendered pixels/interaction in a live
browser session because of blocker (3).
