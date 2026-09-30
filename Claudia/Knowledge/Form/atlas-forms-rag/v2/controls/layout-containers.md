# Layout containers

Structural controls that group other controls. Each renders via its own dedicated
component (not a shared placeholder) — real, distinct interactive behavior.

| type | use when | key config |
|---|---|---|
| `card-container` | wrap related controls in a bordered card with an optional header | `config.controls: FormControl[]` — nested child controls rendered inside the card |
| `collapsible-panel` | one expandable/collapsible section | — |
| `accordion` | multiple expand/collapse panels, typically one-open-at-a-time | — |
| `enhanced-tabs` / `tab` | tabbed grouping (aliases, identical render) | — |
| `modal` | content that opens in a dialog overlay | — |
| `stepper` | multi-step/wizard flow | — |

Only `card-container`'s nested-controls shape is confirmed in the base renderer
(`config.controls` — an array of full `FormControl` objects, each rendered recursively via
`FormField`). For `collapsible-panel`/`accordion`/`enhanced-tabs`/`modal`/`stepper`, use
`sectionId` grouping (put the controls that belong inside the container into the same
`FormSection` and let the container control represent that section) rather than guessing an
undocumented nested-children config key — verify the exact nesting config against the
specific dedicated component (`AccordionControl`, `TabsControl`, etc.) before relying on
anything beyond what's listed here.

## Example — card with nested controls

```json
{ "id": "billing_card", "type": "card-container", "label": "Billing Address", "order": 6,
  "config": { "controls": [
    { "id": "billing_street", "type": "text", "label": "Street", "order": 1 },
    { "id": "billing_city", "type": "text", "label": "City", "order": 2 }
  ] } }
```
