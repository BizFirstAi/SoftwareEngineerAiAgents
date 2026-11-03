# AppAgent Procedures — Step-by-Step Guides

Complete procedures for AppAgent to build apps using MCP.

## Quick Links

1. [Create from Template](02-create-from-template.md) — **Preferred default** when a template matches (check [template-catalogue.md](../../Knowledge/AppAgent/template-catalogue.md)) — higher quality ceiling than scratch-building
2. [Create Empty App](01-create-empty-app.md) — Fallback guided build of web site, app, or content site when no template fits
3. [Add Pages](03-add-pages.md) — Add new pages to existing app
4. [Add Widgets](04-add-widgets.md) — Add and configure widgets
5. [Style & Theme](05-style-and-theme.md) — Apply styling, theming, responsive design
6. [Validate App](06-validate-app.md) — **Mandatory Design Quality Gate** — run after every page, not just before publishing

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
| [Create from Template](02-create-from-template.md) | **Preferred default** for "build me a site/app" when a template matches — higher quality ceiling |
| [Create Empty App](01-create-empty-app.md) | Fallback guided build when no template fits |
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

- **Always:** [Knowledge/AppAgent/00-overview.md](../../Knowledge/AppAgent/00-overview.md) and [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md)
- **Before deciding to build from scratch:** [template-catalogue.md](../../Knowledge/AppAgent/template-catalogue.md)
- **When creating/structuring:** [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md)
- **When configuring widgets:** [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) → specific `widgets/{type}.md`
- **When styling:** [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)
- **For MCP patterns:** [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md)

## Recommended Path (Complete App Build)

1. **Check first:** [template-catalogue.md](../../Knowledge/AppAgent/template-catalogue.md) — a matching template beats building from scratch
2. **Start:** [Create from Template](02-create-from-template.md), or [Create Empty App](01-create-empty-app.md) if no template fits — walks guided build, creates Project + App
3. **Expand:** [Add Pages](03-add-pages.md) — if more pages needed mid-session
4. **Populate:** [Add Widgets](04-add-widgets.md) — configure each page's content
5. **Polish:** [Style & Theme](05-style-and-theme.md) — apply the recommended-and-confirmed palette, fonts, layout (see `site-building-lessons.md` § 8 — recommend a default, don't ask an open-ended color question)
6. **Verify after EVERY page, not just at the end:** [Validate App](06-validate-app.md) — the mandatory Design Quality Gate. "Styling rendered" is not a pass.
7. **Ship:** Publish (explicit yes required)

## Common Gotchas

**See [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) for the full,
dated, verified list** — this is a short pointer, not the canonical source:

- **AppSection must exist first** — sections are separate objects, not auto-created. Create via Designer UI or MCP `create_section` tool before widgets will display.
- **`configuration` on `create_widget` is a JSON STRING, not an object** — passing an object returns a generic internal error
- **`appPageID: null` is what makes a header/footer placement site-wide** — any other value scopes it to one page only, even on chrome regions
- **Player rendering differs from Designer** — always preview in real Player, not just Designer canvas
- **Configuration shapes must match renderer** — when validators and renderers disagree, trust the renderer
- **Hard reload may be needed** — after mid-session changes to widgets/pages
- **Soft deletes are default** — deleted items keep `Deleted` flag, not permanently removed
- **No section background tool, no grid widget, no heading-size control in every deployment** — see [platform-requests.md](../../Knowledge/AppAgent/platform-requests.md)

## Need Help?

- **Widget configuration questions?** → Load [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md), then specific widget doc
- **MCP call failing?** → Check [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md)
- **App not rendering?** → See gotchas above, check [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) for section/page scoping rules
- **Styling not working?** → Check [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md), especially Style Builder and theme tokens

---

**Start with:** [Create Empty App](01-create-empty-app.md)  
**Knowledge Base:** [AppAgent Knowledge](../../Knowledge/AppAgent/README.md)
