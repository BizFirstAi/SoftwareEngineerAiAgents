# Atlas Forms MCP Module — Design (First Pilot)

See `overview.md`/`architecture.md` for the overall strategy. This is the concrete design for the
first module: `BizFirst.Ai.Mcp.Tools.AtlasForms`.

## Current state (read directly from code, not assumed)

- **Module**: `BizFirstPayrollV3\src\mvc-server\AtlasForms\` — `BizFirst.Atlas.Forms.Manager`
  (`.Domain`/`.Infrastructure`/`.Service`/`.Api.Base`/`.Api`/`.IntegrationTests`/`.Tests`, the
  standard split this codebase uses everywhere) plus `BizFirst.Atlas.Forms.Extended`
  (`.Domain`/`.Services` only — **no `.Api`/`.Api.Base` today**, see gap below).
- **Controllers** (`Manager.Api.Base`): `BaseFormController`, `BaseFormGroupController`,
  `BaseFormCategoryController`, `BaseFormDataRecordController`, `BaseFormGroupCategoryController`,
  `BaseFormGroupFormController`, `BaseFormGroupTypeController`, `BaseFormTypeController` — full
  CRUD, all under `api/v1/atlas/forms*`.
- **`IFormService`** (`Manager.Domain.Interfaces.Services`) — confirmed methods: `GetByCategoryAsync`,
  `GetByTypeAsync`, `GetEnabledAsync`, `GetByCodeAsync`, `SearchByNameAsync`,
  `GetByPrimaryUsageAsync`, `GetByNodeUsageAsync`, `SearchListAsync`, `CreateAsync`, `UpdateAsync`,
  `UpdateSchemaAsync` (whole-blob replace), `SetEnabledAsync`, `UpdateResolvedSchemaAsync`
  (persists inheritance-merged schema), plus `IBaseService<Form,int>`'s `GetByIdAsync`/etc.
- **`Form.Schema`** (`Manager.Domain.Entities.Form`) is a single `string? Schema` column — the
  **entire control tree lives in one JSON blob**, matching the FormMaker schema spec (`version`,
  `metadata`, `layout`, `sections[]`, `controls[]`, `apiActions[]`). **Correction (per the
  independent `atlas-forms-rag/v2` reviewer, code-verified)**: this doc originally cited "12 control
  types" including `credential` — both wrong. The real, code-verified count is **115 declared
  control types** (113 with a confirmed render path), and `credential` does not exist as a control
  type in real code — see `atlas-forms-rag\v2\00-overview.md`/`controls\` for the authoritative,
  code-scanned catalogue; this doc's own control-type list above should not be treated as complete.
  **The DB table is `Atlas_Forms`** (`FormID` PK, `Schema NVARCHAR(MAX)`, `FormCategoryID`/
  `FormTypeID` FKs, `FormCode` unique, `TenantID`, standard audit columns).
- **The gap Binoy flagged, confirmed real**: the only schema-mutation endpoint today is
  `PATCH {id}/schema` → `IFormService.UpdateSchemaAsync` — a **whole-blob replace**. There is no
  add/update/remove/reorder-single-control operation anywhere in the current service or API
  surface. An LLM tool built directly on today's API would have to fetch the entire schema, parse
  it, splice in one change, and PUT the whole thing back — expensive (full schema in every LLM
  turn) and risky (the LLM must reproduce every untouched control exactly, or corrupt the form).
- **`BizFirst.Atlas.Forms.Extended`** already exists (used today for `IFullFormService`
  inheritance/checksum resolution, called directly from `BaseFormController`'s `full-form` action —
  an existing bridge). Per the standing rule in `architecture.md`, **new** capability does not
  extend that bridge or touch `BaseFormController`/`IFormService` — it gets its own Extended
  service + its own Extended API surface.

## New: `IFormsExtendedService` (new interface, `BizFirst.Atlas.Forms.Extended.Services`)

Granular, control-level operations. Each does a scoped read-modify-write against `Form.Schema`
server-side and persists via the **existing, unchanged** `IFormService.UpdateSchemaAsync`/
`UpdateResolvedSchemaAsync` internally (Extended service composes the core service — it does not
duplicate its persistence logic, and it never requires `IFormService`/`Form.cs`/`BaseFormController`
to change).

```csharp
namespace BizFirst.Atlas.Forms.Extended.Services;

public interface IFormsExtendedService
{
    /// Reads and returns the current control tree, decoded — the tool an AI agent calls to
    /// re-ground itself before making an edit, instead of trusting its own memory of the schema.
    Task<GetFormSchemaResult> GetFormSchemaAsync(GetFormSchemaRequest request, CancellationToken ct = default);

