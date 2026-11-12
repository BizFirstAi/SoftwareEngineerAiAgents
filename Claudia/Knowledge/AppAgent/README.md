# AppAgent Knowledge Base

Complete reference for AppAgent building apps, sites, and web applications in App Studio.

## Start Here

1. **New to AppAgent?** → Read [00-overview.md](00-overview.md)
2. **Creating a new app?** → Read [03-app-creation-flow.md](03-app-creation-flow.md)
3. **Configuring widgets?** → See widget index in [00-overview.md](00-overview.md), then load specific `widgets/{type}.md`
4. **Stuck on MCP?** → Check [05-integration-guide.md](05-integration-guide.md)

## Knowledge Files

- [00-overview.md](00-overview.md) — AppAgent role, capabilities, hard rules, widget type index, capability matrix
- [site-building-lessons.md](site-building-lessons.md) — verified gotchas, tool reality check, copy-ready recipes — load alongside `00-overview.md`, always
- [01-app-model.md](01-app-model.md) — App → Page → Section → AppWidget → Widget hierarchy, CRUD APIs, data model
- [02-widget-types.md](02-widget-types.md) — Widget type reference (fetch specific docs as needed)
- [03-app-creation-flow.md](03-app-creation-flow.md) — How apps are created: Project→App flow, wizard, templates
- [04-design-patterns.md](04-design-patterns.md) — Theming, styling, responsive design, the Style Builder system
- [05-integration-guide.md](05-integration-guide.md) — How AppAgent calls MCP, patterns, error handling
- [06-mcp-server-reference.md](06-mcp-server-reference.md) — AppStudio MCP server tools API
- [template-catalogue.md](template-catalogue.md) — template IDs by industry, content slots — check before building from scratch
- [platform-requests.md](platform-requests.md) — known tool limitations, not agent-fixable
- [architecture.md](architecture.md) — the automation project's own system architecture (not the App Studio product's — see [01-app-model.md](01-app-model.md) for that)
- [STATUS.md](STATUS.md) — open items/known bugs as of the last internal engineering pass (point-in-time, verify before relying on it)
- [DevelopmentHistoryLog.md](DevelopmentHistoryLog.md) — dated history of this knowledge base's own changes
- [engineering-lessons.md](engineering-lessons.md) — the internal engineering bug post-mortems (config-shape drift, undo-stack corruption, schema drift, etc.) — distinct from and older than [site-building-lessons.md](site-building-lessons.md)'s real-MCP-build lessons; both are worth reading
- [design/](design/design-and-plan.md) — Designer UX design history: `design-and-plan.md`, `targets/` (6 proposed feature designs), `wix-style-design/` (the 00-08 Designer-UX doc series code comments cite directly)
- [widgets/](widgets/) — per-widget-type detail docs (one file per type, plus `content-widget-templates.md`), linked from [02-widget-types.md](02-widget-types.md)

## Procedures

See [Procedure/AppAgent](../../../Procedure/AppAgent/README.md) for step-by-step guides:
- Create empty app
- Create from template
- Add pages
- Add widgets
- Style and theme
- Validate app

## Two-Tier Retrieval Pattern

**Tier 0 (always):** `00-overview.md` — widget index, hard rules, core concept pointers  
**Tier 1 (on-demand):**
- `01-app-model.md` — when creating/modifying structure
- `03-app-creation-flow.md` — when creating new app
- `widgets/{type}.md` — load only the types actually needed
- `04-design-patterns.md` — when styling/theming
- `05-integration-guide.md` — for MCP patterns

## Known Issues & Gaps

**See [site-building-lessons.md](site-building-lessons.md) for the full, dated, verified list** —
this is a short pointer, not the canonical source:

1. **AppSection creation via MCP** — Must exist before `create_widget` works. Real `AppSection` is separate, explicitly-created object. Widgets without sections are silently orphaned.
2. **Player rendering bug** — Content placed in non-primary sections doesn't render (always check `layout.appSections[*].isPrimaryContentSection` first)
3. **Client-side caching** — Hard reload may be needed after mid-session widget additions
4. **Config shape validation** — Some validators lag behind real renderers; when in doubt, trust the renderer
5. **No section/page background tool, no grid widget, no heading-size control, no widget edit/delete in every deployment** — see [platform-requests.md](platform-requests.md)

## Security & Access Control

- API key required in `Authorization: Bearer` header
- TenantID claim validated from JWT
- Multi-tenant isolation enforced
- All operations scoped to tenant
- Public assets only in galleries/media pickers

## Version Info

Current as of: 2026-11-12 (ported from the internal `agentic-development-engineers` hub's
`app-development-engineer/` folder — architecture/status/design-history/lessons/per-widget docs
that didn't survive the original 2026-09-25 fork)
Source: `BizFirstAiStudio` and `BizFirst.Ai.Mcp.Tools.AppStudio`
Widget coverage: 18/18 types documented, 19 widget-folder docs (18 types + `content-widget-templates.md`)

---

**See Also:** [AppAgent Procedures](../../../Procedure/AppAgent/README.md) | [Workflow Agent Knowledge](../../Workflow/README.md) | [Form Agent Knowledge](../../Form/README.md)
