# App Studio — Design Patterns, Theming & Style System

**Reference for building styled, themed apps with the Style Builder system and theme token cascade.**

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

### "App looks unstyled/thin" (Most Common)

**Root cause:** `allowScripts: true` on a `content` widget silently strips the entire `<style>` block.

**Fix:**
1. Check content widget's `allowScripts` flag
2. Set to `false` if styles are embedded
3. OR move `<style>` outside script block
4. Reload Player (hard F5)

**Why:** Content widgets sanitize HTML for security. The sanitizer's config flags scripts as allowed but then removes their surrounding `<style>` unconditionally.

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

**Root cause:** `site-branding` and `page-navigation` don't fully participate in `--app-var-*` cascade.

**Fix:**
1. Test these explicitly separate from content sections
2. May need custom CSS overrides
3. Document which theme vars actually affect these widgets

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

Both AppWidget and AppSection support a raw `css` field for custom styles:

```json
{
  "css": ".custom-rule { color: red; }"
}
```

**Constraints:**
- Hard sanitizer removes `<script>`, `onclick`, `javascript:` URLs
- Content Security Policy applies
- Keeps CSS, removes event handlers

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
- [ ] No "unstyled" sections (check `allowScripts` flags)
- [ ] Layout widgets tested separately for theming
- [ ] Real Player (not Designer) rendering verified

---

**See Also:** [01-app-model.md](01-app-model.md) | [05-integration-guide.md](05-integration-guide.md) | [Procedure: Style & Theme](../../Procedure/AppAgent/05-style-and-theme.md)
