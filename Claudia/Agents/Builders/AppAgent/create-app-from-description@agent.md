# @agent: Create App From Description

Takes a plain-language description of an app a user wants, gathers the specific information needed,
and builds a real, working App Studio app end-to-end — either from an existing template or from
scratch — using the real widgets/pages/API surface documented in
`..\rag\app-studio-rag\`. Read `..\rag\app-studio-rag\00-overview.md`,
`app-model.md`, and `app-creation-flow.md` before starting — this agent is a consumer of that RAG
set, not a replacement for it.

## How to Use This Agent

Ask the user these questions before building anything — don't guess at answers a user should give:

1. **App Name** and a one-line **Description**.
2. **Empty app, or start from a template?** If template: show the real template gallery (query
   `Template_DataTemplates` for `DataTemplateTypeID=50` rows, per `app-creation-flow.md`) and let
   the user pick, or confirm none fit and proceed empty.
3. **Industry** and **Category** (optional, but ask — these attach a real `Taxonomy_Records` row per
   `app-creation-flow.md`; don't skip asking just because they're optional).
4. **What should this app actually let a user do?** Get a real feature list, not just a vibe — e.g.
   "browse a photo gallery," "fill out a request form," "chat with a support agent," "see my
   pending approvals." Map each real feature to a real widget type from the 18 in
   `00-overview.md`'s index — don't invent a widget type or a capability that doesn't exist.
5. **How many pages, and what's on each?** At minimum, confirm a home/landing page and what widgets
   belong on it vs. shared across every page (header/nav/footer-style placements with
   `appPageID: null`, per `app-model.md`).
6. For any widget requiring a real ID (Form Widget's `formId`, Workflow Agent's
   `executionTemplateID`, Chat Panel's `processID`) — confirm the user has (or can point you to) the
   real target, or explicitly agree to defer that widget's real binding for later. Never fabricate a
   plausible-looking ID.

## Agent Prompt

```
Build an App Studio app named "[APP_NAME]" — [DESCRIPTION].

Starting point: [Empty app | Template: TEMPLATE_NAME]
Industry: [INDUSTRY or "skip"]
Category: [CATEGORY or "skip"]

Pages:
1. [PAGE_NAME] ([slug]) — widgets: [WIDGET_TYPE: purpose, WIDGET_TYPE: purpose, ...]
2. ...

Shared (every page): [WIDGET_TYPE: purpose, ...]
```

## What To Do

1. **Create the Project + App** via the real unified flow (`app-creation-flow.md`) — Project auto-
   creates the App; this is the ONLY real creation path, don't call `AppsApiClient.create()`
   directly without a Project.
2. **If starting from a template**: call the real create-from-template endpoint. Report every
   `warnings` entry the response returns to the user plainly — these mean a widget's config
   reference (a Document, execution template, etc.) couldn't be safely cloned and needs
   reconfiguring; don't silently swallow them.
3. **Create each page** the user specified, setting `parentPageId` for any nested pages.
4. **For each widget the user specified**: confirm the widget type's real config shape from its
   `widgets\{type}.md` doc before creating it — don't guess field names. Create the shared Widget
   definition, then place it (`AppWidget`) in the right section/page. Widgets shared across every
   page get `appPageID: null`.
5. **For any widget needing a real ID you don't have** (a Form/ExecutionTemplate/Process): create
   the widget with a placeholder note in its `name` (e.g. "Form Widget — NEEDS formId") rather than
   fabricating a number, and list these clearly in your final report as follow-up items. (Via the
   MCP `create_widget` tool a reference type without a real numeric ID is rejected — in that case
   skip that widget and list it as a follow-up instead.)
6. **Live-verify**: open the app in App Player, confirm every page loads and every widget renders
   without error. Screenshot the result.
7. **Check and report public-access state**: call `get_public_access` with the new `appID` (it
   also checks every widget placement). Report plainly that the app is **private** (the default) —
   or, if the result says otherwise or carries a `warnings` entry (e.g. a widget public while the
   app is private), relay that warning verbatim. **Never attempt to publish the app, make it or any
   widget public, or map a custom domain** — those are human tenant-admin actions in the App Studio
   designer / Passport UI and no tool exists for them; tell the user it is their step to take.
8. **Report back**: what was built, the real App/Project ID (and `resID`), the public-access state
   from step 7, any template-clone warnings, any
   widgets left needing a real ID binding, and the live-verification screenshot.

## Gotchas

- Never use the standalone "Create App" bypass — it was removed (`app-creation-flow.md`); Project
  creation IS App creation now.
- `Industry`/`Category` are NOT new columns on the App — they resolve to a `Taxonomy_Records` row.
  Don't invent a different storage shape.
- Template-cloned widgets get FRESH IDs — never assume a cloned widget's ID matches the original
  template's. Some references (Form Widget's `formId`) are intentionally KEPT as-is (shared library
  resource); others are intentionally cleared (tenant-private data) — see `app-creation-flow.md`'s
  classification table before assuming either behavior for a reference type not covered there.
- No server-side thumbnail generation exists for any media widget — don't promise "the gallery will
  load fast" as a feature; it serves original files.
- Gallery widgets and the Media Source picker only ever surface `IsPublicAsset === true` assets —
  if the user wants to show a specific private asset in a gallery, that's not possible today; say so.
- Via MCP, `create_widget` rejects a `sectionName` that does not exist yet — call `create_section`
  first (mark the page-body section `isPrimaryContentSection: true` if widgets are page-scoped with
  `appPageID`). A form/workflow/chat widget needs a real numeric ID in its configuration (`formId`,
  `executionTemplateID`, `executionTemplateCategoryID`, `processID`) or the call is rejected.
- Apps are private by default and you never change that — see step 7 and `app-creation-flow.md`
  ("Public access").
