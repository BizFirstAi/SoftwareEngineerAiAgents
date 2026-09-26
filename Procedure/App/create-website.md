# Create a web site, web application or content site (guided)

The default procedure for the App Developer. It walks the user through building an App Studio
app step by step: choices with a marked default, worked examples, the user's own content, and a
look at every section as soon as it is built. The user only pastes the short prompt from the
studio's Build using AI page. Everything below is the agent's job.

## Hard rules (read before step 1)

1. **Every create or change goes through MCP.** Never click Create, Save, Publish or any other
   control that writes data, and never type into the studio's forms. The browser is only for
   reading, navigating, refreshing and showing results. How to call MCP from the browser:
   [`connect-to-mcp.md`](connect-to-mcp.md).
2. **One question at a time.** Ask, wait for the answer, then move on. Every question offers
   choices, marks one as the default, and gives an example.
3. **Never invent the user's business facts**: names, products, prices, claims, testimonials,
   addresses, phone numbers, emails. Offer examples of *style and structure*. If the user says
   "use your suggestion" for marketing copy (a tagline, a benefit line), you may write it, but
   show it and get a yes before building it. Facts such as prices or contact details must come
   from the user.
4. **Never make up an ID.** Use the IDs the MCP responses return.
5. **Nothing is published without an explicit yes** ([`publish-app.md`](publish-app.md)).
6. **The user can always leave the guided path.** At any step they may say "skip guidance, I'll
   describe it". Then take their whole description, show a plan, and build after their yes,
   following the same design rules.

Knowledge used by this procedure (load when you reach the step that needs it):
[`00-overview.md`](../../Knowledge/App/00-overview.md) (always),
[`section-recipes.md`](../../Knowledge/App/section-recipes.md) (design),
[`site-building-lessons.md`](../../Knowledge/App/site-building-lessons.md) (MCP build gotchas),
[`widgets/{type}.md`](../../Knowledge/App/widgets/) (only for widget types you use).

## Step 1 — What are we building?

Ask:

> What would you like to create?
> 1. **Web site** *(default)*: pages people read, such as a business or product site.
> 2. **Web application**: pages where signed-in people do things, such as forms, approvals or chat.
> 3. **Content site**: mostly articles, media or documents.
>
> You can also say "skip guidance" and describe everything at once.

The three types differ only in the pages suggested in step 4 and the widget types used. The
choice does not change how anything is built.

## Step 2 — The overall idea

Ask for the idea in the user's own words: what the site is for, who visits it, and what a visitor
should do. Give one example answer, e.g. *"An herbal products shop. Visitors are health-minded
families. I want them to browse products and contact us to order."*

Then ask for the **site name** (used for the Project, the App and the header). Never guess it.

## Step 3 — Connect to BizFirst (MCP)

Follow [`connect-to-mcp.md`](connect-to-mcp.md). It opens the admin app's API Keys page so the
user can create a key (or points them at an existing one), then checks the connection with a
read-only call. Do not go on until the check passes.

## Step 4 — Look and feel

Ask the user to choose a palette and show the options from
[`section-recipes.md`](../../Knowledge/App/section-recipes.md) ("Picking colors"):

> Which look fits your site?
> 1. **Deep night**: dark, modern *(default for web applications)*
> 2. **Fresh light**: clean and bright *(default for web sites)*
> 3. **Warm earth**: natural and calm
> 4. Your own colors (tell me a main color, and light or dark)

Pick a short class prefix from the site name (e.g. `nh-` for "Nila Herbals"). You will use the
chosen palette's values as the fallbacks in every `var()`, and the prefix on every class.

## Step 5 — Pages

Suggest pages that fit the idea and the type from step 1, and let the user add, remove or rename:

| Type | Suggested pages |
|---|---|
| Web site | Home, About, Products or Services, Why us / Benefits, Contact |
| Web application | Home (what the app does), one page per task (e.g. Requests, Approvals), Help |
| Content site | Home, Articles or Library, Topics, About, Contact |

For each page confirm the **name** (menu label), **title** (shown on the page) and **slug** (URL
part, lowercase with hyphens). Show the final list as a table and get a yes.

