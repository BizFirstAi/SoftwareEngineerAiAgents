# `select`

Single-value dropdown. For multiple selection use `multiselect`; for a searchable dropdown
use `multi-select-search`; for hierarchical data use `tree-select` or `cascading-select`.

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `options` | `config.options` | `{ value: string, label: string }[]` | Static list, required for a usable control. Rendered in array order — put a real placeholder option in `placeholder`/`label`, not as a fake first option, since the renderer already injects a disabled `"Select..."` option. |

Options are always a **static array** — there is no API-backed options shorthand (see
`advanced-capabilities.md` §7).

## Example

```json
{ "id": "country", "type": "select", "label": "Country", "order": 4, "required": true,
  "validation": { "required": true },
  "config": { "options": [
    { "value": "US", "label": "United States" },
    { "value": "CA", "label": "Canada" },
    { "value": "GB", "label": "United Kingdom" }
  ] } }
```
