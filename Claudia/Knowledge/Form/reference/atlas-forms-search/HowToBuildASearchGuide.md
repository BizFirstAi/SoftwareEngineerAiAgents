# How to Build a Search Form in Atlas Forms

**Purpose of this doc**: a reusable methodology for designing a search/filter/results/edit
form in Atlas Forms — for the NEXT one of these (Doctors Search, or whatever comes after),
not just the Documents one this guide was extracted from. Written 2026-09-01 after building
the Documents search form design end-to-end and finding real, load-bearing gaps at nearly
every step. Read this BEFORE starting a new one — it will save you from re-discovering the
same gaps from scratch.

**Companion doc**: `atlas-forms-architecture-overview.md` (one level up) is the general
Atlas Forms architecture reference — control registry, styling, form-actions, data model.
Read that first if you don't already have a working mental model of Atlas Forms. This guide
is specifically about the search-form pattern.

## The core lesson: verify every mechanism against real source before designing around it

Atlas Forms' own documentation and type system describe more than actually works at
runtime. Multiple mechanisms — a per-button click trigger, several style slots, a whole
grid-filtering type, an entire hook/pipeline framework — are fully authorable in the
Studio UI and fully declared in the type system, but have zero real runtime consumers, or
are wired to the wrong field/shape. **Do not trust a type definition, a Studio dropdown
option, or a doc comment as evidence something works. Trace the real, currently-shipped
Player/Studio-preview code that would actually execute it.** Every gap in this guide was
found exactly that way — by reading the real source, not by inferring from the schema
types.

## Step-by-step process

### 1. Ground the design in a real table and a real, already-shipped reference app

Don't design against an imagined API. Find:
- The real database table (SSDT source under the relevant `dbo\Tables\*.sql`, or the
  seed data under `dbo\Data\*` for real example values).
- The real API client method that already lists/searches this data (search the relevant
  `*-api-client` package).
- The real backend controller action it calls, and trace it all the way down through the
  service/repository layers — don't stop at the controller.
