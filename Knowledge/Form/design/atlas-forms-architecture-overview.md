# Atlas Forms — Architecture Overview

Read-only research pass, written 2026-08-2x/2026-09-01, with a follow-up read-only pass on 2026-09-01 (§15) that closed out the five packages originally left unverified, source: `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\atlas-forms` (pnpm monorepo). Purpose: give a developer who is new to Atlas Forms and about to start real work on "Form Studio" a genuine, code-verified mental model of the system — package responsibilities, the Designer/Player split, the control system, styling, actions, data model, and one traced end-to-end data flow. Findings below were produced by directly reading source files (not just `package.json`/barrel exports) across several parallel research passes; anything not independently confirmed is marked as such rather than asserted. No Atlas Forms code was modified.

**No prior doc covers this ground.** Searched `Documentation\Employees\agentic-coding\` and `atlas-forms\docs\` for an existing overview; what exists instead is a large body of *adjacent* material this doc cross-references rather than duplicates:
- `Documentation\Employees\agentic-coding\bizfirst-ai-mcp-servers-spec\atlas-forms-design.md` — the design for the 8 Atlas Forms **MCP tools** an AI agent uses to build/edit forms (backend C#, `BizFirst.Atlas.Forms.*`). Frontend-facing, but about the backend service layer, not the `atlas-forms` frontend monorepo itself. **Its "view it" URL scheme (`/design/{FormID}`, `/play/{FormID}`) is now stale** — see §10.
- `Documentation\Employees\agentic-coding\atlas-form-automation-project\` (`architecture.md`, `design-and-plan.md`, `STATUS.md`, `lessons/`) — a live project standing up an Octopus AI agent that builds/edits Atlas Forms via those MCP tools through Flow Studio. Backend/agent-orchestration focused, not frontend architecture.
- `Documentation\Employees\agentic-coding\atlas-form-automation-project\atlas-forms-rag\v2\` — a 74-file, code-scanned **control-type reference** (`00-overview.md`, `01-common-properties.md`, `controls/{type}.md`, `validation-rules.md`, `conditional-logic.md`, `worked-examples/`), written for RAG ingestion so an LLM agent can look up exact control properties. This doc leans on it for the control-catalogue and schema-shape facts (§5, §8) rather than re-deriving them, and treats it as current/authoritative for that narrow purpose.
- `Documentation\Employees\atlas-forms\` — an older, informal "employee" folder (`FormMaker_OLD/`, `FormBuilder/`, `Form-Queries/`, `Resources/Resources.md`). `Resources.md` correctly points at this same source tree and the real DB table (`Atlas_Forms`), so it's not wrong, just thin. `FormMaker_OLD/` is a generic agent-persona doc ("this employee does four things: create/validate/compare/sync a form") with no real architectural content — treat as legacy scaffolding, not a source of truth.

This doc is the first pass that actually opens and reads the ~27 frontend packages themselves — as of the §15 follow-up, all ~27 have now been directly read (not inferred from names/`package.json`).

---

## 1. What Atlas Forms actually is

Atlas Forms is a **form-schema-driven builder and renderer** — closer to "dynamic data-entry forms with rich display/chart/media widgets" than "whole multi-page app builder." One `FormSchema` = one form: a flat list of controls (grouped into optional sections), plus form-level metadata, form-level API actions, and an optional style override. There is no separate "Page" concept layered on top of "Form" the way the package names (`pages-studio-react`, `pages-player-react`) might suggest.

**Forms vs. "Pages" — resolved, not two concepts.** `pages-studio-react`/`pages-player-react` are not a distinct "Pages" entity sitting above "Forms." They are simply the **page/route/app-shell layer** for the Studio and Player experiences respectively — routing, tab state, dashboards, layout chrome — that host the real authoring/rendering surfaces (`FormBuilderCanvas` from `designer-components-react`, `FormRenderer` from `player-components-react`). "Pages" here means "screens in the Studio/Player SPA," not a second content-modeling concept parallel to Forms. `form-editor-react` and `pages-studio-react`'s `FormDesignerPage` are two independent, largely-duplicated wrappers around the same `FormBuilderCanvas` — see §4.

**Backend**: a real ASP.NET Core service, `BizFirstPayrollV3\src\mvc-server\AtlasForms\BizFirst.Atlas.Forms.Manager` (`.Domain`/`.Service`/`.Api.Base`/`.Api`), backing table `Atlas_Forms` (`FormID` PK, **`Schema NVARCHAR(MAX)`** — the entire control tree as one JSON blob, `FormCategoryID`/`FormTypeID` FKs, `FormCode` unique, `TenantID`, full standard audit-column set). REST surface: `api/v1/atlas/forms*` (CRUD) and `api/v1/atlas/form-data/*` (submitted records). The only schema-mutation endpoint is a whole-blob `PATCH`/`PUT` — there is no granular add/update/remove-single-control endpoint on the core API (a companion project built granular MCP tools specifically to work around this; see `atlas-forms-design.md`, out of scope here).

---

## 2. Package responsibility map

27 packages under `packages/`. Confidence noted per row — all were read directly across the original pass and the §15 follow-up (which closed the five rows the original pass had left as name-based guesses).

| Package | Role | Confidence |
|---|---|---|
| `types-js` | **Canonical type definitions.** `FormSchema`, `FormControl`/`FormControlType` (115 values), `FormSection`, `FormMetadata` (~25 fields), `FormAction`, `ControlStyleSet`, plus a *separate* `FormDefinition` (backend row shape) and `Create/UpdateFormDefinitionRequest`. 14 files total (`control.types.ts`, `validation.types.ts`, `provider.types.ts`, `api.types.ts`, `theme.types.ts`, `style.types.ts`, `plugin.types.ts`, `mode.types.ts`, `event.types.ts`, `error.types.ts`, `category.types.ts`, `decoration.types.ts`, `form.types.ts`, `control.types.ts`). One source of truth — no competing type definitions found inside this package. | High |
| `schema-js` | Parse/stringify (`parseSchema`/`stringifySchema`), validate (`validateSchema`), and **mode/visibility transform** (`transformSchemaForMode`, `flattenSchema`, `mergeSchemas`, `resolveVisibleControls`, `buildDependencyGraph` for conditional logic) plus a `SafeExpressionEvaluator`. No schema-version migration logic found (no "v1→v2 upgrade" code) despite the name suggesting it. | High |
| `control-registry-js` | **Metadata-only** control registry — `DefaultControlRegistry`, a `Map<FormControlType, ControlPlugin>` singleton (`getGlobalRegistry()`). `register(plugin, options)`; `ControlPlugin` = pure metadata (type/label/group/icon/description/order/`defaultConfig`/`pluginScope`) — **no component references** live here. Base class for `player-components-react`'s `ReactControlRegistry` (§5). | High |
| `controls-builtin-js` | One file, `controls.ts` — ~88 exported `ControlPlugin` metadata consts (`TEXT`, `NUMBER`, ...), zero React, zero rendering. Feeds the registry's palette entries. | High |
| `controls-advanced-react` | React renderers for the heavier control families (`charts`, `codes`, `gauges`, `maps`, `media`, `editors`) — **lazily loaded** via `import('@atlas-forms/controls-advanced-react')` inside `registerAllControls()`, code-split from the core bundle. | High |
| `controls-form-actions-react` | Contains `editable-grid`/`display-grid` control implementations — confirmed **not wired into `registerAllControls()`**, so these two declared types are dead in the shipping app (use `grid` instead). Likely also home to action-related editor UI (not fully re-verified this pass beyond the dead-control finding). | Medium |
| `controls-form-container-react` | **Deep-read, confirmed live and substantial** — a real master/detail "embed N child forms in one control" system: 8 Zustand stores (`MasterDataStore`, `ChildFormRegistryStore`, `BindingRepositoryStore`, `EventManagerStore`, `PathNavigatorStore`, `ChangeDetectorStore`, `ErrorHandlerStore`, `DataSyncEngineStore`) + a strategy layer (binding/validation/save) + 3 layout components (`TabsLayout`/`WizardLayout`/`AccordionLayout`) + designer-side property panel. Genuinely wired into both the real Player and the real Studio — see §15. | High |
| `controls-styling-schema-js` | Defines a **parallel, richer "9 capability groups" styling model** (`ControlStyling`/`CSSClasses`) — fully editable in the Studio's own "Styling" accordion UI but **confirmed dead**: zero references anywhere in `player-components-react`, never rendered at runtime. See §6. | High |
| `designer-components-react` | The real Studio authoring surface: `FormBuilderCanvas` (top-level), `components/canvas/ControlCanvas.tsx`, `components/tabs/*` (Design/Properties/JSON/Settings/Validation/Plugins/Preview), `components/PropertyEditors/*` (one editor component per control type), `components/StyleBuilderPanel/*` (see §6), and its own `registry/*` — `PropertyEditorRegistry`, `ActionRegistry`, `ValidationRuleRegistry`, `PluginConfigSchemaRegistry` (design-time-only registries, separate from `control-registry-js`). | High |
| `form-editor-react` | Small, embeddable wrapper (`FormEditor.tsx`, ~260 lines): loads a schema via `AtlasFormsClient`, renders `FormBuilderCanvas` as a modal or portaled into a host container. Owns no canvas logic itself. | High |
| `form-engine-js` | **Headless** engine (`FormEngine` class, no React import) — composes `FormStateManager`, `FormEventEmitter`, `BindingResolver`/`DataBindingEngine`, `ExpressionEvaluator`, and an injected `IValidationEngine` (defaults to `validation-js`'s `ValidationEngine`). Its own `render()` throws — "use the `useAtlasForm` hook instead." **Not used by the shipped Player** (`FormPlayerPage.tsx` uses `player-components-react`'s `FormRenderer`, not this). No live consumer confirmed this pass — possibly dead/parallel code, not confirmed load-bearing. | Medium — flag: possible dead code |
| `form-manager-react` | **Deep-read, confirmed dead code.** Not a forms-list/CRUD layer — a small, standalone "pick an existing form + Edit button" widget (`FormManager`/`ConnectedFormManager`, wraps `ui-components-react`'s `FormLookupField`). Fully built, has a README with usage examples, but **zero real imports anywhere in the monorepo or in App Studio/Flow Studio** — only self-references and boilerplate `vite.config.ts` alias entries (24-alias blanket lists that resolve every `@atlas-forms/*` package regardless of use). No overlap risk with `FormDefinitionDashboard` because nothing calls it. See §15. | High (confirmed dead) |
| `pages-player-react` | Player app's page/route layer. `FormPlayerPage.tsx` (759 lines) — substantial, not a thin shell: owns Form Actions execution (`FormActionsEngine` from `form-actions-runtime-js`), CSRF token handling, draft autosave (`storage-js`'s `LocalStorageAdapter`), and API-response-to-field payload mapping. Also `FormsDashboard.tsx`. Has its **own local, hand-copied HTTP client** distinct from `api-client-js`/`client-js` — see §8. | High |
| `pages-studio-react` | Studio app's page/route layer: `AtlasFormsStudioApp.tsx` (calls `registerAllControls()` at startup), `FormDesignerPage.tsx`, `FormDefinitionDashboard.tsx`, `FormRecordsPage.tsx`, `EndUserFormView.tsx`, `HelpView.tsx`, `AppLayout.tsx`. `FormDesignerPage` duplicates much of what `form-editor-react` does, independently. | High |
| `player-components-react` | The real runtime rendering surface: `FormRenderer`, `FormField.tsx` (a very large component — a ~3500-line hardcoded `switch(control.type)` handles most common types directly), `ReactControlRegistry` (extends `control-registry-js`'s base with real `EditComponent`/`ViewComponent`/`DesignComponent` references, mode-aware `getComponent()`), `ControlRegistry.ts` (`registerAllControls()`/`registerPhase1Controls`/`registerPhase3Controls`/`registerFormScopePlugins`), and `src/controls/{charts,displays,inputs,layouts}/*.tsx` + `GridControl/`. | High |
| `session-js` | Small — `ISessionProvider` interface (`getSession()`/`getSessionAsync()` → `SessionContext`) + `SessionProviderRegistry` singleton. Auth/session-token abstraction only. | High |
| `state-react` | 3 Zustand stores: `useAuthStore`, `useUIStore` (theme/toasts), `useFormDefinitionStore` (Studio forms-list CRUD state — list/selected/loading/saving/deleting flags). This is **app-shell/list-level** state, not in-canvas editor state (undo/redo/selection/dirty-tracking) — that lives elsewhere (not independently located this pass). | High |
| `storage-js` | **Not** form-schema persistence. Client-side draft/record cache only: `StorageManager` with a `localStorage → IndexedDB → memory` fallback chain (`FallbackStorageAdapter`), used for Player autosave drafts and locally-cached `FormRecord`s. Real form CRUD never goes through this package. | High |
| `api-client-js` | Real typed HTTP client layer — `FormDefinitionApiClient`, `FormDataApiClient`, `CategoryClient`, `DecorationClient`, `UserInputClient`, all on a shared `BaseHttpClient` (retry/circuit-breaker/response-cache/request-queue). | High |
| `client-js` | A **higher-level facade**, not a lower-level primitive as the name might suggest: `AtlasFormsClient` (singleton) composes `api-client-js` + `storage-js` + `control-registry-js` + `themes-js` + `form-engine-js` + `schema-js`'s validator, plus its own `SchemaInheritanceResolver` (form-composition/inheritance merge for `referredFormID`/`referredControlID`) and CSRF/file-serialization utilities. | High |
| `themes-js` | **Deep-read.** A real, separate theme-object model (`ThemeResolver` class, `Theme`/`ColorScheme` for light/dark, get/set/toggle/subscribe) — correctly identified by the earlier pass as distinct from `ControlStyleSet`. **Refined finding**: it's instantiated inside `client-js`'s `AtlasFormsClient` (`getThemeResolver()`), but that getter has **no confirmed caller anywhere except its own unit test** — the real live theming mechanism the Player actually uses is a separate, simpler `FormThemeContext` (`'light'\|'dark'` string) fed from `state-react`'s `useUIStore`. See §15 — a third, effectively-unused theme representation. | High |
| `ui-components-react` | **Deep-read, confirmed live and widely used** (82 real `@atlas-forms/ui-components-react` imports across the monorepo). Mostly generic UI primitives (`Button`, `Modal`, `Pagination`, `Tooltip`, `ToastContainer`, `EntityGrid`, icons, etc.) used throughout `player-components-react`'s own control set, `designer-components-react`, `pages-studio-react`/`pages-player-react`, and externally by App Studio (`AddWidgetModal.tsx`, `WidgetEditorFields.tsx`, matching §13). **Not fully domain-agnostic like `StyleBuilderPanel`, though**: it also exports two Atlas-Forms-typed components, `FormLookupField` and `ControlLookupField` (searchable pickers typed against `FormDefinition`/`types-js`) — real, if narrow, domain coupling. See §15. | High |
| `validation-js` | `ValidationEngine` — `validateField()` gates on `control.required` (the actually-load-bearing flag; `control.validation.required` is not what's checked — see §8 for the common-properties nuance). Used by `form-engine-js` as its default `IValidationEngine`. | Medium |
| `form-actions-js` | Broader, cross-host **action orchestration SDK** — confirmed used by Flow Studio's `atlas-forms-bridge` (§9) as well as within atlas-forms itself. Legitimately distinct from `form-actions-runtime-js`, not a duplicate. | Medium-High |
| `form-actions-runtime-js` | Narrower **API-call execution engine** — `FormActionsEngine`, the thing `pages-player-react/FormPlayerPage.tsx` actually instantiates to run OnLoad/OnChange/OnClick/OnSubmit actions at runtime. Reads (incorrectly, per §7) `schema.metadata?.formActions`. | High |
| `form-action-pipeline-core-library-js` | **Empty, abandoned-rename directory.** Confirmed dead — not a real package with content. | High (confirmed empty) |
| `form-action-pipeline-library-core-js` | The apparent intended sibling of the above — a large, fully-built, fully-tested hook/pipeline framework, but with **zero real consumers anywhere in the monorepo**. Dead code (built, tested, never wired in). | High |
| `common` | **Deep-read, confirmed dead code — not a utilities package at all.** Contains **zero JS/TS files**: it's a pure CSS design-token library (`css-variables.css`/`theme-definitions.css`/`utilities.css`, Tailwind-style utility classes, its own separate `[data-theme="dark"]` light/dark system distinct from both `themes-js` and `ControlStyleSet`). Grepped the entire `src` tree: `@atlas-forms/common` appears **nowhere** outside its own `README.md`/`index.css`/`package.json` — not imported by any app, not aliased in any `vite.config.ts`, not a dependency in any other package's `package.json`. Fully orphaned. See §15. | High (confirmed dead) |

**Update**: all five rows above were unverified guesses in the prior pass; all five have now been independently deep-read (source files opened, not just names/package.json) — see §15 for the full write-up. Three (`controls-form-container-react`, `themes-js`, `ui-components-react`) are real and live, though `themes-js` turns out to be only partially wired in. Two (`form-manager-react`, `common`) are confirmed dead code with zero consumers anywhere in the monorepo — the same standard of evidence (a full-tree grep finding no real importer) already applied to `form-action-pipeline-library-core-js` and `controls-styling-schema-js` in the original pass.

---

## 3. Monorepo structure and cross-monorepo dependencies

Standard pnpm workspace (`pnpm-workspace.yaml`): `packages/*` + `examples/*`, plus — notably — **three external cross-monorepo package sources pulled in by relative path**, meaning Atlas Forms is not a self-contained dependency graph:
- `../bizfirst-common/bizfirst-common-js`
- `../passport/packages/@passport/auth-core` and `@passport/auth-integration` (SSO/auth)
- `../expressions/packages/@bizfirst/expressions-{types,api-client,store,browser,designer}` — a full separate "Expressions Studio" monorepo, consumed specifically by `controls-advanced-react`'s `expression` control type (the RAG catalogue's own note: "value always authored via Expressions Studio modal").

Naming convention confirmed by ADR-002 (§11): `@atlas-forms/<name>-<js|react>`, linked via `workspace:*`. ADR-002's own self-reported benchmark cites "22 packages" — the real count is now ~27, i.e. the package count has grown since that ADR was written (2026-04-18), consistent with genuine ongoing development, not a stale/abandoned repo.

---

## 4. The Designer/Player split

Two independent app shells, both real and both hosted by `examples/form-studio` (see §10):

```
Studio (authoring)                          Player (runtime/fill)
───────────────────────                     ─────────────────────
pages-studio-react (routes/pages)           pages-player-react (routes/pages)
  → FormDesignerPage.tsx                      → FormPlayerPage.tsx (759 lines,
  → FormDefinitionDashboard.tsx                  owns Form Actions execution,
  → FormRecordsPage.tsx                          CSRF, draft autosave)
       ↓ wraps                                     ↓ wraps
designer-components-react                    player-components-react
  → FormBuilderCanvas  ← the real canvas       → FormRenderer / FormField.tsx
  → ControlCanvas.tsx                             (the real renderer, incl.
  → PropertyEditors/* (per-type editors)          the hardcoded switch, §5)
  → StyleBuilderPanel (§6)
  → registry/* (PropertyEditorRegistry,
    ActionRegistry, ValidationRuleRegistry —
    design-time-only, separate from
    control-registry-js)

form-editor-react — a SECOND, independent, embeddable wrapper around
  FormBuilderCanvas (modal/portal), duplicating FormDesignerPage's
  load/save/tab-state glue rather than sharing it.
```

**Real duplication, not a false positive**: `form-editor-react`'s `FormEditor.tsx` and `pages-studio-react`'s `FormDesignerPage.tsx` both independently load a schema via `AtlasFormsClient` and render `FormBuilderCanvas` with near-identical `initialSchema`/`onSchemaChange`/`onSave` wiring — one as a modal/portal for host-app embedding, one as a full routed page. Worth knowing before adding new Studio-embedding capability: it isn't obvious which of the two to extend, and today's code doesn't share the glue between them.

**Runtime side is simpler and more consistent**: `pages-player-react` → `player-components-react`'s `FormRenderer`/`FormField` is the one real rendering path. `form-engine-js`'s headless `FormEngine`/`useAtlasForm` hook is a *separate*, not-obviously-connected mechanism — see the flag in §2. Do not assume it is what's actually running in production without checking for a live consumer first.

---

## 5. The control/widget/registry system

**One registry lineage, two layers — not two independent systems**, despite the package split suggesting otherwise:

1. **`control-registry-js`** — `DefaultControlRegistry`, metadata-only. `ControlPlugin = { type, label, group/category, icon, description, order, enabled, defaultConfig, pluginScope: 'field-only'|'form-only'|'both', singleton }`. No component references. Used for the design-time palette (grouping, icons, labels).
2. **`player-components-react`'s `ReactControlRegistry`** — `extends DefaultControlRegistry`, adds the real component half: `registerReact(plugin: ReactControlPlugin)` and `getComponent(type, mode = 'edit')` (mode-aware: `EditComponent`/`ViewComponent`/`DesignComponent`, falling back `DesignComponent ?? EditComponent`).

**Populated from `controls-builtin-js`** (pure metadata, ~88 `ControlPlugin` consts, zero React) at startup via `registerAllControls()` (`player-components-react/src/controls/ControlRegistry.ts`), called once from `pages-studio-react/src/pages/AtlasFormsStudioApp.tsx:30`. `controls-advanced-react`'s heavier renderers (charts/codes/gauges/maps/media/editors) are registered separately, lazily, via a dynamic `import()` inside the same function — code-split from the core bundle.

**Critical wrinkle — the registry is not the single source of truth for how most controls render.** `FormField.tsx` (player-components-react) contains a **~3500-line, three-block hardcoded `switch (control.type)`** that renders the common/legacy input types (`text`, `email`, `url`, `tel`, `textarea`, etc.) directly as inline JSX — no registry lookup at all for these. `ReactControlRegistry.getComponent()`-based dynamic dispatch is confirmed used at exactly one call site, for the `custom` type; whether the advanced/form-scope-plugin controls also route through it wasn't independently re-verified line-by-line this pass. **Practical implication for anyone modifying or adding a control**: check `FormField.tsx`'s switch blocks first for common types — registering a plugin in `control-registry-js` alone will not make a new common-type control render.

**Control catalogue** (from `types-js`'s `FormControlType` union, cross-checked against the RAG spec's code-scan, `atlas-forms-rag/v2/00-overview.md`): **115 declared string values**, **113 with a confirmed render path**. The two dead ones are `editable-grid`/`display-grid` — real implementations exist in `controls-form-actions-react` but are not wired into `registerAllControls()`; **use `grid` instead** for editable repeating-row UI (search-results-with-edit patterns, line-item grids, etc.) — `grid` supports add/delete/edit/import/export via `config.columns[]`/`config.buttons[]`, including `type: 'computed'` columns. Full category breakdown (Input ×14, Display ×15, Charts ×13, Gauges ×6, Layout/structure ×18, Advanced input ×15, File/code ×6, Media ×10, plus `button`/`link`/`toggle`/`user-picker`/`actor-list`/`custom`, plus 9 form-scope singleton plugins) lives in `atlas-forms-rag/v2/00-overview.md` — not re-copied here in full; that file is current as of a 2026-08-19 code scan and this pass found nothing to contradict it.

`credential` is **not** a real control type — do not use it; secrets belong in `ICredentialResolver` at the node/executor level per the existing `feedback_credential_pattern.md` house rule, not as a form field.

---

## 6. The style system

**Two competing style models — only one is real.**

1. **The live one: `ControlStyleSet`/`StyleProperties`** (`types-js`). 5 CSS-property-bag slots per control — `containerStyle`, `headerStyle`, `bodyStyle`, `contentStyle`, `buttonStyle` — inherited form-root → container → control. Edited through `designer-components-react`'s **`StyleBuilderPanel`**, a floating popover with 6 tabs (Colors/Background/Typography/Spacing/Border/Effects/raw-code). Confirmed fully generic/schema-agnostic:
   ```ts
   export interface StyleBuilderPanelProps {
     slot: string; slotLabel: string; value: StyleProperties; anchorEl: HTMLElement;
     onApply: (styles: StyleProperties) => void; onClose: () => void; isDark: boolean;
     onBrowseAssets?: () => Promise<string>;
   }
   ```
   Zero Atlas-Forms-specific types in its props — `slot`/`value`/`onApply` are all caller-supplied. This is exactly why App Studio can and does reuse this component as-is for its own, unrelated section/widget style editing (§9) — the reuse is architecturally sound, not fragile.

2. **The dead one: `controls-styling-schema-js`'s "9 capability groups" model** (`ControlStyling`/`CSSClasses`) — a fully separate, richer styling schema, fully editable through the Studio's own "Styling" accordion UI, but **confirmed to have zero references anywhere in `player-components-react`** — never rendered, never consumed at runtime. A user can author it in the Studio and it will silently do nothing.

**Real, confirmed gap in the live one, too**: only `containerStyle` of `ControlStyleSet`'s 5 slots is actually applied to the DOM by the shipped Player — `FormRenderer.tsx` has exactly one call to a `resolveStyles` function, and that call only wires up `containerStyle`. `headerStyle`/`bodyStyle`/`contentStyle`/`buttonStyle` are fully authorable in the Studio, saved into the schema, and then **have no live consumer** — a `useResolvedStyles` hook exists (apparently built for this purpose) but is exported and never called anywhere. So 4 of 5 documented style slots are currently cosmetic-only in the schema, not functional at runtime.

**Minor cleanup debt, noted for completeness**: `StyleBuilderPanel/types.ts` carries a local, stale mirror of `StyleProperties`/`ControlStyleSet` whose own doc comment says to delete it once those types were published to `types-js` — they have been, but the mirror file was never removed. Low-risk (not actively causing a bug), but a discoverability trap for a newcomer wondering which type definition is canonical.

`themes-js` is a separate concern (global tokens: colors/fonts/spacing) from this per-control styling system — not independently deep-read this pass beyond confirming it doesn't overlap with `ControlStyleSet`.

---

## 7. Form Actions / the action pipeline — the most significant live gap found this pass

**"Form action" does not have one consistent meaning across this codebase — three incompatible representations coexist:**

1. **`FormSchema.apiActions[]`** — the real schema field (confirmed in `types-js` and matching the repo's own worked-example JSON files), lowercase `trigger` values (`OnSubmit`/`OnLoad`/`OnChange`/`OnValidation` per the RAG spec — note actual casing needs reconfirming against `form.types.ts` directly if precision matters for new code).
2. **`api-actions-plugin`'s own `ApiAction` shape** — a different field name, different trigger-string set than (1).
3. **`form-actions-runtime-js`'s `FormAction`** — PascalCase triggers, and — critically — reads its actions from **`schema.metadata?.formActions`**, not `schema.apiActions`.

**Confirmed live bug, not a theoretical inconsistency**: `pages-player-react/FormPlayerPage.tsx` — the real, deployed Player — instantiates `form-actions-runtime-js`'s `FormActionsEngine`, which reads `schema.metadata?.formActions`. Real forms save their actions at `schema.apiActions` (per (1) above), so **`schema.metadata?.formActions` is always empty for real forms**. The Studio's own internal preview code contains two `// CRITICAL FIX: Use schema.apiActions, not schema.metadata?.formActions` comments — someone already found and fixed this exact mismatch in the Studio's preview path, but **the fix was never ported to the actual deployed Player**. Net effect: **API actions authored in the Studio, and confirmed working in the Studio's own preview, silently do nothing when the form is actually filled out and submitted through the real Player.** This is a functional, user-visible defect, not a code-cleanliness issue, and should be near the top of the list for anyone starting real Form Studio work that touches submit/load/validation actions.

**Package-level picture, now resolved**:
- `form-actions-js` vs `form-actions-runtime-js` — **a genuine, legitimate split**, not a duplicate pair: `form-actions-js` is the broader cross-host action-orchestration SDK (confirmed consumed by Flow Studio's `atlas-forms-bridge`, §9), `form-actions-runtime-js` is the narrower API-call execution engine the real Player actually runs (and which has the bug above).
- `form-action-pipeline-core-library-js` — **confirmed empty**, an abandoned-rename directory with no real content.
- `form-action-pipeline-library-core-js` — its apparent intended sibling: a large, fully-built, fully-tested hook/pipeline framework, but with **zero real consumers anywhere in the monorepo**. Dead code — built and tested, never wired in.
- `api-actions-plugin`'s own `formEffect` handler is a **no-op stub** (`return undefined`) — whatever this plugin is meant to eventually do at the point an API action fires, it does not do it yet.
- `controls-form-actions-react` plausibly houses the Studio-side action-editor/builder UI (consistent with its name and with hosting the dead `editable-grid`/`display-grid` controls, §5) — not independently re-verified beyond that this pass.

**For anyone building or fixing action behavior**: trust `FormSchema.apiActions[]`/`fieldActions[]` as the schema-authoring shape (matches the RAG spec and the worked examples), and know going in that the runtime engine currently reading the wrong field is real, live, reproducible, and not yet fixed.

---

## 8. Data model & persistence

**`FormSchema`** (top-level, `types-js/src/form.types.ts`, confirmed against real source):
```json
{
  "version": "1.0",
  "metadata": { "formID": "string", "title": "string", "...": "~23 more optional fields" },
  "sections": [ { "id": "string", "title": "string", "order": 1 } ],
  "controls": [ { "id": "string", "type": "text", "label": "string", "order": 1 } ],
  "apiActions": [ ],
  "styles": { }
}
```
No top-level `layout` or `actions` field — do not emit them. `FormMetadata` carries ~25 fields including `formContentStyle` (`'input'|'web-content'|'dashboard'|'data'`), `formBehavior` (`'interactive'|'static'`), `formStyle` (`'default'|'webpage'` + `webpageConfig`), plus ~15 persistence-layer-only DB-linkage fields (`formCategoryId`, `htmlCardId`, etc.) that should be omitted from generated schemas.

**`FormControl`** common properties (every object in `controls[]`, regardless of `type`; full table in `atlas-forms-rag/v2/01-common-properties.md`): identity/display (`id`, `type`, `order`, `label`, `placeholder`, `description`, `helpText`, `defaultValue`, `sectionId`), state flags (`required` — **the actually-checked flag**, `readonly`, `disabled`, `hidden`), layout (`width`, `columnSpan`, `rowSpan`, `forceNewRow`, `gridPosition`), `validation`/`binding` (see below), visibility (`visibility`, `modeVisibilitySettings`, `visibilityRule`, `responsiveVisibility`), inheritance (`referredFormID`/`referredFormPath`/`referredControlID`/`controlInheritType` — form-composition via override/import), scope/actions (`scope: 'field'|'form'`, `fieldActions[]`), and `styles` (§6).

**`binding.source` nuance, confirmed against runtime code**: the TS doc-comment claims a fixed `"$json"|"$context"|"$api"` enum, but the real runtime resolver (`DataBindingEngine`, `form-engine-js`) matches `source` against **registered `DataSource.id` values** of type `json|api|variable|form|computed` — no `$` prefix. Trust the runtime behavior over the doc-comment: `source` is a host-registered data-source id, not a fixed enum. Relevant directly to anything like a search-results grid bound to a live query.

**A second, distinct canonical type**: `FormDefinition` (also `types-js`) is the **backend row shape** — `FormID`, `Name`, `Schema: string` (the `FormSchema` above, JSON-serialized), `TenantID`, full audit-column set — plus `Create/UpdateFormDefinitionRequest`. These are deliberately two different shapes (parsed control-tree, camelCase vs. DB row, PascalCase `Schema` string field), not competing definitions of the same thing.

**Persistence — real architectural drift found, three parallel unreconciled client paths**:
- **Studio save** (`pages-studio-react/FormDesignerPage.tsx`, `handleSave`): constructs `FormDefinitionApiClient` (`api-client-js`) directly and calls `client.updateForm(formID, { Schema: JSON.stringify(schema) })` — a **whole-blob replace**, confirmed current.
- **Player's forms-dashboard list**: uses `client-js`'s `AtlasFormsClient` facade instead.
- **Player's actual runtime form-fill load** (`pages-player-react/FormPlayerPage.tsx`): uses neither of the above — it imports from its own **local, hand-copied** `pages-player-react/src/api/` folder (`formDefinitionClient.ts` etc.), whose own header comment reads *"Copied from atlas-form-sdk/src/api/clients/formDefinitionApiClient.ts"* — a fork of an apparently older/legacy standalone `atlas-form-sdk` package, with its own re-declared, looser `FormDefinition` interface (no audit columns).

This is genuine drift, not three equivalent options — most likely `pages-player-react` was ported from a standalone `atlas-form-sdk` app and never refactored onto the shared `api-client-js`. Worth knowing which path any new work should extend rather than adding a fourth.

**`storage-js`** is unrelated to this — it's client-side **draft/record** caching only (`localStorage → IndexedDB → memory` fallback chain), used for Player autosave and locally-cached `FormRecord`s, never for `FormSchema`/`FormDefinition` CRUD.

**`schema-js`** provides parse/stringify/validate plus mode/visibility transforms (`transformSchemaForMode`, `resolveVisibleControls`, `buildDependencyGraph`) and a `SafeExpressionEvaluator` — no version-migration logic despite what the name might suggest.

**`session-js`** is a small auth/session-token abstraction (`ISessionProvider`/`SessionProviderRegistry`), independent of form data.

**`state-react`**: 3 Zustand stores (`useAuthStore`, `useUIStore`, `useFormDefinitionStore`) — app-shell/list-level state, not in-canvas editor state.

---

## 9. Concrete end-to-end trace: creating and rendering a `text` control

1. **Registration (app startup)**: `controls-builtin-js` exports `TEXT: ControlPlugin` metadata. `registerAllControls()` (`player-components-react/src/controls/ControlRegistry.ts`) feeds it into the shared `ReactControlRegistry` singleton. Called once, at module load, from `pages-studio-react/AtlasFormsStudioApp.tsx:30`.
2. **User drags/adds a text control in the Studio**: `FormBuilderCanvas` → `ControlCanvas.tsx` inserts a new `FormControl` object (`{id, type:'text', label, order, ...}`) into the in-memory schema (owned by `designer-components-react`'s canvas state — the specific store wasn't pinned down this pass, see §2's `state-react`/`ui-components-react` flags).
3. **Property editing**: `designer-components-react`'s `registry/PropertyEditorRegistry.ts` maps `'text'` → `TextEditor.tsx` (`components/PropertyEditors/EditorImplementations/`), rendered in the `PropertiesTab` when the control is selected.
4. **Canvas preview (design mode)**: resolves through the same `FormField.tsx` rendering path as the Player, mode-gated to design/edit — no separate design-only text renderer was found registered.
5. **Save**: `FormDesignerPage.tsx`'s `handleSave` → `FormDefinitionApiClient.updateForm(formID, { Schema: JSON.stringify(schema) })` — whole-blob replace to `Atlas_Forms.Schema` via the C# backend.
6. **Player load**: `FormPlayerPage.tsx` fetches the schema through its own local, hand-copied client (§8) — a different code path than the Studio's save.
7. **Player render**: `FormRenderer` iterates `schema.controls[]`, calling `FormField` per control. For `text` (and `email`/`url`/`tel`), `FormField.tsx`'s **hardcoded switch** (not the registry) renders a plain `<input type={control.type} value={strValue} onChange={handleChange} />` directly.
8. **Styling applied**: only `containerStyle` (of the 5 authored slots) is actually resolved and applied to the DOM (§6).
9. **Actions**: if this control had a `fieldActions[]`/form-level `apiActions[]` entry, whether it fires correctly depends on the bug in §7 — form-level API actions are currently broken end-to-end in the real Player.

**Applied example — a search-filter/search-results-with-edit form** (the concrete case this research was requested to inform): filters are ordinary input controls (`select`/`text`/`date-range-picker`, nothing filter-specific exists as a dedicated type); the editable results table should use the **`grid`** control type (not `editable-grid`/`display-grid`, which are dead — §5), configured via `config.columns[]`/`config.buttons[]`; wiring "search" to actually (re)populate the grid is the form-actions/data-binding subsystem — and per §7/§8, that subsystem currently has a confirmed live bug in the real Player (form-level `apiActions[]` triggers silently no-op) and a `binding.source` nuance to get right (host-registered `DataSource.id`, not a `$`-prefixed literal). Build the schema correctly per §8's shape, but budget time to work around or fix §7's bug before relying on OnLoad/OnChange-triggered data refresh working in production today.

---

## 10. The two example apps

- **`examples/form-studio`** — a real, **production-deployed** app, not a throwaway demo. Confirmed: real SSO/Passport auth wiring (`@passport/*`, exchange-code handoff, `LoginRedirectPage`), a prod-basename convention (`App.tsx`: `import.meta.env.DEV ? '/' : (VITE_BASE_URL || '/')`, deployed at `/formstudio/`), a `DevelopmentHistoryLog.md` with real dated bugfix entries (2026-08-07/08, an SSO-redirect-loop bug shared with a sibling app, `saas-tenant-administration`), a `dist/` build, and Playwright e2e tests. Hosts **both** Designer and Player experiences (depends on `client-js`, `player-components-react`, `designer-components-react`, `pages-player-react`, `pages-studio-react`) — this is the real Studio/Player-in-one-app product, analogous in spirit to how other BizFirst products split Designer vs. Player into the same or sibling deployables.
  - **Route scheme is stale in the earlier `atlas-forms-design.md` doc.** That doc claims nested react-router paths `/design/{FormID}`/`/play/{FormID}`. Current `App.tsx` has migrated to a `StudioShell` component that "owns its own internal `view=...` routing rather than nested react-router paths" per its own code comments. **Re-confirm the actual current route/URL shape directly against `StudioShell.tsx` before generating or hard-coding any "here's your form" URL** — do not trust the earlier doc's literal path scheme.
- **`examples/web-portal`** — genuinely minimal (`App.tsx` ~30 lines): renders only `<AtlasFormsPlayerApp authUser={null} .../>` from `pages-player-react`, explicitly documented as "renders form player without authentication." No designer, no auth packages, no `pages-studio-react` dependency. This is the reference example for embedding a **Player-only, unauthenticated** form-fill experience inside an external host app — the pattern to follow if Form Studio work needs to embed just the fill-out experience somewhere else.

---

## 11. Architecture Decision Records (`docs/adr/`)

3 of 7 indexed ADRs are actually written (004–007 are listed as "Proposed/TBD" in the README, not yet authored):

- **ADR-001 — Property Editor Registry Pattern** (Accepted 2026-04-18): replaced a 430-line if/else chain in `PropertiesTab` (one branch per control type) with `PropertyEditorRegistry` (`Map<controlType, PropertyEditor>`, `register()`/`get()`/`getAll()`). Rationale: Open/Closed principle, O(1) lookup, per-editor unit testing, third-party extensibility. Rejected alternatives: dynamic `import()` (loses type safety, adds build-config complexity), a plain props-based switch (still not extensible), a full plugin-lifecycle system (judged over-engineered for the need). Net measured result: 430 → 15 lines in the core component. Lives in `designer-components-react/src/registry/`.
- **ADR-002 — Monorepo Structure with pnpm** (Accepted 2026-04-18): chose pnpm workspaces over separate repos, npm/Yarn workspaces, or Lerna. Self-reported benchmark ("atlas-forms with 22 packages," now ~27): pnpm 18s install / 85MB vs. npm 45s / 120MB vs. Yarn 35s / 115MB. Confirms the `@atlas-forms/<name>-<js|react>` naming convention and `workspace:*` linking. Notes a future migration path (partial split / git subtree / Nx-Turborepo) if the monorepo outgrows this structure — not acted on as of this pass.
- **ADR-003 — Design Token System** (Accepted 2026-04-18): CSS custom properties (`--color-*`, `--spacing-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--transition-*`, `--z-*`), dark mode via a `[data-theme='dark']` override block, plus a sketched ESLint rule to forbid hardcoded values. Rejected Sass/Less variables (compile-time only, no runtime theme switch), CSS-in-JS (bundle/perf cost), Tailwind (bundle size/learning curve, "could be added later as optional"), and the formal W3C Design Tokens Community Group spec (deferred as unneeded complexity for now). Claims a 5-day "Phase 3" migration, starting from ~90% of components having hardcoded values. This is presumably `themes-js`'s domain, though the ADR wasn't cross-checked line-by-line against that package's current source this pass.

All three read as genuine, decisive engineering rationale with real rejected alternatives — no internal contradiction found, and directionally consistent with what's actually on disk (the registry pattern and pnpm workspace structure both match observed code).

---

## 12. Current state / rough edges — maturity signals

- `examples/form-studio/DevelopmentHistoryLog.md` exists and follows the CLAUDE.md convention (dated entries, root cause + fix) — but only at the app level, and only 3 entries (all 2026-08-07/08, all about the SSO/auth migration). **No per-package `DevelopmentHistoryLog.md` files were found inside `packages/*`** — unlike the stricter per-project expectation this session's house rules otherwise describe, this repo does not appear to follow that convention below the app level.
- A cluster of security-hardening docs exists at the atlas-forms root — `DOMPURIFY_SECURITY_HARDENING.md`, `HTMLCONTROL_SECURITY_CHECKLIST.md`, `HTMLCONTROL_SECURITY_INDEX.md`, `HTMLCONTROL_USAGE.md`, `SECURITY_VERIFICATION.md`, `VERIFICATION_REPORT.md` — filenames strongly suggest a real, deliberate XSS-hardening pass around the `html`/`css`/`article` display controls (DOMPurify sanitization). **Not read in full depth this pass** — flagged, not verified. Anyone relying on the security posture of raw-HTML controls should read these directly before trusting they're current, rather than trusting this summary.
- `IMPLEMENTATION_PROGRESS.md`, `IMPLEMENTATION_SUMMARY.md`, `OPTION_A_COMPLETION_SUMMARY.md`, `PHASE-3-ADVANCED-INPUTS-COMPLETE.md` (under `packages/`), `FIXES_EXPLAINED.md`, `CONTRIBUTING.md`, `HowToBuildAndRun.md`, `ONBOARDING.md`, `QUICK_REFERENCE.md` also exist at/near the root — skimmed for existence, not deeply read this pass. Their presence (plus `PHASE-3-ADVANCED-INPUTS-COMPLETE.md`'s name specifically) is consistent with active, phased development rather than an abandoned codebase.
- Net maturity read: this is a genuinely active, evolving codebase (package count grew past its own ADR's benchmark number, dated dev-history entries exist, security hardening was clearly done deliberately) — but with real accumulated drift in exactly the areas a new contributor is most likely to touch first (styling — §6, actions — §7, and the client/persistence layer — §8). Budget time to verify current behavior against source rather than trusting any single doc (including this one) as eternally current.

---

## 13. Consumers outside atlas-forms

Atlas Forms is **load-bearing infrastructure for at least two other major BizFirst products**, not a single-consumer style-panel dependency as initial context suggested:

- **App Studio** (`src/app-studio`): consumes on *both* sides.
  - Designer side: `StyleBuilderPanel` reuse, confirmed at `AddWidgetModal.tsx`, `WidgetEditorFields.tsx`, `PositionEditor.tsx`, `StyleSlotEditor.tsx`.
  - Runtime side: `app-studio/packages/widget-handlers-form-widget/src/FormWidgetRenderer.tsx` — a dedicated widget handler that embeds a real Atlas Forms form as a widget type inside App Studio's own player (`apps/app-player`, which depends directly on `player-components-react`, `api-client-js`, `types-js` via `link:`).
  - Also: `app-studio-designer-components-react` vendors/bundles type declarations from a wide set of `@atlas-forms/*` packages (`api-client-js`, `client-js`, `control-registry-js`, `form-engine-js`, `schema-js`, `state-react`, `storage-js`, `themes-js`, `types-js`, `ui-components-react`, `validation-js`) — a materially bigger dependency surface than one component.
- **Flow Studio** (`src/flow-studio`): the largest real consumer found. `packages/atlas-forms-bridge` has real `workspace:*` dependencies on `@atlas-forms/types-js`, `@atlas-forms/form-actions`, `@atlas-forms/player-components-react`, used to resolve and render Atlas Forms schemas as Human-In-the-Loop (HIL) forms inside a running workflow node (`resolveFormSchema.ts`, `handleFormNode.ts`, `ANCPFormOrchestrator.ts`, `EdgeInteractFormOrchestrator.ts`, `SignalRStreamingOrchestrator.ts`, `AtlasFormSchemaProvider.ts`). Also referenced in `flow-studio-designer` (`AtlasHilFormContent.tsx`, `ConnectorConfigDialog.tsx`, `NodePropertiesModal.tsx`, `typeSafeFormRenderer.ts`) and `flow-studio-api`. Atlas Forms is genuinely the rendering engine for Flow Studio's HIL/suspend-resume node UI — load-bearing, not incidental.
- **`bizfirst-common`**: `bizfirst-common-react/src/styles/StyleProperties.ts` explicitly mirrors `StyleBuilderPanel`'s style types, with its own code comment stating this is **temporary, acknowledged duplication** — "once `StyleProperties` is published to `@atlas-forms/types-js`, replace this file with a re-export." (It has been published; the replacement hasn't happened yet — the same class of cleanup debt as §6's stale `StyleBuilderPanel/types.ts` mirror.) `hil-ui`'s `FormStepRenderer.tsx` also renders forms via an injected `useHilFormRenderer()` context tied to `player-components-react`. `app-studio-player`'s `tsconfig.json` path-maps directly into `StyleBuilderPanel`'s source.
- **`passport`**: `@passport/auth-integration`'s `useThemeSync.ts` references Atlas Forms — likely syncing `state-react`'s theme store with the shared auth/theme system.
- **Everywhere else checked** under `BizFirstAiStudio/src/` (`ancp`, `api`, `app-conv`, `app-templates`, `bizfirst-global`, `chatbots`, `DataTemplates`, `demos`, `did`, `doc-app`, `edge-interact`, `edge-stream`, `edgestream-old`, `expressions`, `install-hub`, `market-hub`, `multiqueries`, `NodeTemplates`, `octopus`, `playground`, `screen-recorder`, `shared-styles`, `storage`) — **zero** `@atlas-forms` references, with one notable deliberate exception: `app-conv`'s `conversationsApiClient.ts` has a comment explicitly stating it does *not* depend on `@atlas-forms/form-actions`, specifically to stay embeddable outside Flow Studio — a documented decision to avoid coupling, not a gap.

**Practical implication for Form Studio work**: changes to `types-js`, `player-components-react`, `form-actions-js`/`form-actions-runtime-js`, or `StyleBuilderPanel`/`ControlStyleSet` are not contained to atlas-forms — they can affect App Studio's widget rendering and Flow Studio's HIL forms. Check both before assuming a change is locally scoped.

---

## 14. Summary of confirmed gaps/concerns, prioritized

For whoever picks up real Form Studio work next:

1. **Form Actions Player bug (§7)** — real, live, user-visible. `FormPlayerPage.tsx` reads `schema.metadata?.formActions` (always empty); real actions live at `schema.apiActions`. The Studio's own preview already has the fix (two `// CRITICAL FIX` comments) — it was never ported to the real Player. Highest-priority fix candidate if any work touches submit/load/validation actions.
2. **Styling: 4 of 5 `ControlStyleSet` slots are non-functional at runtime (§6)** — only `containerStyle` is applied; `headerStyle`/`bodyStyle`/`contentStyle`/`buttonStyle` are authorable and saved but never rendered. A whole parallel styling model (`controls-styling-schema-js`'s "9 capability groups") is fully dead.
3. **`editable-grid`/`display-grid` are dead control types (§5)** — built, not wired in. Use `grid`.
4. **Three unreconciled client code paths for form fetch/save (§8)** — `api-client-js` direct, `client-js`'s `AtlasFormsClient` facade, and a hand-copied legacy client inside `pages-player-react`. Real drift; know which one any new code should extend.
5. **`FormField.tsx`'s ~3500-line hardcoded switch bypasses the control registry for most common types (§5)** — don't assume registering a plugin is sufficient to change common-type rendering behavior.
6. **`form-engine-js` may be dead/parallel code (§2, §4)** — no live consumer confirmed; verify before building on it.
7. **Stale route-scheme claim in `atlas-forms-design.md` (§10)** — `form-studio` has moved to `StudioShell`'s internal view-routing; re-confirm the real current URL shape before generating a "here's your form" link.
8. **`form-action-pipeline-core-library-js` (empty) and `form-action-pipeline-library-core-js` (built, tested, unused) are both dead code (§7)** — don't extend either without first confirming a real plan to wire them in.
9. ~~Five packages not independently deep-read this pass~~ — **resolved, see §15.** `controls-form-container-react` and `ui-components-react` are confirmed live and load-bearing; `form-manager-react` and `common` are confirmed dead code (zero consumers); `themes-js` is real but only partially wired in (see #11 below).
10. **`form-manager-react` and `common` are dead code, confirmed by full-tree grep (§15)** — same standard as the original pass's dead-code findings. `common` in particular isn't a utilities package at all despite its name — it's an orphaned pure-CSS design-token library with zero importers anywhere.
11. **A third, effectively-unused theme representation (§15)**: `themes-js`'s `ThemeResolver`/`Theme` object model is instantiated inside `AtlasFormsClient` but its `getThemeResolver()` accessor has no confirmed caller outside its own unit test. The Player's real, live theme propagation is a separate, simpler `'light'|'dark'` string chain (`state-react`'s `useUIStore` → `player-components-react`'s `FormThemeContext`). Combined with `common`'s dead CSS-variable theme system and §6's already-confirmed-dead `controls-styling-schema-js`, that's now **three unused/underused styling or theming abstractions** in this codebase, not one.
12. **`controls-form-container-react`'s internal save path likely uses stale data (§15)** — its `useFormContainer` hook's `handleSave`/`getAllData` read from an internal Zustand `MasterDataStore` that is seeded once at mount and never updated as the user edits child forms through the real Player's actual prop-based data flow (`FormContainerControl`'s own `masterRef`/`onChange`). The wizard layout's own Submit button routes through this stale-data path. Likely low-impact in practice today only because `FormContainerControl` never populates `config.onSubmit` (not serializable in a JSON `FormSchema`), so the real save still happens at the outer form level — but worth fixing/removing before anyone builds on the internal save path directly.
13. **Security-hardening docs (DOMPurify/HTML-control) not content-verified this pass (§12)** — read them directly before treating raw-HTML control security as confirmed current.

---

## 15. The five previously-unverified packages, deep-read

A follow-up pass (2026-09-01) opened and read real source files (not just `package.json`/barrel exports) for the five packages §2 had flagged as unverified. Same rigor as the rest of this doc: findings below are evidenced by direct source reads and full-monorepo greps (`atlas-forms`, `app-studio`, `flow-studio`, and — to catch false positives — the wider `BizFirstAiStudio/src` tree), not inference from names.

### 15.1 `controls-form-container-react` — real, substantial, and wired into both Studio and Player

This is the renderer for the `form-container`/`form-node` control types — a genuine master/detail "embed N child forms inside one control" system, not a thin wrapper:

- **8 Zustand stores** (`src/stores/`): `MasterDataStore` (data + rollback snapshot), `ChildFormRegistryStore`, `BindingRepositoryStore`, `EventManagerStore` (pub/sub), `PathNavigatorStore` (dot-path get/set), `ChangeDetectorStore`, `ErrorHandlerStore`, `DataSyncEngineStore` — plus a `serviceRegistry.ts` (`setupFormContainerServices`/`cleanupFormContainerServices`) that initializes/tears them down.
- **A strategy layer** (`src/strategies/`): `BindingStrategies.ts` (shared-root / sub-root / independent — matches the `DataBindingConfig` discriminated union in `src/types/index.ts`), `ValidationStrategies.ts` (free / blocked / indicators / auto-save, via `ValidationStrategyFactory`), `SaveStrategies.ts`.
- **3 layout components** (`src/components/`): `TabsLayout`, `WizardLayout` (step indicator + prev/next/submit), `AccordionLayout` — all consumed by the top-level `FormContainer.tsx` component.
- **Designer-side UI** (`src/designer/`): `FormContainerPropertyPanel.tsx`, `ChildFormsGridPanel.tsx`, `FormBrowseModal.tsx`.

**Confirmed live wiring, both directions**:
- **Player**: `player-components-react/src/controls/layouts/FormContainerControl.tsx` is a real adapter — imports `FormContainer` from this package directly, fetches each child form's `FormSchema` via `FormDefinitionApiClient` (`client-js`), resolves the configured data-binding mode (`resolveChildData`: shared-root passes the full master object through, sub-root walks a dot-path with `createRootIfMissing`, independent gets `{}`), and renders each child via `player-components-react`'s own `FormRenderer` (recursive: a form-container's children are real nested forms, not a separate rendering path). `player-components-react/src/components/FormField.tsx` has a hardcoded `case 'form-container':` (line ~2759) that lazily imports and renders `FormContainerControl` inside a `<Suspense>` — consistent with §5's finding that the ~3500-line switch, not registry dispatch, is the real routing mechanism (there is also a `registry.register('form-container', FormContainerControl)` call in `ControlRegistry.ts`, but `FormField`'s switch bypasses it — the registration appears to be dead/redundant wiring, not the actual call path).
- **Studio**: `designer-components-react/src/components/tabs/PropertiesTab.tsx` imports `FormContainerPropertyPanel` from this package directly — the property-editing side is genuinely wired in too, not just the runtime renderer.

**This resolves §2's "Low — flagged" row to a confirmed "High."**

**New finding — internal save path likely reads stale data**: `useFormContainer.ts`'s `handleSave()`/`getAllData()` call `useMasterDataStore.getState().getData()`. But `MasterDataStore` is seeded exactly once, in a `useEffect` gated only on `[childForms.length]`, via `setupFormContainerServices(initialDataRef.current, childForms)` — and nothing in the package (checked `DataSyncEngineStore.ts` directly — it never references `useMasterDataStore`, `setData`, or `updateField`) ever re-syncs it as the user edits child forms. The real, live data-edit path in the Player is entirely separate: `FormContainerControl.tsx` tracks master data in its own `masterRef`/React `value`/`onChange` props (passed down from the parent `FormRenderer`), completely bypassing the internal Zustand store. So `WizardLayout`'s own Submit button — which calls `FormContainer.tsx`'s `handleWizardSubmit` → `handleSave()` → `configRef.current.onSubmit?.(allData)` — reads master data that reflects only the *initial* values, not live edits. Practical impact today is likely muted because `FormContainerControl.tsx` never sets `config.onSubmit` (a JSON `FormSchema` can't serialize a function), so real submission for a form-container control still happens at the outer form's own submit action, not through this internal path — but the internal `handleSave`/`getAllData` API is there, exported, and would silently return stale data if anyone wires `onSubmit` through the schema-config or calls it directly.

**Doc-staleness note**: `controls-form-container-react/IMPLEMENTATION_STATUS.md` (dated 2026-03-29) describes the package as "Phase 1 COMPLETE" with only the 8 stores done and strategies/UI still "Phase 2 — Next Steps." The package has since grown well past that (strategies, layouts, designer panels, real Player/Studio wiring all exist and are live) — the status file was never updated and materially understates how far along this package actually is. Low-risk (doesn't mislead toward unsafe action, just toward underestimating maturity), but worth knowing before assuming "Phase 1" is where this package still stands.

### 15.2 `form-manager-react` — confirmed dead code

Not a forms-list/CRUD management layer (the prior pass's guess). Its real role, confirmed by reading `FormManager.tsx`/`ConnectedFormManager.tsx`/`README.md`: a small, standalone "search and pick an existing form, then click Edit" widget — `FormManager` (data-source-agnostic, takes `fetchForms`/`loadForm` props) and `ConnectedFormManager` (pre-wired to `AtlasFormsClient.getInstance()`). It wraps `ui-components-react`'s `FormLookupField` and adds Edit/Clear buttons. Fully built (component, CSS, README with usage examples for pairing with `form-editor-react`), but:

- A precise grep for `@atlas-forms/form-manager-react`, `FormManager`, and `ConnectedFormManager` across `atlas-forms`, `app-studio`, and `flow-studio` finds **zero real imports** anywhere outside the package's own files.
- The only other hits are `flow-studio/apps/{flow-studio,flow-pipelines}/vite.config.ts` — but those files blanket-alias **24 different `@atlas-forms/*` packages** to their source paths (standard monorepo dev-resolve boilerplate), not evidence of use. No `.ts`/`.tsx` file in either app imports it.

**Conclusion**: dead code, same class of finding as `form-action-pipeline-library-core-js` in the original pass — built and documented, never consumed. No overlap risk with `pages-studio-react`'s `FormDefinitionDashboard`/`FormRecordsPage` (the concern the prior pass flagged) because nothing calls this package at all.

### 15.3 `ui-components-react` — real, widely used, mostly-but-not-entirely generic

Confirmed live: **82 real `@atlas-forms/ui-components-react` imports** across the monorepo (a precise `@atlas-forms/ui-components-react` grep, not a bare `ui-components-react` substring match — an earlier loose grep pass falsely matched an unrelated `@edge-stream/app-ui-components-react` package in EdgeStream; that package has no `@atlas-forms/*` dependency at all and is a false positive, not a real cross-consumer — corrected here so it isn't miscounted).

Real consumers: dozens of `player-components-react`'s own control implementations (`TextInput.tsx`, `SelectInput.tsx`, `CheckboxInput.tsx`, `DateInput.tsx`, and ~15 more input/layout controls import from it directly — it's a dependency of the control set itself, not just page chrome), `designer-components-react` (`FormBuilderCanvas.tsx`, `ControlCanvas.tsx`, property-editor tabs), `controls-form-container-react` (`AccordionLayout.tsx`, `FormContainerPropertyPanel.tsx`), `pages-studio-react`/`pages-player-react` (`AppLayout.tsx` and most page components), and externally by App Studio (`AddWidgetModal.tsx`, `WidgetEditorFields.tsx` — matches the App Studio consumer already documented in §13).

**Content**: `src/index.ts`'s barrel confirms a genuinely generic UI kit — `StandardButton`/`DesignButton`/`StudioButton`, `TextInput`, `Modal`/`ModalPortal`, `ConfirmDialog`, `ErrorBoundary`, `ToastContainer`, `Tooltip`, `EntityGrid`, `Pagination`, `MetaSelect`, `SearchableSelect`, `AccordionSection`, `EmojiPicker`, `SidebarToggle`/`SidebarNavButton`, `BizFirstLogo`, an icon set. This part matches §2's original guess and is architecturally similar to `StyleBuilderPanel` (§6) — schema-agnostic, reusable.

**Refinement to the original guess**: the package *also* exports two components with real Atlas-Forms domain coupling — `FormLookupField` (searchable form picker; its props are typed against `FormDefinition` from `types-js`, and it's the thing `form-manager-react`'s dead `FormManager` wraps) and `ControlLookupField` (searchable control picker). Both take their fetch function as an injected prop, so they're not hard-wired to a specific API, but the type coupling to `types-js`'s `FormDefinition` is real. So: **mostly** generic like `StyleBuilderPanel`, but not *purely* generic — worth knowing if `ui-components-react` is ever reused the way `StyleBuilderPanel` was reused by App Studio for something entirely outside Atlas Forms' data model.

### 15.4 `themes-js` — real, but only partially wired into live code

Confirmed the original guess's core claim: `themes-js` is a completely separate concern from `ControlStyleSet`/per-control styling (§6) — a `ThemeResolver` class (`src/theme-resolver.ts`) managing named `Theme` objects (`lightTheme`/`darkTheme`, each with `colors`/`typography`/`spacing`/`radius`/`shadows`/`zIndex`/`transitions`), with `getCurrent()`/`resolve()`/`setTheme()`/`toggle()`/`onChange()`/system-preference detection, exposed as a `getGlobalThemeResolver()` singleton.

**New finding — it's live in construction but not in actual use**: `client-js/src/atlas-forms.client.ts` genuinely imports and calls `getGlobalThemeResolver()` — `AtlasFormsClient`'s constructor sets `this.themeResolver = config.themeResolver || getGlobalThemeResolver()`, and exposes it via a public `getThemeResolver(): IThemeResolver` method. That's real, functional wiring, not a type-only reference. **But** a full-tree grep for `getThemeResolver()` finds exactly one caller: `atlas-forms/tests/packages/client-js.test.ts` — a unit test. No page, component, or hook in the shipped Studio or Player calls it.

The actual live theme mechanism the Player uses is a different, simpler system entirely: `state-react/src/ui.store.ts`'s `useUIStore` (a persisted Zustand store, `theme: 'dark' | 'light'`, `toggleTheme()`) is read by `pages-player-react/FormPlayerPage.tsx` (`const { theme } = useUIStore()`) and passed as `isDark ? 'dark' : 'light'` into `player-components-react`'s `FormThemeProvider` (a plain React context, `src/contexts/FormThemeContext.tsx`, typed just `'dark' | 'light'` — no `Theme`/`ColorScheme` object at all), which `useFormTheme()` then reads throughout the control tree (confirmed consumed by `FormContainerControl.tsx`, among others).

**Net effect**: three independent theme representations now confirmed in this codebase — `themes-js`'s rich `Theme`/`ColorScheme` object model (instantiated, essentially uncalled), `common`'s CSS-custom-property `[data-theme="dark"]` system (§15.5, fully dead/unimported), and the simple `useUIStore` → `FormThemeContext` string chain (the one actually driving what users see). This directly extends §6's "two competing style models" finding into styling *and* theming both having redundant, mostly-unused parallel systems — and refines ADR-003 (§11)'s CSS-custom-property design (`--color-*`, `[data-theme='dark']`) as more likely describing `common`'s dead stylesheet than `themes-js`'s live-but-uncalled TS object model; ADR-003 wasn't line-by-line cross-checked against either package's current source in this pass either, so treat that mapping as a reasonable read rather than a confirmed fact.

### 15.5 `common` — not a utilities package; confirmed dead code

The name and the original doc's guess ("presumably shared low-level utilities") turned out to be wrong in kind, not just unverified: `packages/common/` contains **zero JavaScript or TypeScript files**. Its entire content is `styles/` — `css-variables.css` (colors/typography/spacing/radius/shadows/transitions/z-index as CSS custom properties, plus a `[data-theme="dark"]` override block), `theme-definitions.css` (base element styling — h1–h6, inputs, buttons, tables, modals, alerts, badges), `utilities.css` (a small Tailwind-style utility-class set — `flex`, `p-4`, `text-center`, etc.), and a detailed `README.md` documenting all of it as if it were an active design system.

A full-tree grep for `atlas-forms/common` (the import path used throughout the package's own README, e.g. `import '@atlas-forms/common/styles/index.css'`) finds **no matches anywhere outside the package's own three files** (`README.md`, `index.css`'s own doc-comment, `package.json`'s name field). It is not aliased in any app's `vite.config.ts`, not listed as a dependency in any other package's `package.json`, not `@import`-ed from any other CSS file in the monorepo. This is a fully orphaned package: a complete, documented CSS design system that nothing in the shipping product actually loads.

**Conclusion**: confirmed dead code, same evidentiary standard as `form-action-pipeline-library-core-js` and `controls-styling-schema-js` in the original pass (a real, built, documented thing with zero consumers) — extends that pattern to a fourth dead/orphaned package in this monorepo, and to a second (after `controls-styling-schema-js`) dead styling system specifically.
