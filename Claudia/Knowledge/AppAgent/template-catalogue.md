# Template Catalogue

Supports the template-first strategy in [`Procedure/AppAgent/02-create-from-template.md`](../../Procedure/AppAgent/02-create-from-template.md):
prefer `create_app_from_template` with a designer-built template over building from scratch with raw
widgets, whenever a reasonable match exists. Building from scratch is the fallback, and it has a
**lower quality ceiling** — see [`site-building-lessons.md`](site-building-lessons.md) for why
(no section background tool, no real grid widget, heading size not controllable, etc. all apply
equally to a from-scratch build, but a designer-built template's own styling already works around
them where possible).

## Status

**No template IDs below are verified yet.** This table is a placeholder structure — before using it,
call `list_templates` and fill in real `templateID`s, confirm the page list and content slots per
template by reading the actual cloned app once, and mark each row `Verified <date>, AppID <id>` once
checked end to end. Until then, treat every row as **TODO / unverified**.

| Industry | `templateID` | Pages | Content slots to fill | Status |
|---|---|---|---|---|
| Healthcare / wellness | `TODO` | Home, Services, About, Contact | Hero headline/subhead, service list (name + description each), About copy, contact details/hours | **TODO — unverified** |
| Retail / ecommerce | `TODO` | Home, Catalog, Product, Contact | Hero, category list, product cards (name/price/image/description), contact/store info | **TODO — unverified** |
| SaaS / tech | `TODO` | Home, Features, Pricing, Contact | Hero + CTA, feature list, pricing tiers, contact/demo-request copy | **TODO — unverified** |
| Portfolio / creative | `TODO` | Home, Work, About, Contact | Hero, project/work items (image + description each), bio, contact | **TODO — unverified** |
| Nonprofit / community | `TODO` | Home, Mission, Get Involved, Contact | Hero + mission statement, programs/initiatives list, volunteer/donate CTA, contact | **TODO — unverified** |

## How to fill this in

1. Call `list_templates`, match each returned template to the closest industry row above (or add a
   new row if none fits).
2. `create_app_from_template` into a throwaway test app, open it in the real App Player, and record:
   the real page list, every widget that needs user content (not already populated), and any gotcha
   specific to that template (reuse the format in `site-building-lessons.md` §7).
3. Update the row's `templateID`, `Pages`, `Content slots`, and `Status` (`Verified <date>, AppID
   <id>`) together — don't mark Verified without recording which app proved it.

## When no template fits

Fall back to [`01-create-empty-app.md`](../../Procedure/AppAgent/01-create-empty-app.md)'s
from-scratch flow, using the recipes and palette library in
[`site-building-lessons.md`](site-building-lessons.md). Tell the user plainly that the from-scratch
path has a lower quality ceiling than a template (see that file §2 for exactly why) before starting,
so expectations are set up front, not discovered at review time.

---

**See Also:** [site-building-lessons.md](site-building-lessons.md) | [Create from Template](../../Procedure/AppAgent/02-create-from-template.md)