- A real, already-shipped React app that already does search/list/edit for this exact
  data, if one exists. It tells you the real, working UX and field set far more reliably
  than guessing from the table schema alone — and it tells you what the backend
  genuinely supports today (a reference app's own code comments are often the most
  direct evidence of a missing backend capability — e.g. a comment saying "no free-text
  search endpoint exists" is exact, first-party truth).

### 2. Trace whether the target endpoint actually supports server-side filtering

This is not safe to assume. Confirmed finding (2026-09-01, Documents/`Doc_Documents`):
the shared `BaseRepository<TEntity,TKey,TContext>.GetAllAsync` used across this
platform's whole `Go.*`/`BizFirst.Ai.*` module family carries a `Filters:
Dictionary<string, object>` field on its request DTO — but **never reads it**. This is
platform-wide, not specific to one module. Before designing filter controls into a
schema:
- Trace the FULL call chain (controller → service → repository → the actual
  `BaseRepository`/EF method) for the endpoint you intend to use.
- Confirm whether `Filters` (or whatever the request DTO's filter field is called) is
  actually read and applied as a `.Where()` clause anywhere in that chain, or silently
  dropped.
- If dropped: check whether OTHER, more specific endpoints on the same controller
  already apply real, working single-predicate filters (e.g. a `GetByType`/`GetByStatus`
  action) — these are your evidence for what the real, working fix pattern looks like if
  you need one built.
- Check for an existing, more general "Search" pattern elsewhere in the codebase before
  assuming you need a bespoke fix — this platform has a strong shared-base-class
  convention; a real, working search/filter mechanism may already exist for a DIFFERENT
  module and just not be adopted yet by the one you're building against.
- Confirm the pagination response shape separately — it's often already fully real and
  working (total count, total pages, has-next/has-previous flags) even when filtering
  isn't, since pagination and filtering are usually implemented independently.

### 3. Trace the Form-Actions mechanism end-to-end before assuming any trigger works

Confirmed findings (2026-09-01), current as of that date — **re-verify these against the
real code before relying on them, they may have been fixed by the time you read this**:

- **The real, deployed Form Player does not fire authored `apiActions[]` at all.** It
  reads from the wrong schema field (`schema.metadata?.formActions`, PascalCase
  triggers) instead of the real one (`schema.apiActions[]`, lowercase/kebab triggers).
  The Studio's own live-preview code already has the correct field/casing — compare the
  two if you need to see working vs. broken side by side.
- **Response-to-control mapping only fires for the `load` trigger**, in both the real
  Player and the Studio preview. A `submit`- or `button-click`-triggered action's
  response is never mapped into any control. If your design needs an explicit
  Search/Refresh button (as opposed to auto-load-then-client-filter), this gap is
  directly load-bearing — your search results literally cannot reach a grid control
  until it's fixed.
- **The one real implementation that builds an OUTGOING request from `payloadMapping`
  applies it backwards** in at least the Studio preview's `executeApiAction` — treats
  the mapping's key as the destination field and the value as the source control ID,
  the exact inverse of the confirmed authoring convention. Check this specifically if
  your filter values don't seem to reach the backend even after the trigger/mapping
  gaps above are fixed.
- **No real session auth (JWT) is attached to any `apiActions[]` call today**, in either
  the Player or the Studio preview — not because it's hard, but because it was never
  wired. The token source (`@passport/store`) works correctly elsewhere in the same
  monorepo (powering schema load/save), it just was never connected to the action-firing
  path. If your search endpoint requires auth (most real BizFirst endpoints do), this is
  a hard prerequisite, not a nice-to-have.
- A per-button `click` trigger (`'button-click'`) exists as an authorable schema value
  and appears in all the Studio's own action-editor UIs — but no real runtime code
  checks for it. Use `submit` if you need a button to fire an action; it's the trigger
  with the most working infrastructure around it (once the gaps above are fixed).

### 4. Don't assume client-side data manipulation is possible without custom code

Confirmed (2026-09-01): there is no declarative, schema-only mechanism in Atlas Forms
for "a filter control's value narrows an already-loaded grid's rows, client-side, no
server round-trip." Four candidate mechanisms were checked (grid's own config,
`fieldActions[]`, the expression/formula-engine suite, and structural bindings) — all
either don't exist, are dead code, or are structurally scoped to single field values,
never a control's whole row-set. The only real option is the `custom` control type,
which means writing and registering a real React component per host app — losing the
"one schema, one behavior everywhere" property.

**Practical implication**: if you want purely server-side search (enterprise pattern:
explicit Search button, real backend filtering, pagination), this limitation doesn't
matter — you were never going to filter client-side anyway. If you want a lighter,
Document-Manager-style "load everything, filter locally" UX instead, be honest that it
needs either (a) accepting the `custom`-control tradeoff, or (b) a real Atlas Forms
platform enhancement (e.g. a `GridConfig.quickFilter` capability, or a new
client-side-only trigger type) — not something achievable from JSON alone today.

**If you're building a SECOND, THIRD, etc. search form** (this guide's whole reason for
existing): a `custom` grid-filter component, if you go that route, should be built
ONCE and reused across every future search form — each form still configures it via its
own schema (columns, data source), only the filtering mechanism itself is real code,
written a single time. Don't rebuild it per entity type.

### 5. Design the schema

Once the above is actually verified (not assumed):
- Two sections is the natural shape: filters, then results.
- Filter controls are plain `text`/`select`/etc. — there's no dedicated "filter" control
  type.
- The results table is the `grid` control. **Do not use `editable-grid`/`display-grid`**
  — both exist in code but are never registered in the shipping Player; they render
  nothing. `grid` is the real, working one (add/delete/edit via `config.buttons[]`,
  columns via `config.columns[]`, client-side pagination of whatever rows it's given via
  `config.pageSize`).
- One `apiAction` per real backend call you need (initial load and/or search-on-submit).
  `payloadMapping`'s key is always a control ID; the value is a dot/bracket-notation
  path — direction (request field vs. response field) depends on the action's trigger,
  confirmed via the real worked example already in this codebase
  (`FORM_SCHEMA_CORRECTED.json`, top level of the `atlas-forms` package).
- If editing needs to be richer than the grid's own inline edit can reasonably support
  (many fields, sections, conditional logic), design it as a SEPARATE form/widget rather
  than cramming it into the search form's own schema — matches how App Studio itself
  composes small, focused widgets rather than one monolithic one, and keeps the edit
  form reusable outside the search context too.

### 6. Write down every gap you find, don't paper over them

Every design doc in `atlas-forms-search/` explicitly separates "confirmed working," "confirmed
broken with a scoped fix identified," and "unconfirmed, flagged for follow-up verification."
Keep doing this for the next one. A design that silently assumes a broken mechanism works is
worse than one that honestly says "this needs fixing first" — the second one is
buildable once the fix lands; the first one just fails mysteriously later.

## Quick-reference: known Atlas Forms gaps as of 2026-09-01

Re-verify each of these against current source before relying on this list — they may
have been fixed since this was written.

| Gap | Blocks | Fix scope |
|---|---|---|
| Player never fires `apiActions[]` (wrong field/casing) | Any form using `apiActions` at all | Small, scoped — Studio preview already has the correct logic to port |
| Response-mapping only wired for `load` trigger | Any `submit`/`button-click`-triggered search | Small, scoped — extend the existing `load` handler's logic to the other triggers |
| Outgoing `payloadMapping` applied backwards (Studio preview) | Any outgoing request built from `payloadMapping` | Small, one function |
| No real auth attached to `apiActions[]` calls | Any real, authenticated backend endpoint | Medium — 5 named files, working token source already exists elsewhere in the monorepo |
| `Filters` dict never read by shared `BaseRepository.GetAllAsync` | Server-side filtering via the generic list endpoint | Small per-module fix (override in the specific repository), platform-wide if fixed generically (higher blast radius, not recommended without more scoping) |
| No declarative client-side grid filtering | "Load everything, filter locally" UX patterns | Real platform enhancement needed, or accept the `custom`-control tradeoff |
| `editable-grid`/`display-grid` control types unregistered | Using either type at all | Use `grid` instead |
| Only `containerStyle` of 5 style slots actually renders | Rich per-control styling beyond the container box | Real platform enhancement needed |
| No FK→display-name resolution in grid columns | Showing a readable name instead of a raw numeric ID | Real platform enhancement needed, or resolve in the API response itself |

## Where to find the deeper evidence

Every claim in this guide traces back to a specific file:line citation in
`atlas-forms-search-results-edit-form-schema.md` (this folder) and
`atlas-forms-architecture-overview.md` (one level up). Read those for the full "how do I
know this" trail before trusting this guide's summary at face value on anything
consequential.
