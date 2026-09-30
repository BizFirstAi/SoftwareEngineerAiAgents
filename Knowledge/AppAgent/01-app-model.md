# App Studio — Core Data Model & API

**Source:** `BizFirstAiStudio` app-handlers-core, app-studio-api-client-js, real CRUD endpoints.

## Hierarchy

```
App (AppRecord)
 └─ AppPage (AppPageRecord) — a page; parentPageID for nesting
     └─ AppSection — a layout region (header/nav/footer/content)
         └─ AppWidget (AppWidgetRecord) — one PLACEMENT of a Widget
             └─ Widget (WidgetRecord) — shared definition + config
```

## Critical Concepts

### Widget vs. AppWidget (Never Get This Wrong)

| Aspect | Widget | AppWidget |
|--------|--------|-----------|
| **What it is** | Shared, reusable definition | One PLACEMENT in a specific app/page/section |
| **ID field** | `widgetID` | `appWidgetID` |
| **Contains** | `widgetType`, `configuration`, `name` | `appID`, `widgetID` (FK), `sectionName`, `appPageID`, `displayOrder` |
| **Scope** | Global (shared across apps) | App-scoped (one placement) |
| **Config layer** | Base config | Can override via `styleConfiguration` |

**Key rule:** The SAME Widget definition can be placed many times (`appWidgetID` rows sharing one `widgetID`). Editing the Widget's config affects every placement; placement-specific fields (`showInNav`, `styleConfiguration`) are independent per placement.

### AppSection Is Explicitly Created (CRITICAL GAP)

`AppSection` is a **real, separate, explicitly-created object** — it is NOT auto-created when a widget references its name.

**Confirmed bug:** Calling `create_widget` with `sectionName: "main"` succeeds and writes `AppWidget` rows, but the Designer shows "No layout defined yet" — widgets are silently orphaned. Creating sections requires:
1. Using Designer UI ("+ Add Section"), OR
2. Using `create_section` MCP tool (now available)

**Until sections exist, widgets won't render anywhere.**

### Page Structure & Nesting

- `parentPageID` (nullable, self-referencing FK) — drives nested page menu in `page-navigation` widget
- `null`/`undefined` parentPageID = top-level page
- `isDefault` — which page loads when no specific page is targeted

## AppWidget Fields

| Field | Meaning |
|-------|---------|
| `appPageID` | `null` = shared/default content (shown when no page is targeted). Only meaningful in the primary content section. Layout widgets (header/nav/footer) never set this. |
| `isDefault` | This is the default widget for its section; `widgetID=0` in URL resolves here |
| `showInNav` / `navPosition` | Whether/where nav link appears: `'top'` \| `'side'` \| `null` |
| `routable` | Whether activating this widget updates browser URL |
| `styleConfiguration` | Level-3 style slots (independent per placement — two placements of the same Widget can look different) |
| `sectionName` | The section this placement lives in |

## Real CRUD API

**Base path pattern:** `{apiBaseUrl}/apps/...` (App Studio module)

### Apps

| Action | Endpoint |
|--------|----------|
| List apps | `POST {base}/apps/list` |
| Get app | `POST {base}/apps/get-by-id` |
| List by project | `POST {base}/apps/by-project` |
| Create app | `POST {base}/apps` |
| Update app | `PUT {base}/apps/{id}` |
| Delete app | `DELETE {base}/apps/{id}` (soft delete) |
| Publish app | `POST {base}/apps/{id}/publish` |
| Create template | `POST {base}/apps/{id}/create-template` |
| Create from template | `POST {base}/apps/create-from-template` |

### Pages

| Action | Endpoint |
|--------|----------|
| List pages | `GET {base}/apps/{appId}/pages` |
| Create page | `POST {base}/apps/{appId}/pages` |
| Update page | `PUT {base}/apps/{appId}/pages/{id}` |
| Delete page | `DELETE {base}/apps/{appId}/pages/{id}` |
| Reorder pages | `POST {base}/apps/{appId}/pages/reorder` |
| Set default page | `POST {base}/apps/{appId}/pages/{id}/set-default` |

### AppWidgets (Placements)

| Action | Endpoint |
|--------|----------|
| List placements | `GET {base}/apps/{appId}/widgets` |
| Create placement | `POST {base}/apps/{appId}/widgets` |
| Update placement | `PUT {base}/apps/{appId}/widgets/{id}` |
| Delete placement | `DELETE {base}/apps/{appId}/widgets/{id}` |
| Set default placement | `POST {base}/apps/{appId}/widgets/{id}/set-default` |

### Widget Definitions

| Action | Endpoint |
|--------|----------|
| List widgets | `GET {base}/widgets` |
| Get widget | `GET {base}/widgets/{id}` |
| Create widget | `POST {base}/widgets` |
| Update widget | `PUT {base}/widgets/{id}` |
| Delete widget | `DELETE {base}/widgets/{id}` |

### Sections

| Action | Endpoint |
|--------|----------|
| Create section | `POST {base}/apps/{appId}/sections` |
| (others via Designer UI for now) | |

## Gotchas & Constraints

1. **Configuration is arbitrary JSON** — both Widget and AppWidget store config as JSON. Every config has index signature `[key: string]: unknown` for generic reading.
2. **Widget creation modal vs. safe defaults** — Some types have no sensible zero-config default and ALWAYS go through creation modal (`form`, `image`, `video`, `audio`, `pdf`, `chat-panel`, `workflow-template`, `workflow-template-category`). Others are safe-default drag-to-place.
3. **Widget type registry drives UI** — `WIDGET_TYPE_REGISTRY` is the single source of truth for what types appear in the creation picker. Adding a widget type needs registry entry + real handler package.
4. **Primary content section is required** — Read `AIExt_Apps.Configuration.layout.appSections` to find which section is flagged `isPrimaryContentSection: true` for THIS app. Widgets in non-primary sections won't render on the real Player even if correctly configured.
5. **Bare app-root URL differs from `/page/{slug}`** — `/{appID}?tenantID=...` (no slug) vs. `/​{appID}/page/home` follow different code paths and can diverge. Always test both.

## Project Integration

`Project` is a SEPARATE backend module (`/api/v1/project/projects/*`, NOT App Studio's own `/apps/*`).

**App creation flow now unified:**
1. Create Project (auto-creates its App)
2. User goes through wizard
3. Project ID + App ID returned
4. Both scoped together

The standalone "Create App" bypass has been removed — always route through Project creation.

## Template System

### Create Template from App
Walks real Pages/Widgets/AppWidgets, serializes into schema-versioned JSON (`DataTemplateTypeID 50`), stored in `Template_DataTemplates.ContentData`.

### Create App from Template  
Deserializes and creates BRAND NEW App with brand new Pages/Widgets/AppWidgets. **Every structural entity gets a fresh ID** — nothing is copied.

**Config field classification:**
- **Kept as-is** (shared library refs): Form Widget's `formId` — original form definition isn't cloned
- **Cleared with placeholder** (tenant-private data): Workflow Template Widget's `executionTemplateID`, all media widget URLs
- **Unclassified** (flagged as warning): New widget types need explicit classification in `WidgetConfigTemplateSanitizer`
