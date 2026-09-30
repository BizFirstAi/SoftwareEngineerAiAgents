# `json-editor`

Plain monospace textarea that parses its content as JSON on every change; if the current
text doesn't parse, the raw string is passed through (`onChange` receives whatever
`JSON.parse` produced, or the raw string on parse failure) and the border turns amber. No
schema-aware validation — for that, use `enhanced-json-editor`.

## Config

None beyond common properties — no type-specific `config` keys are read.

## Example

```json
{ "id": "raw_metadata", "type": "json-editor", "label": "Metadata (JSON)", "order": 8,
  "defaultValue": {} }
```
