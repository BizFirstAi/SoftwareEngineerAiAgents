# Atlas Forms — External `formUri` Fetch: Design (Research/Design Only)

**Status: DONE / IMPLEMENTED (2026-09-01).** Built per this design's own recommended
defaults for all 6 open decisions in §9 (see the "Implementation status" section appended at
the end of this file for the resolution of each, plus what was verified live vs. simulated).
Source: `packages/pages-player-react/src/api/config.ts`,
`packages/pages-player-react/src/api/formUriLoader.ts` (new),
`packages/pages-player-react/src/pages/FormPlayerPage.tsx`,
`packages/pages-player-react/src/pages/AtlasFormsPlayerApp.tsx`. Dated entry also added to
`packages/pages-player-react/DevelopmentHistoryLog.md`.

**Original status when this section was written (superseded above): RESEARCH/DESIGN ONLY. No source code had been changed as part of that pass.**

Written 2026-09-01. Scope: `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\atlas-forms` (Player: `packages/pages-player-react`). Reference format follows `atlas-forms-form-actions-player-bug-fix-design.md` (file:line citations for every factual claim; confirmed vs. recommended kept visually separate; open decisions at the end, not silently assumed).

**Feature being designed**: let the Player load a `FormSchema` from an arbitrary, fully-qualified external URI (`https://raw.githubusercontent.com/...`, a Cloudflare-hosted static file, or an `ipfs://<CID>` reference) instead of exclusively from `formDefinitionClient.getById(formID)` — a "headless form-fetch" path that bypasses the backend API entirely. **Disabled by default**, gated by a read-only (build/deploy-time only, no runtime toggle) env var.

---

## 1. The real, current form-loading surface

### 1a. `FormPlayerPage.tsx` — the single real load path today

`packages/pages-player-react/src/pages/FormPlayerPage.tsx`:

- **Props** (`FormPlayerPage.tsx:56-60`): `formID: number` is required; no alternative loading input exists today.
- **Load effect** (`FormPlayerPage.tsx:91-130`):
  ```ts
  Promise.all([
    formDefinitionClient.getById(formID),
    storage.loadDraft(String(formID)),
  ]).then(([formResult, loadedDraft]) => {
    ...
    const form = formResult.data as any;
    const schemaStr = form?.Schema ?? form?.schema;         // 106
    ...
    let parsedSchema = typeof schemaStr === 'string' ? JSON.parse(schemaStr) : schemaStr;  // 113
    setSchema(parsedSchema);                                 // 115
  })
  ```
  **Confirmed, load-bearing detail**: line 113 already tolerates `Schema` being *either* a JSON string *or* an inline object. This existing tolerant-parse is reused directly by the `formUri` design below (§5) — no new parsing branch is needed for that part.
  **Also confirmed**: everything on `formResult.data` other than `.Schema`/`.schema` is discarded — `FormID`, `Name`, and any audit/metadata fields the backend returns are never read again after this effect. This directly answers the coordinator's metadata question in §5c below.
- Draft-loading (`storage.loadDraft(String(formID))`, same effect) and form-data submission (`handleSubmit`, `FormPlayerPage.tsx:533-581`, posts to `formDataClient.submit({ FormID: formID, FormData: ... })`) are both keyed on the numeric `formID` and are backend-relative — **out of scope**: a `formUri`-loaded form has no `FormID` to key a draft/submission against without further design (flagged as an open decision, §11).

### 1b. `AtlasFormsPlayerApp.tsx` — routing: how a `formID` reaches `FormPlayerPage` today

`packages/pages-player-react/src/pages/AtlasFormsPlayerApp.tsx`:

- Uses **query-string routing**, not a router library: `readViewParam()`/`pushViewParam()` (`AtlasFormsPlayerApp.tsx:48-61`) read/write `?view=<dashboard|records|settings|form>` via `URLSearchParams` + `window.history.pushState`.
- The **standalone form view** (`AtlasFormsPlayerApp.tsx:146-176`, `view === 'form'`) is the exact real precedent to extend:
  ```ts
  const params = new URLSearchParams(window.location.search);
  const formID = parseInt(params.get('formID') ?? '', 10);   // 148
  if (formID) {
    return ( ... <FormPlayerPage formID={formID} onSuccess={() => window.close()} /> ... );  // 168
  }
  ```
  This is a real `?view=form&formID=123` link, opened in a new tab (comment at line 145: "opens in new tab via 'View Form'").
- The main `dashboard`/`records`/`settings` views (`AtlasFormsPlayerApp.tsx:186-189`) render `FormsDashboard`/`FormRecordsPage`/`SettingsPage` with no `formID` — form selection happens inside `FormsDashboard`.

### 1c. `FormsDashboard.tsx` — where `formID` links are constructed

`packages/pages-player-react/src/pages/FormsDashboard.tsx`:

- Imports the **canonical** `FormDefinition` type from `@atlas-forms/types-js` (`FormsDashboard.tsx:10`), not the narrower local one `FormPlayerPage.tsx` actually receives data through (see §1e — two different declared shapes exist).
- "View Form" constructs the exact link pattern from §1b: `url.searchParams.set('formID', String(form.FormID))` (`FormsDashboard.tsx:139`), `onSelectForm?.(form.FormID, form.Name)` (`FormsDashboard.tsx:132`).
- The form card only ever renders `Enabled`, `Name`, `FormCode`, `Version`, `Description` (`FormsDashboard.tsx:230-250`) — **no audit/metadata field is displayed** for a form definition anywhere in this file (grepped explicitly; zero hits for `CreatedOn`/`LastModifiedOn`/`TenantID`/etc. in this file). Relevant to §5c.
- **Scope boundary, stated explicitly, not an oversight**: `FormsDashboard` lists forms known to the backend (`AtlasFormsClient`), so a `formUri`-sourced form cannot and should not appear in this list — a `formUri` link is a direct-link-only entry point (§1b/§9), consistent with the feature's own "bypass the backend" premise.

