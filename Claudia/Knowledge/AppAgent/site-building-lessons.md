# AppAgent — Site Building Lessons (verified in the real App Player)

Primary verification: 2026-11-02, building the EC Products website (AppID 1121) through the Build
using AI page's MCP bridge, hard-reloaded in the real App Player (not the Designer canvas). Additional
verified facts below come from a separate real build, Clarity Mind Health (AppID 1122), dated in
place. `00-overview.md`, `04-design-patterns.md` and `06-mcp-server-reference.md` link here.
Re-verify anything here against your own `listTools()`/`tools/list` call before relying on it — tool
surfaces change, and this file itself has already superseded earlier, less specific claims elsewhere
in these docs (see §1).

## 1. Tool facts that differ from the older docs

- Real tool names/params (from `listTools()`): `create_project_with_app(name, description, projectTypeID)`,
  `update_app(appID, name, description, appCode)`, `create_page(appID, name, title, slug, parentPageID, showInMenu)`,
  `update_page(appID, pageID, name, title, slug, showInMenu, menuLabel, displayOrder, isDefault)`,
  `create_section(appID, sectionName, region, isPrimaryContentSection)`,
  `create_widget(appID, widgetType, name, configuration, sectionName, appPageID)`,
  `update_widget_placement(appID, widgetPlacementID, styleConfiguration, widgetStyle, widgetCss, displayOrder, showInNav, navPosition)`,
  `list_widgets_in_app(appID)`, `list_widget_types`, `get_public_access`.
  Every property is required; pass `null` for "unchanged". **Verified** 2026-11-02, AppID 1121.
- `widgetPlacementID` is the `appWidgetID` returned by `create_widget`.
- `create_section.region` must be one of `header | footer | left | main | right`. Create `header`,
  `main` (isPrimaryContentSection true) and `footer` before placing widgets — an unknown section name
  silently orphans any widget placed into it, no error.
- On `create_widget`, `appPageID: null` is what makes a placement **site-wide**. Setting any real
  `appPageID` — including on a `header`/`footer` region — silently scopes that widget to one page
  only, even though some tool warning text suggests otherwise. **Verified** 2026-10-xx, AppID 1122.
- Some deployments require `create_widget`'s `configuration` param as a **JSON string**
  (`JSON.stringify(...)`), not an object — passing an object there returned a generic "internal
  error" with no field-level hint. **Verified** 2026-10-xx, AppID 1122. Not confirmed one way or the
  other on the AppID 1121 build; check your own tool's error behavior if `create_widget` fails
  immediately with no useful message.
- Not available from the bridge / not in the tool list, as of the 2026-11-02 check: `delete_widget`
  (blocked as destructive), `publish_app`, `update_section_style`, any tool that edits an existing
  widget's configuration (content text, image URL). To change content you must create a new widget
  and hide the old one (`display: none` via `update_widget_placement`). Plan content before creating
  widgets. (A separate, earlier `tools/list` check, 2026-09-18, also found no `update_widget_definition`
  and no `theme` param on `update_app` — consistent with the above.)
- `list_widgets_in_app`/`list_app_widgets` returns **no widget name**, only `appWidgetID`/`widgetID`/
  `sectionName`/`appPageID`/`displayOrder`. Join back through the `widgetID` `create_widget` returned
  — a name-keyed lookup silently matches nothing.
- Every new placement lands on `displayOrder: 0`. Order within a section is undefined until you
  explicitly set it — always set `displayOrder` on every placement of a page (hero 1, cards 2..n, etc).
- New apps are **PRIVATE**. Making one public is a human action in the Designer (`get_public_access`
  reports current state).
- MCP tool calls bypass the ordinary ASP.NET MVC authorization filter pipeline (it doesn't run on the
  `/mcp` endpoint at all), but a separate, purpose-built, fail-closed authorization layer gates MCP
  calls specifically — a hand-maintained per-tool allowlist that defaults any unlisted tool to
  human-only, plus per-call identity propagation to work around MCP's stateless dispatch. **Verified
  directly in BizFirstPayrollV3 source** (`McpToolAuthorizationGuard`, `McpToolAccessCatalog`,
  `McpCallerIdentityRegistry`), correcting an earlier, less-informed claim that this path had no
  authorization at all. "The tool accepted the call" is still not something to assume is impossible to
  get wrong — just don't claim there's no check.
