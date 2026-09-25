# `form-picker`

Search-and-select control for choosing another Form by ID (used to wire up
`referredFormID`-style references, form-container targets, grid `editFormID`, etc., from
within a form-builder UI). Value is a Form ID (number) or form reference object depending
on host wiring — treat as a numeric FormID reference for schema-authoring purposes.

## Config

No type-specific `config` keys are read by the base component beyond common properties.

## Example

```json
{ "id": "target_form", "type": "form-picker", "label": "Linked Form", "order": 8 }
```
