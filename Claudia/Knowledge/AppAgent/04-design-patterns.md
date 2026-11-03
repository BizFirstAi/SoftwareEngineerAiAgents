# App Studio — Design Patterns, Theming & Style System

**Reference for building styled, themed apps with the Style Builder system and theme token cascade.**

> **Verified in the real App Player:** which style keys are accepted (camelCase only), what the Player strips, and the hero/card/header layout recipe are in [site-building-lessons.md](site-building-lessons.md). Read it before styling any app.

## The Three-Level Style System

```
App Level (global tokens)
  ↓
Section Level (AppSection.style)
  ↓
Placement Level (AppWidget.styleConfiguration)
```

Each level inherits from the one above; specificity increases downward.

### App Level — Theme Tokens

**Theme tokens** (`--app-var-*` CSS custom properties) define the app's color, typography, and spacing foundation.

| Token | Purpose | Example |
|-------|---------|---------|
| `--app-var-primary` | Primary color | `#0066cc` |
| `--app-var-secondary` | Secondary accent | `#ff6600` |
| `--app-var-success` | Success/positive | `#00aa00` |
| `--app-var-danger` | Error/warning | `#cc0000` |
| `--app-var-background` | Page background | `#ffffff` |
| `--app-var-text` | Primary text color | `#333333` |
| `--app-var-text-light` | Secondary text | `#666666` |
| `--app-var-border` | Border color | `#dddddd` |
| `--app-var-shadow` | Shadow color | `rgba(0,0,0,0.1)` |

All widgets reference these tokens for consistency.

### Section Level — Layout & Spacing

`AppSection.style` controls how a layout region looks:

```json
{
  "background": "var(--app-var-background)",
  "padding": "32px 16px",
  "margin": "0",
  "max-width": "1200px",
  "margin": "0 auto"
}
```

Common section types:
- **Header** — logo/branding, navigation
- **Hero** — large cover image/banner
- **Main content** — primary page content
- **Footer** — legal, contact, links

### Placement Level — Widget-Specific Style

`AppWidget.styleConfiguration` overrides styles for ONE placement:

```json
{
  "widgetContainer": {
    "style": {
      "padding": "16px",
      "background": "var(--app-var-secondary)",
      "border-radius": "8px"
    }
  },
  "contentStyle": {
    "font-size": "18px",
    "line-height": "1.6"
  }
}
```

Two placements of the same Widget can have different styles — this is placement-level config, not the Widget definition itself.

## Picking a Palette

**Default to the industry-specific library in [`site-building-lessons.md`](site-building-lessons.md)
§ 8 (healthcare/wellness, retail, SaaS, portfolio, nonprofit)** when the app's industry/audience is
known — it's tested and gives primary/secondary/surface/text/accent plus type/spacing defaults in one
place. The generic presets below are a fallback for when no industry match applies.

### Preset Palettes

1. **Deep Night** (dark, modern)
   - Primary: `#1a1a2e`
   - Secondary: `#16213e`
   - Accent: `#0f3460`
   - Text: `#ffffff`

2. **Fresh Light** (clean, bright)
   - Primary: `#0066cc`
   - Secondary: `#00aa44`
   - Accent: `#ff6600`
   - Text: `#333333`

3. **Warm Earth** (natural, calm)
   - Primary: `#8b6f47`
   - Secondary: `#d4a574`
   - Accent: `#c2b280`
   - Text: `#5a4a3a`

### Custom Palette

If user has their own colors:

1. Get main color
2. Get light/dark preference
3. Generate complementary colors using HSL offsets
4. Define CSS class prefix (e.g., `nh-` for "Nila Herbals")
5. Create token values

**Example custom class:**

```css
.nh-main {
  --app-var-primary: #8b4513;
  --app-var-secondary: #d4a574;
  --app-var-text: #333333;
  --app-var-background: #f5f1ed;
}
```

## Common Style Issues & Solutions

### "Large dark/empty voids above or below content"

**Root cause:** no MCP tool reliably sets a section's background, so the App Player's own default
dark background shows through anywhere your content doesn't explicitly cover (tracked as platform
gap P1, see [`platform-requests.md`](platform-requests.md)).

**Fix:** use the "full-page band" pattern — give the section's own content an explicit
`background`/`backgroundImage` AND either `minHeight` (in `vh`) or generous padding, set through
`update_widget_placement`'s `styleConfiguration.widgetContainer.style` (camelCase keys), not relying
on a section-level tool and not relying on the content HTML's own inline styles (mostly stripped). See
[`site-building-lessons.md`](site-building-lessons.md) §2–§3.

