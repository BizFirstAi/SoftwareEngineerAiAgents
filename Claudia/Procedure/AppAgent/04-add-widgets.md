# Procedure: Add and Configure Widgets

Add specific widgets to an existing app/page/section and configure them.

## When to Use

- User says "add a [widget type] to this page"
- Populating a page with content
- Called by all other procedures that build app content

## Steps

1. **Determine widget type needed**
   - Load [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) for overview
   - Ask user what kind of content/interaction they want
   - Map to one of the 17 real widget types

2. **Load widget's configuration docs**
   - Look up the widget in [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md)
   - Load its Tier 1 doc (e.g., `widgets/form.md`)
   - Review required fields, config shape, examples

3. **Gather widget configuration from user**
   - Required fields must come from user (IDs, URLs, form references)
   - Optional fields: ask user or use sensible defaults
   - Never make up field values
   - For content: ask user for their text/copy, don't generate it

4. **Check if widget requires creation modal**
   - Some widgets: `form`, `image`, `video`, `audio`, `pdf`, `chat-panel`, `workflow-template`, `workflow-template-category` — go through modal, have required fields
   - Others: safe-default drag-to-place (e.g., `content`, `page-navigation`, `signin`)

5. **Create widget (MCP)**
   - Call `create_widget` with:
     - `appID`
     - `appPageID` (if page-scoped; `null` for shared/default)
     - `sectionName`: the section this goes in
     - `widgetType`
     - `configuration`: the widget-specific config object
     - `displayOrder`
   - Keep returned `appWidgetID`

6. **Verify section exists**
   - **CRITICAL:** `AppSection` must exist before widget can render
   - If section doesn't exist, the widget will be created but orphaned
   - Use `create_section` first if needed

7. **Configure styling (optional)**
   - Load [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) for Style Builder system
   - Call `update_widget_placement` with `styleConfiguration` if needed
   - Apply theme tokens, spacing, sizing, etc.

8. **Preview**
   - Refresh app in App Player
   - Check widget renders correctly
   - Test any interactive features

## Widget Type Checklist

| Widget | Required Config | Can Skip? |
|--------|---|---|
| `form` | `formId` | No |
| `content` | `content`, `format` | No |
| `workflow-template` | `executionTemplateID` | No |
| `workflow-template-category` | `executionTemplateCategoryID` | No |
| `chat-panel` | `processID` | No |
| `image` | `imageUrl` | No |
| `video` | `videoUrl` | No |
| `audio` | `audioUrl` | No |
| `pdf` | `pdfUrl` | No |
| `page-navigation` | Layout config | Yes (defaults ok) |
| `site-branding` | Logo URL | Yes (placeholder ok) |
| `signin` | Config | Yes (auth-only ok) |
| `notifications` | Config | Yes (minimal ok) |
| `hil-inbox` | None | Yes (auth/tenant only) |
| Galleries | Filter options | Yes (defaults ok) |

## Common Gotchas

- **Section must exist first** — widgets silently orphan if section doesn't exist
- **AppSection vs. sectionName** — `sectionName` is string; section object must be created separately
- **Config shape matters** — Invalid JSON config will fail validation. Check widget doc for exact shape.
- **Media widget URLs** — Must be public (IsPublicAsset=true); private URLs fail silently at render time
- **Form widget requires real form** — `formId` must point at existing Atlas Form definition

## Knowledge

- [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) — Widget index and quick reference
- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) — Widget vs. AppWidget, section scoping
- [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) — Styling and theming
- `widgets/{type}.md` — Full configuration reference for specific widget type

---

**See Also:** [Style & Theme](05-style-and-theme.md) | [Add Pages](03-add-pages.md) | [Create Empty App](01-create-empty-app.md)
