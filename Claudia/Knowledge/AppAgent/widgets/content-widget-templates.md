# Content Widget Templates — ready-made starting points an agent can pick from

Companion to `content.md` (the config shape) — this doc is about a specific, real, already-seeded
set of Content Widgets flagged as reusable templates, and the mechanism for placing a copy of one.
Read this BEFORE hand-authoring a Hero/Timeline/Pricing/Testimonial/Feature-grid section from
scratch — a good starting point already exists and can be cloned instead.

## The mechanism, precisely (read this before touching `AIExt_Widgets.IsTemplate`)

`AIExt_Widgets.IsTemplate BIT` (default `0`) marks a widget as a template. A widget flagged this way
is otherwise a completely ordinary `content`-type widget — nothing about `IsTemplate=1` changes how
it renders. It only changes whether it appears in the Toolbox's "Content Widget Template" gallery.

**The one fact that matters most, because getting it backwards silently corrupts data**:
`addWidgetActions.ts` has two functions that look superficially similar but do fundamentally
different things —

- `createWidgetAndPlace` — creates a **brand-new, independent `Widget` row**, then places it. This
  is CLONE semantics. Placing a template MUST go through this path (or its own template-specific
  wrapper, if one exists by the time you're reading this — check `git log`/the current file for a
  `placeTemplateWidget`-style function that seeds `createWidgetAndPlace` from a template's own
  `Configuration`).
- `placeExistingWidget` — takes an **already-existing `WidgetID`** and creates a new placement
  (`AppWidget`) pointing at that *same* row. This is REFERENCE semantics — every placement shares
  one row. Editing content through ANY placement rewrites the shared original, and every other app
  or section that ever placed that same `WidgetID` changes too.

Placing a template via `placeExistingWidget` would mean: the moment a user customizes their copy of
the "Pricing Table" template, they silently rewrite the master template itself — corrupting it for
every future user who picks it from the gallery, and for anyone else's already-placed copy if it
happens to share the same `WidgetID` (it would, since there'd only be one row). `placeExistingWidget`
itself is correct and untouched for its own real, different purpose (deliberately sharing ONE
editable widget across multiple placements in the same app — e.g., a logo widget placed in several
sections that should all update together). Templates need the opposite property: every placement
independent.

## Template count — CORRECTED 2026-11-25: this is NOT a complete or small list anymore

**This doc previously said "the 4 real templates" and stopped there — that was stale even at the time
some readers relied on it.** The 4 below (792-795, seeded 2026-09-12) are real and still present, but
many more templates have been added since under the same `IsTemplate=1` convention (a 2026-11
cross-check against the live seed data found dozens more, covering Hero/CTA/Stats/Team/FAQ/Testimonial-
grid/Pricing-single/Case-Study/and other common landing-page sections). **Do not state a specific
template count from this doc or any other knowledge file — always run the query below first** and use
its actual row count and names for whatever you're about to tell a user or pick from.

The original 4, for illustration only (not the full set):

| WidgetID | Name | Wrapper class | What it is |
|---|---|---|---|
| 792 | Template: Timeline | `.tpl-timeline` | Vertical timeline, year markers + heading + description per entry |
| 793 | Template: Testimonial | `.tpl-testimonial` | Single quote card with avatar placeholder, name, role |
| 794 | Template: Pricing Table | `.tpl-price-*` | 3-tier pricing cards, one visually featured, each with a CTA button |
| 795 | Template: Feature Grid | `.tpl-feat-*` | 3-card icon+title+description grid |

**Always query live for the current, complete list** (don't trust this doc's own copy-paste of the
HTML to stay byte-identical forever either — a future agent may have edited them):

```sql
SELECT WidgetID, Name, Configuration FROM AIExt_Widgets WHERE IsTemplate = 1 AND WidgetType = 'content';
```

## Why they all use `var(--app-var-*)`, and what that means for any NEW template you add

Every color, font, radius, shadow, and spacing value in all 4 templates is a theme-token reference
with a literal fallback, e.g. `background:var(--app-var-color-primary,#4a90d9)` — never a bare hex
value. See `styling-and-common-properties.md` and
`Documentation\WorkManagement\app-studio-theme\design.md` for the full `--app-var-*` contract (19
tokens as of 2026-09-12: the original 12 plus `color-primary-hover`/`link`/`text-inverse`/`success`/
`error`/`button-bg`/`button-text`).

**This is a hard requirement for any new template you add to this gallery, not a style preference**:
a template with hardcoded colors looks fine once, then looks visibly wrong (mismatched against
everything else on the page) the moment the app/tenant applies a different theme — defeating the
entire point of a template gallery. Always write `var(--app-var-{token},{sensible-fallback})`, using
the fallback as what the hex would have been if you'd hardcoded it — the fallback is what renders
before any theme is applied or in a context with no theme engine at all (e.g. this doc's own SQL
query above, read outside a browser).

Buttons specifically should use `button-bg`/`button-text`, not `color-primary`/`text-inverse`
directly — the two are independently overridable per design (a theme's button color need not equal
its primary brand color), see `ThemeTokens.ts`'s own doc comment on `button-bg`/`link` for why they
default equal to `color-primary` but aren't the same token.

## When generating a new page for a user, prefer cloning one of these over hand-authoring equivalent content

If a user asks for a page that plausibly matches one of the shapes in the live template gallery (a
company history / roadmap → Timeline; social proof → Testimonial; a pricing page → Pricing Table; a
"why us" / benefits section → Feature Grid; and many more now — query live, don't assume the gallery
is still just these 4), clone the matching template (via the Toolbox's "Content Widget Template"
gallery, or the same clone-on-add mechanism programmatically) and edit its copy, rather than writing a
new `<style>` block from scratch. This is faster, guaranteed theme-correct, and
avoids re-introducing bugs (browser-vendor CSS quirks, missing wrapper-class scoping, etc.) that the
existing templates have already had shaken out of them.
