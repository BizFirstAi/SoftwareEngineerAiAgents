# Procedure: Style and Theme an App

Apply styling, colors, responsive design, and theming to an app.

## When to Use

- User says "make it look like [color/style description]"
- App exists but looks unstyled/plain
- Applying consistent theme across pages
- Adjusting layout, spacing, fonts, colors

## Key Concepts (Load First)

**Load:** [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md), [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) (§2 for exactly why styling attempts silently fail, §3 for the copy-ready layout recipe)

- **Theme tokens** (`--app-var-*`) — CSS custom properties for colors, fonts, spacing
- **Style Builder system** — Structured style slots (component level, section level, app level)
- **AppSection.style** — Layout, spacing, background per section
- **Widget.styleConfiguration** — Placement-level overrides (two placements of same widget can look different)
- **Style escape hatch** (`css` field) — Raw CSS with hard sanitizer rules

## Steps

1. **Choose color palette**
   - Ask user: what colors/mood? (modern dark, clean light, warm earth, custom?)
   - Load palette examples from [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)
   - Define main color, accent colors, background, text color
   - Create CSS class prefix (e.g., `nh-` for "Nila Herbals")

2. **Apply section-level styling (MCP, if available)**
   - For each page section, try `update_section_style` for background/padding/max-width/alignment —
     but **verify it actually changes the rendered output** before relying on it; it is not in the
     real tool list in at least one verified build (tracked as platform gap P1 in
     [`platform-requests.md`](../../Knowledge/AppAgent/platform-requests.md)). If it doesn't exist or
     has no effect, use the "full-page band" pattern instead — give the section's own content an
     explicit `backgroundImage`/`minHeight` directly through `update_widget_placement`'s
     `styleConfiguration.widgetContainer.style` (camelCase keys — never inline HTML `style=""`, which
     is mostly stripped), per
     [`site-building-lessons.md`](../../Knowledge/AppAgent/site-building-lessons.md) §2–§3. This is
     what avoids the dark/empty voids that show through the Player's default background otherwise.
     - Use theme tokens with prefix: `background: var(--app-var-primary, #123456)`

3. **Apply widget-level styling (MCP)**
   - For each widget, call `update_widget_placement` with `styleConfiguration`:
     - Widget container style (padding, margin, max-width)
     - Content styling (text color, font-size, line-height)
     - Responsive breakpoints (if needed)

4. **Theme variables (optional)**
   - If app uses multiple color schemes, define `--app-var-*` tokens
   - Document in `AppStudioTheme` preset
   - All widgets reference these tokens for consistency

5. **Test responsive design**
   - Resize browser to test mobile, tablet, desktop widths
   - Check that layout doesn't break
   - Adjust responsive breakpoints if needed

6. **Validate theming**
   - Run the full [Design Quality Gate](06-validate-app.md) — "preview looks fine" is not the bar;
     the gate's checklist (dark voids, readable text, visual hierarchy, consistent palette) is
   - Preview in App Player (not just Designer — Player injects default theme)
   - Hard reload (F5) to clear any cached styles
   - Test on different devices/widths
   - Check that no content widget has an embedded `<style>` block at all — `allowScripts: true` is not permitted via MCP, so any `<style>` block is a dead end; style the placement instead via `styleConfiguration.widgetContainer.style` (see [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)). Also remember a content widget's own inline `style=""` attributes are mostly stripped too (backgrounds, grid, sizing lost) — don't rely on them for layout. Full verified details in [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) §2

## Style Builder System

**Three levels** (from most general to most specific):

1. **App level** — Global theme tokens, default fonts
2. **Section level** — AppSection.style (layout, spacing, background per section)
3. **Placement level** — AppWidget.styleConfiguration (widget-specific overrides)

**Each level can override the one above it.**

## Common Style Fields

| Field | Values | Example |
|-------|--------|---------|
| `background` | Color, gradient, image URL | `"#ffffff"` or `"var(--app-var-primary)"` |
| `color` | Text color | `"#333333"` |
| `padding` | CSS spacing | `"16px"` or `"16px 8px"` |
| `margin` | CSS spacing | `"0"` |
| `max-width` | Width constraint | `"1200px"` |
| `font-family` | Font stack | `"'Segoe UI', sans-serif"` |
| `font-size` | Size | `"16px"` |
| `line-height` | Spacing | `"1.5"` |

## Know Issues & Workarounds

1. **Never embed `<style>` in content, and don't rely on inline `style=""` either** — a content widget's `<style>` block requires `allowScripts: true`, which is **not permitted via MCP at all** (verified 2026-11-02) — there is no escape hatch here, don't try. Inline `style=""` attributes written directly in the content HTML are also mostly stripped (backgrounds, grid, sizing lost; only basic text color tends to survive). The only reliable path is `update_widget_placement`'s `styleConfiguration.widgetContainer.style` object with **camelCase** keys — see [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) §2 for the exact list of which style keys the Player actually honors.
2. **Fixed menu can't be themed; the `page-navigation` widget can** — The legacy fixed `AppNavMenu` top/side bars are not a widget (no `WidgetID`), so no tool can style them, period. For a themed menu, `create_widget` a `page-navigation` widget instead — placing one anywhere in the layout automatically replaces the fixed bars, and it reads real, overridable CSS custom properties (`--color-bg-secondary`, `--color-text-secondary`, `--color-bg-tertiary`, `--color-text-primary`, `--color-border` — note: not `--app-var-*`), settable via that widget's own `update_widget_placement` → `styleConfiguration.widgetContainer.css`. `site-branding` genuinely has no theme hook yet — test it explicitly and treat off-theme branding colors as a real, currently-unfixable limitation, not something to keep retrying.
3. **Player theme injection** — App Player always injects default dark theme. Use explicit prefixed classes (`nh-main`, etc.) to override it.
4. **Client-side caching** — Hard reload (F5) required after style changes; refresh alone may not clear cached CSS.

## Styling Best Practices

- ✓ **Use theme tokens** — consistency and easy brand changes
- ✓ **Test in real Player** — Designer canvas theming can differ
- ✓ **Test responsive** — resize and check mobile/tablet widths
- ✓ **Don't over-style** — keep it clean; let typography and spacing do the work
- ✓ **Use Safe defaults** — if theming seems complex, stick to simple color + font choices
- ✓ **Hard reload after changes** — CSS caching can hide your work

## Knowledge

- [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) — verified gotchas, why styling silently fails, copy-ready recipes
- [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) — Full theming system, tokens, Style Builder, examples
- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) — styleConfiguration field details
- [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) → specific widget docs for widget-specific style options
- [platform-requests.md](../../Knowledge/AppAgent/platform-requests.md) — tool limits that aren't agent-fixable

---

**See Also:** [Add Widgets](04-add-widgets.md) | [Validate App](06-validate-app.md)
