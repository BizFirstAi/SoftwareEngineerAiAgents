# Section Recipes: ready-made, theme-aware HTML for `content` widgets

Tier 1 doc. Load it when building or restyling page content for a web site, web application or
content site. It gives an agent a small set of well-designed section patterns to fill with the
user's own words, so a site built through MCP looks finished instead of plain.

Why this exists: the 30 seeded Content Widget Templates (`content-widget-templates.md`) can be
cloned from the Designer's Toolbox, but no MCP tool clones a template widget. An agent building
through MCP writes each `content` widget's HTML itself. These recipes follow every rule in
`site-building-lessons.md` and `theming.md` so that HTML comes out right the first time.

## Rules every recipe follows (do not drop any of them)

1. **`allowScripts: true`** in the widget configuration, or the whole `<style>` block is silently
   stripped (`site-building-lessons.md` §1):
   `{"content": "<div class=\"xx-page\">...</div>", "format": "html", "allowScripts": true}`
2. **Every value is a theme token with a literal fallback**: `var(--app-var-bg,#0f172a)`, never a
   bare hex and never a bare `var()` (`theming.md` §1.2). The 19 token names are in `theming.md`
   §1.3; do not invent others.
3. **Scope every class with a short per-site prefix** (`nh-` for "Nila Herbals"), so two widgets on
   one page never restyle each other.
4. **The outermost wrapper sets its own background** (`site-building-lessons.md` §5), so nothing
   behind the widget shows through between sections.
5. **Backgrounds use longhand properties**: `background-color` + `background-image`, never the
   `background` shorthand with a gradient and a `url()` together (`site-building-lessons.md` §13).
6. **Spacing uses the space unit**: full sections `calc(var(--app-var-space-unit,8px)*10)` vertical
   (never less than `*6`), cards `*3`–`*4`, tight gaps `*2`.
7. **Real type scale**: hero `h1` 44–52px / weight 800, section `h2` 28–32px / 700, card `h3`
   18–19px / 700, body 15–16px / line-height 1.7, eyebrow label 13px / 700 / letter-spacing 2px /
   `color-secondary`.
8. **Buttons use `button-bg` / `button-text`**, links use `link` (`theming.md` §1.3).
9. **Responsive by default**: grids use `repeat(auto-fit, minmax(240px, 1fr))`; rows use
   `flex-wrap: wrap`. No fixed widths wider than a phone.
10. **Only the user's words go in the text.** The recipes hold layout and style; names, claims,
    prices, addresses and phone numbers come from the user (see the procedure).

## How to use them

- **One `content` widget per page**, holding that page's sections in order, wrapped once in
  `<div class="{p}-page">`. Put the shared `<style>` block (base + only the recipes that page
  uses) at the top of that widget. This is the composition the lessons recommend
  (`site-building-lessons.md` §5).
- Replace `{p}` with the site's prefix and every `[[…]]` with the user's approved text.
- Anchor ids (`id="{p}-hero"`) let the agent scroll the browser to a section after building it.

## Base (include once at the top of every page's `<style>`)

