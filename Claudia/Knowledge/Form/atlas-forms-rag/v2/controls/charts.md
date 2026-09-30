# Chart controls (13 types, display-only)

All 13 are read-only visualizations. None take a rich per-type `config` schema — they read
either a numeric array or an array of `{x,y}`/`{x,y,z}` points, sourced from the control's
bound `value` (via `binding`) or `config.data`/`config.staticData`. There is no axis
label / legend / title config in the base renderer — for a titled chart, wrap it in a
`card-container` with a `header` control above it.

| type | data shape | notes |
|---|---|---|
| `bar-chart` | array of numbers or `{name?, value}` objects | `name` labels each bar (defaults to `Item 1`, `Item 2`, …); `line-chart`/`area-chart`/etc. below do NOT read `name`, only `bar-chart`/`pie-chart` do |
| `line-chart` | numeric array or `{value}` objects | no per-point label |
| `area-chart` | numeric array or `{value}` objects | no per-point label |
| `pie-chart` | array of numbers or `{name?, value}` objects | `name` labels each slice |
| `histogram` | numeric array | |
| `waterfall-chart` | numeric array | |
| `tree-map` | numeric array | |
| `heatmap` | array (passed through to `HeatmapChart`) | |
| `sankey-diagram` | array (passed through to `SankeyChart`) | |
| `network-graph` | array (passed through to `NetworkGraphChart`) | |
| `gantt-chart` | array (passed through to `GanttChart`) | |
| `scatter-plot` | `config.staticData` or `config.data`: `{x:number,y:number}[]` | |
| `bubble-chart` | `config.staticData` or `config.data`: `{x:number,y:number,z?:number}[]` (`z` = bubble size, default 30) | |

## Example

```json
{ "id": "monthly_revenue", "type": "bar-chart", "label": "Monthly Revenue", "order": 3,
  "config": { "data": [12000, 15500, 14200, 18900] } }
```

```json
{ "id": "cost_vs_time", "type": "scatter-plot", "label": "Cost vs. Time", "order": 4,
  "config": { "staticData": [ { "x": 1, "y": 100 }, { "x": 2, "y": 180 } ] } }
```
