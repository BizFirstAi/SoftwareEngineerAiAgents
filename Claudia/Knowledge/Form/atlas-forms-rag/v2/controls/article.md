# `article`

Structured rich-content block. Accepts either HTML or Markdown in one `content` string —
Markdown is auto-detected (headings `#`, list markers `-*+`, `**bold**`, `` `code` ``) and
converted to HTML before sanitization (same DOMPurify whitelist family as `html`, slightly
narrower attribute list: `href title src alt class`).

## Config

| Property | Location | Type | Notes |
|---|---|---|---|
| `content` | `config.content` | string | HTML or Markdown source. |

## Example

```json
{ "id": "help_article", "type": "article", "order": 1,
  "config": { "content": "## Before you start\n\nHave your **account ID** ready." } }
```
