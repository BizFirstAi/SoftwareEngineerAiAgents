# `code-editor`

Syntax-highlighted code editor. In the current renderer it falls back to a plain monospace
textarea (`value` as string) unless the advanced-controls package's real code editor
component is loaded — treat it as "monospace text area for code" for schema-authoring
purposes; no language/theme config keys are read by the base fallback.

## Config

None beyond common properties are read by the guaranteed fallback path.

## Example

```json
{ "id": "custom_script", "type": "code-editor", "label": "Custom Script", "order": 12 }
```
