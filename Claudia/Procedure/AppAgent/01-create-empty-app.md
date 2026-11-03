# Procedure: Create a Web Site, Web Application or Content Site (Guided)

The default procedure for AppAgent. Walks user through building an App Studio app step-by-step: guided choices with marked defaults, worked examples, user's own content, and preview of each section as built.

## Hard Rules (Read First)

1. **Every create or change goes through MCP** — never click Create, Save, Publish or any writing control. Browser is read-only.
2. **One question at a time** — ask, wait for answer, then move on. Every question offers choices, marks a default, gives examples.
3. **Never invent business facts** — names, products, prices, claims, testimonials, addresses, phones, emails come from user. Offer style/structure examples only.
4. **Never make up IDs** — use IDs that MCP responses return.
5. **Nothing is published without explicit yes** — always confirm before publishing.
6. **User can always skip guidance** — if they say "skip, I'll describe it," take their full description, show a plan, build after yes.

## Step 0 — Preflight: MCP Connection & API Key Setup (Required)

Before proceeding, confirm that the AppAgent's MCP server tools are available AND set up the API key connection:

0. **Browser extension on the Build using AI page?** Use the page's MCP bridge:
   `await window.bizfirstAgent.mcp.status()`. If `connected: true`, continue with Step 1 and make
   every MCP call with `window.bizfirstAgent.mcp.call(...)`. No API key is needed. See
   [use-page-mcp-bridge.md](../General/use-page-mcp-bridge.md).
1. **Check MCP tools:** Look for tools whose names start with `BizFirst.Ai.Mcp.Tools.AppStudio` or call the server's list/health tool.
2. **If tools ARE available:** Continue with Step 1 below.
3. **If tools are NOT available:** Offer the user this choice:

   **How do you want to set up the API key for App Studio connection?**
   
   A) **I have an existing API key** - Provide it, I'll use it to connect
   B) **Guide me to create the key** - I'll walk you step-by-step to create one in Passport Admin Dashboard
   C) **Create it for me** - I'll use APIKeyAgent to automatically generate and configure the key (Recommended)

4. Based on user choice:
   - **Choice A:** User provides key → Verify connection → Continue with Step 1
   - **Choice B:** Follow [Procedure/APIKeyAgent/01-create-api-key.md](../../APIKeyAgent/01-create-api-key.md) → Return with API key → Continue with Step 1
   - **Choice C:** Launch APIKeyAgent to auto-create → Return with API key → Continue with Step 1

5. **Never standalone, not even as an option:** never build, publish, keep or offer an artifact,
   HTML page, standalone site, theme or file, not even with approval. MCP connection is the ONLY
   path forward.

## Knowledge to Load

- [00-overview.md](../../Knowledge/AppAgent/00-overview.md) (always) — includes the capability matrix (what AppAgent can/can't build today); state the relevant limits before building, not after
- [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) (always) — verified gotchas and copy-ready recipes used throughout this procedure
- [03-app-creation-flow.md](../../Knowledge/AppAgent/03-app-creation-flow.md) (app creation wizard)
- [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) (when choosing look/feel)
- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) (when creating structure)
- [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) (widget index, then specific `widgets/{type}.md`)
- [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md) (MCP patterns)
- [template-catalogue.md](../../Knowledge/AppAgent/template-catalogue.md) — check before Step 1: a matching template beats building from scratch (see [02-create-from-template.md](02-create-from-template.md))

## Step 0.5 — Set Expectations Before Building

