# Atlas Forms — Form Actions Player Bug: Fix Design

**Status: RESOLVED / IMPLEMENTED 2026-09-01.** Option A (§4, bypass `FormActionsEngine`,
port the Studio's proven pattern) was implemented in
`pages-player-react/src/pages/FormPlayerPage.tsx`, verified live in the real deployed
Player (not just the Studio preview), and typechecks clean. Full details, exact diff
reasoning, live-verification evidence, and what remains explicitly out of scope are in
`pages-player-react`'s own `DevelopmentHistoryLog.md` (2026-09-01 entry) — this document is
kept as-is below for history/design-rationale reference, not rewritten to narrate the
implementation.

**One real, additional finding from the implementation pass, not anticipated by this
design doc:** fixing the `load` trigger to actually populate `formValues` for the first
time exposed a dormant infinite-render loop in `FormPlayerPage.tsx` (unrelated call site,
`handleFieldValuesChange`'s unconditional mirroring of live form values back into a prop
rebuilt fresh every render) — fixed at the same call site as part of this task, since the
Form-Actions fix would otherwise be unusable. See the DevelopmentHistoryLog entry for the
full mechanism.

**Still open / explicitly out of scope (unchanged by this fix, tracked separately):**
response→control mapping only wired for `load`/`field-change`, never `submit`/
`button-click`; the outgoing-`payloadMapping` key/value inversion bug in
`AtlasFormsStudioApp.tsx`'s `executeApiAction` (ported into the Player unchanged, not
fixed); no live session token reaches any `apiActions[]` call (auth gap, §8 of the
search-results-edit-form-schema doc); `button-click` actions have no per-button scoping
field in the real schema.

