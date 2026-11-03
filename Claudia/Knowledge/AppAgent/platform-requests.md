# Platform Requests — Tracked, Not Agent-Fixable

These are real limitations of the current App Studio MCP surface and renderer, found while actually
building sites (see [`site-building-lessons.md`](site-building-lessons.md) for the verification
behind each one). None of these can be worked around by AppAgent with a cleverer tool call — they
need a platform change. Disclose the relevant ones to the user **before** building when they affect
what was asked for (see `00-overview.md`'s capability matrix), rather than quietly building something
worse than requested.

Every item below was independently confirmed by two separate real builds — Clarity Mind Health
(AppID 1122) and the EC Products website (AppID 1121, 2026-11-02) — arriving at the same list without
either build referencing the other. Treat that as a strong signal these are genuine platform gaps, not
one agent's misunderstanding of the tools.

| # | Request | User-visible symptom it fixes | Priority |
|---|---|---|---|
| P1 | Section/page `background` and `max-width` styling tool (`update_section_style` that actually has effect, or a real field on `AppSection`) | Large dark/empty bands above and below content where the App Player's default dark background shows through | High |
| P2 | A grid or row container widget type, with `gap`/`alignment` config | Card rows and multi-column layouts currently have to be hand-built as one big content-widget `<div>` with inline flex styles — no real layout widget exists | High |
| P3 | Heading/text size control, plus a sanitized *scoped* `<style>` subset (selectors, `:hover`, `@keyframes` — safely sandboxed, not the current all-or-nothing `allowScripts`) | Text stays small regardless of container font-size; no real hover/animation/gradient effects are reachable through any sanctioned tool path | High |
| P4 | Theme tokens that can actually override the App Player's default dark theme (a real `theme` param on `update_app`, or an equivalent) | Every MCP-built app renders on the same 19 built-in default color tokens; there is no way to give an app its own brand palette at the app level | High |
| P5 | `update_widget` (edit an existing widget's `configuration`/content) and `delete` for agent-created widgets | Any content fix today requires deleting the whole app and rebuilding from scratch — there is no incremental edit path | Medium |
| P6 | `publish_app` and `get_player_url` with `tenantID`, reachable from the MCP bridge | AppAgent cannot currently hand the user a working published link without a manual step outside MCP | Medium |
| P7 | A real `logo`/asset field on `site-branding` (currently only a URL string, no upload/picker reachable from MCP) | Users with a logo file (not already hosted somewhere) have no way to get it into the header through MCP | Low |
| P8 | `page-navigation` widget alignment/layout config (currently fixed orientation only) | Can't match a specific site design's nav placement (e.g. right-aligned, centered, with dropdowns) | Low |

## How to use this list

- When a user's request needs one of these (a themed section background, a real grid, a logo
  upload), tell them up front: *"I can build this, but [X] isn't possible through the current
  tools — here's what I'll do instead: [workaround from site-building-lessons.md, or none]."*
- Never silently substitute a worse result and call it done.
- If you confirm one of these has shipped (new tool appears in `listTools()`), update this table and
  [`site-building-lessons.md`](site-building-lessons.md) §1 together — they describe the same gaps
  from two angles (what to request vs. what to do today) and must stay in sync.

---

**See Also:** [site-building-lessons.md](site-building-lessons.md) | [00-overview.md](00-overview.md)