Before the questionnaire, briefly state any capability limits relevant to what the user is
describing (see `00-overview.md`'s capability matrix) — for example, if they want live booking,
multi-step intake forms, or an authenticated portal, say up front that those need
FormAgent/WorkflowAgent collaboration or aren't buildable today, rather than discovering it mid-build
or silently delivering less than asked. Never claim compliance (HIPAA, PCI, etc.) without user-supplied evidence.

## Step 1 — What Are We Building? (After Preflight Passes)

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

## Step 4 — Look and Feel (Agent Recommends, User Confirms)

**Load:** [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md), [site-building-lessons.md § 8 palette library](../../Knowledge/AppAgent/site-building-lessons.md)

Users can't reliably supply styling details from scratch (raw hex codes, font pairings), so don't ask
an open-ended "what colors do you want" question. Instead, pick a palette first, then ask a short
confirm-or-choose question with that pick as the marked default — same shape as every other question
in this procedure (numbered options, one marked default, answer required before moving on):

1. Pick a default palette from the industry/audience already captured in Step 2, using the palette
   library in `site-building-lessons.md` § 8 (healthcare/wellness, retail, SaaS, portfolio, nonprofit
   — or the closest match if the industry isn't listed).
2. **If the user already volunteered colors unprompted** (e.g. in Step 2's own-words description),
   skip straight to confirming you'll use those — don't re-ask.
3. Otherwise, ask:

   > **Which look fits your site?**
   > 1. **[Industry] palette** — [primary]/[accent] on [surface] *(recommended, based on your
   >    industry)*
   > 2. A different palette from the library — tell me which industry/mood fits better
   > 3. Your own colors — tell me a main color and light or dark preference

4. Wait for the answer before proceeding (Hard Rule 2) — don't treat silence or a generic "looks
   good" elsewhere as consent to skip this question.
5. There is no working app-level theme mechanism (`update_app` has no `theme` param — see
   `site-building-lessons.md` §1) and a content widget's own inline styles are mostly stripped (§2), so
   apply the confirmed palette's hex values **directly, per widget placement**, via
   `update_widget_placement`'s `styleConfiguration.widgetContainer.style` (camelCase keys — see the
   recipes in `site-building-lessons.md` § 3). Give every top-level section's placement its own
   explicit `background`/`backgroundImage` and `minHeight` (§2–§3, the "full-page band" pattern) —
   otherwise the Player's default dark background shows through as empty voids.

The only content questions for this step are: purpose, audience, pages, copy, logo/photos (already
covered in earlier steps) — never "what colors do you want."

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

   - **Then put every page in the menu:** `create_page` leaves `showInMenu: false` and
     `displayOrder: 0`, so the `page-navigation` widget shows nothing. For each page call
     `update_page` with `showInMenu: true`, `menuLabel`, `displayOrder` 1, 2, 3… (other fields
     `null`), and set `isDefault: true` on the home page. Verified live 2026-09-30 (VoltCase, AppID 1123).

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
2. **Run the Design Quality Gate** ([06-validate-app.md](06-validate-app.md)) — hard reload the real
   App Player, screenshot desktop and mobile, check every item. Do this before showing the user
   anything or calling the result done.
3. Show user the app in App Player
4. Scroll, highlight sections, test nav
5. Ask: "Does this match what you wanted?" — and if the gate found flaws you couldn't fix, say so
   plainly here rather than only asking if it "looks right"
6. If not, follow [04-add-widgets.md](04-add-widgets.md) or [05-style-and-theme.md](05-style-and-theme.md) to adjust

## Step 9 — Final Review & Publish

1. **Run the Design Quality Gate** ([06-validate-app.md](06-validate-app.md)) one final time across
   every page, not just the last one touched
2. Ask user to review the complete app
3. Test all pages, all widgets, all navigation
4. Check styling/theme on different page widths (responsive test)
5. When user says yes: **call `publish_app` via MCP with explicit user confirmation, if the tool is
   available** — it is not guaranteed to be in every deployment's tool list (see
   [`platform-requests.md`](../../Knowledge/AppAgent/platform-requests.md) P6); if it's missing, tell
   the user plainly and hand off the manual publish step rather than silently failing or claiming success.

6. Show final URL and success message

## If User Skips Guidance

If at any step user says "skip, I'll describe it":

1. Take their complete description
2. Show a step-by-step plan extracted from it
3. Get yes/no on the plan
4. Execute all steps (project → app → pages → sections → widgets → styling → preview → publish)

---

**See Also:** [Add Pages](03-add-pages.md) | [Add Widgets](04-add-widgets.md) | [Style & Theme](05-style-and-theme.md) | [Validate App](06-validate-app.md)