### 1d. `FormRecordsPage.tsx` — a different entity, not form definitions

`packages/pages-player-react/src/pages/FormRecordsPage.tsx` browses **submitted form data records** (`FormDataRecord` from `../api/formDataClient`), not form definitions. It calls `formDefinitionClient.getById(record.FormID)` (`FormRecordsPage.tsx:40`) only to re-render a schema for a previously-submitted record in a view modal — this path is unaffected by this design (a `formUri`-loaded form is never submitted through the DB-backed records flow; see the draft/submission scope note in §1a). Its `CreatedOn`/`LastModifiedOn` display (`FormRecordsPage.tsx:321,324`) is for `FormDataRecord` (`formDataClient.ts:16,18,19`: `CreatedOn: string`, `LastModifiedOn?: string`, `IsDeleted?: boolean`) — a **separate type from `FormDefinition`**, not evidence about form-definition metadata display.

### 1e. `formDefinitionClient` — the real implementation, and a shape discrepancy worth flagging

`packages/pages-player-react/src/api/formDefinitionClient.ts` (full file, 29 lines):
```ts
export interface FormDefinition {
  FormID: number;
  Name: string;
  Description?: string;
  Schema?: string;
  Enabled: boolean;
  DisplayOrder: number;
  [key: string]: unknown;                    // index signature — extra fields pass through untyped
}

export class FormDefinitionClient extends BaseApiClient {
  getById(id: number): Promise<ApiResponse<FormDefinition>> {
    return this.postQuery<FormDefinition>(API_ENDPOINTS.FORM_DEFINITIONS.GET_BY_ID, { ID: { ID: id } });
  }
}
export const formDefinitionClient = new FormDefinitionClient();
```
`API_ENDPOINTS.FORM_DEFINITIONS.GET_BY_ID = '/api/v1/atlas/forms/by-id'` (`endpoints.ts:9`).

**This local `FormDefinition` is narrower than the canonical one.** `packages/types-js/src/form.types.ts:393-501` declares a *second*, fuller `FormDefinition` interface (the one `FormsDashboard.tsx` actually imports, §1c) that includes the full standard metadata set — see §5a. The local, narrower interface in `formDefinitionClient.ts` is what `FormPlayerPage.tsx`'s `getById()` call is actually typed against; its `[key: string]: unknown` index signature means extra backend-returned fields would pass through at runtime without breaking typing, but nothing in `FormPlayerPage.tsx` reads them (§1a).

