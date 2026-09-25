# `actor-list`

Comma-separated multi-value text input for actors/roles. Value is a string array when the
input parses to one or more non-empty comma-separated items, otherwise the raw string.

## Config

None — no type-specific `config` keys are read.

## Example

```json
{ "id": "approvers", "type": "actor-list", "label": "Approvers", "order": 7,
  "placeholder": "e.g. alice@company.com, role-finance" }
```