```css
.{p}-page{background-color:var(--app-var-bg,#0f172a);color:var(--app-var-text,#e8eef7);font-family:var(--app-var-font-family,system-ui,-apple-system,"Segoe UI",sans-serif);line-height:1.7;font-size:16px}
.{p}-page *{box-sizing:border-box}
.{p}-wrap{max-width:1120px;margin:0 auto;padding:0 calc(var(--app-var-space-unit,8px)*4)}
.{p}-sec{padding:calc(var(--app-var-space-unit,8px)*10) 0}
.{p}-sec.alt{background-color:var(--app-var-bg-panel,#16213a)}
.{p}-eyebrow{display:block;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--app-var-color-secondary,#e8a33d);margin:0 0 calc(var(--app-var-space-unit,8px)*1.5)}
.{p}-page h1,.{p}-page h2,.{p}-page h3{font-family:var(--app-var-font-heading,system-ui,-apple-system,"Segoe UI",sans-serif);color:var(--app-var-text,#e8eef7);margin:0}
.{p}-page h2{font-size:30px;font-weight:700;line-height:1.25;margin-bottom:calc(var(--app-var-space-unit,8px)*2)}
.{p}-page h3{font-size:18px;font-weight:700;margin-bottom:calc(var(--app-var-space-unit,8px)*1)}
.{p}-lead{font-size:18px;color:var(--app-var-text-muted,#9fb0c8);max-width:680px}
.{p}-page p{margin:0 0 calc(var(--app-var-space-unit,8px)*2)}
.{p}-page a{color:var(--app-var-link,#4a90d9)}
.{p}-btn{display:inline-block;padding:calc(var(--app-var-space-unit,8px)*1.5) calc(var(--app-var-space-unit,8px)*3.5);border-radius:var(--app-var-radius,8px);background-color:var(--app-var-button-bg,#4a90d9);color:var(--app-var-button-text,#ffffff)!important;font-weight:700;text-decoration:none;transition:background-color .2s,transform .2s}
.{p}-btn:hover{background-color:var(--app-var-color-primary-hover,#5da0e8);transform:translateY(-1px)}
.{p}-btn.ghost{background-color:transparent;border:2px solid var(--app-var-button-bg,#4a90d9);color:var(--app-var-text,#e8eef7)!important}
.{p}-center{text-align:center}.{p}-center .{p}-lead{margin-left:auto;margin-right:auto}
@media (max-width:640px){.{p}-sec{padding:calc(var(--app-var-space-unit,8px)*6) 0}.{p}-page h2{font-size:24px}}
```

## Recipe 1 — Hero (first section of a home page)

```html
<section class="{p}-hero" id="{p}-hero"><div class="{p}-wrap">
  <span class="{p}-eyebrow">[[eyebrow, e.g. business type]]</span>
  <h1>[[tagline]]</h1>
  <p class="{p}-lead">[[one-line subtext]]</p>
  <div class="{p}-actions"><a class="{p}-btn" href="[[link, e.g. ./products]]">[[button label]]</a>
  <a class="{p}-btn ghost" href="[[second link]]">[[second button label, optional]]</a></div>
</div></section>
```
```css
.{p}-hero{padding:calc(var(--app-var-space-unit,8px)*14) 0 calc(var(--app-var-space-unit,8px)*12);background-color:var(--app-var-bg,#0f172a);background-image:radial-gradient(ellipse at top right,color-mix(in srgb,var(--app-var-color-primary,#4a90d9) 28%,transparent) 0%,transparent 60%)}
.{p}-hero h1{font-size:50px;font-weight:800;line-height:1.1;max-width:760px;margin-bottom:calc(var(--app-var-space-unit,8px)*2.5)}
.{p}-actions{display:flex;flex-wrap:wrap;gap:calc(var(--app-var-space-unit,8px)*2);margin-top:calc(var(--app-var-space-unit,8px)*4)}
@media (max-width:640px){.{p}-hero h1{font-size:34px}}
```
With a photo the user supplied (a public URL): add to `.{p}-hero`
`background-image:linear-gradient(180deg,color-mix(in srgb,var(--app-var-bg,#0f172a) 55%,transparent),color-mix(in srgb,var(--app-var-bg,#0f172a) 92%,transparent)),url('[[image url]]');background-size:cover;background-position:center;background-repeat:no-repeat`.

## Recipe 2 — Feature / benefit cards (3–6 items)