### "App looks unstyled/thin" (Most Common)

**Root cause:** a `content` widget's `html`/`markdown` content has an embedded `<style>` block. `allowScripts: false` (the default) silently strips it.

**Fix:** remove the `<style>` block from the content and style the widget via `update_widget_placement`'s `styleConfiguration` instead (see "Styling Best Practices" below). Then hard-reload the Player (F5) to confirm.

**Do not set `allowScripts: true` to "fix" this.** As of the most recent verified build (AppID 1121, 2026-11-02), `create_widget` rejects a `<style>` block unless `allowScripts: true` is set, and `allowScripts: true` itself is **not permitted via MCP at all** — don't try to work around it. Even inline `style=""` attributes written directly in a content widget's HTML are **mostly stripped** by the Player (backgrounds, grid, sizes, `object-fit` are lost; only basic text color tends to survive) — so a content widget's own HTML cannot reliably carry layout/visual styling either way. The only reliable path is styling the **placement**, not the content: `update_widget_placement`'s `styleConfiguration.widgetContainer.style` object, with **camelCase** keys (`backgroundColor`, not `background-color`) — see [`site-building-lessons.md`](site-building-lessons.md) §2 for the exact list of which style keys the Player actually honors. The separate `styleConfiguration.widgetContainer.css` raw-string field (below) is weaker still — one flat declarations block, no selectors.

**Why DOMPurify strips it in the first place:** Content widgets sanitize HTML for security (`ContentSanitizer.ts`, DOMPurify). The restrictive custom tag allowlist it uses by default does not include `style` — any `<style>` block is removed, silently, not rejected.

### Styles not changing after update

**Root cause:** CSS caching in browser or App Player.

**Fix:**
1. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
2. NOT just F5 (soft refresh)
3. Clear DevTools cache if needed

### Theme tokens not applying

**Root cause:** Variable fallbacks too weak, Player's default theme overrides them.

**Fix:**
1. Use explicit prefixed classes: `.nh-main`, not bare `var(--app-var-*)`
2. Place class on parent container that wraps content
3. Inline styles on wrapping div, not content widgets
4. Example: `<div class="nh-main" style="padding: 16px;">` wraps widget

### Layout widgets (nav, branding) don't theme

**Root cause — two genuinely different cases, don't conflate them:**

1. **The fixed `AppNavMenu` top/side bars** (the legacy menu every app has by default, *not* a placed widget) are hardcoded app chrome with no `WidgetID` — there is no `styleConfiguration` slot for them at all, in the Designer or via any MCP tool. This is a real, structural limitation, not a missing CSS override. Do not attempt to style it; it cannot be done.
2. **The `page-navigation` widget** is a different thing: a real, placeable `AppWidget` (create it via `create_widget` like any other widget). The moment one is placed anywhere in the app's layout, `AppPlayer` automatically **replaces** the fixed `AppNavMenu` bars with it — it is not additive, and the app does not end up with two menus. Unlike the fixed bars, this widget genuinely IS stylable: it reads `--color-bg-secondary`, `--color-text-secondary`, `--color-bg-tertiary`, `--color-text-primary`, and `--color-border` (not `--app-var-*`) for its colors, and those are regular CSS custom properties — inherited, so they can be overridden.

**Fix for a themed menu:**
1. `create_widget` with `widgetType: "page-navigation"`, `configuration: {"orientation": "horizontal"}` (or `"vertical"`), placed in the header (or wherever the menu should sit).
2. `update_widget_placement` on that new placement with `styleConfiguration` = `{"widgetContainer": {"css": "--color-bg-secondary: <theme color>; --color-text-secondary: <theme color>; --color-bg-tertiary: <theme color>; --color-text-primary: <theme color>; --color-border: <theme color>;"}}` — plain custom-property declarations, no selectors or braces needed beyond the JSON structure itself.
3. Verify in the real App Player (hard reload) — the fixed bars should be gone, replaced by this widget in your theme colors.

