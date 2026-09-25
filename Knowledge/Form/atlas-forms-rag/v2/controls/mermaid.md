# `mermaid`

Renders a Mermaid diagram definition. Loads the `mermaid` library lazily from a CDN
(`cdn.jsdelivr.net`) on first use — requires the client to have network access to that CDN.
Output SVG is sanitized with a dedicated DOMPurify SVG-tag whitelist.

## Config

The diagram source is read from the control object directly, not from `config`:
`(control as any).definition` (preferred) or `(control as any).content` as a fallback. Put
the Mermaid syntax string on a top-level `definition` key on the control object, not inside
`config`.

## Example

```json
{ "id": "flow_diagram", "type": "mermaid", "order": 1,
  "definition": "graph TD; A[Start] --> B{Approved?}; B -->|Yes| C[Continue]; B -->|No| D[Reject];" }
```