**Not independently confirmed this pass**: the real backend DTO the `/api/v1/atlas/forms/by-id` endpoint returns at runtime (a repo-wide grep for the controller in `BizFirstPayrollV3` timed out against this session's search budget and was not retried). The client-side declared types above are the best available evidence; see §5c for how this is handled without that confirmation.

### 1f. `apiConfig` — the real, local API base-URL pattern

`packages/pages-player-react/src/api/config.ts` (full file, 23 lines):
```ts
const getEnvVar = (key: string, defaultValue: string): string => {
  return ((import.meta as any).env?.[key]) || defaultValue;
};
export const apiConfig: ApiConfig = {
  baseUrl: getEnvVar('VITE_ATLAS_API_BASE_URL', ''),
  timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'), 10),
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
};
```
This is the file the new env-var read should live alongside (§6b) — it already has the exact `getEnvVar` helper and a module-scope `const` computed once at load, which is the pattern needed for "read-only."

---

## 2. Real environment-variable convention (confirmed by grep, not guessed)

### 2a. Monorepo-wide boolean-flag convention

Grepped `import.meta.env.VITE_...===...true...` / `VITE_ENABLE_` / `VITE_FEATURE_` across `BizFirstAiStudio/src`. Confirmed real, existing hits (not exhaustive, representative):
- `flow-studio/shared/config/app-config.ts:37` — `DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true'`
- `passport/packages/@passport/config/src/logging.ts:26-27` — `enableConsole: ... !== 'false'`, `enableRemote: ... === 'true'`
- `passport/packages/@passport/config/src/cache.ts:13` — `enabled: import.meta.env.VITE_ENABLE_CACHE !== 'false'`
- `passport/packages/@passport/config/src/features.ts:6` — dynamic `import.meta.env[\`VITE_FEATURE_${key.toUpperCase()}\`]`
- `saas/apps/saas-tenant-administration/src/config.ts:33,35-39` — a small typed `readBoolEnv(name, defaultValue)` helper:
  ```ts
  export const PAYMENT_FEATURE_ENABLED: boolean = readBoolEnv('VITE_PAYMENT_FEATURE_ENABLED', false);
  function readBoolEnv(name: string, defaultValue: boolean): boolean {
    const raw = (import.meta.env as Record<string, string | undefined>)[name];
    if (raw === undefined || raw === '') return defaultValue;
    return raw.toLowerCase() === 'true' || raw === '1';
  }
  ```
  (mirrored in `saas/apps/saas-platform-administration/src/config.ts:80`)
- `edge-stream/install-hub/apps/install-hub-{creator,admin}/.env.local` — a sibling convention, `VITE_FEATURE_MARKETPLACE=true` etc.

**Conclusion**: `VITE_ENABLE_<NAME>` (boolean, `=== 'true'`) is the dominant repo-wide shape for an on/off capability flag, always read through a small helper and exported as a computed-once `const`/config object — never re-read per call, never exposed as mutable app state.

### 2b. `atlas-forms`'s own local convention — the stronger, more directly applicable precedent

Two files *inside* `atlas-forms` itself already establish a local naming prefix and a working boolean-flag pattern:
- `packages/pages-player-react/src/api/config.ts:17` and `examples/web-portal/src/config/appConfig.ts:22` both use **`VITE_ATLAS_API_BASE_URL`** — i.e., atlas-forms prefixes its own env vars with `VITE_ATLAS_`, not bare `VITE_`.
- `examples/web-portal/src/config/appConfig.ts` (full file, 25 lines) already has a **real, working boolean flag** using exactly this prefix:
  ```ts
  const parseBoolean = (value: string, defaultValue: boolean): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return defaultValue;
  };
  export const webPortalConfig: WebPortalConfig = {
    apiBaseUrl: getEnvVar('VITE_ATLAS_API_BASE_URL', ''),
    enableLogging: parseBoolean(getEnvVar('VITE_ATLAS_ENABLE_LOGGING', 'true'), true),   // line 23
  };
  ```
  `examples/web-portal/.env.production:5` sets `VITE_ATLAS_ENABLE_LOGGING=false` for real.

**This is the closest real precedent available** — same package family (`pages-player-react`/`web-portal`), same `getEnvVar` helper already present locally, same `VITE_ATLAS_` prefix, same `parseBoolean`-then-computed-once-const shape.

### 2c. Recommended env var name and read location

- **Name: `VITE_ATLAS_ENABLE_FORM_URI_FETCH`** — matches §2b's local prefix exactly (not the bare `VITE_ENABLE_FORM_URI_FETCH` genericly implied by the task brief's own example name; the more specific, already-established local prefix is the better match per "match the real convention, not invent one").
- **Read location: extend `packages/pages-player-react/src/api/config.ts`** (the file already doing this exact job for `VITE_ATLAS_API_BASE_URL`), porting `parseBoolean` verbatim from `web-portal/appConfig.ts:15-19`:
  ```ts
  const parseBoolean = (value: string, defaultValue: boolean): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return defaultValue;
  };

  // Read once at module load. Vite statically replaces `import.meta.env.VITE_*` references at
  // build time (its `define`/import-analysis step), so this is not a live process.env read —
  // by the time the bundle runs in the browser, this literal is already baked in. There is no
  // runtime code path (state, store, UI control) anywhere that can change this value after
  // build; that is what makes it genuinely "read-only" per the requirement, not just
  // "not currently wired to a toggle."
  export const FORM_URI_FETCH_ENABLED: boolean = parseBoolean(
    getEnvVar('VITE_ATLAS_ENABLE_FORM_URI_FETCH', 'false'),
    false,          // disabled by default, per the explicit requirement
  );
  ```
- **Default: `'false'`** (disabled), satisfying the explicit "disabled by default" requirement.
- `FormPlayerPage.tsx` imports `FORM_URI_FETCH_ENABLED` from `../api/config` and reads the already-computed constant — never calls `import.meta.env` itself, and never stores the flag in `useUIStore`/React state/any other mutable location. This is the concrete mechanism satisfying "no runtime toggle exposed anywhere in app state/UI/store."

---

## 3. Validation mechanism reality check

Grepped `packages/atlas-forms` for `ajv`/`zod`/`yup`/`joi`/`json-schema` in every `package.json` — **zero hits**. Grepped `form-engine-js`, `pages-player-react`, `types-js`, `validation-js` for the same — **no schema/shape-validation library exists anywhere in this codebase** (`validation-js` exists as a package name but was not found to contain Ajv/Zod/etc. — it is field-level form validation, i.e. validating a user's *input values* against a form's rules, a different concern from validating that an untrusted external file *is structurally* a `FormSchema`).

**Conclusion, stated plainly**: nothing exists to reuse. A minimal hand-rolled shape check is needed (§5b) — matching the task brief's own fallback suggestion, not a guess made without checking.

---

## 4. CORS reality check — live-verified this session, not documentation-only

This session has live internet access via the `Bash` tool. Ran real `curl` requests (2026-09-01, this session):

```
$ curl -s -D - -o /dev/null https://raw.githubusercontent.com/octocat/Hello-World/master/README
HTTP/1.1 200 OK
...
Access-Control-Allow-Origin: *
Cross-Origin-Resource-Policy: cross-origin
...
```