If the app must keep the fixed `AppNavMenu` instead (e.g. it relies on the fixed bar's layout), its colors are a known, unfixable-via-tools limitation — tell the user to change it themselves in App Config, don't spend further effort trying tool-based overrides on it.

## Style Builder Structure (Technical)

For agents calling MCP:

**AppWidget.styleConfiguration** shape:

```json
{
  "widgetContainer": {
    "style": { /* container-level CSS */ }
  },
  "contentStyle": { /* content-level CSS */ },
  "responsive": {
    "mobile": { /* 320px+ rules */ },
    "tablet": { /* 768px+ rules */ },
    "desktop": { /* 1024px+ rules */ }
  }
}
```

**AppSection.style** shape:

```json
{
  "background": "...",
  "padding": "...",
  "max-width": "...",
  "margin": "..."
}
```

## CSS Escape Hatch

`styleConfiguration`'s `css` field supports raw custom styles, but it is **far more limited than it
looks**: it accepts exactly ONE flat declarations block, applied to one element — no selectors, no
braces, no nested rules, no `@`-rules of any kind.

**Valid:**
```json
{
  "css": "color: red; padding: 8px;"
}
```

**Invalid — silently dropped, not partially applied, not an error:**
```json
{
  "css": ".custom-rule { color: red; }"
}
```
Any literal `{`, `}`, or `@` anywhere in the string causes the **entire** block to be discarded. That
means no `:hover`, no `::before`, no `@keyframes`, no `@media`/`@container` — responsive behavior only
comes from the platform's own built-in mobile/tablet/desktop breakpoints, not from anything you write
here. **Verified** against the sanitizer directly — see
[`site-building-lessons.md`](site-building-lessons.md) §2 for the full explanation and what this
means for what's actually achievable.

**Constraints:**
- A literal `{`, `}`, or `@` anywhere drops the whole block silently
- Content Security Policy applies
- Keeps flat CSS declarations, removes event handlers and script URLs

## Tested Section Recipes (verified builds)

**Styled through widget placements, not content-widget HTML** — content widgets cannot reliably carry
layout styling (see above), so every recipe below styles the *placement* (`update_widget_placement`'s
`styleConfiguration.widgetContainer.style`, camelCase keys) of ordinary widgets (`image`/`video` as
cards, `content` for plain-text structure only). Full recipes with exact verified style keys live in
[`site-building-lessons.md`](site-building-lessons.md) §3 — load that file when you're about to build
any of these, not just this summary:

- **Header** — a `content` brand widget (plain `h1`/`p` text structure) with a gradient placement
  background, above a `page-navigation` widget (site-wide via `appPageID: null`)
- **Hero** — a `content` widget whose placement gets `backgroundImage`, `backgroundSize: cover`, and
  an explicit `minHeight`, not just padding, or the Player's dark background shows through above/below it
- **Feature/card row** — native `image`/`video` widgets as cards, each placement styled
  `display: inline-block` with an explicit `width`/`minWidth`/`margin` percentage, not a hand-built flex
  `<div>` inside a content widget's HTML (that HTML's own inline styles would mostly be stripped)
- **Footer** — a `content` widget in the `footer` section, site-wide, same `appPageID: null` rule as the header
- **Full-page band (general rule)** — any section meant to visually fill the viewport needs its
  placement's own explicit `background`/`backgroundImage` AND either `minHeight` or generous padding
  set through `styleConfiguration`, never through the content HTML's own inline styles

## Responsive Design Testing

**Breakpoints to test:**

- **Mobile:** 320px (iPhone SE), 375px (iPhone 11), 414px (iPhone 12+)
- **Tablet:** 768px (iPad), 810px (iPad Pro)
- **Desktop:** 1024px+, 1440px, 1920px

**In DevTools:** Use device emulation to test each width. Check:
- Text doesn't overflow
- Touch targets ≥ 44px tall/wide (mobile)
- Layout stacks sensibly on narrow
- Horizontal scroll doesn't appear

## Validation Before Publishing

- [ ] App renders without layout breaks at 320px, 768px, 1024px, 1440px
- [ ] Hard reload (F5) shows fresh styles, not cached old ones
- [ ] Theme tokens are defined and applied
- [ ] No "unstyled" sections (no content widget has an embedded `<style>` block — styling lives in `styleConfiguration`, never `allowScripts: true`, which this tool rejects anyway)
- [ ] Menu theming checked: the fixed `AppNavMenu` top/side bars cannot be restyled by any tool — if the app needs a themed menu, place a `page-navigation` widget instead (see "Layout widgets (nav, branding) don't theme" above), which replaces the fixed bars automatically and IS stylable
- [ ] Real Player (not Designer) rendering verified

---

**See Also:** [site-building-lessons.md](site-building-lessons.md) | [platform-requests.md](platform-requests.md) | [01-app-model.md](01-app-model.md) | [05-integration-guide.md](05-integration-guide.md) | [Procedure: Style & Theme](../../Procedure/AppAgent/05-style-and-theme.md) | [Procedure: Validate App](../../Procedure/AppAgent/06-validate-app.md)