## Step 6 — Create the app and its structure (MCP)

Call these in order (argument rules: [`connect-to-mcp.md`](connect-to-mcp.md), "Calling a tool"):

1. `create_project_with_app` with the site name and the idea as the description. Keep the
   returned **AppID** (and AppCode, if returned; otherwise read it with `get_app`).
2. `create_section` three times, before any widget
   ([`site-building-lessons.md`](../../Knowledge/App/site-building-lessons.md) §4):
   - `header`: region `header`, `isPrimaryContentSection` false
   - `main`: region `main`, `isPrimaryContentSection` **true**
   - `footer`: region `footer`, `isPrimaryContentSection` false
3. `create_page` once per page from step 5. Keep each **AppPageID** and slug.
4. `update_page` on the home page with `isDefault` true.
5. Header: `create_widget` of type `page-navigation`, config `{"orientation":"horizontal"}`, in
   section `header`, with no page (shared). Then `update_widget_placement` on it with
   `styleConfiguration` `{"widgetContainer":{"css":"background-color:<bg-panel>;padding:14px 32px;border-bottom:1px solid <border>;"}}`,
   using the palette's values. Tell the user plainly that the menu text colors come from the
   widget itself and cannot be themed through MCP yet (`site-building-lessons.md` §2).
6. Footer: `create_widget` of type `content` in section `footer`, shared, using Recipe 8.
7. Show the empty site: [`preview-and-focus.md`](preview-and-focus.md), opening the home page.

## Step 7 — Build each page, one section at a time

For each page in order, first suggest its sections (e.g. Home: Hero, Benefits, Featured products,
Call to action) and let the user change the list. Then for **each section**:

1. **Ask what it should contain**, with two example directions to pick from or edit. Example for
   a hero:
   > Section 1 of Home, the hero, is the first thing visitors see. Pick a style or describe your own:
   > 1. **Tagline + button**: a short bold line, one line under it, a "Shop now" button
   > 2. **Welcome + intro**: a warm heading, 2–3 sentences about you, a "Learn more" button
2. **Get the real words**: the heading, the text, button labels and where each button goes.
   Remind the user of rule 3 when facts are needed.
3. **Show the draft** as plain text (not code) and ask: *"Do you like this? Keep it, change the
   words, or try the other style."* Repeat until they say yes.
4. **Build it**: `create_widget` of type `content` in section `main`, with that page's
   `appPageID`. Its HTML is the matching recipe from
   [`section-recipes.md`](../../Knowledge/App/section-recipes.md): base CSS plus the recipe's CSS
   in a `<style>` block, the markup with the user's words, the outer `<div class="{p}-page">`
   wrapper, and **`"allowScripts": true`**. One widget per section, so the user can later change
   one section without touching the others ([`update-section.md`](update-section.md)).
   Sections appear in creation order. Only set `displayOrder` with `update_widget_placement` when
   inserting a section between existing ones.
5. **Show it**: [`preview-and-focus.md`](preview-and-focus.md), reload the page and scroll to
   the new section. Ask where they want to see it: the App Studio designer *(default)* or App
   Player.
6. **Ask**: *"Happy with this section, or change something?"* A change goes through
   [`update-section.md`](update-section.md).

After the last section of a page, show the whole page in App Player and ask whether the page is
done.

## Step 8 — Review the whole site

Walk the user through every page in App Player ([`preview-and-focus.md`](preview-and-focus.md)).
Check each page yourself as well: no section without padding, no default blue links, no text
touching the page edge, buttons look like buttons, and no placeholder text such as `[[` left over.
List anything the user still needs to provide (for example real photos: images must be
uploaded by a signed-in person in the app's media library, which no MCP tool can do today).

## Step 9 — Release

Ask whether to publish. Follow [`publish-app.md`](publish-app.md).

## Step 10 — Report

Tell the user: the AppID and AppCode, the App Player link for each page, what was built, what is
still missing, and any MCP gaps you hit (from [`connect-to-mcp.md`](connect-to-mcp.md), "Known
tool gaps").
