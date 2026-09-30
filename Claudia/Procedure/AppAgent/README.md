# AppAgent Procedures — Step-by-Step Guides

Complete procedures for AppAgent to build apps using MCP.

## Quick Links

1. [Create Empty App](01-create-empty-app.md) — **Default.** Guided build of web site, app, or content site
2. [Create from Template](02-create-from-template.md) — Clone a template and customize
3. [Add Pages](03-add-pages.md) — Add new pages to existing app
4. [Add Widgets](04-add-widgets.md) — Add and configure widgets
5. [Style & Theme](05-style-and-theme.md) — Apply styling, theming, responsive design
6. [Validate App](06-validate-app.md) — Testing, preview, readiness check

## Hard Rules (All Procedures)

1. ✓ **Every create or change goes through MCP** — never click UI buttons
2. ✓ **Browser is read-only** — navigate, refresh, show results only
3. ✓ **One question at a time** — ask, wait, move on
4. ✓ **Never invent business facts** — user provides names, products, prices, claims
5. ✓ **Never make up IDs** — use IDs returned by MCP responses
6. ✓ **Nothing published without explicit yes** — always confirm
7. ✓ **User can skip guidance** — accept full description, build after yes

## When to Use Each Procedure

| Procedure | When |
|-----------|------|
| [Create Empty App](01-create-empty-app.md) | Default for "build me a site/app" requests with guided experience |
| [Create from Template](02-create-from-template.md) | User wants to clone an existing template and customize |
| [Add Pages](03-add-pages.md) | Extending existing app with new pages (mid-session or separate task) |
| [Add Widgets](04-add-widgets.md) | Adding specific widgets to a page (reference for all widget types) |
| [Style & Theme](05-style-and-theme.md) | Applying look-and-feel, colors, responsive design |
| [Validate App](06-validate-app.md) | Before publishing — test rendering, nav, layout, widgets |

## MCP Connection

**Before any procedure:** Follow the MCP connection setup in [Create Empty App](01-create-empty-app.md) Step 3.

You'll need:
- API endpoint (usually `{admin-app-url}/api/v1/...`)
- API key (generated or existing)
- TenantID (from admin context)
- Successful test call confirming connection

## Knowledge Requirements

Each procedure references knowledge docs. Load them as directed:

- **Always:** [Knowledge/AppAgent/00-overview.md](../../Knowledge/AppAgent/00-overview.md)
- **When creating/structuring:** [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md)
- **When configuring widgets:** [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) → specific `widgets/{type}.md`
- **When styling:** [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)
- **For MCP patterns:** [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md)

## Recommended Path (Complete App Build)

1. **Start:** [Create Empty App](01-create-empty-app.md) — walks guided build, creates Project + App
2. **Expand:** [Add Pages](03-add-pages.md) — if more pages needed mid-session
3. **Populate:** [Add Widgets](04-add-widgets.md) — configure each page's content
4. **Polish:** [Style & Theme](05-style-and-theme.md) — apply colors, fonts, layout
5. **Verify:** [Validate App](06-validate-app.md) — test before publishing
6. **Ship:** Publish (explicit yes required)

## Common Gotchas

- **AppSection must exist first** — sections are separate objects, not auto-created. Create via Designer UI or MCP `create_section` tool before widgets will display.
- **Player rendering differs from Designer** — always preview in real Player, not just Designer canvas
- **Configuration shapes must match renderer** — when validators and renderers disagree, trust the renderer
- **Hard reload may be needed** — after mid-session changes to widgets/pages
- **Soft deletes are default** — deleted items keep `Deleted` flag, not permanently removed

## Need Help?

- **Widget configuration questions?** → Load [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md), then specific widget doc
- **MCP call failing?** → Check [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md)
- **App not rendering?** → See gotchas above, check [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) for section/page scoping rules
- **Styling not working?** → Check [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md), especially Style Builder and theme tokens

---

**Start with:** [Create Empty App](01-create-empty-app.md)  
**Knowledge Base:** [AppAgent Knowledge](../../Knowledge/AppAgent/README.md)
