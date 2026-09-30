# Odoo Node — Test Plan

Read `..\globals.md`, `..\02-guidelines.md`, and `resource.md` first. Structured per Binoy's explicit
two-phase instruction, same as `..\elasticsearch\test-plan.md`: **Phase 1 (isolated, one feature at a
time) must be fully run before Phase 2 (the combined chained workflow) is attempted.** Unlike the
Elasticsearch pilot, **no Phase 1/Phase 2 workflow has been built yet for this node** — this plan
currently documents Phase 0 (partially done) and lays out what Phase 1/2 will need; it is not yet a
record of executed cases the way Elasticsearch's is.

Cross-cutting categories from `..\globals.md` will be folded into each phase rather than repeated per
operation: static config coverage (category 1) up front; invalid config (category 3) and credential
failure (category 4) each with one representative case per distinct code path (CRUD shape vs. Lead
action vs. Trigger — the failure handling is not fully shared across all 35 operations the way
Elasticsearch's 10 were, since Lead/Activity/Trigger have their own `Info` classes not yet confirmed
to share a common `Validate()` base beyond the connection block).

## Phase 0 — Static config coverage (no live system, no credentials needed)

### P0-01 — Registry, executor, and DB catalog agree

**Steps:** Confirm `Process_ProcessElementTypes.Code = 'odoo'` exists and is `Enabled=1`; confirm the
C# `NodeTypeName`/`ProcessElementTypeCode` constant equals `"odoo"`; confirm all 35 Atlas Forms and
35 DataTemplates listed in `resources\db-catalog.md` exist; confirm each of the 35 form/template
pairs actually routes to a real, reachable case in one of the 5 feature partials (not just that the
partial file exists).
**Status:** **Partial Pass.** Registry row confirmed live via direct `sqlcmd` query 2026-09-06
(`ProcessElementTypeID=337`, `Code='odoo'`, `Enabled=1`). Forms/templates confirmed present on disk,
35/35 by directory listing. **Not yet done:** the operation-by-operation routing confirmation (does
each of the 35 actually reach a real `switch` case, not just "the partial file that should handle it
exists") — this node has no `NodeReport.md` to lean on the way Elasticsearch did, so this table needs
to be built from scratch by reading each feature partial's routing logic directly.

### P0-02 — Atlas Form fields agree with C# `LoadFrom`/`Validate`

**Steps:** For each of the 35 operation forms, cross-check every field ID against the matching
`*Info.cs` class's `LoadFrom(ConfigDataPropertyBag reader)` keys and `Validate()` requirements.
**Expected:** no drift — every form field has a matching reader call, every `Validate()` requirement
has a matching required form field.
**Status:** **Partial Pass.** Done and confirmed for the connection block (all 35) and the generic
CRUD shape (`OdooCreateInfo`/`OdooGetInfo`/`OdooGetAllInfo`/`OdooUpdateInfo`/`OdooDeleteInfo`,
covering `contact`, `lead`'s base 5 ops, and `custom` — 15 of 35 operations) — see
`resources\config-schema.md`. **Not yet done:** `Infos\OdooLeadInfos.cs`'s 5 action-specific classes
(convert/markWon/markLost/logNote/scheduleActivity), `Infos\OdooActivityInfos.cs`,
`Infos\OdooLookupInfo.cs` (8 lookup resources), `Infos\OdooTriggerInfo.cs`'s `Validate()` if it has
one beyond the inline check already read in the feature partial. That's 20 of 35 operations still
needing a direct file read before this case can be a full Pass.

### P0-03 — No dedicated test project exists to (not) claim stale coverage

**Steps:** Search the repo for any `*Odoo*Tests*` project.
**Expected:** either a real, current, passing test project (like Elasticsearch's *should* be), or a
stale one to flag (like Elasticsearch's *actually is*), or confirmation that none exists at all.
**Status:** **Pass (as a finding, not a defect)** — confirmed 2026-09-06, zero matches anywhere in
`BizFirstPayrollV3`. This is a different, arguably worse gap than Elasticsearch's stale project (at
least a stale project once had real coverage); there is no `dotnet test` dry run available for this
node at all. Worth flagging to whoever owns this node, same spirit as Elasticsearch's finding — not
fixed here (out of scope, no product code touched by this testing task).

---

## Phase 1 — Isolated, one feature at a time (not yet built)

**Not started.** Once P0-01/P0-02 are complete enough to write real configs with confidence, build
35 small workflows (`manual-trigger` → one `odoo` node per operation), preferably **Chrome-driven
through Flow Studio's real UI** — the reason Elasticsearch used the DB fallback (a logged-out browser
session) does not currently apply here, and per `..\globals.md` the UI path is always preferred when
available. Point every workflow's connection block at the real local Odoo target documented in
`resources\credentials.md` (`siteUrl=http://localhost:8069`, `database=leadfirst`,
`authMode=usernamePassword`) — unlike Elasticsearch, there is no fake-credential placeholder step
needed here; real happy-path execution is available from the very first workflow built.

Planned case numbering (matches `resource.md` §3's table): P1-01..05 (contact), P1-06..15 (lead),
P1-16..21 (activity), P1-22..29 (8 lookups), P1-30..34 (custom), P1-35 (trigger poll).

Every write/query case (contact/lead/activity/custom create, update, get, getAll; trigger poll) will
need the same independent backend-data-comparison discipline as Elasticsearch's category 7 — for
Odoo, that means a direct JSON-RPC call (the same `common.login`/`execute_kw` shape already manually
proven this session) confirming the real record, independent of the workflow's own reported output.

### P1-CROSS-01 — Invalid config is rejected cleanly (planned, not yet built)

Pick one representative operation per distinct `Info` class family (generic CRUD, a Lead action, the
Trigger) once each class's real `Validate()` requirements are confirmed (P0-02) — do not guess error
codes ahead of reading the actual code, unlike Elasticsearch where the codes were already confirmed
before this section was written.

### P1-CROSS-02 — Credential failure handling (planned, not yet built)

Build one throwaway variant of any `get`/`getAll` config with `credentialID` blank and `authMode`
left at default (`apiKey`, no inline fallback value) — expect a clean, specific error from
`ResolveVaultCredentialsAsync` (or wherever the resulting blank-secret condition is actually checked
— **not yet confirmed** where the "no credential resolved at all" case surfaces its own error;
`OdooNodeExecutor.Credentials.cs` resolves secrets but the calling feature partial's own null-check
behavior after that hasn't been read).

---

## Phase 2 — Combined chained workflow (not yet built; build only after every Phase 1 case has a verdict)

Not designed in detail yet. A realistic chain given this node's 13 resources: create a contact →
create a lead linked to it → log a note → schedule an activity on it → mark the activity done →
convert the lead → mark it won → getAll leads filtered to the new one → clean up (delete the
created records). This mirrors the "realistic lifecycle in one execution" shape of Elasticsearch's
Phase 2, adapted to Odoo CRM's actual object graph rather than an index/document pair.

---

## Certification / sign-off

**Not ready.** Per `..\02-guidelines.md` Step 8, a node's testround is only ready for sign-off when
every Phase 1 case (individually) and the Phase 2 combined case have a real Pass, backed by real
evidence. Current state: Phase 0 partially Pass (connection block + generic CRUD shape confirmed;
Lead/Activity/Lookup/Trigger-specific field-level confirmation still open), Phase 1/2 not yet built.
Unlike Elasticsearch, the remaining blockers here are **investigation and build work, not external
prerequisites** — the credential/test-target blocker that stops Elasticsearch cold does not apply to
this node.
