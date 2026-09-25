# `if-condition`

Decision node that evaluates a single boolean expression and routes execution to one of two
static output ports. Use it for a simple two-way branch; for a multi-way branch based on matching
a value against several cases, use `switch` instead. Output ports: `true` (isMainPort) and
`false` (isDefault, used when nothing else applies) — both are fixed/static, unlike `switch`'s
dynamic per-case ports. Does not require credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `condition` | string | yes | — | Boolean expression evaluated at runtime. Node errors (`"Condition expression is required"` at validation time, or the runtime equivalent) if blank. Supports `$variable` references, e.g. `"$status == 'active' && $age > 18"`. |
| `language` | string (enum: `javascript`, `cs`, `vb`, `python`) | no | `javascript` | Read by the shared `ScriptLanguageInfo`/`ScriptNodeExecutorBase` machinery (same mechanism used by `switch` and the Function/CodeExecute script nodes). |
| `isExpression` | boolean | no | `false` | `false` (the default) means `condition` is a bare script body that gets auto-wrapped as `{%language:condition%}` before evaluation. `true` means `condition` is already a full `{%language:...%}` directive string and is passed through unchanged. Node config forms normally save bare scripts, so leave this `false` unless you are hand-authoring a directive string. |

## Example

```json
{
  "condition": "$order.status == 'approved' && $order.total > 100",
  "language": "javascript",
  "isExpression": false
}
```

## Gotchas

- **DB schema gap — empty stub:** the DB seed `ConfigurationSchema` for `if-condition` is
  literally `{"type":"object","properties":{}}` — it declares no fields at all, despite the node
  requiring a real `condition` expression to function. An agent relying on the DB schema would not
  know `condition` (or `language`/`isExpression`) exists. This is the real config: `condition`
  (required) plus the shared `language`/`isExpression` pair inherited from
  `ScriptNodeExecutorBase`.
- The output ports are **fixed**: `true` and `false` (see
  `IfConditionOutputPortMapping.TruePortName`/`FalsePortName`). `false` is configured as the
  default port. There is no way to add additional named ports to this node type — for anything
  beyond a two-way branch, use `switch`.
- If `condition` evaluates to a script exception, the node currently propagates that failure via
  the standard error path — it does not fall back to `false`.
- `sourceDataPath`/`targetDataPath`-style SmartPath keys (`source*`/`target*` prefixed, inherited
  from `BaseNodeExecutorSettings`) are also accepted for advanced input/output data routing, but
  are optional and not specific to this node — leave them unset for a normal boolean-branch use
  case.