- Calls are slow (about 1-3 s each). Run bulk builds as one background async script in the page, store
  progress in `window.__log`, and poll it. Keep each tool-call script reasonably small.

**Never promise or report a feature this section says is missing** (editing a widget's content after
creation, a custom app-level theme, deleting a widget, `publish_app` from the bridge) — say what
actually happened instead.

## 2. What the Player does with styling

- `content` widget with `format: "html"`:
  - `<style>` blocks are rejected by `create_widget` unless `allowScripts: true`, which is **NOT
    permitted via MCP at all**. Do not try to work around it.
  - Inline `style=""` attributes written directly in the content HTML are **mostly stripped**
    (backgrounds, grid, sizes, `object-fit` are all lost; only basic text color tends to survive).
    Treat content HTML as plain text structure only: `h1`, `p`, `a`, lists — never rely on it to carry
    layout or visual styling.
  - `AppWidget.widgetCss` is a separate field some tools accept and happily store, but no renderer
    (Designer or Player — they share one render path) ever reads it. Writing CSS there has zero
    effect; it is not a working escape hatch, just a trap that looks like one.
- Style **placements** instead: `update_widget_placement` with
  `styleConfiguration = {"widgetContainer": {"style": { ... }}}`.
  - Keys MUST be camelCase (`backgroundColor`, `verticalAlign`, `borderRadius`). Hyphenated keys are
    rejected: "not a safe CSS property/slot name".
  - Verified working: `display`, `width`, `minWidth`, `margin`, `padding`, `background`,
    `backgroundImage` (including `linear-gradient(...), url(...)`), `backgroundSize`, `backgroundPosition`,
    `minHeight`, `color`, `textAlign`, `fontSize`, `letterSpacing`, `textShadow`, `border`, `borderTop`,
    `borderBottom`, `borderRadius`, `boxShadow`, `overflow`, `marginTop`, `marginBottom`, `verticalAlign`.
  - Verified NOT effective: `justifyContent` on the nav (menu stayed left-aligned); heading font size
    cannot be enlarged through the container (`fontSize` on a hero only slightly affected `h1`).
  - The separate raw `widgetContainer.css` string field is weaker still: it accepts exactly ONE flat
    declarations block (`color: red; padding: 8px;`), applied to one element. Any literal `{`, `}`, or
    `@` anywhere in it causes the whole block to be silently discarded — no `:hover`, `::before`,
    `@keyframes`, `@media`/`@container`. It did not apply layout in the Nov-02 build either; use the
    `style` object above instead. (Exception: the five `--color-*` custom properties for
    `page-navigation`, see §4.)
- Re-check after every style change with a hard reload (Ctrl+Shift+R) and wait ~15-30 s; the Player
  shows "Loading..." for a long time on first load.

**Net effect — why MCP-built sites look "unstyled/thin":** combine the above with no section/page
background tool (`platform-requests.md` P1) and no scoped `<style>` subset (P3), and there is
currently no sanctioned path to hover states, gradients-with-nested-rules, or real grid/flex layout —
only flat placement-level `style` keys per element. If that's not enough for what the user asked for,
say so plainly; do not claim the result is "clean" or "professional" when it's flat colored boxes.

## 3. Layout recipe that looks professional (no grid available)

Widgets in a section stack vertically and there is no grid or wrapper widget. Fake a responsive grid:

1. Use native `image` widgets (config `imageUrl`, `alt`, `caption`, `objectFit: "contain"`) as cards,
   one widget per product/item. `video` widgets (`videoUrl`, `caption`, `controls`) work the same way.
   Don't use a content-widget `<div>` for cards — its inline styles would mostly be stripped (§2).