    /// Inserts one control at a position (section + index, or "end"). Validates the control's
    /// `type` against the 12 supported control types and its `key` for uniqueness within the form
    /// before persisting — the two failure modes a naive whole-blob PATCH would silently allow.
    Task<UpdateWebResponse> AddControlAsync(AddFormControlRequest request, CancellationToken ct = default);

    /// Patches one control's properties (label, validation rules, conditional-logic block, etc.)
    /// by `controlKey`, leaving every other control untouched.
    Task<UpdateWebResponse> UpdateControlAsync(UpdateFormControlRequest request, CancellationToken ct = default);

    /// Removes one control by `controlKey`. Also strips any `conditionalLogic` rule elsewhere in
    /// the schema that referenced the removed control as its `watchField` — the dangling-reference
    /// case a whole-blob replace would leave for the LLM to catch (it usually wouldn't).
    Task<UpdateWebResponse> RemoveControlAsync(RemoveFormControlRequest request, CancellationToken ct = default);

    /// Reorders controls within a section (or across sections) to a caller-supplied ordered list
    /// of `controlKey`s — the same "one intent, one call" shape as add/remove/update.
    Task<UpdateWebResponse> ReorderControlsAsync(ReorderFormControlsRequest request, CancellationToken ct = default);
}
```

Concurrency: no dedicated `RowVersion`/`Version` column exists on `Atlas_Forms` — confirmed by
Binoy. Use the existing `LastModifiedOn` audit column as the optimistic-concurrency token instead
(see Decision #1 below) rather than adding a schema migration for this.

## DTO shapes for `IFormsExtendedService`

Naming/style ground truth: `Manager.Domain.WebRequests.Form.FormActionRequests.cs` (`CreateFormRequest`/
`UpdateFormRequest`/`UpdateFormSchemaRequest`/`SetFormEnabledRequest`) is the convention for the
*core* service's controller-bound requests — plain classes deriving `GoWebRequest`/`UpdateWebRequest`,
`IDInfo FormID` for mutations addressed by ID, `[StringLength]`/`[Required]` on user-supplied strings.
The **Extended** project already has its own precedent one level in from that:
`Extended.Domain\Domain\GetFullFormRequest.cs`/`GetFullFormResult.cs` — request classes still derive
`GoWebRequest` (from `BizFirstFi.Go.Essentials.Domain.Requests`), but **result** classes are plain
POCOs, not `GoWebResponse`-based (`GetFullFormResult` has no `Errors`/`Metadata`/`Success`). The new
types below follow that same split: requests inherit `GoWebRequest`/`UpdateWebRequest`, `Get*Result`
is a plain POCO, and the four mutations return the already-declared `UpdateWebResponse` (errors +
success flag, no `Data` on the plain type).

**`controlKey` naming note, confirmed against real code, not assumed:** the FormMaker/`@atlas-forms/
types-js` `FormControl` interface's identifier field is `id: string`, not `key`. The Extended
project's own existing inheritance-merge code
(`Extended.Services\Services\FormInheritance\Inner\FormSchemaResolver.cs`, `MergeControls` — indexes
derived controls into `Dictionary<string, JsonNode> derivedById` **keyed by `id`**, case-insensitive)
confirms `id` is already this codebase's real identity key for a control within `Form.Schema`. So
everywhere this doc and the new DTOs say `controlKey` (route segments, tool params, request
properties), it means **`schema.controls[].id`** — not a new field. Decision #3 ("control `key`
uniqueness scoped per form") is unaffected; this is only a naming clarification, not a new decision.

**JSON node type, matched to existing code, not a new choice:** `FormSchemaResolver.cs` already
parses/manipulates `Form.Schema` using `System.Text.Json.Nodes` (`JsonObject`/`JsonArray`/`JsonNode`)
rather than a hand-rolled C# mirror of the 88+ TypeScript control types (see "Control JSON shape"
below for why a full C# type per control type is not attempted). The new DTOs reuse the same types
for the same reason: the control tree's actual shape varies per `type` and is defined canonically on
the frontend (`@atlas-forms/types-js`), not duplicated as C# POCOs server-side.

```csharp
using System.Text.Json.Nodes;
using BizFirstFi.Go.Essentials.Domain.Requests;

namespace BizFirst.Atlas.Forms.Extended.Domain;

/// <summary>Request to read the current control tree and concurrency token for one form.</summary>
public class GetFormSchemaRequest : GoWebRequest
{
    public int FormID { get; set; }
}

/// <summary>Decoded schema plus the token every subsequent mutation on this form must echo back.</summary>
public class GetFormSchemaResult
{
    public int FormID { get; set; }

    /// <summary>Schema envelope fields, matching FormSchema (types-js): version/metadata/sections[]/
    /// controls[]/actions[]. Decoded once server-side so callers never parse Form.Schema themselves.</summary>
    public string Version { get; set; } = string.Empty;
    public JsonObject Metadata { get; set; } = new();
    public JsonArray Sections { get; set; } = new();
    public JsonArray Controls { get; set; } = new();
    public JsonArray Actions { get; set; } = new();

