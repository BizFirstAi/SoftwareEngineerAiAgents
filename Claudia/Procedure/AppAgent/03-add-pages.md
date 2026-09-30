# Procedure: Add Pages to an Existing App

Add new pages to an app that's already created.

## When to Use

- User says "add a new page to this app" (mid-session or separate task)
- Expanding app after initial creation
- Don't use for initial page setup — see [Create Empty App](01-create-empty-app.md) Step 5

## Steps

1. **Get page details from user**
   - Page name (menu label)
   - Page title (shown on page)
   - Page slug (URL part, lowercase with hyphens)
   - Should this be default page? (only one per app)
   - Is this nested under another page? (for tree navigation)

2. **Create page (MCP)**
   - Call `create_page` with:
     - `appID`: the existing app
     - `name`, `title`, `slug`
     - `parentPageID`: (if nested under another page)
     - `isDefault`: true/false
   - Keep returned `pageID`

3. **Create sections for this page**
   - Determine what layout sections this page needs (header, nav, footer, main content)
   - Call `create_section` for each
   - Mark one as `isPrimaryContentSection: true` for the main content area
   - Keep returned section IDs

4. **Add widgets to the page**
   - Follow [Add Widgets](04-add-widgets.md)
   - Make sure `appPageID` is set to this new page's ID

5. **Preview**
   - Show page in App Player
   - Test navigation to/from this page
   - Verify it appears in page-navigation widget menu

## Knowledge

- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) — Page structure, nesting, defaults
- [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md) — MCP patterns

---

**See Also:** [Add Widgets](04-add-widgets.md) | [Create Empty App](01-create-empty-app.md)