**RESOLVED 2026-09-02** (see `pages-player-react`'s and `pages-studio-react`'s own
`DevelopmentHistoryLog.md` 2026-09-02 entries, and the search-results-edit-form-schema
doc's §5 Q2/Q3 and §8 for full detail): the outgoing-`payloadMapping` inversion bug and
the auth gap are both fixed, in both real consumers. Response→control mapping was
extended, but via a new, separate `'search'` trigger rather than by extending `submit`/
`button-click` themselves — `submit`/`button-click` still have no response mapping,
by design; use `'search'` (fires identically to `'button-click'`, via a `type: 'button'`
control's `onClick`) when a response needs to reach a control. `button-click`'s
per-button-scoping gap remains unchanged/unresolved.

---

**Original status note below, kept for history — no longer current:** ~~design/review
document. No source code has been changed as part of this pass. Per explicit instruction,
implementation (code changes) and live browser verification are deferred until the user
has reviewed this design and a separate, still-in-progress 5-package research pass has
landed.~~

Written 2026-09-01. Scope: `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\atlas-forms`. Builds directly on `atlas-forms-architecture-overview.md` §7/§14 (that doc's own casing details for `apiActions[]` were flagged there as needing reconfirmation — this pass reconfirms them against real source and real historical commits, see §1 below).

---

## 1. Confirmed root cause

### 1a. The real, on-disk schema shape (not the declared type)

`FormSchema.apiActions[]` items are **not** shaped like `types-js`'s or `form-actions-runtime-js`'s own declared `FormAction` interface. The actual shape authored by real users, confirmed three independent ways — a real captured form schema (`atlas-forms/FORM_SCHEMA_CORRECTED.json`), the plugin that defines the authoring UI (`controls-form-actions-react/src/plugins/api-actions/definition.ts`), and the Studio's own already-correct preview code (`AtlasFormsStudioApp.tsx`) — is:

```ts
// controls-form-actions-react/src/plugins/api-actions/definition.ts (real, authoritative shape)
export interface ApiAction {
  id: string;
  trigger: 'submit' | 'load' | 'save' | 'field-change' | 'button-click' | 'validation';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payloadMapping: Record<string, string>;   // flat map, direction depends on trigger — see §5c
  headers: Record<string, string>;
  onSuccess: 'none' | 'showMessage' | 'redirect' | 'custom';
  onError: 'none' | 'showError' | 'showMessage' | 'custom';
}
```

A real, working example (`FORM_SCHEMA_CORRECTED.json`, form `form-1779348191381`, "Currentl Form 2005"):

```json
"apiActions": [
  { "id": "api-action-...-3061", "name": "Load First Post", "trigger": "load",
    "endpoint": "https://jsonplaceholder.typicode.com/posts", "method": "GET",
    "payloadMapping": { "control-1779348203927": "[0].id" } },
  { "id": "api-action-...-8313", "name": "Submit Comment", "trigger": "submit",
    "endpoint": "https://jsonplaceholder.typicode.com/posts/1/comments", "method": "POST",
    "payloadMapping": { "control-1779348206082": "email" } }
]
```

**Trigger casing is lowercase/kebab** (`'load'`, `'submit'`, `'field-change'`, `'button-click'`, `'save'`, `'validation'`) — confirmed against real data, not PascalCase as the architecture doc's §7 left as an open question. This resolves that doc's own flagged uncertainty.

**Important nuance not previously documented**: `types-js`'s own declared `FormAction` interface (`form.types.ts:14-28`, the type `apiActions?: FormAction[]` is annotated with) is itself a *third*, different, mismatched shape — PascalCase triggers (`'OnSubmit'|'OnLoad'|'OnChange'|'OnValidation'`), no `name`/`payloadMapping`, uses `actionKey`/`endpoint`/`payload.mappings[]` instead. So the TypeScript type that `FormSchema.apiActions` is declared as does not match the real runtime JSON at all. Any fix should treat `schema.apiActions` as `ApiAction[]` (cast through `any[]`, exactly as `AtlasFormsStudioApp.tsx` already does with an explicit comment justifying the cast) — not as `types-js`'s `FormAction[]`.

### 1b. `FormActionsEngine.executeOnTrigger`'s real contract

Read in full: `form-actions-runtime-js/src/engine/FormActionsEngine.ts` and `src/types/index.ts`.

```ts
async executeOnTrigger(trigger: FormAction['trigger'], formSchema: any, formData: Record<string, any>) {
  const formActions = (formSchema.metadata?.formActions || []) as FormAction[];
  const matchingActions = formActions.filter(a => a.trigger === trigger);
  ...
  return this.executeActions(matchingActions, context);
}
```

- Reads `formSchema.metadata?.formActions` — **not** `schema.apiActions`. This is the confirmed bug location inside the engine itself, not just at the call sites.
- `trigger` is typed `FormAction['trigger']` = `'OnSubmit'|'OnLoad'|'OnChange'|'OnValidation'` (PascalCase; note `'OnClick'` isn't even in this union — `FormPlayerPage.tsx` passes `'OnClick'` today via an `as any`-style loosening, since TS can't have caught this class mismatch cleanly).
- `executeAction()` requires `action.endpoint` or `action.actionKey`, and builds the request payload via `PayloadMapper.mapPayload(formData, payloadConfig.mappings, payloadConfig.staticValues)` — i.e. it expects `action.payload.mappings: {fromField, toField}[]`, **not** the real `ApiAction.payloadMapping: Record<string,string>` flat map. Even if trigger casing were fixed, the engine's payload-building step would not understand real `apiActions` data unless the mapping shape is also translated first.
- Conclusion: **the engine's declared public contract does not match real `apiActions` data in two independent ways (trigger casing AND payload-mapping shape)**, not one. A pure case-normalization at the call site is insufficient by itself — the payload shape also needs translating, or the engine bypassed. See §5.

### 1c. All 4 call sites in `FormPlayerPage.tsx` (current, broken state — verified against the current file, all still present)

| # | Location | Trigger read | Reads from |
|---|---|---|---|
| 1 | Load effect, `executeLoadActions()` (~L285-412) | `'OnLoad'` | `schema.metadata?.formActions` |
| 2 | `handleFieldValuesChange` (~L442-531) | `'OnChange'` | `schema.metadata?.formActions`, filtered again per changed field via `a.fieldId === fieldId \|\| !a.fieldId` |
| 3 | `handleButtonClick` (~L545-611) | `'OnClick'` | `schema.metadata?.formActions`, filtered by `a.buttonId === buttonId \|\| !a.buttonId` |
| 4 | `handleSubmit` (~L625-735) | `'OnSubmit'` | `schema.metadata?.formActions` |

All four build a `schemaForEngine = { ...schema, metadata: { ...schema.metadata, formActions: <filtered actions> } }` wrapper and call `actionsEngine.executeOnTrigger(<PascalCase trigger>, schemaForEngine, values)`. Since real forms never populate `schema.metadata.formActions` (they populate `schema.apiActions`), `allFormActions`/`formActions` is always `[]`, the filter always returns `[]`, and `executeOnTrigger` always short-circuits at `matchingActions.length === 0`. **Confirmed: all 4 sites are dead code paths for every real form today.**

### 1d. The proven-correct pattern already in production: `AtlasFormsStudioApp.tsx`

Read in full. It does **not** use `FormActionsEngine` at all. It has its own local helpers — `getApiActionsByTrigger()`, `executeApiAction()` (raw `fetch()`), `extractNestedValue()` — that read `schema.apiActions` directly and match real lowercase trigger values (`'load'`, `'submit'`, `'field-change'`), with the two `// CRITICAL FIX` comments the task brief referenced (lines ~203-204, ~525-531). This is the pattern that should be ported, not merely referenced.

---

## 2. Git history: this is a **regression**, not merely an unported fix — new finding this pass

Traced full history of `FormPlayerPage.tsx` via `git log --follow` plus `git show` on the relevant commits. This materially sharpens the root-cause story:

- **`6e0a97c4`** (2026-05-20) / **`acb8304f`** (2026-05-21): implemented the load/submit triggers reading `schema.apiActions` with lowercase trigger names — i.e., **the correct logic existed in `FormPlayerPage.tsx` at this point.**
- **`5dac0a33`** (2026-05-21 13:40): added logging only (per its own diff — 3 insertions, 1 deletion). This is the commit `FIXES_EXPLAINED.md`/`VERIFICATION_REPORT.md` (both dated 2026-05-21, also introduced in this commit) describe as having "applied" the `schema.apiActions`/`'submit'` fix — **but the actual diff shows only debug logging was added, not the fix itself** (the fix was already present from the two commits above). Those two `.md` files are accurate about *what the correct fix looks like* but inaccurate/stale about *what commit made it durable* — worth knowing so they aren't trusted as proof current code is correct.
- **`eaa46bd1`** (2026-05-22, "Form action : fix") — **this is the regression commit.** Its diff shows the working `(schema as any).apiActions` / `a.trigger === 'load'` logic being **replaced** with `schema.metadata?.formActions` / `a.trigger === 'OnLoad'` (i.e. reverted to the broken shape), while *simultaneously*, in the same commit, adding the two `// CRITICAL FIX` comments to `AtlasFormsStudioApp.tsx` (also modified in this same commit, 369 lines changed) that correctly read `schema.apiActions`/lowercase triggers. **One commit fixed the Studio preview and broke the Player, at the same time.** This is a direct, git-confirmed origin for the exact asymmetry the architecture doc's §7 flagged.
- This same commit also added `form-actions-runtime-js/src/utils/SchemaMigration.ts` (322 lines) — a translation shim, `migrateSchemaToNewFormat()`, that converted old `apiActions` (flat `payloadMapping`, lowercase trigger) into the new `metadata.formActions` shape (`payload.mappings[]`, PascalCase trigger) at schema-load time in `FormPlayerPage.tsx`. This was a **third design already attempted**: reconcile the two shapes via a migration function rather than porting the read-side logic.
- **`fb7c92b4`** and **`44ce6f48`** (2026-05-23, both titled around "Api config fixes"/"Schema migration removed") **removed `migrateSchemaToNewFormat` and its import**, leaving `FormPlayerPage.tsx` in its current state: broken reads, no migration shim, no fallback. This is the code on disk today (confirmed by re-reading the live file in §1c above).

**Practical implication**: a naive "just port the Studio's two comments" fix is the right instinct, but the presence of a previously-built-and-abandoned migration-shim approach (`SchemaMigration.ts`) means there is real prior art on an alternative design worth weighing, not reinventing blind. See §5.

---

## 3. Pre-flight findings — existing real forms with authored `apiActions`

**Cannot reach the live database from this session — reporting honestly per instruction, not skipping silently.**

- Attempted `sqlcmd` against `DESKTOP-SRR6P2B\MSSQLSERVER02` / `BIZFIRSTATLASDB` (the server/DB named in `Documentation\Employees\atlas-forms\Form-Queries\TASK2_DATABASE_QUERY_REPORT.md`, dated 2026-07-23, reporting 1002 existing `FormID`s / 1069 expected). Result: **network-unreachable** (`SQL Server Network Interfaces: Error Locating Server/Instance Specified`) — that report was generated on a different physical machine (`DESKTOP-SRR6P2B`) than this session's host (`Achu`), and the DB is not reachable cross-machine from here.
- Tried this machine's own local `(localdb)\MSSQLLocalDB` instance (reachable) — it has a `BizFirstFiV3DB` database, but **no `Atlas_Forms` table exists in it** (`INFORMATION_SCHEMA.TABLES` query returned zero rows). So even the locally-reachable SQL instance isn't the real Atlas Forms data store.
- Probed local ports (10001 Consolidated WebApi, plus 5000/5001/5173/7000/7001/44300/44301) for a running Atlas Forms backend to query via REST instead — **nothing listening** (`curl` connection refused / timed out on all).
- **Conclusion: the live-DB pre-flight check is unverified this pass.** Do not treat the count below as authoritative.

**What repo-level evidence does show** (this is real, not a substitute for the DB check, but the strongest available signal):

- `atlas-forms/FORM_SCHEMA_CORRECTED.json` is a **real, captured production form schema** (form `form-1779348191381`, "Currentl Form 2005") with two genuinely authored `apiActions` — a `'load'` action hitting `https://jsonplaceholder.typicode.com/posts` and a `'submit'` action posting to `https://jsonplaceholder.typicode.com/posts/1/comments`. This is concrete, non-hypothetical proof that at least one real end user has authored real `apiActions` content through the Studio and hit exactly this bug (that's *why* `FIXES_EXPLAINED.md`/`VERIFICATION_REPORT.md` exist — they were written in response to this user's report).
- `Documentation\Employees\atlas-forms\Form-Queries\FormIDList.md` / `TASK2_DATABASE_QUERY_REPORT.md` confirm **1002–1069 real `FormID`s exist** in the live DB as of 2026-07-23 — but none of the existing DB-query reports in that folder queried `apiActions` content specifically (they're about `FormID` existence/sync between an expected list and the DB, not schema content). **How many of those 1000+ forms have non-empty, real `apiActions` today is genuinely unknown from this pass.**

**What happens to existing forms once this is fixed**: any form with a real, non-empty `apiActions[]` (however many that turns out to be) will start actually firing its configured HTTP calls on load/submit/change/click, where today they silently no-op. This is correct-per-spec behavior, not a regression — but it is a **behavior change that will surprise someone** if a form has a stale/test/demo endpoint configured (the jsonplaceholder.typicode.com example above is exactly this kind of thing — harmless as a public test API, but the pattern generalizes to real internal endpoints someone configured, forgot were dead, and never expected to fire). See recommendation below.

**Recommendation before wider rollout**: someone with real access to the live `BIZFIRSTATLASDB` (or the running Consolidated WebApi) should run:
```sql
SELECT FormID, Name FROM dbo.Atlas_Forms
WHERE Schema LIKE '%"apiActions":[%' AND Schema NOT LIKE '%"apiActions":[]%' AND Deleted = 0;
```
...to get the real count and inspect what those forms' actions actually point at, before this fix ships broadly. This is a recommendation for a follow-up step, not something this pass could execute.

---

## 4. Proposed fix — options, with reasoning (decision needed before implementation)

### Option A — Port the Studio's proven pattern directly; bypass `FormActionsEngine` (recommended) — **IMPLEMENTED 2026-09-01**

Replace all 4 call sites' engine-based logic in `FormPlayerPage.tsx` with local helpers reading `schema.apiActions` and matching real lowercase/kebab triggers, mirroring `AtlasFormsStudioApp.tsx`'s `getApiActionsByTrigger`/`executeApiAction`/`extractNestedValue` almost verbatim (`FormPlayerPage.tsx` already has its own near-identical `extractValueFromResponse`/`mapResponseToFormFields` helpers reading the wrong field — those bodies can largely stay, just re-pointed at `schema.apiActions`). `FormActionsEngine` stops being imported/used by `FormPlayerPage.tsx` entirely.

**Why recommended**:
- It is *exactly* the pattern the task brief describes as "proven-correct... never ported" — lowest-risk, matches known-working behavior, no new design invented.
- Avoids the payload-shape mismatch in §1b entirely — no need to translate `payloadMapping` (flat, direction-flipping) into `payload.mappings[]` (array of `{fromField,toField}`), since the bypassed engine never sees it.
- `FormActionsEngine` currently has **zero other consumers in the entire monorepo** (confirmed, §6) — bypassing it in `FormPlayerPage.tsx` does not strand any other caller; the package becomes fully unused (same category as `form-engine-js` and `form-action-pipeline-library-core-js` per the architecture doc's §2/§14 dead-code flags), a fact worth surfacing to the user/reviewer rather than deciding unilaterally to delete it.

### Option B — Fix `FormActionsEngine` itself to accept real `apiActions` data

Change `executeOnTrigger` to read `formSchema.apiActions` and accept lowercase triggers, and change `buildPayload`/`PayloadMapper` to understand the flat `payloadMapping` shape (with the direction caveat in §5c). Call sites stay thin wrappers around the engine.

**Why not the default recommendation**: this is the "fix the foundation, not the call site" instinct the task brief raises as worth considering, and it is architecturally cleaner *if* `FormActionsEngine` is meant to be the one real engine going forward — but it requires real semantic changes to `PayloadMapper`/`ActionResultProcessor` (not just a trigger-string rename), is a larger surface to get right and test, and — per §6 — has no other consumer today to justify hardening it right now. This is a legitimate "fix the foundation" option and should be the user's call, not assumed away; flagging explicitly rather than silently picking Option A.

### Option C — Resurrect and complete the abandoned `SchemaMigration.ts` shim

Restore `migrateSchemaToNewFormat()` (git-recoverable from `eaa46bd1`, deleted in `44ce6f48`) and re-wire it at schema-load time, fixing its payload-mapping translation (§5c) before doing so. Keeps `FormActionsEngine` as the single execution path with `apiActions` normalized upstream into its declared shape.

**Why not the default recommendation**: this exact approach was already tried and abandoned within a two-day window in May — no commit message or code comment recorded *why* it was removed, which is itself a yellow flag (don't resurrect it blind without understanding what motivated its removal, if anyone recalls). It also doesn't resolve the payload-mapping direction ambiguity noted in §5c; it would need that fixed first, same as Option B.

**This design doc does not pick a final answer between A/B/C — that decision is for the user/reviewer**, per the explicit "state your reasoning either way, don't just pick one" instruction. Option A is recommended as lowest-risk and most literally matching the brief's framing; B and C are real, considered alternatives with their own merits (foundation-level fix; reuse of prior art) that a reviewer may prefer.

### 5c. A caveat surfaced this pass, relevant to all three options

`AtlasFormsStudioApp.tsx`'s `executeApiAction()` builds the outbound payload as:
```ts
Object.entries(action.payloadMapping).forEach(([fieldPath, controlId]) => {
  payload[fieldPath] = formValuesData[controlId as string];
});
```
...i.e., for **submit/field-change** actions it treats `payloadMapping`'s **key as the destination API field** and **value as the source control ID**. But the real worked example's submit action is `{"control-1779348206082": "email"}` — key is the control ID, value is `"email"`. Applying the code above to that data would try `formValuesData["email"]` (a field literally named `"email"`), not `formValuesData["control-1779348206082"]` (the actual control) — which looks backwards relative to the *load*-trigger mapping semantics (`{controlId: responsePath}`, key=destination-in-form, value=source-in-response — the natural, opposite direction). This wasn't flagged in the architecture doc and is a genuine open question: either (a) the submit-side direction really is inverted from the load-side, by design or by an un-caught bug in the "proven correct" preview code, or (b) `formValuesData` in that one call happens to be keyed by field-name rather than control-ID in some path not fully traced this pass. **Whichever option (A/B/C) is chosen, implementation should write a real test/manual check for the submit/field-change payload direction specifically** — don't assume the load-trigger direction generalizes, and don't assume the preview code is bug-free just because it's the "proven correct" reference; it has only been shown correct for the load path, not confirmed for submit.

---

## 5. Blast radius

Confirmed by repository-wide grep across all of `BizFirstAiStudio/src` (App Studio, Flow Studio, and every other product), not inferred:

- **`FormActionsEngine` has exactly one consumer in the entire monorepo**: `pages-player-react/src/pages/FormPlayerPage.tsx`. Nothing else imports `@atlas-forms/form-actions-runtime` (confirmed by grep — the only hits are `FormPlayerPage.tsx` itself, `form-actions-runtime-js`'s own internal files, and its `README.md`).
- **`FormPlayerPage.tsx` consumers** (confirmed):
  - `examples/form-studio` — the real, production-deployed Studio+Player app (per architecture doc §10). Its own `src/pages/FormPlayerPage.tsx` is a **33-line thin re-export wrapper** around `@atlas-forms/pages-player-react`'s real component (confirmed by reading it in full) — not a fork, so there is exactly one real implementation to fix, not two.
  - `pages-player-react`'s own `AtlasFormsPlayerApp.tsx` also renders `FormPlayerPage` — this is what `examples/web-portal` embeds for its documented "unauthenticated Player-only" pattern (architecture doc §10).
  - So the fix's live-behavior impact is scoped to: **real end users filling out/submitting forms through the Studio's Player view, and any external host embedding the unauthenticated Player pattern.**
- **App Studio: confirmed NOT affected.** `app-studio/packages/widget-handlers-form-widget/src/FormWidgetRenderer.tsx` (read in full) renders forms via `player-components-react`'s bare `FormRenderer` directly and has its own, completely separate action mechanism (`context.appWidget.configuration['submitActionBindings']` + `engine.executeAction(...)`, App Studio's own widget-action system). Repo-wide grep for `pages-player-react`/`form-actions-runtime` inside `app-studio/` returned **zero hits**. App Studio never reads `schema.apiActions` or `schema.metadata?.formActions` at all — it has its own, unrelated design for "what happens on submit," so this fix neither helps nor harms it. (Worth noting as a separate, out-of-scope observation: App Studio's forms don't get Atlas-Forms-authored API actions today either way — not something this fix changes.)
- **Flow Studio: confirmed NOT affected by this specific fix.** Repo-wide grep for `apiActions`/`formActions`/`FormActionsEngine`/`OnLoad`/`OnSubmit` inside `flow-studio/packages/atlas-forms-bridge/src` returned **zero hits**. `FormWidgetRenderer.tsx`'s own code comment explicitly names Flow Studio's `AtlasHilFormContent.tsx` as "the proven embedding template for `FormRenderer`" — i.e. Flow Studio's HIL forms, like App Studio's widget forms, render via the bare `FormRenderer` and never go through `FormPlayerPage`/`FormActionsEngine`. HIL forms are about presenting fields for human approval/input inside a workflow, not about the form itself calling external APIs on load/submit — consistent with why this bridge never touches `apiActions`.
- **Net**: the blast radius is **narrower than the original brief anticipated**. This is not a foundation-wide change touching every Atlas Forms consumer — it is contained to the real "fill out and submit a standalone form via the Player" experience (Studio's own Player view + `examples/web-portal`'s embed pattern). App Studio and Flow Studio each have their own independent, unaffected action mechanisms layered directly on `FormRenderer`.

---

## 6. Verification plan (for when implementation actually happens — not executed this pass)

1. **Typecheck**: `pnpm --filter @atlas-forms/pages-player-react run typecheck`, plus (if `form-actions-runtime-js` or `types-js` end up touched under Option B/C) `pnpm --filter @atlas-forms/form-actions-runtime run typecheck` and a workspace-wide `pnpm -r run typecheck` to catch any ripple.
2. **Live verification, all 4 triggers** (the original brief only called out load+submit as the historically-tested pair — broaden to match the real `ApiAction.trigger` union):
   - Load (`'load'`): open the real Player (`examples/form-studio` dev server) against a form seeded with `FORM_SCHEMA_CORRECTED.json`'s exact `apiActions` (or freshly authored via the Studio) — confirm via claude-in-chrome's Network + Console tabs that the GET to the configured endpoint fires on page load and the mapped field populates.
   - Submit (`'submit'`): confirm the POST fires with the mapped payload, before/instead-of-or-alongside the default form-data submission per `handleSubmit`'s existing fallback logic.
   - Field-change (`'field-change'`, called `'OnChange'`/call-site-3 today): confirm an action tied to a specific field fires on that field's change, debounced, and does not fire for unrelated fields.
   - Button-click (`'button-click'`, called `'OnClick'`/call-site-4 today): confirm an action tied to a specific button fires only for that button.
3. **Negative check**: confirm a form with **no** `apiActions` (the overwhelmingly common case today) shows no change in behavior — no spurious calls, no console errors, default submission still works exactly as before.
4. **Regression check on the Studio preview**: re-open `AtlasFormsStudioApp.tsx`'s own preview mode after the change and confirm its load/submit actions still fire — expected to be unaffected since that file isn't touched, but verify nothing in a shared package (`types-js`, `form-actions-runtime-js`, if touched under B/C) broke it.
5. **CSRF/error-path check**: confirm CSRF token wiring and the `submitError` banner still behave correctly for a deliberately-failing action (e.g. a 404 endpoint), under whichever implementation path (Option A's raw-fetch vs. Option B/C's engine) is chosen.
6. **Payload-mapping direction check (new, from §5c)**: author a submit/field-change action with a `payloadMapping` matching the real worked example's shape and confirm, concretely, which direction actually produces the correct outbound payload — resolve the open question rather than assuming.
7. **Pre-flight DB query** (§3's recommendation): before calling this "shipped," someone with real access to the live Atlas Forms DB should run the suggested query and review what real forms' `apiActions` point at, so a form with a stale/dangerous endpoint isn't silently activated.

---

## 7. Summary for the reviewer

- Root cause is fully confirmed, including a **new finding this pass**: the current broken state is a **git-traceable regression** (`eaa46bd1`, 2026-05-22), not merely a fix that was "never ported" — the correct logic existed in `FormPlayerPage.tsx` for two days and was reverted in the same commit that added it correctly to `AtlasFormsStudioApp.tsx`.
- Pre-flight DB check is **honestly unverified** — the live DB is unreachable from this session (wrong machine/network); the strongest available evidence is one real captured form schema (`FORM_SCHEMA_CORRECTED.json`) proving real users do author `apiActions`, against a backdrop of 1000+ total forms in the DB whose `apiActions` content is unknown from here.
- Three fix options are laid out (A: bypass the engine, recommended; B: fix the engine's real contract; C: resurrect the abandoned migration shim) with reasoning for each, plus a previously-undocumented payload-mapping direction ambiguity (§5c) that should be resolved during implementation regardless of which option is picked.
- Blast radius is **narrower than expected**: only `pages-player-react`/`FormPlayerPage.tsx` and its two consumers (`examples/form-studio`, `examples/web-portal`) are affected. App Studio and Flow Studio both render Atlas Forms via a bare `FormRenderer` with their own independent action mechanisms and are confirmed, by repo-wide grep, to have zero exposure to this bug or its fix.

~~No code was changed. Awaiting review/decision on §4's option and the second signal referenced in the scope-change instruction before implementing.~~ **Superseded 2026-09-01 — see the RESOLVED/IMPLEMENTED status note at the top of this document.** Option A was implemented, live-verified in the real deployed Player, and typechecks clean; full details in `pages-player-react/DevelopmentHistoryLog.md`.