    /// <summary>Optimistic-concurrency token (Decision #1) — echo back as `ExpectedLastModifiedOn`
    /// on the next Add/Update/Remove/Reorder call for this form.</summary>
    public DateTime LastModifiedOn { get; set; }
}

/// <summary>Inserts one control into `schema.controls[]` (and `schema.sections[].id` membership).</summary>
public class AddFormControlRequest : UpdateWebRequest
{
    public IDInfo FormID { get; set; } = new IDInfo();

    /// <summary>The full control object to insert, same shape GetFormSchemaAsync returns for an
    /// existing control. Must include "id" (the controlKey) and "type"; see validation rules below.</summary>
    public JsonObject Control { get; set; } = new();

    /// <summary>Section to insert into — must match an existing `sections[].id`, or null for a
    /// form with no sections. AddControlAsync never creates a section implicitly.</summary>
    public string? SectionKey { get; set; }

    /// <summary>0-based insert position within the section's control order; null appends at the end.</summary>
    public int? Position { get; set; }

    public DateTime ExpectedLastModifiedOn { get; set; }
}

/// <summary>Patches one control's properties by controlKey (`schema.controls[].id`), leaving every
/// other control byte-for-byte untouched.</summary>
public class UpdateFormControlRequest : UpdateWebRequest
{
    public IDInfo FormID { get; set; } = new IDInfo();

    public string ControlKey { get; set; } = string.Empty;

    /// <summary>JSON merge-patch (RFC 7396) applied to the existing control object — only the keys
    /// present here are changed; the agent never has to resend the whole control. A key set to
    /// JSON null removes that property from the control (standard merge-patch semantics).</summary>
    public JsonObject Patch { get; set; } = new();

    public DateTime ExpectedLastModifiedOn { get; set; }
}

/// <summary>Removes one control by controlKey and cleans up dangling references (see validation
/// rules below).</summary>
public class RemoveFormControlRequest : UpdateWebRequest
{
    public IDInfo FormID { get; set; } = new IDInfo();

    public string ControlKey { get; set; } = string.Empty;

    public DateTime ExpectedLastModifiedOn { get; set; }
}

/// <summary>Reorders controls within one section (or the whole form when SectionKey is null) to a
/// caller-supplied, complete ordered list of controlKeys.</summary>
public class ReorderFormControlsRequest : UpdateWebRequest
{
    public IDInfo FormID { get; set; } = new IDInfo();

    public string? SectionKey { get; set; }

    /// <summary>Every controlKey currently in scope (that section, or the whole form), in the new
    /// order, exactly once each — see validation rules below for what happens if the set doesn't match.</summary>
    public List<string> OrderedControlKeys { get; set; } = new();

    public DateTime ExpectedLastModifiedOn { get; set; }
}

/// <summary>Populated in the conflict case described below — lets the caller re-ground and retry
/// without a second round trip back through get_form_schema.</summary>
public class FormControlConcurrencyConflict
{
    public DateTime ExpectedLastModifiedOn { get; set; }
    public DateTime ActualLastModifiedOn { get; set; }
    public GetFormSchemaResult CurrentSchema { get; set; } = new();
}
```

**Concurrency-conflict response shape.** The interface above declares `AddControlAsync`/
`UpdateControlAsync`/`RemoveControlAsync`/`ReorderControlsAsync` as returning `UpdateWebResponse` —
that is unchanged. Concretely, each implementation constructs an `UpdateWebResponse<
FormControlConcurrencyConflict>` (already a valid `UpdateWebResponse` per Go.Essentials'
`UpdateWebResponse<T> : UpdateWebResponse`, so this is not a signature change): on a match, `Data` is
left null and `Success` is true; on a `LastModifiedOn` mismatch, the method does **not** write, adds
`response.Errors.AddError("ConcurrencyConflict", "Form was modified since it was last read (expected
{ExpectedLastModifiedOn}, actual {ActualLastModifiedOn}). Re-fetch via get_form_schema and reapply
the change.")` (same `GoWebResponse.Errors.AddError` mechanism `UpdateSchema`/`SetEnabled` already use
for their own failure cases), and sets `Data` to a `FormControlConcurrencyConflict` carrying the
current schema — so the MCP tool handler (and, through it, the agent) can recover in the same turn
instead of a second `get_form_schema` round trip.

## Control JSON shape

