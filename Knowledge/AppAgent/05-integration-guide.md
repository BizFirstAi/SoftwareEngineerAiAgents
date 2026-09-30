# AppAgent — MCP Integration Guide

**How AppAgent calls MCP to create, configure, and publish apps.**

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
| `update_widget_definition` | Update Widget definition | `widgetID`, `configuration` |

### AppWidgets (Placements)

| Tool | Purpose | Params |
|------|---------|--------|
| `create_widget` | Place widget in app/page/section | `appID`, `appPageID?`, `widgetID`, `sectionName`, `displayOrder?`, `configuration?` → returns `appWidgetID` |
| `update_widget_placement` | Edit placement | `appID`, `appWidgetID`, `appPageID?`, `sectionName?`, `displayOrder?`, `styleConfiguration?` |
| `list_app_widgets` | Get placements for app | `appID` → returns AppWidget array |
| `set_default_widget` | Mark as default | `appID`, `appWidgetID` |
| `delete_widget` | Remove placement | `appID`, `appWidgetID` |

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

**Each widget type has a different `configuration` object.** Examples:

**Content Widget:**
```json
{
  "configuration": {
    "content": "Hello world",
    "format": "html"
  }
}
```

**Form Widget:**
```json
{
  "configuration": {
    "formId": 123
  }
}
```

**Image Widget:**
```json
{
  "configuration": {
    "imageUrl": "https://example.com/image.jpg",
    "alt": "Description",
    "caption": "Optional caption"
  }
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

**See Also:** [01-app-model.md](01-app-model.md) | [06-mcp-server-reference.md](06-mcp-server-reference.md) | [Procedures](../../Procedure/AppAgent/README.md)
