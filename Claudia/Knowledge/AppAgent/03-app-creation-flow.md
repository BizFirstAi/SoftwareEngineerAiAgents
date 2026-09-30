# App Creation Flow — Project Unification & Template Wizard

**Source:** `BizFirstAiStudio` CreateAppModal, Designer Toolbar, AppTree/ProjectTree panels.

## One Real Path: Project Creates App

**"Create Project" auto-creates its App** through a unified wizard flow:

1. Call `create_project_with_app` (MCP or API)
   - Project name, description, `projectTypeID: 20` (App Studio type)
   - Returns: `projectID` + `appID`
2. User goes through wizard (below)
3. Both created together

**The standalone "Create App" bypass (used to exist in two UI places) has been removed.** Do NOT generate a flow that calls `AppsApiClient.create()` directly — route through Project creation.

## Project Type Routing

`Project_Projects.ProjectTypeID` determines what gets auto-created:

- **Type 20** (App) — App Studio app (current default, everything below)
- **Type 21** (Workflow) — Future Flow Studio process creation path (check current code for end-to-end status)

## The Wizard Flow (`CreateAppModal`)

### Step 1: Empty vs. Template
Large visual choice: start blank or use a template?

### Step 2: Everything Else (Combined Page)
- **(if Template chosen):** Template gallery — live name-only cards fetched from `AppTemplatesApiClient`
- **Name** — App name (required, enables Create button)
- **Description** — What the app does (optional)
- **Industry** — Business vertical (optional)
- **Category** — Business category (optional)

**Create App is enabled the moment Name is filled** — the rest is optional. Fast minimal flow and fuller business-context flow both possible, neither forced.

### Industry & Category Storage

**NOT stored as new columns.** Instead:
1. Create/attach a real `Taxonomy_Records` row
2. Set new App's `TaxonomyRecordID` to point at that row

Don't invent a different storage shape for these fields.

## Create Template from an App

**Endpoint:** `POST {base}/apps/{id}/create-template`

**What it does:**
1. Walks real Pages/Widgets/AppWidgets in the app
2. Serializes into one schema-versioned JSON document
3. Internal temp-ID cross-references between pages/widgets
4. Inserts into `Template_DataTemplates.ContentData` under `DataTemplateTypeID 50` ("New App")

**Output:** Reusable template JSON, no new template type created

## Create App from Template — Reverse with Real ID Semantics

**Endpoint:** `POST {base}/apps/create-from-template`

**Key semantic:** Deserialize template JSON and create BRAND NEW App with brand new Pages/Widgets/AppWidgets.

**Every app-owned structural entity gets a fresh ID** — nothing is copied, everything is cloned with new IDs.

### Config Field Classification

Widget config ID references are classified during cloning:

| Classification | Action | Example |
|---|---|---|
| **Kept as-is** | Shared/library references, not cloned | Form Widget's `formId` — original form definition stays, new app points at same form |
| **Cleared with placeholder** | Tenant-private data, would leak original tenant's data | Workflow Template Widget's `executionTemplateID`, all media widget asset URL fields |
| **Unclassified** | New widget type — flagged as user warning, not guessed | Any new widget type needs explicit classification in `WidgetConfigTemplateSanitizer` |

**For new widget types:** Logic lives in `BizFirst.Ai.AppStudio.Api.Base\Services\WidgetConfigTemplateSanitizer` — decide classification explicitly, don't assume a field that "looks like" `formId` is safe to keep.

## Deleting Apps

**Flow:** Every App create/delete goes through same Project-scoped path now.

**Endpoint:** `DELETE {base}/apps/{id}`

**Behavior:** Soft delete (per codebase convention — `Deleted` flag, not hard row removal)

**Project integration:** A prior delete-orphan gap (un-deletable Apps) was closed. `AppTreePanel` now has real delete action scoped to Project.

## Key Takeaways

- ✓ Always route through **Project** creation, never standalone App creation
- ✓ Wizard is **one combined page** after Empty/Template choice
- ✓ **Create button enabled as soon as Name filled** — rest optional
- ✓ Industry/Category stored via **Taxonomy_Records**, not new columns
- ✓ Templates **clone with new IDs**, classify config fields explicitly
- ✓ Soft deletes via `Deleted` flag, scoped to Project

---

**See Also:** [01-app-model.md](01-app-model.md) — Real CRUD API endpoints | [05-integration-guide.md](05-integration-guide.md) — MCP tool calling