**Confirmed live, not assumed from documentation**: `raw.githubusercontent.com` serves `Access-Control-Allow-Origin: *`, which is sufficient for an unauthenticated browser `fetch()` (no credentials mode needed, matching §7's no-auth-by-default design) to succeed cross-origin.

Cloudflare Pages/R2/Workers-hosted static files were **not** live-tested (no concrete Cloudflare-hosted URL was available to probe) — for those, the standard, well-documented behavior is that Cloudflare Pages and R2 public buckets serve permissive CORS by default for static GET requests, but this specific claim is **not live-verified this pass** and should be treated as documentation-sourced, unlike the GitHub raw-content result above. A deployer relying on this should verify their own bucket/Pages CORS configuration directly.

(See §8 for IPFS gateway CORS, also live-verified this session.)

---

## 5. The exported file's envelope shape (added per explicit follow-up instruction)

### 5a. What `getById()` returns today vs. what `FormPlayerPage.tsx` actually uses

Per §1e, two declared shapes exist:

1. **The canonical, full shape** — `types-js`'s `FormDefinition` (`form.types.ts:393-501`), which **already declares the complete CLAUDE.md standard metadata set**, field-for-field:

   | CLAUDE.md standard field | Declared in `types-js` `FormDefinition` | Required? |
   |---|---|---|
   | `TenantID` | `form.types.ts:461` | required (`TenantID: number`) |
   | `Deleted` | `form.types.ts:464` | required (`Deleted: boolean`) |
   | `Archived` | `form.types.ts:467` | required (`Archived: boolean`) |
   | `CreatedOn` | `form.types.ts:470` | required (`CreatedOn: string`) |
   | `CreatedBy` | `form.types.ts:473` | optional (`CreatedBy?: number`) |
   | `LastModifiedOn` | `form.types.ts:476` | required (`LastModifiedOn: string`) |
   | `LastModifiedBy` | `form.types.ts:479` | optional |
   | `SourceAppID` | `form.types.ts:482` | optional |
   | `ClientAccountID` | `form.types.ts:485` | optional |
   | `AppDomainID` | `form.types.ts:488` | optional |
   | `DataDomainID` | `form.types.ts:491` | optional |
   | `DataSegmentID` | `form.types.ts:494` | optional |
   | `ResID` | `form.types.ts:497` | required (`ResID: string`) |

   Plus `FormID: number` (`:395`), `Name: string` (`:398`), `Schema?: string` (`:410`, **JSON-serialized `FormSchema`** — confirmed by the comment at that line and by `FormPlayerPage.tsx:113`'s tolerant parse), and an index signature (`:500`) for anything else.

2. **The narrower local shape** actually used at the one real call site (`FormPlayerPage.tsx:96`, via `formDefinitionClient.ts:10-18`) — no metadata fields declared, just an index signature.

**Answering the coordinator's Q1 directly**: whether the *backend* actually populates the full metadata set on this endpoint's real response body was **not independently confirmed this pass** (§1e — the controller search timed out). What *is* confirmed by reading the code: **`FormPlayerPage.tsx`'s load effect (`:105-115`) only ever extracts `.Schema`/`.schema` and discards every other field, unconditionally, regardless of what the backend sends.** So today, even if the backend does return the full metadata set, the Player throws all of it away before it ever reaches `FormRenderer` or any other consumer.

**Answering the coordinator's Q2 directly**: `FormsDashboard.tsx` renders `Enabled`/`Name`/`FormCode`/`Version`/`Description` only (`:230-250`, confirmed by grep, zero hits for the metadata fields in that file). `FormRecordsPage.tsx` displays `CreatedOn`/`LastModifiedOn`, but those belong to `FormDataRecord` (submitted records), a different type entirely (§1d) — **not** form-definition metadata. **Conclusion: no UI in the Player today reads or displays any of the standard metadata fields for a form *definition*.** They exist purely for provenance/audit purposes in the type system, with zero current UI consumer. This means adding them to a `formUri` envelope is additive and non-breaking — nothing downstream depends on their presence today, so there is no functional requirement forcing them to be present, only a provenance one (§5d).

### 5b. Proposed envelope shape for the exported `.json`/`.form` file

Reuse the **canonical** `FormDefinition` shape (§5a #1) as the envelope's outer type — it is already exactly the right shape (flat metadata fields + a `Schema` field holding the form's `FormSchema`), and it is already exported from `@atlas-forms/types-js`, so no new type needs inventing for the outer shell:

```jsonc
{
  // ─── Standard row/metadata fields (flat, sibling to Schema — matches the real getById()
  //     row shape, not a new wrapper) ───
  "FormID": 1042,
  "Name": "Vendor Intake Form",
  "TenantID": 7,
  "Deleted": false,
  "Archived": false,
  "CreatedOn": "2026-08-12T14:03:00Z",
  "CreatedBy": 55,
  "LastModifiedOn": "2026-08-30T09:11:00Z",
  "LastModifiedBy": 55,
  "SourceAppID": 12,
  "ClientAccountID": 300,
  "AppDomainID": 1,
  "DataDomainID": 1,
  "DataSegmentID": null,
  "ResID": "form-1042-vendor-intake",

  // ─── The one real, existing nesting point (matches production exactly: `Schema` is its
  //     own field on the row, not flattened) ───
  "Schema": {
    "version": "1.0",
    "metadata": { "formID": "form-1779348191381", "title": "Vendor Intake Form" },
    "controls": [ /* ... */ ],
    "apiActions": [ /* ... */ ],
    "styles": { /* ... */ }
  }
}
```

**Reasoning for this exact shape, addressing the tension in the coordinator's own phrasing** ("a flat superset... unless the real shape is itself nested — match the real shape"): the real `getById()` response *is* nested in exactly one place — `Schema` is its own key holding the form's schema (as a JSON string in the DB/API today, per `form.types.ts:410`'s comment). Flattening `FormSchema`'s own fields (`version`/`metadata`/`controls`/`apiActions`/`styles`) up to the top level would collide or create ambiguity with the row's own fields in principle (e.g. the row has `Name`; `FormSchema.metadata` has its own `title`) and would *not* match the real shape. So: **flat at the metadata layer, one level of nesting at `Schema` — matching production exactly**, not a new invented structure.

**`Schema` as inline object, not a JSON string, in the exported file**: the DB/API layer stringifies `Schema` because it's stored in an `NVARCHAR(MAX)` column — an artifact of the storage layer, not something a static export file needs to replicate. `FormPlayerPage.tsx:113`'s existing tolerant parse (`typeof schemaStr === 'string' ? JSON.parse(schemaStr) : schemaStr`) already accepts either form, so the `formUri` fetch path can reuse that exact line unchanged — an inline object is recommended for human/git readability of a hand- or tool-exported file, but a JSON-string-encoded `Schema` is also accepted without extra code.

### 5c. Validation recommendation for the metadata portion — soft, not hard-required

Recommendation (not asserted as decided): **the core `FormSchema` fields remain hard-required** (validation fails the load if missing — see §6b's `version`/`controls[]` check, functionally necessary to render at all). **The standard metadata fields (§5a's table) should be optional, defaulted, and warned-on-missing, not hard-required**:

```ts
function normalizeFormUriEnvelope(raw: any): { metadata: Partial<FormDefinitionMeta>; schema: unknown } {
  const missing: string[] = [];
  const req = (key: string, fallback: unknown) => {
    if (raw?.[key] === undefined) { missing.push(key); return fallback; }
    return raw[key];
  };
  const metadata = {
    FormID: raw?.FormID,
    Name: raw?.Name,
    TenantID: req('TenantID', undefined),
    Deleted: req('Deleted', false),
    Archived: req('Archived', false),
    CreatedOn: req('CreatedOn', null),
    LastModifiedOn: req('LastModifiedOn', null),
    ResID: req('ResID', undefined),
    // ...remaining optional fields passed through as-is
  };
  if (missing.length > 0) {
    console.warn('[FormPlayerPage] formUri envelope missing standard metadata fields (defaulted):', missing);
  }
  return { metadata, schema: raw?.Schema };
}
```

**Why soft, not hard**: a well-behaved export tool (the "export via multiquery" flow the coordinator described) should populate all of these from the real DB row, so in the well-behaved case this is a non-issue. But a hand-authored `.json` file (someone writing a form schema by hand and hosting it, without ever having a real DB row) realistically will not have a real `TenantID`/`CreatedOn`/`ResID` — and failing validation entirely for that case would block a legitimate, simple use of the feature (a lightweight, no-backend form) over fields that, per §5a's answer to Q2, **no UI currently consumes anyway**. Defaulting + a console warning surfaces the gap for debugging without being a hard blocker. This is a recommendation for the reviewer to confirm, not a foundational requirement being asserted.

### 5d. Provenance note (ties back to the auth/audit-trail gap)

Because `CreatedOn`/`CreatedBy`/`LastModifiedOn`/`LastModifiedBy` now travel **with the file itself**, a `formUri`-loaded form carries embedded provenance even with zero live DB access — partially answering the "no audit trail for URI-hosted forms" concern. This is **not** tamper-proof the way a real DB row is (nothing stops whoever hosts the static file from hand-editing `CreatedOn` to any value they like — there is no signature or checksum tying the envelope's metadata to a trusted source), so it should be described as "best-effort embedded provenance," not a security control. If real tamper-evidence is wanted later, the `ipfs://` path in §8 offers a stronger property for free (content-addressing — see §8c) that `https://` URIs do not.

---

## 6. Concrete design

### 6a. Prop / route / query-param shape

**`FormPlayerPageProps`** (`FormPlayerPage.tsx:56-60` today) — add `formUri` as a sibling, and make the two mutually exclusive via a discriminated union (stronger typing than the current plain interface's single required `formID`, recommended given this is a genuinely either/or input, not two independent optional fields):

```ts
export type FormPlayerPageProps =
  | { formID: number; formUri?: undefined; onSuccess?: () => void; onCancel?: () => void }
  | { formID?: undefined; formUri: string; onSuccess?: () => void; onCancel?: () => void };
```
(A simpler both-optional-with-a-runtime-check interface is a valid fallback if the union is judged to not fit this file's existing plain-interface style — flagged as an open decision, §11.)

**Routing** — extend `AtlasFormsPlayerApp.tsx`'s existing `view === 'form'` branch (`:146-176`) with a sibling query param, mirroring the exact existing `formID` pattern (`:148`) rather than inventing a new routing mechanism:
```ts
if (view === 'form') {
  const params = new URLSearchParams(window.location.search);
  const formUriParam = params.get('formUri');              // new, sibling to formID (line 148)
  const formID = parseInt(params.get('formID') ?? '', 10);
  if (formUriParam) {
    return ( ... <FormPlayerPage formUri={formUriParam} onSuccess={() => window.close()} /> ... );
  }
  if (formID) {
    return ( ... <FormPlayerPage formID={formID} onSuccess={() => window.close()} /> ... );
  }
}
```
Result: `?view=form&formUri=<url-encoded-uri>` becomes the real, direct-link entry point — exactly parallel to today's `?view=form&formID=123` (`FormsDashboard.tsx:139`). `formUri` must be `encodeURIComponent`-ed by whoever constructs the link, standard `URLSearchParams` behavior, nothing new to build.

### 6b. Fetch + validate + parse flow, and exactly where it plugs in

Plug-in point: `FormPlayerPage.tsx`'s existing load effect, **`:91-130`**. Today it unconditionally calls `formDefinitionClient.getById(formID)`. The new logic branches *before* that call, so the existing `formID` path (`:95-127`) is **untouched**:

```ts
useEffect(() => {
  let cancelled = false;
  setLoading(true);

  if (formUri) {
    if (!FORM_URI_FETCH_ENABLED) {                                          // §2c constant
      setError('External form URIs are disabled in this environment.');    // recommended message, §6c
      setLoading(false);
      return;
    }
    loadFormFromUri(formUri)                                                // new helper, below
      .then((result) => { if (!cancelled) { setSchema(result.schema); setDraft(null); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }

  // ── existing formID path, unchanged (FormPlayerPage.tsx:95-127) ──
  Promise.all([ formDefinitionClient.getById(formID), storage.loadDraft(String(formID)) ]).then(...);
  ...
}, [formID, formUri]);
```

`loadFormFromUri(uri: string)`:
1. **Resolve scheme** (§8a) — `ipfs://` translated to a gateway HTTPS URL first; `http(s)://` used as-is (already fully-qualified, no base-URL resolution needed, per the task's own framing).
2. **Fetch, explicitly no auth** (§7):
   ```ts
   const response = await fetch(resolvedUrl);   // deliberately: no Authorization header, no credentials: 'include'
   ```
3. **Distinct error handling** (§6d) at each failure point: network/CORS, non-2xx status (split by status where useful), non-JSON body, shape-invalid JSON.
4. **Shape validation** (§5c's `normalizeFormUriEnvelope` + a minimal `FormSchema` check):
   ```ts
   function isValidFormSchema(s: any): boolean {
     return !!s && typeof s === 'object' && typeof s.version === 'string' && Array.isArray(s.controls);
   }
   ```
   These two fields (`version`, `controls[]`) are the minimum functionally required for `FormRenderer` to have anything to render — matching `types-js`'s own `FormSchema` interface (`form.types.ts:213-231`), which declares both as required (non-optional), while `metadata`/`sections`/`apiActions`/`styles` are either required-but-tolerable-empty or optional.
5. On success, reuse the exact tolerant-parse already in `FormPlayerPage.tsx:113` for `Schema` (string or object), return `{ schema: parsedSchema, envelopeMeta: normalizedMetadata }`.

### 6c. Behavior when the flag is off (recommendation, not asserted-decided)

If `formUri` is supplied (prop or query param) but `FORM_URI_FETCH_ENABLED` is `false`: **do not attempt any fetch**, and set a clear, visible error state — reusing the component's existing `error`/`<div className="af-form-player-page__error">` rendering path (`FormPlayerPage.tsx:363-374`) with the message **"External form URIs are disabled in this environment."** This is recommended specifically *because* silently falling through (e.g. rendering a blank/loading-forever state, or silently ignoring `formUri` and showing "Form not found") is worse for whoever is debugging a misconfigured deployment — they would have no signal that the flag, not the URI itself, is the problem. Stated as a recommendation per the task's own instruction, open for reviewer sign-off (§11).

### 6d. Error handling — distinct messages per real failure mode

| Failure | Detection | Recommended user-facing message |
|---|---|---|
| Flag disabled | `!FORM_URI_FETCH_ENABLED` before fetch | "External form URIs are disabled in this environment." |
| Network failure / CORS rejection | `fetch()` throws (`TypeError`) | "Could not reach the external form URI. This may be a network problem or the host may not allow cross-origin requests (CORS)." — **note**: browser `fetch()` deliberately does not distinguish a CORS rejection from a DNS/network failure at the JS layer (both surface as the same opaque `TypeError: Failed to fetch`); the message must say "may be," not claim certainty, since the code genuinely cannot tell which one occurred. |
| 404 | `response.status === 404` | "No form was found at the given URI (404)." |
| Other non-2xx | `!response.ok` | "The external form URI returned an error (HTTP {status})." |
| Non-JSON response body | `response.json()` rejects | "The response from that URI is not valid JSON." |
| JSON that doesn't validate as a `FormSchema` | `isValidFormSchema()` returns false | "The fetched file does not look like a valid form definition (missing `version` or `controls`)." |
| IPFS gateway-specific failure | any of the above, after IPFS→HTTPS resolution | same messages as above — the gateway translation (§8a) happens before the fetch, so failures downstream of it are indistinguishable from an ordinary HTTPS failure to the user, which is correct (they shouldn't need to know a gateway hop occurred). |

Each is a distinct `setError(...)` call, not one generic catch-all — matching the task's explicit requirement.

---

## 7. Auth interaction — no Passport token attached by default

Firm requirement, not a decision point: `loadFormFromUri`'s `fetch()` call (§6b step 2) must **not** attach any bearer/Passport JWT, and must not use `credentials: 'include'`. This mirrors the same default-safe posture already established elsewhere for `apiActions[]`'s `auth: "passport"|"none"` contract and the in-flight `fetchAuthToken()`/`onBeforeAuthTokenFetch()` work in `@passport/auth-session` — **explicitly not touched, referenced only**: a grep of `controls-form-actions-react/src/plugins/api-actions/definition.ts` for an `auth` field found none yet (consistent with that contract being described as "in flight elsewhere," not yet landed in this exact file as of this research pass — not a contradiction of the task brief, just confirmation the sibling work hasn't merged into this file yet). The design principle stands independent of that work landing: a `formUri` fetch target is, by definition, an arbitrary third-party host — attaching any internal credential to it by default would be a credential-leak vector, so the fetch in §6b is written with no auth headers at all, full stop, with no flag to turn that on later without a separate, explicit design decision.

---

## 8. `ipfs://` scheme support (additive third mode, same pipeline)

Same fetch → validate → parse pipeline as §6b; only the URL-resolution step before the fetch differs.

### 8a. Scheme detection and gateway resolution

```ts
function resolveFormUri(uri: string): string {
  if (/^ipfs:\/\//i.test(uri)) {
    const cidAndPath = uri.slice('ipfs://'.length);   // "<CID>[/path...]"
    return `${IPFS_GATEWAY_BASE_URL}${cidAndPath}`;    // simple concatenation; handles both bare-CID and CID+path forms
  }
  return uri;   // http(s):// — already fully-qualified, used as-is (no base-URL resolution needed)
}
```

**Recommended default gateway: `https://ipfs.io/ipfs/`** — live-verified this session:
```
$ curl -sI --max-time 10 https://ipfs.io/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn
HTTP/1.1 301 Moved Permanently
Access-Control-Allow-Origin: *
access-control-allow-methods: GET, HEAD, OPTIONS
...
```
permissive CORS confirmed live (redirects to a per-CID subdomain, `<cid>.ipfs.dweb.link`, which itself also returned `Access-Control-Allow-Origin: *` when probed directly).

**Explicit finding that overrides the original ask's own suggestion**: `cloudflare-ipfs.com` — named in the task brief as a relevant example precisely because Cloudflare was already a target host — **does not resolve at all**, live-verified this session:
```
$ curl -s -o /dev/null -w "HTTP_CODE:%{http_code} ERR:%{errormsg}\n" https://cloudflare-ipfs.com/ipfs/...
HTTP_CODE:000 ERR:Could not resolve host: cloudflare-ipfs.com
```
This domain appears to be decommissioned. **Do not use it as the default or documented example gateway** — recommend `ipfs.io` instead, with `dweb.link`-style per-CID subdomain gateways as a documented alternative.

**Recommendation: make the gateway base URL its own, separate env var** — `VITE_ATLAS_IPFS_GATEWAY_URL` (default `https://ipfs.io/ipfs/`), read via the same `getEnvVar` helper in `config.ts`, computed once alongside `FORM_URI_FETCH_ENABLED`. Reasoning: a deployment that wants a private/self-hosted IPFS gateway (common in enterprise IPFS setups) should be able to point at it without a code change, while the **capability on/off gate stays the single `VITE_ATLAS_ENABLE_FORM_URI_FETCH` flag regardless of scheme** — per the explicit instruction not to split the enable flag per-scheme. This is a recommendation, open for sign-off (§11).

### 8b. Same guardrails, scheme-agnostic once bytes are fetched

CORS, schema validation (§5c/§6b), and no-auth-by-default (§7) apply identically once `resolveFormUri()` has produced a real HTTPS URL — the fetch/validate/parse pipeline downstream of resolution has no scheme-specific branching. The IPFS gateway CORS finding above is, like the GitHub raw-content one, sourced from a **live request in this session**, not documentation — but note it was tested against exactly two gateways (`ipfs.io`, `dweb.link`); a different or self-hosted gateway configured via `VITE_ATLAS_IPFS_GATEWAY_URL` would need its own CORS verification by whoever configures it.

### 8c. Immutability — `ipfs://<CID>` is a stronger guarantee than a pinned commit SHA

Worth stating explicitly, not just noting IPFS as "another host to support": a CID is a **multihash of the content's own bytes** — the address *is* a hash of the file itself. A pinned Git commit SHA, by contrast, hashes a commit object graph that merely *points to* a blob; the guarantee that the same bytes are served depends on the git host continuing to serve that same commit faithfully. An `ipfs://<CID>` reference cannot silently resolve to different bytes without the CID itself changing — this is the reason IPFS is an attractive option for this feature specifically, not an incidental extra transport.

### 8d. Immutable-URL guidance (both schemes) — recommendation, not enforced

For `https://` URIs: **strongly recommend pinning to a commit-SHA-based raw URL** (e.g. `raw.githubusercontent.com/<org>/<repo>/<commit-sha>/form.json`, not `.../main/form.json`) or a content-hash path, not a mutable branch reference — documented guidance for whoever authors a `formUri`, since the Player has no practical way to verify a host's mutability policy for an arbitrary third-party URL. For `ipfs://` URIs, this guidance is moot by construction (§8c) — the CID itself already is the content hash, so there is no separate "pin to an immutable ref" step needed the way there is for `https://`.

---

## 9. Open decisions needing sign-off

1. **Discriminated union vs. plain-optional props** (§6a) — the union is stronger typing but a style departure from this file's current plain-interface convention; reviewer's call.
2. **Metadata validation strictness** (§5c) — recommended soft/default-with-warning; could instead be made hard-required for a stricter provenance guarantee. Reviewer's call.
3. **Draft/submission behavior for a `formUri`-loaded form** (§1a) — `storage.loadDraft`/`formDataClient.submit` are both keyed on a numeric `FormID` that a `formUri`-only load may not reliably have (the envelope's `FormID` field is optional/best-effort, §5c). This design does not resolve what "Submit" should do for a `formUri`-loaded form with no real backend `FormID` — needs a follow-up decision (disable submission entirely for `formUri` forms? key drafts by a hash of the URI instead? out of scope for this pass, flagged so it isn't silently assumed).
4. **`VITE_ATLAS_IPFS_GATEWAY_URL` as a separate env var** (§8a) — recommended, not asserted; reviewer's call on whether a second env var is warranted vs. hardcoding `ipfs.io`.
5. **Cloudflare Pages/R2 CORS** (§4) — not live-verified this pass (no concrete URL available to test); should be verified against a real deployed instance before this is documented as "confirmed working" for that specific host, unlike the GitHub raw-content and `ipfs.io` results, which are live-verified.
6. **Backend DTO for `/api/v1/atlas/forms/by-id`** (§1e/§5a) — not independently confirmed this pass (search timed out); the design does not depend on this being resolved (§5a's answer holds regardless, since `FormPlayerPage.tsx` discards non-`Schema` fields either way), but a reviewer with backend access could close this gap directly.

---

## 10. Implementation status (2026-09-01) — built, verified, resolutions of §9

Built per the instruction to use this design's own recommended default for every one of its
6 open items. Resolution of each:

1. **Discriminated union vs. plain-optional props** — doc's recommended shape (the union)
   was used as-is: `FormPlayerPageProps` is now `{ formID; formUri?: undefined } | { formID?:
   undefined; formUri }`.
2. **Metadata validation strictness** — doc's recommendation (soft/defaulted/warned-on-
   missing) was used as-is, in `formUriLoader.ts`'s `normalizeFormUriEnvelope`.
3. **Draft/submission behavior for a `formUri`-loaded form** — the doc left this **genuinely
   unresolved, with no stated recommendation** (§9 item 3 explicitly poses it as an open
   question, not a lean). Per this build's instruction to make the conservative/safe choice
   in that case: a `formUri`-loaded form now skips `storage.loadDraft`/`clearDraft` and the
   default `formDataClient.submit` fallback entirely (both keyed on a `FormID` that may not
   correspond to any real `Atlas_Forms` row) — `submit`-triggered `apiActions[]` still run,
   since those don't depend on `FormID`; if none are configured, submission surfaces a clear
   error rather than silently no-opping or writing against a fabricated `FormID`.
4. **`VITE_ATLAS_IPFS_GATEWAY_URL` as a separate env var** — doc's recommendation was used
   as-is (default `https://ipfs.io/ipfs/`).
5. **Cloudflare Pages/R2 CORS** — left unverified as the doc found it; not used as a
   documented/example host anywhere in the implementation, comments, or the
   `DevelopmentHistoryLog.md` entry. Only `raw.githubusercontent.com` and `ipfs.io` are
   referenced as confirmed-working examples, matching this doc's own §4/§8a findings.
6. **Backend DTO shape** — doc's own §5a already established this doesn't block a
   frontend-only build; no further action taken, matching the doc's own conclusion.

**Verified for real:**
- `npx tsc --noEmit` / `npx tsc` (full build) in `packages/pages-player-react`: 0 errors.
- `npx jest` in the same package: no test files exist for it (confirmed by a fresh grep);
  nothing to regress.
- **Live browser verification** (`examples/web-portal` dev server,
  `?view=form&formUri=...`):
  - Flag off (default): `formUri` rejected with `"External form URIs are disabled in this
    environment."` — not silently ignored.
  - Flag on, **real cross-origin fetch, real render**: a `FormDefinition` envelope (matching
    this doc's §5b shape exactly — flat metadata + nested `Schema`) was fetched from a local
    Node static-file server on a distinct port (`localhost:8934`, real
    `Access-Control-Allow-Origin: *` headers, genuinely cross-origin from the app's own
    `localhost:*` origin) and rendered live: "Full Name*" / "Email Address*" / "Submit Form"
    matched the fixture's `controls[]` exactly.
  - **Why a local static server and not a real external host**: this session's `gh` CLI
    reported successfully creating a public GitHub gist, but the resulting URL 404'd on
    every subsequent real `curl` GET against `gist.github.com` /
    `gist.githubusercontent.com` / `api.github.com` — including several retries over
    minutes and a `gh gist delete` on the same ID also returning "not found" — while a real,
    pre-existing, unrelated public gist (`rxaviers/7360908`) fetched successfully in the same
    session, confirming gist infrastructure itself was reachable. This indicates `gh`'s
    *write* operations were not actually reaching the real GitHub API in this sandboxed
    session, despite the CLI reporting success — so a real gist/repo file could not be
    verified reachable, and a local, real-HTTP, real-CORS server was used instead as the
    honest, verifiable alternative (per this task's own "clearly state if you used a local
    static file, and why" allowance). This doc's own §4/§8a CORS findings for
    `raw.githubusercontent.com`/`ipfs.io` were live-verified via `curl` in an earlier session
    and are independent of this gist issue.
  - Three distinct real failure modes also verified live, each producing its own message
    (not a generic catch-all): a 404 → `"No form was found at the given URI (404)."`; a
    malformed-JSON response → `"The response from that URI is not valid JSON."`; valid JSON
    missing `version`/`controls` → `"The fetched file does not look like a valid form
    definition (missing \`version\` or \`controls\`)."`.

Full detail (file list, exact messages, the unrelated Vite dev-server dep-cache hiccup hit
and worked around during verification) is in `packages/pages-player-react/
DevelopmentHistoryLog.md`'s 2026-09-01 "External `formUri` fetch" entry.