```html
<section class="{p}-sec alt" id="{p}-features"><div class="{p}-wrap {p}-center">
  <span class="{p}-eyebrow">[[eyebrow]]</span><h2>[[heading]]</h2><p class="{p}-lead">[[intro, optional]]</p>
  <div class="{p}-grid">
    <div class="{p}-card"><div class="{p}-icon">[[emoji or 1–2 letters]]</div><h3>[[title]]</h3><p>[[text]]</p></div>
    <!-- repeat per item -->
  </div>
</div></section>
```
```css
.{p}-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:calc(var(--app-var-space-unit,8px)*3);margin-top:calc(var(--app-var-space-unit,8px)*5);text-align:left}
.{p}-card{background-color:var(--app-var-bg,#0f172a);border:1px solid var(--app-var-border,#2a3552);border-radius:var(--app-var-radius,8px);padding:calc(var(--app-var-space-unit,8px)*4);box-shadow:var(--app-var-shadow,0 2px 8px rgba(0,0,0,.24));transition:transform .2s,border-color .2s}
.{p}-card:hover{transform:translateY(-4px);border-color:var(--app-var-color-primary,#4a90d9)}
.{p}-card p{color:var(--app-var-text-muted,#9fb0c8);margin:0}
.{p}-icon{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;margin-bottom:calc(var(--app-var-space-unit,8px)*2);background-color:color-mix(in srgb,var(--app-var-color-primary,#4a90d9) 18%,transparent);color:var(--app-var-color-primary,#4a90d9)}
```
Use the same grid for a product list: put the product name in `h3`, a short description in `p`,
and a price line only if the user gave one.

## Recipe 3 — Text + highlight (about / story)

```html
<section class="{p}-sec" id="{p}-about"><div class="{p}-wrap {p}-split">
  <div><span class="{p}-eyebrow">[[eyebrow]]</span><h2>[[heading]]</h2><p>[[paragraph 1]]</p><p>[[paragraph 2, optional]]</p></div>
  <div class="{p}-panel"><div class="{p}-stat"><strong>[[number]]</strong><span>[[label]]</span></div><!-- 2–4 stats or bullet points --></div>
</div></section>
```
```css
.{p}-split{display:flex;flex-wrap:wrap;gap:calc(var(--app-var-space-unit,8px)*6);align-items:center}
.{p}-split>div{flex:1 1 320px}
.{p}-panel{background-color:var(--app-var-bg-panel,#16213a);border-radius:var(--app-var-radius,8px);padding:calc(var(--app-var-space-unit,8px)*4);display:grid;gap:calc(var(--app-var-space-unit,8px)*3)}
.{p}-stat strong{display:block;font-size:34px;font-weight:800;color:var(--app-var-color-primary,#4a90d9);line-height:1.1}
.{p}-stat span{color:var(--app-var-text-muted,#9fb0c8);font-size:14px}
```
Only show numbers the user actually gave. Without them, use the panel for 3–4 short bullet points.

## Recipe 4 — Steps / process (numbered, because order matters)

```html
<section class="{p}-sec alt" id="{p}-steps"><div class="{p}-wrap">
  <h2 class="{p}-center">[[heading]]</h2>
  <ol class="{p}-steps"><li><h3>[[step title]]</h3><p>[[step text]]</p></li><!-- repeat --></ol>
</div></section>
```
```css
.{p}-steps{list-style:none;counter-reset:s;padding:0;margin:calc(var(--app-var-space-unit,8px)*5) 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:calc(var(--app-var-space-unit,8px)*3)}
.{p}-steps li{counter-increment:s;position:relative;padding:calc(var(--app-var-space-unit,8px)*4);padding-top:calc(var(--app-var-space-unit,8px)*7);background-color:var(--app-var-bg,#0f172a);border-radius:var(--app-var-radius,8px);border:1px solid var(--app-var-border,#2a3552)}
.{p}-steps li::before{content:counter(s);position:absolute;top:calc(var(--app-var-space-unit,8px)*2.5);left:calc(var(--app-var-space-unit,8px)*4);font-weight:800;font-size:22px;color:var(--app-var-color-secondary,#e8a33d)}
.{p}-steps p{color:var(--app-var-text-muted,#9fb0c8);margin:0}
```

## Recipe 5 — Testimonial / quote

