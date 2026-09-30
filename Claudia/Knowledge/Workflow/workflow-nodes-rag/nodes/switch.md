# `switch`

Decision node that evaluates a single expression and routes execution to whichever output port's
configured **usage value** matches the expression's string result, falling back to a default port
when nothing matches. Use it for a multi-way branch keyed off a value (e.g. payment method, order
status); for a plain two-way boolean branch use `if-condition` instead. Output ports are
**dynamic** — there is no fixed set of "case" ports; every port the flow designer wires up is
matched against the evaluated value at runtime (see Gotchas for exactly how). Does not require
credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `expression` | string | yes | — | Script/expression whose **string result** is matched against each output port's `usage` value. Node errors (`"Switch expression not configured"` / `"Switch expression is required"`) if blank. Example: `"paymentMethod"` or `"order.status"`. |
| `language` | string (enum: `javascript`, `cs`, `vb`, `python`) | no | `javascript` | Same shared mechanism as `if-condition`. |
| `isExpression` | boolean | no | `false` | Same semantics as `if-condition`: `false` = bare script body, auto-wrapped; `true` = already a full `{%language:...%}` directive. |
| `OutputPortMapping` | array of `{usage, port, label, isDefault}` | no (but effectively required to get more than the default port) | — | **This is the real "cases" mechanism** — see Gotchas. Each entry: `usage` = the value to match against the evaluated `expression` result; `port` = the output port key to route to (defaults to `usage` if omitted); `label` = display label (defaults to `port`); `isDefault` = `true` marks the fallback port used when no `usage` matches. If no entry has `isDefault: true`, the node auto-creates one named `"default"`. |
| `default` | string | no | `"default"` | Design-time-only key name (`SwitchConfigInfo.InputKeys.Default`) for the fallback port name; the executor resolves the default port via `OutputPortMapping`'s `isDefault` flag, not by reading this key directly at runtime. |

## Example

```json
{
  "expression": "$order.paymentMethod",
  "language": "javascript",
  "isExpression": false,
  "OutputPortMapping": [
    { "usage": "creditCard", "port": "creditCard", "label": "Credit Card" },
    { "usage": "paypal",     "port": "paypal",     "label": "PayPal" },
    { "usage": "default",    "port": "default",    "label": "Other", "isDefault": true }
  ]
}
```

## Gotchas

- **DB schema gap — empty stub:** the DB seed `ConfigurationSchema` for `switch` is literally
  `{"type":"object","properties":{}}`, declaring no fields despite the node requiring a real
  `expression` plus a case-routing configuration to function.
- **DB schema gap — output ports:** the DB seed's `OutputPortsSchema` only declares a single
  `main` output port. In reality `switch` routes to whatever ports are defined in the node's
  `OutputPortMapping` config array at design time (arbitrary case ports plus one default/error
  port) — the seeded port list under-represents the node's real shape.
- **"Cases" is not a config key** — despite the executor's own class-level doc comment on
  `SwitchNodeExecutor.cs` describing a `"cases"` dictionary config key and a `SwitchCase.cs` data
  model, **neither exists in the codebase** (confirmed: no `SwitchCase*.cs` file anywhere in the
  Core execution-nodes project, and `SwitchNodeSettings` has no `Cases` property). The actual
  mechanism is: `OutputPortMapping` is loaded from the config key literally named
  `"OutputPortMapping"` (see `BaseNodeExecutorSettings.OutputMapping` reading
  `ReadConfigNodeByKey("OutputPortMapping")`), and case matching happens by comparing the
  evaluated `expression` string result against each port entry's `usage` field
  (`OutputPortMapping.FindByUsageOrDefault`). Do not author a `cases` key — it is not read by
  the executor at all.
- If expression evaluation throws, the node logs a warning and treats the switch value as an
  empty string (falls through to whichever port's `usage` is `""`, or the default port) — it does
  **not** route to an error port for evaluation failures the way `if-condition` can.
- If no port has `isDefault: true` and no case matches, the node returns an execution error
  (`"Not match found. No default port configured. Exception Code 1516265"`) rather than silently
  no-oping.
- `TargetDataPathDefault` writes the switch result to a memory variable named `switchResult` when
  no explicit `targetDataPath` is configured.
