# Procedure: Style and Theme an App

Apply styling, colors, responsive design, and theming to an app.

## When to Use

- User says "make it look like [color/style description]"
- App exists but looks unstyled/plain
- Applying consistent theme across pages
- Adjusting layout, spacing, fonts, colors

## Key Concepts (Load First)

**Load:** [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)

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

2. **Apply section-level styling (MCP)**
   - For each page section, call `update_section_style`:
     - Background color/image
     - Padding/margin (spacing)
     - Max-width, alignment
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
   - Preview in App Player (not just Designer — Player injects default theme)
   - Hard reload (F5) to clear any cached styles
   - Test on different devices/widths
   - Check that any content widget with an embedded `<style>` block has `allowScripts: true` set — otherwise it's silently stripped (see [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md)); `create_widget` now rejects this case up front, so a tool error here means fix the flag, not the content

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

1. **`allowScripts` bug** — Leaving `allowScripts` at its default `false` on a content widget whose content includes a `<style>` block silently strips it. Set `allowScripts: true` to keep it, or better, drop the `<style>` block and use `update_widget_placement`'s `styleConfiguration` instead. `create_widget` now rejects the unsafe combination with an explicit error rather than letting it fail silently.
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

- [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) — Full theming system, tokens, Style Builder, examples
- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) — styleConfiguration field details
- [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) → specific widget docs for widget-specific style options

---

**See Also:** [Add Widgets](04-add-widgets.md) | [Validate App](06-validate-app.md)
