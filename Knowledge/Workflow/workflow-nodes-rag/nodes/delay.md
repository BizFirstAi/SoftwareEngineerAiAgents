# `delay`

Pauses workflow execution for a specified duration or until a specific datetime before
continuing. Use it for rate limiting, waiting between retries, or scheduling a resumption
point. Two execution strategies chosen automatically by duration: **in-process** (duration
below `inProcessThresholdMs`, default 30 000 ms) suspends the current thread via `Task.Delay`;
**durable** (duration at/above the threshold) persists a `PendingDelay` DB row and suspends the
whole workflow — a background scheduler resumes it when the deadline passes, so the process can
survive an app restart mid-delay. Output ports (`DelayOutputPortMapping`): **`main`** (delay
elapsed normally, or the target time was already in the past so the delay was skipped),
**`cancelled`** (an in-process delay's `Task.Delay` was cancelled), **`waiting`** (a durable
delay was persisted and the workflow suspended), **`error`** (bad/missing duration
configuration). Requires no credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `delayType` | string enum: `"duration"`, `"until"` | No | `"duration"` | Selects which group of fields below is used. |
| `durationMs` | integer | One of durationMs/durationSeconds/durationMinutes/durationExpression required in `"duration"` mode | none | Delay length in milliseconds. Checked first. |
| `durationSeconds` | integer | see above | none | Checked if `durationMs` absent; converted to ms (`× 1000`). |
| `durationMinutes` | integer | see above | none | Checked if the above two are absent; converted to ms (`× 60000`). |
| `durationExpression` | string | see above | none | Fallback: a raw string parsed with `long.TryParse` as a millisecond count. Not a full expression language — must already resolve to a plain integer string. Superseded at runtime by `sourceDataRootPath` if configured (see below). |
| `untilUtc` | string (ISO-8601) | Required in `"until"` mode if `untilExpression` absent | none | Absolute UTC datetime string, parsed with `DateTimeStyles.RoundtripKind`. |
| `untilExpression` | string | Required in `"until"` mode if `untilUtc` absent | none | Same parsing as `untilUtc`; used as a fallback. |
| `inProcessThresholdMs` | integer | No | `30000` | Delays with resolved duration below this run synchronously in-process; at/above, the node persists a durable `PendingDelay` and suspends. |
| `sourceDirectivePath` / `sourceDataRootPath` / `sourceDataLeafPath` | SmartPath triple | No | unset (falls back to static config) | If configured, resolves a runtime value that **overrides** `durationExpression` (duration mode) or `untilUtc`/`untilExpression` (until mode) at execution time. |
| `targetDirectivePath` / `targetDataRootPath` | SmartPath pair | No | unset (no write-back) | If configured, writes delay telemetry (`delayRequestedMs`, `delayActualMs`, `delayResumedAt`, `delayMode`, and for durable delays `delayID`/`delayResumeAfter`) to the given memory location in addition to `OutputData`. |

Validation (`DelayNodeSettings.Validate`): `delayType` must be exactly `"duration"` or
`"until"`; `"duration"` mode requires one of `durationMs`/`durationSeconds`/`durationMinutes`/
`durationExpression`; `"until"` mode requires `untilUtc` or `untilExpression`.

## Example

```json
{
  "delayType": "duration",
  "durationSeconds": 90,
  "inProcessThresholdMs": 30000
}
```

Wait until a specific timestamp instead:

```json
{
  "delayType": "until",
  "untilUtc": "2026-08-25T09:00:00Z"
}
```

## Gotchas

- **DB schema gap — significant.** `ConfigurationSchema` in `Process_ProcessElementTypes_Delay.data.sql` declares `DelayMs`, `DelaySeconds`, `DelayMinutes` (PascalCase, no `delayType`/`until*`/`inProcessThresholdMs`). The real config keys are all camelCase (`durationMs`, `durationSeconds`, `durationMinutes`, `durationExpression`, `delayType`, `untilUtc`, `untilExpression`, `inProcessThresholdMs`) — none of the DB-documented `Delay*` keys exist in the actual settings class. Using the DB-schema field names silently no-ops (the node falls through to "No duration specified" error).
- **DB schema gap — output ports.** `OutputPortsSchema` for `delay` only lists `main` and `error`. The executor actually has four ports: `main`, `cancelled`, `waiting`, `error`. A durable (long) delay always exits via `waiting`, not `main` — a config-authoring agent that only wires `main`→`error` will silently drop the durable-delay path.
- A delay is **not guaranteed to run in-process** just because you didn't set `inProcessThresholdMs` — the 30-second default threshold means any delay of 30s or longer persists a DB row and suspends the whole workflow (durable path), which has different operational implications (survives restarts, but adds DB write latency and a background-scheduler dependency) than an in-process `Task.Delay`.
- If the resolved target time is already in the past (e.g. an `untilUtc` value in the past), the node does **not** error — it exits via `main` immediately with `delayMode: "skipped"` and `delayActualMs: 0`.
- `durationExpression`/`untilExpression` are simple string fallbacks (parsed with `long.TryParse` / `DateTime.TryParse`), not full expression-language directives — don't expect `{% %}` script syntax here.
