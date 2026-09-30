# Procedure: Create a Web Site, Web Application or Content Site (Guided)

The default procedure for AppAgent. Walks user through building an App Studio app step-by-step: guided choices with marked defaults, worked examples, user's own content, and preview of each section as built.

## Hard Rules (Read First)

1. **Every create or change goes through MCP** — never click Create, Save, Publish or any writing control. Browser is read-only.
2. **One question at a time** — ask, wait for answer, then move on. Every question offers choices, marks a default, gives examples.
3. **Never invent business facts** — names, products, prices, claims, testimonials, addresses, phones, emails come from user. Offer style/structure examples only.
4. **Never make up IDs** — use IDs that MCP responses return.
5. **Nothing is published without explicit yes** — always confirm before publishing.
6. **User can always skip guidance** — if they say "skip, I'll describe it," take their full description, show a plan, build after yes.

## Knowledge to Load

- [00-overview.md](../../Knowledge/AppAgent/00-overview.md) (always)
- [03-app-creation-flow.md](../../Knowledge/AppAgent/03-app-creation-flow.md) (app creation wizard)
- [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) (when choosing look/feel)
- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) (when creating structure)
- [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) (widget index, then specific `widgets/{type}.md`)
- [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md) (MCP patterns)

## Step 1 — What Are We Building?

Ask:

> **What would you like to create?**
> 1. **Web site** *(default)* — pages people read (business site, product site, portfolio)
> 2. **Web application** — pages where signed-in people do things (forms, approvals, chat)
> 3. **Content site** — mostly articles, media, documents
>
> You can also say "skip guidance" and describe everything at once.

**The three types differ only in suggested pages and widget types.** The creation process is identical.

## Step 2 — The Overall Idea

Ask for the idea in user's own words: what the site is for, who visits it, what should a visitor do?

Example answer: *"An herbal products shop. Visitors are health-minded families. I want them to browse products and contact us to order."*

Then ask for the **site name** (used in Project, App, and header). Never guess it.

## Step 3 — Connect to BizFirst (MCP)

**Load:** [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md)

1. Get user's **API endpoint** (usually `{admin-app-url}/api/v1/...`)
2. Get or create **API key** (in admin app's API Keys page)
3. Get **TenantID** (from admin context)
4. Make a test read-only call via MCP: `GET {endpoint}/apps/list`
5. Confirm success

Do NOT go on until the check passes.

## Step 4 — Look and Feel (Styling)

**Load:** [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)

Ask:

> **Which look fits your site?**
> 1. **Deep night** — dark, modern *(default for apps)*
> 2. **Fresh light** — clean, bright *(default for websites)*
> 3. **Warm earth** — natural, calm
> 4. Your own colors — tell me a main color and light or dark

Pick a short class prefix from the site name (e.g., `nh-` for "Nila Herbals"). Show the palette in examples. You will put this palette in every widget as a local token block. The `var()` fallbacks alone aren't enough — App Player always injects default dark theme, which beats them. Use the prefix on every class.

## Step 5 — Pages

Suggest pages fitting the idea + type from Step 1, let user add/remove/rename:

| Type | Suggested Pages |
|------|---|
| Web site | Home, About, Products or Services, Why Us / Benefits, Contact |
| Web application | Home (what it does), one per task (e.g., Requests, Approvals), Help |
| Content site | Home, Articles or Library, Topics, About, Contact |

For each page, confirm:
- **Name** — menu label
- **Title** — shown on page
- **Slug** — URL part (lowercase with hyphens)

Show final list as table, get yes.

## Step 6 — Create the App and Structure (MCP)

**Load:** [03-app-creation-flow.md](../../Knowledge/AppAgent/03-app-creation-flow.md)

Call these in order (argument rules: [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md), "Calling a Tool"):

1. **`create_project_with_app`**
   - Name: site name
   - Description: the idea from Step 2
   - `projectTypeID: 20` (App Studio app type)
   - Keep returned **projectID** and **appID**

2. **`update_app`** — set readable app code
   - `appID`: from step 1
   - `appCode`: site name in lowercase with hyphens (e.g., `nila-herbals`)
   - If taken, try with short suffix
   - `name: null`, `description: null`

3. **`create_pages`** (bulk or per-page)
   - For each page from Step 5, call `create_page`
   - Name, slug, `appID`

4. **`create_section`**
   - Create one section per page-area (header, nav, footer, main-content)
   - Mark primary content section with `isPrimaryContentSection: true`
   - Keep returned section IDs and names

5. **`create_widget`** (or use Designer for first pass)
   - Populate each section/page with widgets
   - See Step 7

## Step 7 — Add Widgets (MCP)

**Load:** [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md), then specific widget docs as needed.

For each widget type you use:

1. Check [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) for overview
2. Load the widget's Tier 1 doc (e.g., `widgets/form.md`) for configuration
3. Call `create_widget` via MCP with correct config

**Common first widgets:**
- `site-branding` (logo + name in header)
- `page-navigation` (menu of pages)
- `content` (static text/HTML per page)
- `form` (contact form, signup, etc.)
- `image`, `video` (media on pages)

Never make up field values — ask user for content.

## Step 8 — Preview and Look (MCP + Browser)

After each page or section is built:

1. Call `publish_app` (as draft, if supported)
2. Show user the app in App Player
3. Scroll, highlight sections, test nav
4. Ask: "Does this match what you wanted?"
5. If not, follow [04-add-widgets.md](04-add-widgets.md) or [05-style-and-theme.md](05-style-and-theme.md) to adjust

## Step 9 — Final Review & Publish

1. Ask user to review the complete app
2. Test all pages, all widgets, all navigation
3. Check styling/theme on different page widths (responsive test)
4. When user says yes: **call `publish_app` via MCP with explicit user confirmation**

5. Show final URL and success message

## If User Skips Guidance

If at any step user says "skip, I'll describe it":

1. Take their complete description
2. Show a step-by-step plan extracted from it
3. Get yes/no on the plan
4. Execute all steps (project → app → pages → sections → widgets → styling → preview → publish)

---

**See Also:** [Add Pages](03-add-pages.md) | [Add Widgets](04-add-widgets.md) | [Style & Theme](05-style-and-theme.md) | [Validate App](06-validate-app.md)