2. Style each card's **placement**: `display: inline-block`, `verticalAlign: top`, `width: 22%`,
   `minWidth: 220px`, `margin: 1.2%`, `backgroundColor`, `border`, `borderTop: 3px solid <accent>`,
   `borderRadius: 12px`, `overflow: hidden`, `boxShadow`. This gives 4 per row and wraps on narrow screens.
3. Hero banner per page: one `content` widget (kicker `<p>`, `<h1>`, subtitle `<p>`, plain text
   structure only) with placement style `backgroundImage: linear-gradient(rgba(15,22,48,.8),rgba(26,26,46,.93)), url(<photo>)`,
   `backgroundSize: cover`, `minHeight: 300px`, `padding: 80px 8%`, `textAlign: center`, white text.
4. Header: a `content` brand widget (`<h1>NAME</h1><p>tagline</p>`) with a gradient placement
   background, `letterSpacing`, and a bottom accent border, above the `page-navigation` widget — both
   placed with `appPageID: null` so they're site-wide, not page-scoped (§1). The built-in
   `site-branding` widget shows an empty logo square when no logo exists; hide it and use text
   branding unless the user supplies a logo file.
5. Footer: a `content` widget in the `footer` section (dark background via placement style, top accent
   border), also `appPageID: null`. Only use facts the user supplied (no invented addresses/phones).
6. ALWAYS set `displayOrder` explicitly on every placement of a page (hero 1, cards 2..n). Without it,
   widgets created later can render above earlier ones (ties sort unpredictably) — see §1.

## 4. Navigation theming (confirmed)

`page-navigation` with `configuration {"orientation":"horizontal"}` replaces the fixed bars and reads
`--color-bg-secondary`, `--color-text-secondary`, `--color-bg-tertiary`, `--color-text-primary`,
`--color-border`. Set them through `widgetContainer.css`. Remember `create_page` leaves `showInMenu`
false unless passed; set `showInMenu: true` and `displayOrder` per page via `update_page`.

The fixed `AppNavMenu` top/side bars themselves (the legacy default menu, *not* a placed widget) have
no `WidgetID` and no `styleConfiguration` slot anywhere — not in the Designer, not via any MCP tool.
This is a structural limitation, not a missing override; don't spend effort trying to style it
directly. Placing a `page-navigation` widget replaces it automatically (not additive — the app never
ends up with two menus).

## 5. Images and media hosting

- Raw GitHub URLs (`https://raw.githubusercontent.com/<org>/<repo>/main/<path>`) load in the Player.
  URL-encode spaces in file names (`%20`). Very large videos (20 MB+) can show an empty player while buffering.
- Do not use `github.com/.../blob/...` URLs for media; use raw.

## 6. Process lessons

- Reading the agent docs: fetch only `raw.githubusercontent.com` links (the index says so). A cloud-side
  fetch can fail; reading the same raw URL in the user's Chrome tab works.
- The App Player URL needs `?tenantID=...`. Do not type the URL yourself; use the Designer's Preview
  button (it opens `http://localhost:6130/<appCode>` with the tenant) and keep that tab for verification.
- Keep the Build using AI tab open (it holds `window.bizfirstAgent`); do all viewing in other tabs.
- Do not claim styling is done until a hard-reloaded Player screenshot shows it — see the mandatory
  Design Quality Gate in [`Procedure/AppAgent/06-validate-app.md`](../../Procedure/AppAgent/06-validate-app.md).

## 7. Other verified gotchas (not covered above)

- **A `form` widget in create/edit mode has no submit button.** It renders perfectly (labels, help
  text, validation) but `FormWidgetRenderer` passes `nested` to `FormRenderer`, and `FormRenderer`
  gates its entire submit bar on `!nested`. No widget config works around this — `hideSubmitButton` is
  irrelevant because the bar never renders regardless. Do not promise a working order/contact/signup
  form from a `form` widget; deliver capture via `wa.me`/`tel:`/`mailto:` deep links in a content
  widget instead. **Verified**, Bosh Bakery build (FormID 10001142).
