# Procedure: Create App from Template

Clone an existing template and customize it for a new app.

## Template-first: prefer this over building from scratch

A designer-built template already works around the platform's styling limits (no section-background
tool, no real grid widget, heading size not controllable — see
[`site-building-lessons.md`](../../Knowledge/AppAgent/site-building-lessons.md)) the way they were
designed to, before you ever touch it. Building from scratch with raw widgets
([01-create-empty-app.md](01-create-empty-app.md)) is the **fallback**, not the default — it has a
**lower quality ceiling**, because every one of those platform limits applies directly to hand-built
content with no template-level workaround already baked in.

**Before starting any build:** check [`template-catalogue.md`](../../Knowledge/AppAgent/template-catalogue.md)
for a template matching the user's industry/purpose. If one exists, use this procedure. Only fall
back to building from scratch if no reasonable match exists, and tell the user that's what's
happening and why (lower quality ceiling) before you start.

## When to Use

- User says "create an app like [existing app]" or "clone a template"
- User wants to start from a pre-built template instead of from scratch
- Faster than [Create Empty App](01-create-empty-app.md) when structure is known
- **Default choice whenever a template reasonably matches** — see above

## Steps

1. **Get template choice** — ask user which template to clone
   - Can be fetched via `list_templates` MCP call
   - Templates are pre-built, reusable app definitions

2. **Gather customization details**
   - New app name
   - New app description
   - Any content changes (copy, images, links)
   - Any pages to remove or add

3. **Create app from template (MCP)**
   - Call `create_app_from_template`
   - Pass: `templateID`, new app `name`, `description`
   - Returns: new `appID`, `projectID`

4. **Customize as needed**
   - Update pages, widgets, styling via [Add Widgets](04-add-widgets.md) and [Style & Theme](05-style-and-theme.md)
   - Replace placeholder content with user's own content

5. **Preview and publish**
   - Follow preview steps from [Create Empty App](01-create-empty-app.md) Step 8, including the
     mandatory [Design Quality Gate](06-validate-app.md) — a cloned template can still break per-page
     (e.g. content changes placed with the wrong `appPageID`), so don't skip it just because the
     template started out correct
   - Publish when ready (explicit yes required)

## Key Points

- **Every structural entity gets a fresh ID** — nothing is truly copied, all are cloned with new IDs
- **Config field classification:**
  - **Kept as-is:** Form Widget's `formId` (points at original form definition)
  - **Cleared with placeholder:** Workflow Template's `executionTemplateID`, all media widget URLs
  - **New widget types:** Must be explicitly classified; unclassified ones are flagged as warnings
- **Test thoroughly** — cloned apps sometimes have stale data; always verify in real Player

## Knowledge

- [template-catalogue.md](../../Knowledge/AppAgent/template-catalogue.md) — which template to pick, by industry, and its content slots
- [site-building-lessons.md](../../Knowledge/AppAgent/site-building-lessons.md) — verified gotchas that still apply after cloning (e.g. `configuration` as a JSON string on any new `create_widget` call)
- [03-app-creation-flow.md](../../Knowledge/AppAgent/03-app-creation-flow.md) — Template semantics and cloning
- [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md) — MCP patterns

---

**See Also:** [Create Empty App](01-create-empty-app.md) | [Add Widgets](04-add-widgets.md)
