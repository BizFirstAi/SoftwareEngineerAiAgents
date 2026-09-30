# `form-container`

Embeds another form by reference inside this one (renders the referenced form live via
`FormContainerControl`). Alias: `form-node` is registered identically but is not part of
the documented `FormControlType` union — prefer `form-container`.

## Config

No fixed `config` schema was confirmed in the base renderer beyond passing the control
through to `FormContainerControl` — the embedded form is typically selected via
`referredFormID` (a common property, see `01-common-properties.md`) rather than a
`config` key. Use `form-picker` in a form-builder UI to let a user choose the target form
ID interactively.

## Example

```json
{ "id": "embedded_address_form", "type": "form-container", "order": 5,
  "referredFormID": 1042 }
```
