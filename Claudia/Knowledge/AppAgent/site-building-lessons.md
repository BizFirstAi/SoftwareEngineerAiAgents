# AppAgent — Site Building Lessons (verified in the real App Player)

Verified 2026-11-02 while building the EC Products website (AppID 1121) through the Build using AI
page's MCP bridge. Everything below was checked with a hard reload of the real App Player, not the
Designer canvas. `00-overview.md` and `04-design-patterns.md` link here; this file was referenced by
`06-mcp-server-reference.md` but did not exist.

## 1. Tool facts that differ from the older docs

- Real tool names/params (from `listTools()`): `create_project_with_app(name, description, projectTypeID)`,
  `update_app(appID, name, description, appCode)`, `create_page(appID, name, title, slug, parentPageID, showInMenu)`,
  `update_page(appID, pageID, name, title, slug, showInMenu, menuLabel, displayOrder, isDefault)`,
  `create_section(appID, sectionName, region, isPrimaryContentSection)`,
  `create_widget(appID, widgetType, name, configuration, sectionName, appPageID)`,
  `update_widget_placement(appID, widgetPlacementID, styleConfiguration, widgetStyle, widgetCss, displayOrder, showInNav, navPosition)`,
  `list_widgets_in_app(appID)`, `list_widget_types`, `get_public_access`.
  Every property is required; pass `null` for "unchanged".
- `widgetPlacementID` is the `appWidgetID` returned by `create_widget`.
- `create_section.region` must be one of `header | footer | left | main | right`. Create `header`,
  `main` (isPrimaryContentSection true) and `footer` before placing widgets.
- Not available from the bridge / not in the tool list: `delete_widget` (blocked as destructive),
  `publish_app`, `update_section_style`, any tool that edits an existing widget's configuration
  (content text, image URL). To change content you must create a new widget and hide the old one
  (`display: none` via `update_widget_placement`). Plan content before creating widgets.
- New apps are PRIVATE. Making one public is a human action in the Designer (`get_public_access` reports state).
- Calls are slow (about 1-3 s each). Run bulk builds as one background async script in the page, store
  progress in `window.__log`, and poll it. Keep each tool-call script reasonably small.

## 2. What the Player does with styling

- `content` widget with `format: "html"`:
  - `<style>` blocks are rejected by `create_widget` unless `allowScripts: true`, which is NOT permitted
    via MCP. Do not try to work around it.
  - Inline `style=""` attributes are mostly stripped (backgrounds, grid, sizes, object-fit all lost; only
    basic text colour survived). Treat content HTML as plain text structure: `h1`, `p`, `a`, lists.
- Style placements instead: `update_widget_placement` with
  `styleConfiguration = {"widgetContainer": {"style": { ... }}}`.
  - Keys MUST be camelCase (`backgroundColor`, `verticalAlign`, `borderRadius`). Hyphenated keys are
    rejected: "not a safe CSS property/slot name".
  - Verified working: `display`, `width`, `minWidth`, `margin`, `padding`, `background`,
    `backgroundImage` (including `linear-gradient(...), url(...)`), `backgroundSize`, `backgroundPosition`,
    `minHeight`, `color`, `textAlign`, `fontSize`, `letterSpacing`, `textShadow`, `border`, `borderTop`,
    `borderBottom`, `borderRadius`, `boxShadow`, `overflow`, `marginTop`, `marginBottom`, `verticalAlign`.
  - Verified NOT effective: `justifyContent` on the nav (menu stayed left-aligned); heading font size
    cannot be enlarged through the container (`fontSize` on a hero only slightly affected `h1`).
  - Raw `widgetContainer.css` did not apply layout; use `style`. (Exception: the five `--color-*`
    custom properties for `page-navigation`, see section 4.)
- Re-check after every style change with a hard reload (Ctrl+Shift+R) and wait ~15-30 s; the Player
  shows "Loading..." for a long time on first load.

## 3. Layout recipe that looks professional (no grid available)

Widgets in a section stack vertically and there is no grid or wrapper widget. Fake a responsive grid:

1. Use native `image` widgets (config `imageUrl`, `alt`, `caption`, `objectFit: "contain"`) as cards,
   one widget per product. `video` widgets (`videoUrl`, `caption`, `controls`) work the same way.
2. Style each card placement: `display: inline-block`, `verticalAlign: top`, `width: 22%`,
   `minWidth: 220px`, `margin: 1.2%`, `backgroundColor`, `border`, `borderTop: 3px solid <accent>`,
   `borderRadius: 12px`, `overflow: hidden`, `boxShadow`. This gives 4 per row and wraps on narrow screens.
3. Hero banner per page: one `content` widget (kicker `<p>`, `<h1>`, subtitle `<p>`) with placement style
   `backgroundImage: linear-gradient(rgba(15,22,48,.8),rgba(26,26,46,.93)), url(<photo>)`,
   `backgroundSize: cover`, `minHeight: 300px`, `padding: 80px 8%`, `textAlign: center`, white text.
4. Header: put a `content` brand widget (`<h1>NAME</h1><p>tagline</p>`) with a gradient background,
   `letterSpacing`, and a bottom accent border, above the `page-navigation` widget. The built-in
   `site-branding` widget shows an empty logo square when no logo exists; hide it and use text branding
   unless the user supplies a logo file.
5. Footer: a `content` widget in the `footer` section (dark background, top accent border). Only use
   facts the user supplied (no invented addresses/phones).
6. ALWAYS set `displayOrder` explicitly on every placement of a page (hero 1, cards 2..n). Without it,
   widgets created later can render above earlier ones (ties sort unpredictably).

## 4. Navigation theming (confirmed)

`page-navigation` with `configuration {"orientation":"horizontal"}` replaces the fixed bars and reads
`--color-bg-secondary`, `--color-text-secondary`, `--color-bg-tertiary`, `--color-text-primary`,
`--color-border`. Set them through `widgetContainer.css`. Remember `create_page` leaves
`showInMenu` false unless passed; set `showInMenu: true` and `displayOrder` per page via `update_page`.

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
- Do not claim styling is done until a hard-reloaded Player screenshot shows it.

## 7. Requests for the MCP server (not possible from the agent side)

1. `update_widget` (edit configuration/content of an existing widget definition).
2. `delete_widget` / `delete_widget_placement` for apps the agent itself created.
3. `update_section_style` (centered max-width containers, section background).
4. `publish_app` and a `get_player_url` tool that returns the Player URL with tenantID.
5. A `grid`/`row` container widget, or support for `display: grid/flex` plus gap on a section, so cards
   can be centered without the inline-block workaround.
6. Allow a safe, sanitized `<style>` subset (scoped class rules) in `content` widgets, or heading size slots.
7. A logo/asset field on `site-branding` and a documented theme hook for it.
8. Honor `justifyContent` / alignment on `page-navigation`.
