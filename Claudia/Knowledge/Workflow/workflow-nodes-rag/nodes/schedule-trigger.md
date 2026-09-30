# `schedule-trigger` (a.k.a. "Scheduled Trigger")

Entry-point node intended to activate a workflow on a recurring cron schedule. Important
architectural note: this executor is **validation-and-echo only** — it contains no timer or
polling loop itself. Actual recurring firing is expected to be driven by an external scheduler
(Hangfire, Quartz, etc.) through the optional `IWorkflowSchedulerService` abstraction, and **no
concrete implementation of that interface ships by default**. Until one is registered in DI,
dropping this node into a workflow does not by itself create a recurring job — the node only
validates its `schedule` config and, when the containing thread is executed by some other means,
echoes trigger metadata downstream. `CleanupAsync` silently no-ops (skips scheduler
de-registration) whenever `IWorkflowSchedulerService` isn't registered.

Output ports: `main` (schedule config present and syntactically valid), `error` (schedule config
missing or invalid — including cron parse failures). Requires no credentials.

**Node type code — read this before authoring `type`/`code` in a workflow definition:** the DB row
(`Process_ProcessElementTypes.Code`) and the executor's actual
`ProcessElementTypeCode` override are both the string **`schedule-trigger`** (no "d"). The
executor also declares a `public const string NodeTypeName = "scheduled-trigger";` (with "d") that
is *not* what `ProcessElementTypeCode` returns — that constant is misleading/unused for routing
purposes. Use `schedule-trigger`.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `schedule` | string | **Yes** | none | Cron expression: 5 fields (`minute hour day-of-month month day-of-week`) or 6 fields (`second minute hour day-of-month month day-of-week`), space-separated. Also readable from a UI-authored nested shape: `settings.Schedule` (PascalCase) or `settings.schedule`, used as a fallback only when the flat `schedule` key is absent. |
| `sourceDirectivePath` / `sourceDataRootPath` / `sourceDataLeafPath` | string | No | — | Optional SmartPath override to source an iteration collection instead of the flat schedule-fire event. |
| `targetDirectivePath` / `targetDataRootPath` / `targetDataLeafPath` | string | No | — | Optional write-back of the combined trigger + input data to a memory variable. |

Field-level validation of `schedule` (in `ValidateScheduleConfiguration`, run at execution time):
each whitespace-separated field must match `^(\*|[0-9A-Z]+)([/\-][0-9A-Z]+)?(,[0-9A-Z]+([/\-][0-9A-Z]+)?)*$|\?`
(case-insensitive) — i.e. `*`, `?`, digits, letters (for month/day-of-week names like `MON`,
`JAN`), ranges (`n-m`), steps (`*/n` or `n/s`), and comma lists are all accepted. There is **no**
semantic range checking (see Gotchas).

## Example

```json
{ "schedule": "0 9 * * MON-FRI" }
```

## Gotchas

- DB schema gap: `ConfigurationSchema` in the seed
  (`Process_ProcessElementTypes_ScheduledTrigger.data.sql`) is an empty stub
  `{"type":"object","properties":{}}`, even though `schedule` is a hard requirement enforced in
  three separate places: `ScheduledTriggerNodeSettings.Validate()`, `ValidateAsync` (design-time),
  and `ValidateScheduleConfiguration` (execution-time). An agent authoring config from the DB
  schema alone would not know `schedule` is required.
- The regex is permissive, not semantic: values like hour `99` or day `40` pass field validation
  (they match `[0-9A-Z]+`) and are only caught later by whatever actually parses the cron
  expression at fire time (outside this executor). Don't rely on this node to catch an
  out-of-range cron field.
- `ValidateAsync` (invoked at design/save time in Flow Studio) only checks that the element's
  `Configuration` string is non-empty — it does **not** re-run `ValidateScheduleConfiguration`'s
  field-count/character checks. A workflow can be saved successfully with a malformed cron
  expression and only fail once the node actually executes.
- This node will not "just start firing" on its own. There is no default `IWorkflowSchedulerService`
  registration in this codebase; an agent generating a workflow that assumes cron firing is live
  out of the box will be wrong unless a scheduler adapter has separately been wired into DI.
