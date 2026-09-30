# AppAgent Knowledge Base

Complete reference for AppAgent building apps, sites, and web applications in App Studio.

## Start Here

1. **New to AppAgent?** → Read [00-overview.md](00-overview.md)
2. **Creating a new app?** → Read [03-app-creation-flow.md](03-app-creation-flow.md)
3. **Configuring widgets?** → See widget index in [00-overview.md](00-overview.md), then load specific `widgets/{type}.md`
4. **Stuck on MCP?** → Check [05-integration-guide.md](05-integration-guide.md)

## Knowledge Files

- [00-overview.md](00-overview.md) — AppAgent role, capabilities, hard rules, widget type index
- [01-app-model.md](01-app-model.md) — App → Page → Section → AppWidget → Widget hierarchy, CRUD APIs, data model
- [02-widget-types.md](02-widget-types.md) — Widget type reference (fetch specific docs as needed)
- [03-app-creation-flow.md](03-app-creation-flow.md) — How apps are created: Project→App flow, wizard, templates
- [04-design-patterns.md](04-design-patterns.md) — Theming, styling, responsive design, the Style Builder system
- [05-integration-guide.md](05-integration-guide.md) — How AppAgent calls MCP, patterns, error handling
- [06-mcp-server-reference.md](06-mcp-server-reference.md) — AppStudio MCP server tools API

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

**CRITICAL GAPS:**
1. **AppSection creation via MCP** — Must exist before `create_widget` works. Real `AppSection` is separate, explicitly-created object. Widgets without sections are silently orphaned.
2. **Player rendering bug** — Content placed in non-primary sections doesn't render (always check `layout.appSections[*].isPrimaryContentSection` first)
3. **Client-side caching** — Hard reload may be needed after mid-session widget additions
4. **Config shape validation** — Some validators lag behind real renderers; when in doubt, trust the renderer

## Security & Access Control

- API key required in `Authorization: Bearer` header
- TenantID claim validated from JWT
- Multi-tenant isolation enforced
- All operations scoped to tenant
- Public assets only in galleries/media pickers

## Version Info

Current as of: 2026-09-11  
Source: `BizFirstAiStudio` and `BizFirst.Ai.Mcp.Tools.AppStudio`  
Widget coverage: 17/17 documented

---

**See Also:** [AppAgent Procedures](../../../Procedure/AppAgent/README.md) | [Workflow Agent Knowledge](../../Workflow/README.md) | [Form Agent Knowledge](../../Form/README.md)