```html
<section class="{p}-sec" id="{p}-quote"><div class="{p}-wrap {p}-center">
  <blockquote class="{p}-quote"><p>“[[quote the user supplied]]”</p><cite>[[name]], [[role or place]]</cite></blockquote>
</div></section>
```
```css
.{p}-quote{margin:0 auto;max-width:760px;padding:calc(var(--app-var-space-unit,8px)*5);border-radius:var(--app-var-radius,8px);background-color:var(--app-var-bg-panel,#16213a);border-left:4px solid var(--app-var-color-primary,#4a90d9)}
.{p}-quote p{font-size:21px;line-height:1.6;color:var(--app-var-text,#e8eef7)}
.{p}-quote cite{font-style:normal;font-weight:700;color:var(--app-var-text-muted,#9fb0c8)}
```
Never write a testimonial yourself. Use this recipe only for a real quote the user gives.

## Recipe 6 — Call-to-action band (end of a page)

```html
<section class="{p}-cta" id="{p}-cta"><div class="{p}-wrap {p}-center">
  <h2>[[heading]]</h2><p class="{p}-lead">[[one line]]</p>
  <a class="{p}-btn" href="[[link]]">[[button label]]</a>
</div></section>
```
```css
.{p}-cta{padding:calc(var(--app-var-space-unit,8px)*10) 0;background-color:var(--app-var-bg-panel,#16213a);background-image:linear-gradient(135deg,color-mix(in srgb,var(--app-var-color-primary,#4a90d9) 22%,transparent),transparent 70%)}
```

## Recipe 7 — Contact details

```html
<section class="{p}-sec" id="{p}-contact"><div class="{p}-wrap">
  <h2>[[heading]]</h2><p class="{p}-lead">[[intro]]</p>
  <div class="{p}-grid">
    <div class="{p}-card"><h3>[[e.g. Email]]</h3><p>[[value from the user]]</p></div>
    <!-- phone, address, hours: only the ones the user gave -->
  </div>
</div></section>
```
A real contact **form** is a separate `form` widget bound to an existing Atlas Forms form
(`widgets/form.md`). Never fake a form in HTML: it would have nowhere to send its data.

## Recipe 8 — Footer (shared, placed once with `appPageID` null in the footer section)

```html
<footer class="{p}-footer"><div class="{p}-wrap {p}-footrow">
  <strong>[[site name]]</strong><span>[[short line or © year + name]]</span>
</div></footer>
```
```css
.{p}-footer{background-color:var(--app-var-bg-panel,#16213a);border-top:1px solid var(--app-var-border,#2a3552);padding:calc(var(--app-var-space-unit,8px)*5) 0;color:var(--app-var-text-muted,#9fb0c8);font-family:var(--app-var-font-family,system-ui,-apple-system,"Segoe UI",sans-serif)}
.{p}-footrow{display:flex;flex-wrap:wrap;justify-content:space-between;gap:calc(var(--app-var-space-unit,8px)*2)}
.{p}-footer strong{color:var(--app-var-text,#e8eef7)}
```

## Picking colors when the theme can't be set through MCP

The app theme (`update_app`'s `theme` parameter) is **not available** in the current MCP build (see
`../../Procedure/App/connect-to-mcp.md`, "Known tool gaps"). Until it is, the fallback values
inside each `var()` are what the visitor sees. Choose one palette with the user and use its values
as the fallbacks everywhere. Three starting palettes to offer:

| Palette | bg | bg-panel | text | text-muted | color-primary / button-bg | color-secondary | border |
|---|---|---|---|---|---|---|---|
| **Deep night** (dark, modern) | `#0f172a` | `#16213a` | `#e8eef7` | `#9fb0c8` | `#4a90d9` | `#e8a33d` | `#2a3552` |
| **Fresh light** (clean, bright) | `#f7faf8` | `#ffffff` | `#15261d` | `#5b6e63` | `#2f855a` | `#c47f17` | `#dbe7df` |
| **Warm earth** (natural, calm) | `#faf6f0` | `#ffffff` | `#2e2419` | `#6f5f4d` | `#8a5a2b` | `#4f7a3a` | `#eadfce` |

Set `button-text` to `#ffffff` on all three, `color-primary-hover` to a slightly lighter
`color-primary`, and `link` equal to `color-primary`. When the theme parameter comes back, write
the same values as the app theme instead and the fallbacks stop mattering.