**Gap found while grounding this section, flagged explicitly rather than papered over:** the "Current
state" section above (citing the `formmaker_system` memory reference) says 12 control types. The
*actual, live* frontend schema surface — `@atlas-forms/types-js`'s `FormControlType` union
(`packages/types-js/src/control.types.ts`) and the concrete control implementations under
`packages/player-components-react/src/controls/` — defines **88+** control types across seven
categories (Input, Display, Chart, Gauge/Indicator, Layout/Structure, Advanced Input, Media, plus
form-scope plugin controls). This doc's "12 control types" line is not being changed (existing
content, not this pass's job to redo), but `AddControlAsync`'s `type` validation (see next section)
must be built against the **live 88+-value `FormControlType` union**, not the 12-type figure — the
12-type spec appears to describe an earlier/simpler baseline than what `form-studio`/
`player-components-react` actually ship today. Confirm which list is authoritative before
implementation; treat the `FormControlType` union in `control.types.ts` as the source of truth for
now since it is what actually renders.

Every control is one object in `schema.controls[]`. Two worked examples, pulled from the real
`FormControl` interface (`control.types.ts`) and, for `grid`, the real `GridColumn`/`GridButton`
shapes (`player-components-react/src/controls/inputs/GridControl/grid.types.ts`) and the real
dispatch site (`FormField.tsx`, `case 'grid':`, line 3111 — passes the whole `control` object straight
into `<GridControl control={control} .../>`, which reads `control.config` itself):

**A `text` control** — the simple case, every property is a top-level `FormControl` field:

```json
{
  "id": "customerFirstName",
  "type": "text",
  "label": "First Name",
  "placeholder": "Jane",
  "required": true,
  "order": 0,
  "sectionId": "personalInfo",
  "validation": { "maxLength": 100, "message": "First name is required" },
  "width": "half"
}
```

**A `grid` control** — the complex/custom case: `FormControl`'s generic fields (`id`/`type`/`label`/
`order`/`sectionId`) still apply, but the grid-specific shape lives entirely inside `config`, which
`GridControl.tsx` reads itself rather than the generic field renderer:

```json
{
  "id": "lineItemsGrid",
  "type": "grid",
  "label": "Line Items",
  "order": 3,
  "sectionId": "orderDetails",
  "config": {
    "gridType": "table",
    "columns": [
      { "key": "sku", "label": "SKU", "type": "text", "required": true, "width": 120 },
      { "key": "qty", "label": "Qty", "type": "number", "min": 1, "default": 1, "width": 80 },
      { "key": "unitPrice", "label": "Unit Price", "type": "number", "min": 0 },
      {
        "key": "lineTotal", "label": "Line Total", "type": "computed",
        "compute": "row.qty * row.unitPrice"
      }
    ],
    "buttons": [
      { "label": "Add Row", "buttonAction": "add", "icon": "plus" },
      { "label": "Delete", "buttonAction": "deleteSelected", "requiresSelection": true, "icon": "trash" }
    ]
  }
}
```

## Validation rules for `IFormsExtendedService`

Confirmed as gaps in today's surface (see "The gap Binoy flagged" above — a whole-blob `PATCH` allows
all of these silently); the new methods are the first place any of this gets checked.