- **A content widget can never run real JavaScript** — moot now that `allowScripts` isn't settable via
  MCP at all (§2), but worth knowing why: a `<script>` tag inserted via `dangerouslySetInnerHTML`
  never executes regardless, and `iframe`/`srcdoc` aren't reachable from a content widget either. If
  the user needs real interactivity (a game, a calculator, anything stateful), the only MCP-reachable
  path is a `form` widget placing an Atlas Forms `iframe-viewer` control with `sandbox: false`,
  pointed at first-party content you serve yourself.
- **Never hand-write an in-app `<a href="/app/page/x">` inside a content widget.** The real app
  requires query params (tenant/session) on every URL; an ordinary relative or root-absolute link
  drops them and sends the visitor to an error page. Use a `page-navigation` widget for page-to-page
  links, a fragment-only `href="#thing"` for in-page anchors, or an absolute external URL
  (`https://...`, `tel:`, `mailto:`).

## 8. Palette library (per industry)

No MCP tool lets AppAgent set an app-level theme (§1), so these are hand-applied per widget placement
via the `style` keys in §2 — not a shortcut around that limit, just a starting point so the agent
isn't guessing colors from scratch. Pick one by default based on the user's stated industry/audience;
use the user's own colors instead if they volunteer them (don't override a stated preference).

| Industry | Primary | Secondary | Surface | Text | Accent | Type | Spacing unit |
|---|---|---|---|---|---|---|---|
| Healthcare / wellness | `#2f6f5e` | `#eaf3ef` | `#ffffff` | `#1f2d2a` | `#d98e5f` | Calm sans (`'Inter', 'Segoe UI', sans-serif`), generous line-height (1.6) | 8px |
| Retail / ecommerce | `#1a1a2e` | `#f5f1ed` | `#ffffff` | `#1f1f1f` | `#e8a33d` | Confident sans, tighter headings | 8px |
| SaaS / tech | `#0f3460` | `#e9eef5` | `#ffffff` | `#15202b` | `#4a90d9` | Modern sans, mono accents for data | 8px |
| Portfolio / creative | `#111111` | `#f5f5f5` | `#ffffff` | `#111111` | `#c2412d` | Expressive serif headings + clean sans body | 12px |
| Nonprofit / community | `#2b5a8c` | `#fbf7ee` | `#ffffff` | `#242424` | `#e0a63e` | Warm, approachable sans, larger body text (17px) | 8px |

Each row is a starting point, not a hard rule — adjust saturation/contrast as needed, but keep the
relationship (primary for actions/headers, surface for cards, accent used sparingly for CTAs).

## 9. Design Quality Gate

Before reporting any page or the whole app as done: hard-reload the real App Player, screenshot
desktop (~1440px) and mobile (~390px), and check every item in the gate defined in
[`Procedure/AppAgent/06-validate-app.md`](../../Procedure/AppAgent/06-validate-app.md). "Styling
rendered" is not a pass. If something fails and you can't fix it, say exactly what's wrong and why —
cite the relevant section above if it's a known platform limit, rather than re-attempting a workaround
already documented here as not working.

## 10. Requests for the MCP server (not possible from the agent side)

Tracked with priorities and user-visible symptoms in
[`platform-requests.md`](platform-requests.md) — independently arrived at the same list from two
separate builds (AppID 1121 and AppID 1122): no `update_widget`/`delete_widget` for agent-created
widgets, no `update_section_style`, no `publish_app`/`get_player_url` with tenantID from the bridge,
no grid/row container widget, no safe scoped `<style>` subset or heading-size control, no logo/asset
field or theme hook on `site-branding`, and `page-navigation` ignoring `justifyContent`/alignment.

---

**See Also:** [00-overview.md](00-overview.md) | [04-design-patterns.md](04-design-patterns.md) |
[06-mcp-server-reference.md](06-mcp-server-reference.md) | [platform-requests.md](platform-requests.md) |
[template-catalogue.md](template-catalogue.md) | [Validate App](../../Procedure/AppAgent/06-validate-app.md)
