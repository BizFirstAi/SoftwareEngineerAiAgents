# Developer/debug viewers (display-only, minimal config)

Not intended for end-user-facing business forms — these are debugging/admin-tool widgets
that happened to be registered as control types.

| type | renders | config |
|---|---|---|
| `api-response-viewer` | pretty-printed JSON of the bound `value` in a `<pre>` block | none |
| `variable-inspector` | same `<pre>` JSON dump | none |
| `conditional-logic-viewer` | same `<pre>` JSON dump | none |
| `database-query-builder` | same `<pre>` JSON dump (no actual query-building UI in the base renderer) | none |
| `analytics-dashboard` | 4 KPI cards + trend/pie/bar mini-charts | `config.data: number[]`, **positional not keyed** — index 0→"Total Users" KPI, 1→"Revenue" KPI (×100, `$`-formatted), 2→"Bounce Rate" KPI (`%`), 3→"Avg. Session" KPI (seconds); index 4+ (or the whole array again if length ≥ 5) feeds the mini-charts. Falls back to a hardcoded demo array (`[1240, 84, 45, 90, 40, 70, 45, 90, 60, 80, 55]`) if `config.data` is absent. Fragile positional contract — treat as a rough preview, not a precise reporting widget. |

Only use these when the user explicitly wants a debug/dev-facing panel. For a real
end-user analytics view, compose `kpi-card` + `charts.md` types individually instead of
`analytics-dashboard`, which cannot be pointed at real data today.

## Example

```json
{ "id": "raw_response", "type": "api-response-viewer", "label": "Last API Response",
  "order": 20 }
```