- **`AddControlAsync` rejects:**
  - **Duplicate `id`.** The new control's `id` already exists in `schema.controls[]` for this form
    (case-insensitive — matches `FormSchemaResolver.MergeControls`'s own `StringComparer
    .OrdinalIgnoreCase` on control `id`, so the new check is consistent with the one piece of
    control-identity logic that already exists in this codebase).
  - **Unknown `type`.** The control's `type` is not a member of the live `FormControlType` union (see
    gap noted above — validate against the full current list, not the 12-type figure).
  - **Missing required control properties.** `id` and `type` are themselves required on every
    control (`FormControl.id`/`FormControl.type` are non-optional in `control.types.ts`); reject a
    control object missing either rather than persisting a malformed entry.
  - **Unknown `SectionKey`.** If `SectionKey` is supplied, it must match an existing `sections[].id`
    — `AddControlAsync` does not create sections implicitly (stated above; restated here as the
    concrete rejection case).
- **`UpdateControlAsync` rejects:** `ControlKey` not found in `schema.controls[]`; a `Patch` that
  attempts to change `id` to a value that collides with another control's `id` (same duplicate check
  as `AddControlAsync`, applied post-patch); a `Patch` that changes `type` to an unknown type (same
  check as above).
- **`RemoveControlAsync`'s dangling-conditional-logic cleanup, mechanically:** after removing the
  control at `ControlKey`, scan every remaining control's `visibilityRule.dependsOn[]` (see
  `FormControl.visibilityRule` in `control.types.ts`) for the removed `id`. Two cases: (a) the rule's
  `type` is `'dependency'` and `dependsOn` becomes empty after removal — downgrade the rule to
  `type: 'always'` rather than leaving a `'dependency'` rule with nothing to depend on; (b) `dependsOn`
  had multiple entries — just drop the removed `id` from the array, leaving the rule intact for the
  remaining dependencies. Also scan `fieldActions[].when.field` (`ActionCondition.field`, same file)
  for the same removed `id` and drop that action's `when` clause (an action with a dangling `when
  .field` would never fire, which is a silent behavior change, not a hard error — so this is cleanup,
  not a rejection).
- **`ReorderControlsAsync` rejects:** `OrderedControlKeys` whose set doesn't exactly match the current
  controls in scope (missing an existing key, containing an unknown key, or a duplicate key) — reject
  the whole call rather than silently dropping/duplicating controls, same never-silently-corrupt
  principle as the single-control edit case in the agent-flow section below.

## New: `BizFirst.Atlas.Forms.Extended.Api.Base` (new project — Extended has no API surface today)

New controller, new routes, **not added to `BaseFormController`**:

```
POST   api/v1/atlas/forms-extended/{id}/schema/get      -> IFormsExtendedService.GetFormSchemaAsync
POST   api/v1/atlas/forms-extended/{id}/controls         -> AddControlAsync
PATCH  api/v1/atlas/forms-extended/{id}/controls/{key}   -> UpdateControlAsync
DELETE api/v1/atlas/forms-extended/{id}/controls/{key}   -> RemoveControlAsync
POST   api/v1/atlas/forms-extended/{id}/controls/reorder -> ReorderControlsAsync
```

`[AuthorizeTenantAdminAttribute]` on every route — same as the base `Form` controller's writes
(`UpdateSchema`/`SetEnabled`) — confirmed by Binoy, no separate narrower policy for v1 (see
Decision #2 below). Registered via a new `AddAtlasFormsExtendedApi()`-style extension, following
`AddAtlasExtendedServices()`'s existing pattern in `Extended.Services\DependencyInjection.cs`.

## MCP tool module: `BizFirst.Ai.Mcp.Tools.AtlasForms`

References `BizFirst.Atlas.Forms.Extended.Services` (new) directly, in-process — **not** the new
`.Extended.Api.Base` project, and **not** `IFormService`/`Manager.Api.Base` except where a tool
legitimately needs an unchanged existing read/write (`create_form`, `find_forms`). Curated to 8
tools, not a 1:1 wrapper over the ~19 existing + 5 new controller actions (per `architecture.md`'s
scaling rule):

| Tool | Backing call | New or existing |
|---|---|---|
| `find_forms(filter)` | `IFormService.SearchListAsync`/`SearchByNameAsync`/`GetByCategoryAsync`/etc. collapsed into one filter param | existing |
| `create_form(name, schema)` | `IFormService.CreateAsync` | existing |
| `get_form_schema(formId)` | `IFormsExtendedService.GetFormSchemaAsync` | **new** |
| `add_form_control(formId, control, position)` | `IFormsExtendedService.AddControlAsync` | **new** |
| `update_form_control(formId, controlKey, patch)` | `IFormsExtendedService.UpdateControlAsync` | **new** |
| `remove_form_control(formId, controlKey)` | `IFormsExtendedService.RemoveControlAsync` | **new** |
| `reorder_form_controls(formId, orderedKeys)` | `IFormsExtendedService.ReorderControlsAsync` | **new** |
| `set_form_enabled(formId, enabled)` | `IFormService.SetEnabledAsync` | existing |

## Agent conversation flow (confirmed with Binoy, this session)

Two distinct phases, deliberately different tool-call shapes:

**Phase 1 — initial creation, one shot, no per-field looping.** User: "Create a customer onboarding
form." Agent asks clarifying questions about desired fields, iterates on the proposed structure
with the user until approved — all in conversation, no tool calls yet. Once approved, the agent
already has the complete field list in its own context, builds the whole schema JSON itself, and
calls **`create_form` once** with the complete schema. **Do not loop `add_form_control` per field
here** — that would be N round-trips for zero benefit and risks a partially-built form if it fails
partway through.

**Phase 2 — the view/feedback/edit loop, where the granular tools earn their place.**
`create_form` returns a `FormID`; the agent gives the user a URL to open and view it. User feedback
("add a phone field," "remove middle name," "move email above phone") is now naturally a single
surgical edit — the agent calls `get_form_schema(formId)` to re-ground itself in the *actual*
current server-side state (defends against drift if the user also edited via the UI directly
between AI turns), then the one targeted tool (`add_form_control`/`update_form_control`/
`remove_form_control`/`reorder_form_controls`) — never a full-schema resubmission.

**Resumability — tie the conversation to the FormID(s), not just one FormID.** A single scalar
"current FormID" breaks the moment a *second* form enters the same conversation ("now also build a
shipping address form" while the onboarding form is still open) — so the state Octopus carries per
conversation is a small **list**, not one value:

- `formsInThisConversation: [{FormID, Name, lastTouchedAt}, ...]` — appended to (never overwritten)
  every time `create_form` succeeds. Same memory mechanism as before (Octopus's existing owner-axis
  scoping, `MemoryID`/`ConversationID` — see `OctopusAiAgentBridgeOriginReader`; same
  `AIConv_Conversations`/`AIConv_Messages` persistence `AiAgentNodeExecutor.ChatMessage.cs` already
  uses for Flow↔Octopus correlation), just a list value instead of a scalar.
- `activeFormId` — a separate pointer to whichever form implicit edit commands target when the user
  doesn't name one. Defaults to the most recently created/edited form.

**Mechanically, this is not the LLM's job to remember to do — it's automatic, the same pattern
already live elsewhere in this codebase.** Confirmed by reading `Memory\Hooks\
MemoryInjectionHook.cs` (`BizFirstAI.V21`, Octopus Core) directly: it queries `AIMemory_
WorkingMemory` scoped by `AgentId`+`ConversationId` and runs on **every** LLM call
(`BeforeGenerating`), injecting whatever is stored there straight into the system prompt — no tool
call needed to read it back. So the write side is the `create_form` tool handler itself (server-
side C#): after `IFormService.CreateAsync` succeeds, it reads the current
`formsInThisConversation` value for this `ConversationId` from the working-memory store, appends
the new entry, writes it back — the same read-then-write-as-a-side-effect shape
`PersistConversationStartAsync` already uses for `ConversationID`/`AgentSessionId`. The LLM only
ever sees the *result* (the list, auto-injected into its next prompt), never has to remember to
persist it.

**Procedural memory — confirmed this system doesn't have that category shipped today.** Read
`MemoryModel.cs`/`MemoryContextPackage.cs`/`MemoryRetrievalQuery.cs` directly: this memory system
has **Working** and **Episodic** memory (both actively retrieved by `MemoryInjectionHook`), plus a
`SemanticMemoryModel` class that exists but is **not** queried by the retrieval hook (only
`WorkingMemories`/`EpisodicMemories`/`CrossSessionMemories` are pulled). A procedural memory design
*does* exist as a planned spec — `Documentation\UserGuides\OverallPlan\proposed-Guides\03_Octopus\
Guide5_ProceduralMemory\guide.md` (`IProceduralMemoryStore`/`ProceduralMemoryService`/`Procedure`
entity with `steps[]`/`triggerPattern`, `FindMatchAsync(task)`, capture-from-successful-completion
+ human review, admin-defined vs. agent-learned, skill library) — but a full-repo, case-insensitive
search for "procedural" across `BizFirstAI.V21`, `BizFirstFiDB`, and `BizFirstPayrollV3`'s
`AIMemory` module found **zero matches**; none of the guide's cited source files exist. This is a
documented-but-unbuilt design, not a gap in an existing store. Do not build the full
capture/review/replay system described there just for Atlas Forms — that is real, separate scope
(procedure capture, human approval workflow, skill library UI). Use the two lighter existing
mechanisms instead — see open question below.

**Which form an edit targets is a reasoning problem, not a mechanical one** — deciding whether
"add a phone field" continues the active form or "now also build a shipping form" starts a new one
is the agent's job, not something the tool schema can enforce. When it's genuinely ambiguous (two+
forms in play, the request doesn't name one), **the agent should ask, not guess** — same
never-silently-corrupt principle as the single-control edit case above. On resuming a past
conversation that touched multiple forms, the agent surfaces what it has (from the stored list)
rather than silently assuming only one exists.

## Decisions (confirmed by Binoy)

1. **Concurrency** — no dedicated `RowVersion`/`Version` column; `Atlas_Forms.LastModifiedOn`
   (standard audit column) is what exists. `IFormsExtendedService`'s read-modify-write methods
   should use it as a lightweight optimistic check: `GetFormSchemaAsync` returns the current
   `LastModifiedOn` alongside the schema, and each mutation (`AddControlAsync`/`UpdateControlAsync`/
   `RemoveControlAsync`/`ReorderControlsAsync`) takes it back and fails the write (rather than
   silently overwriting) if the row's current `LastModifiedOn` no longer matches — cheap, no schema
   migration needed, still catches the human-edits-via-UI-while-agent-is-mid-edit race the plain
   whole-blob `PATCH` has no way to detect today.
2. **Auth for the new Extended routes** — same `[AuthorizeTenantAdminAttribute]` as the base
   `Form` controller's writes (`UpdateSchema`/`SetEnabled`). No separate, narrower policy for v1.
3. **Control `key` uniqueness scope** — unique within one form only (not global). `AddControlAsync`
   validates uniqueness against that form's own control set; `update_form_control`/
   `remove_form_control` address a control by `(formId, controlKey)`, not `controlKey` alone.
4. **The "view it" URL** — points to the real existing app,
   `BizFirstAiStudio\src\atlas-forms\examples\form-studio`. Confirmed real routes in
   `FormListPage.tsx`: `/design/{FormID}` (editor — the one this flow wants, matches "view/adjust
   what was just built") and `/play/{FormID}` (fill-and-submit runtime view) — both keyed on
   `FormID` alone, no tenant/app segment in the route (unlike ChatDesk's `appid/{appID}` scheme;
   `form-studio` resolves tenant from the authenticated session instead). Deployed path is
   `/formstudio/` per `App.tsx`'s prod-basename comment. The URL the agent hands back after
   `create_form` is `{form-studio origin}/design/{FormID}`.

## Non-goals for this pilot

Matching the format `overview.md` and `chat-desk-spec/overview.md` use for their own Non-goals
sections — explicit scope boundaries, not implied ones.

- **Not building a runnable HTTP host for the new routes.** `BizFirst.Atlas.Forms.Extended.Api.Base`
  as scoped above is a controller **class library** (`Sdk="Microsoft.NET.Sdk"`, confirmed by reading
  its `.csproj` and comparing to `Manager.Api.Base`'s identical shape) — it has no `Program.cs`, no
  `Sdk.Web`, nothing that listens on a port. The existing `Manager.Api.Base` only becomes reachable
  because `Manager.Api` (`Sdk="Microsoft.NET.Sdk.Web"`) hosts it: `Manager.Api\Controllers\
  FormController.cs` is a **concrete** subclass of `abstract BaseFormController`, and something has to
  do that instantiation for the new Extended controllers too. This pilot builds `.Extended.Api.Base`
  only (matching `architecture.md`'s in-process MCP module, which doesn't need HTTP at all) and does
  **not** build a `BizFirst.Atlas.Forms.Extended.Api` host, and does not add concrete subclass
  controllers into the Consolidated WebApi (`BizFirst.Ai.Platform.Web.Server.Core`, confirmed it
  already references Atlas Forms). Net effect: in this pilot, the five new routes exist as C# but are
  **not callable over HTTP by anything** — only the MCP tool module (which calls
  `IFormsExtendedService` in-process, never through `.Extended.Api.Base`) can reach the new
  capability. Wiring a real host for human/external-HTTP access to these routes is separate,
  unscoped follow-up work, not silently assumed to come free with the `.Api.Base` project.
- **Not touching `FormGroup`/`FormCategory`/`FormDataRecord`/`FormType`/`FormGroupCategory`/
  `FormGroupForm`/`FormGroupType` controllers or services.** All seven remaining `Manager.Api.Base`
  controllers stay exactly as they are — this pilot is `Form`/`Atlas_Forms` only.
- **Not building any `form-studio` frontend changes.** Checked directly:
  `FormDesignerPage.tsx`'s `handleSave` still does a **whole-schema replace** —
  `client.updateForm(formID, { Schema: JSON.stringify(schema) })` — the exact whole-blob `PATCH`
  pattern this doc's "gap" section calls out as the thing granular tools exist to avoid. Nothing in
  `form-studio` (`FormListPage.tsx`, `FormDesignerPage.tsx`, or the `@atlas-forms/pages-studio-react`
  designer it wraps) currently calls, or is wired to call, any of the five new
  `.Extended.Api.Base` routes. The designer's own in-canvas add/edit/remove/reorder controls are
  local client-side state changes only, saved as one whole-blob PATCH on Save — a completely separate
  code path from the new agent-facing granular API. Consuming the new endpoints from `form-studio`
  itself (e.g. to reflect an agent's live edit without a full page reload) is explicitly out of scope
  for this pilot.
- **Not resolving the procedural-memory open question** (see below) — use of Working/Episodic memory
  as already designed is in scope; deciding what "procedural memory" should mean for this module is
  not.
- **Not adding a `RowVersion`/`Version` column migration to `Atlas_Forms`.** Decision #1 already
  settled this — `LastModifiedOn` is the concurrency token for v1, restated here only as an explicit
  boundary so a future pass doesn't quietly reintroduce a schema migration this pilot deliberately
  avoided.
- **Not curating the MCP tool catalogue beyond the 8 tools already listed above.** No `delete_form`,
  no bulk/batch control operations, no schema-diff/undo tool — if a real need for these shows up
  during Phase 2 testing, that is a follow-up curation decision (`overview.md`'s open question #3),
  not something to add speculatively now.

## Testing

Convention, read directly from `BizFirst.Atlas.Forms.Manager.Tests`/`.IntegrationTests` rather than
invented: xUnit + Moq + FluentAssertions, `MethodName_Scenario_ExpectedResult` test names, Arrange/
Act/Assert comment blocks, one `{X}ServiceTests.cs` per service under `Tests\Services\` plus one
`{X}ControllerTests.cs` per controller under `Tests\Controllers\`, shared `TestBase\
ServiceTestBase.cs`/`ControllerTestBase.cs`, and `Helpers\{MockFactory,TestDataBuilder,
AssertionHelper}.cs` for shared fixtures — mirrored in a separate `.IntegrationTests` project
(`Api\`/`Database\`/`Fixtures\`/`Infrastructure\`) for real-DB-backed tests. The Extended project has
no `.Tests`/`.IntegrationTests` project of its own yet (only `.Domain`/`.Services`) — this pilot needs
to add one, following the same split, not invent a new convention.

- **`IFormsExtendedService` unit tests** (new `BizFirst.Atlas.Forms.Extended.Tests`, mocking
  `IFormService` the way `FormServiceTests.cs` mocks `IFormRepository`):
  - `GetFormSchemaAsync` — valid form returns decoded schema + current `LastModifiedOn`; unknown
    `FormID` returns a not-found error; a form whose `Schema` is null/empty returns an empty control
    tree rather than throwing (a genuinely blank new form is a real state, not an error case).
  - `AddControlAsync` — happy path inserts at the requested position; duplicate `id` rejected; unknown
    `type` rejected; unknown `SectionKey` rejected; missing `id`/`type` on the control object
    rejected; stale `ExpectedLastModifiedOn` rejected with a `FormControlConcurrencyConflict` payload
    and **no write** (assert the mock's `UpdateSchemaAsync` was never called on that path — the
    concurrency check must short-circuit before persistence, not race it).
  - `UpdateControlAsync` — merge-patch applies only the given keys and leaves every other control's
    JSON byte-for-byte identical; patch that renames `id` into a collision is rejected; unknown
    `ControlKey` rejected.
  - `RemoveControlAsync` — removes the control; a `visibilityRule.dependsOn` referencing the removed
    control is downgraded to `type: 'always'` when it was the only dependency, or has just that one
    `id` stripped when there were others; a `fieldActions[].when.field` referencing the removed
    control has its `when` clause dropped; removing a `ControlKey` with no dependents anywhere is a
    plain removal (regression guard — cleanup logic must not touch unrelated controls).
  - `ReorderControlsAsync` — full valid reorder succeeds; a list missing an existing key is rejected;
    a list with an unknown/duplicate key is rejected; reordering within one `SectionKey` never
    reorders controls in other sections.
  - Every method: `ExpectedLastModifiedOn` mismatch is the one shared negative case worth a
    parameterized/theory test across all four mutations, since it's the same check duplicated four
    times per Decision #1.
- **`.Extended.Api.Base` controller tests**, following `FormControllerTests.cs`'s pattern: routing,
  `[AuthorizeTenantAdminAttribute]` presence (Decision #2) on all five actions, request binding
  (`{id}`/`{key}` route values landing in `FormID`/`ControlKey`), and that the controller is a thin
  pass-through to `IFormsExtendedService` (no business logic duplicated at the controller layer — the
  same shape `BaseFormController`'s existing actions already keep).
- **`.IntegrationTests` additions** (real Atlas DB, following `.Manager.IntegrationTests`'s
  `Fixtures`/`Database` setup): a full add→update→remove→reorder sequence against one real form,
  asserting `Atlas_Forms.Schema` and `LastModifiedOn` after each step — this is the one place an
  actual SQL round trip is worth the cost, since the whole point of these methods is a correct
  scoped read-modify-write against a real row, not a mocked one.
- **Explicitly not testing in this pass:** the MCP tool module itself (`BizFirst.Ai.Mcp.Tools
  .AtlasForms` — its own project once built, once `overview.md`'s open questions on gateway placement/
  hosting are resolved) and the agent conversation-flow/memory behavior described above (that's
  `BizFirstAI.V21` Octopus Core / `MemoryInjectionHook` territory, already covered by that system's
  own tests, not this module's).

## Open questions for Binoy — still unresolved

1. **What "procedural memory" should mean for this module** — (a) static, agent-wide form-building
   conventions ("prefer grid for repeating data") → belongs in the Atlas Forms agent's own
   `SkillPrompt`/`GuidelinePrompt`, no memory-system work needed; (b) per-tenant/per-user learned
   preferences that should generalize across conversations → maps onto the existing-but-unwired
   `SemanticMemoryModel`, needs `MemoryInjectionHook` extended to query it; or (c) the full
   capture/review/replay system `Guide5_ProceduralMemory\guide.md` describes → real, separate scope,
   not something to build as part of this pilot. Confirm which before doing any memory-system work
   here — (a) and (b) are cheap, (c) is a project of its own.
