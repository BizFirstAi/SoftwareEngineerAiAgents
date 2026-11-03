# AppAgent — MCP Integration Guide

**How AppAgent calls MCP to create, configure, and publish apps.**

**Always call `listTools()` (or this server's `tools/list`) first, every session, and trust its
output over the tables below if they disagree.** The REST-style paths and params in this file and in
`AGENT.md` are illustrative of the shape of the API, not a guarantee of what's currently deployed —
some have been verified missing (see
[`site-building-lessons.md`](site-building-lessons.md) §1 for the dated, verified list, including
`update_widget_definition` and a `theme` param on `update_app`, both of which this file used to
describe as available and are not, as of the last live check). Re-verify anything here against your
own `listTools()` call before depending on it.

## Authentication & Setup

### API Endpoint

User provides: `{admin-app-url}/api/v1/...`

Example: `https://admin.bizfirst.com/api/v1/appstudio`

### API Key

1. User generates in admin app's API Keys page
2. Header: `Authorization: Bearer {key}`
3. Key scoped to tenant and user

### TenantID

Included in JWT claims or provided as query/body param, depending on auth method.

## Calling a Tool

**Pattern:**

```
POST {apiEndpoint}/tools/{toolName}
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  "appID": "...",
  "name": "...",
  ...other params...
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "...",
    ...
  }
}
```

**On error:**

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Core MCP Tools

### Apps

| Tool | Purpose | Params |
|------|---------|--------|
| `create_project_with_app` | Create Project + auto-create App | `name`, `description`, `projectTypeID: 20` → returns `projectID`, `appID` |
| `update_app` | Set app code, name, description | `appID`, `appCode`, `name`, `description` |
| `list_apps` | List all apps | (paging) → returns app array |
| `get_app` | Get one app details | `appID` → returns full app object |
| `publish_app` | Publish app (live) | `appID` → returns publish status |
| `delete_app` | Soft-delete app | `appID` |

### Pages

| Tool | Purpose | Params |
|------|---------|--------|
| `create_page` | Add page to app | `appID`, `name`, `title`, `slug`, `parentPageID?`, `isDefault?` → returns `pageID` |
| `update_page` | Edit page | `appID`, `pageID`, `name`, `title`, `slug`, `isDefault?` |
| `list_pages` | Get pages for app | `appID` → returns page array |
| `set_default_page` | Mark page as default | `appID`, `pageID` |
| `reorder_pages` | Reorder pages | `appID`, `pageIDs` (ordered array) |
| `delete_page` | Remove page | `appID`, `pageID` |

### Sections

| Tool | Purpose | Params |
|------|---------|--------|
| `create_section` | Create layout section | `appID`, `name?`, `isPrimaryContentSection?`, `style?` → returns `sectionID`, `sectionName` |
| `update_section_style` | Update section styling | `appID`, `sectionID`, `style` (CSS props) |

### Widgets (Definitions)

| Tool | Purpose | Params |
|------|---------|--------|
| `list_widget_definitions` | Get all reusable Widgets | (paging) → returns widget array |
| `create_widget_definition` | Create reusable Widget | `name`, `widgetType`, `configuration` → returns `widgetID` |
| `update_widget_definition` | Update Widget definition | `widgetID`, `configuration` — **not present in every deployment; verified missing as of a 2026-09-18 live check (see [site-building-lessons.md](site-building-lessons.md) §1). Confirm via `listTools()` before planning an edit-in-place flow around it — if it's absent, a content/config fix means delete + rebuild, not an edit.** |

### AppWidgets (Placements)

| Tool | Purpose | Params |
|------|---------|--------|
| `create_widget` | Place widget in app/page/section | `appID`, `appPageID?`, `widgetID`, `sectionName`, `displayOrder?`, `configuration?` → returns `appWidgetID`. **`configuration` must be passed as a JSON STRING (`JSON.stringify(...)`), not an object — passing an object returns a generic "internal error" with no field-level hint. Verified, AppID 1122.** |
| `update_widget_placement` | Edit placement | `appID`, `appWidgetID`, `appPageID?`, `sectionName?`, `displayOrder?`, `styleConfiguration?`. **`appPageID: null` is what makes a placement site-wide — setting any real `appPageID` on a header/footer region silently scopes it to one page only, even if the tool's own description text suggests otherwise. Verified, AppID 1122.** |
| `list_app_widgets` | Get placements for app | `appID` → returns AppWidget array. **Does not include the widget's name** — join back through `widgetID`, don't look up by name. |
| `set_default_widget` | Mark as default | `appID`, `appWidgetID` |
| `delete_widget` | Remove placement | `appID`, `appWidgetID` — **not present in every deployment; if missing, hide a placement instead with `styleConfiguration: {"widgetContainer":{"css":"display:none"}}`.** |

### Templates

| Tool | Purpose | Params |
|------|---------|--------|
| `list_templates` | Get reusable templates | (paging) → returns template array |
| `create_app_from_template` | Clone template to new app | `templateID`, `name`, `description`, `projectTypeID: 20` → returns new `appID`, `projectID` |
| `create_template_from_app` | Save app as reusable template | `appID`, `name`, `description` → returns `templateID` |

## Sequencing & Dependencies

**Create a complete app:**

1. `create_project_with_app` (everything depends on this)
2. `update_app` (set readable app code)
3. `create_page` (for each page)
4. `create_section` (for each page's layout regions)
5. `create_widget` (for each widget placement)
6. `update_widget_placement` (for styling, if needed)
7. `publish_app` (go live)

**Dependencies:**
- Pages depend on App
- Sections depend on App
- Widgets (AppWidget placements) depend on App + Page + Section + Widget definition
- Section must exist before widgets placed in it

## Error Handling

**Common errors:**

| Error | Cause | Fix |
|---|---|---|
| `Invalid appID` | App doesn't exist | Check app was created and ID is correct |
| `Section not found` | Section doesn't exist | Create section before placing widgets |
| `Invalid widget configuration` | Config shape wrong | Check widget Tier 1 doc for correct shape |
| `Unauthorized` | API key invalid/expired | Regenerate key in admin |
| `Tenant mismatch` | Key scoped to different tenant | Check TenantID matches key |
| `AppPage not found` | Page ID invalid | Check page exists in this app |

## Widget Configuration Shapes

**Each widget type has a different `configuration` shape — and on `create_widget`, the whole thing
must be passed as a JSON STRING, not an object** (see the AppWidgets table above). The objects below
show the shape to stringify, not what to actually send:

**Content Widget** (stringify this object → `configuration: "{\"content\":\"Hello world\",\"format\":\"html\"}"`):
```json
{
  "content": "Hello world",
  "format": "html"
}
```

**Form Widget:**
```json
{
  "formId": 123
}
```

**Image Widget:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "alt": "Description",
  "caption": "Optional caption"
}
```

**Load the widget's Tier 1 doc for exact shape before calling `create_widget`.**

## Styling Configuration

**Widget placement styling:**

```json
{
  "styleConfiguration": {
    "widgetContainer": {
      "style": {
        "padding": "16px",
        "background": "var(--app-var-primary)"
      }
    }
  }
}
```

**Remember the `css` escape-hatch field (not shown above) is far more limited than `style`** — it
accepts exactly one flat declarations block per element, no selectors or braces, and `style` keys must
be camelCase. See [site-building-lessons.md](site-building-lessons.md) §2.

**Section styling:**

```json
{
  "style": {
    "background": "var(--app-var-background)",
    "padding": "32px 16px",
    "max-width": "1200px"
  }
}
```

**Verify this actually changes the rendered page before relying on it** — in some deployments no
section-background tool has any effect at all (tracked as platform gap P1 in
[platform-requests.md](platform-requests.md)); if so, use the "full-page band" pattern in
[site-building-lessons.md](site-building-lessons.md) §2–§3 instead.

## Testing Connection

Before starting any app build, test the connection with a read-only call:

```
POST {endpoint}/apps/list
Authorization: Bearer {key}
Content-Type: application/json

{}
```

Expected response:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": N
  }
}
```

If this fails, authentication/endpoint is wrong — stop and fix before proceeding.

## Browser + MCP Coordination

**Hard rule:** Browser is read-only; all writes through MCP.

**Typical workflow:**
1. Call MCP tool to create/update
2. Wait for success response
3. Refresh app in browser to see changes
4. Show user the result
5. Ask for next step

**Never:**
- Type into Designer forms (write via MCP instead)
- Click Create/Save/Publish buttons (write via MCP instead)
- Use browser's drag-drop for initial structure (use MCP tools instead)

---

**See Also:** [site-building-lessons.md](site-building-lessons.md) | [platform-requests.md](platform-requests.md) | [01-app-model.md](01-app-model.md) | [06-mcp-server-reference.md](06-mcp-server-reference.md) | [Procedures](../../Procedure/AppAgent/README.md)
