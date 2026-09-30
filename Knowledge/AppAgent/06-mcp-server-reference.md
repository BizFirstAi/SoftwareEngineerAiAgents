# AppStudio MCP Server Reference

**Complete API reference for `BizFirst.Ai.Mcp.Tools.AppStudio` MCP server.**

## Server Info

| Property | Value |
|----------|-------|
| **Name** | `BizFirst.Ai.Mcp.Tools.AppStudio` |
| **Auth** | Signed-in user session OR tenant-scoped API key |
| **Base path** | `/api/v1/appstudio` (typical) |
| **Format** | REST JSON (POST for queries, PUT for updates, DELETE for removals) |

## Authentication

### API Key Method

```
Authorization: Bearer {api-key}
```

Key generated in admin app, scoped to tenant + user.

### Session Method

Signed-in user with valid tenant scope from auth context.

**Some tools behave differently per auth method** (e.g., field visibility, defaults) — see [site-building-lessons.md](../../Knowledge/App/site-building-lessons.md) for gotchas.

## Endpoint Reference

### Apps

#### `POST /apps/list`
**List all apps** (with paging)

Request:
```json
{
  "pageSize": 50,
  "pageNumber": 1
}
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "appID": "...",
        "name": "...",
        "appCode": "...",
        "description": "...",
        "projectID": "...",
        "configuration": { /* JSON */ },
        "createdOn": "...",
        "lastModifiedOn": "..."
      }
    ],
    "total": 42
  }
}
```

#### `POST /apps/get-by-id`
**Get one app**

Request:
```json
{
  "appID": "..."
}
```

Response: single app object

#### `POST /apps/by-project`
**List apps for a project**

Request:
```json
{
  "projectID": "..."
}
```

Response: app array

#### `POST /apps`
**Create app** (via Project creation — see `/apps/create-project-with-app`)

#### `PUT /apps/{id}`
**Update app**

Request:
```json
{
  "appID": "...",
  "name": "...",
  "description": "...",
  "appCode": "..."
}
```

#### `DELETE /apps/{id}`
**Delete app** (soft delete)

#### `POST /apps/{id}/publish`
**Publish app** (make live)

#### `POST /apps/{id}/create-template`
**Create template from app**

Request:
```json
{
  "appID": "...",
  "name": "Template name",
  "description": "Template description"
}
```

Returns: `templateID`

#### `POST /apps/create-from-template`
**Create new app from template**

Request:
```json
{
  "templateID": "...",
  "name": "New app name",
  "description": "...",
  "projectTypeID": 20
}
```

Returns: `appID`, `projectID`

#### `POST /projects`
**Create Project** (auto-creates App)

Request:
```json
{
  "name": "Project name",
  "description": "What it's for",
  "projectTypeID": 20
}
```

Returns: `projectID`, auto-created `appID`

**Alias:** `create_project_with_app`

### Pages

#### `GET /apps/{appID}/pages`
**List pages**

Response: page array

#### `POST /apps/{appID}/pages`
**Create page**

Request:
```json
{
  "appID": "...",
  "name": "Page name",
  "title": "Shown on page",
  "slug": "page-url-slug",
  "parentPageID": null,
  "isDefault": false
}
```

Returns: `pageID`, full page object

#### `PUT /apps/{appID}/pages/{id}`
**Update page**

Request:
```json
{
  "appID": "...",
  "pageID": "...",
  "name": "...",
  "title": "...",
  "slug": "...",
  "isDefault": false
}
```

#### `DELETE /apps/{appID}/pages/{id}`
**Delete page**

#### `POST /apps/{appID}/pages/reorder`
**Reorder pages**

Request:
```json
{
  "appID": "...",
  "pageIDs": ["page-1", "page-2", "page-3"]
}
```

#### `POST /apps/{appID}/pages/{id}/set-default`
**Mark page as default**

### Sections

#### `POST /apps/{appID}/sections`
**Create section**

Request:
```json
{
  "appID": "...",
  "name": "section-name",
  "isPrimaryContentSection": false,
  "style": { /* CSS props */ }
}
```

Returns: `sectionID`, `sectionName`

#### `PUT /apps/{appID}/sections/{id}/style`
**Update section styling**

Request:
```json
{
  "style": {
    "background": "...",
    "padding": "...",
    "max-width": "..."
  }
}
```

### Widgets (Definitions)

#### `GET /widgets`
**List widget definitions**

Response: widget array

#### `GET /widgets/{id}`
**Get widget definition**

#### `POST /widgets`
**Create widget definition**

Request:
```json
{
  "name": "My widget",
  "widgetType": "content",
  "configuration": { /* widget-specific */ }
}
```

#### `PUT /widgets/{id}`
**Update widget definition**

#### `DELETE /widgets/{id}`
**Delete widget definition**

### AppWidgets (Placements)

#### `GET /apps/{appID}/widgets`
**List placements in app**

Response: AppWidget array

#### `POST /apps/{appID}/widgets`
**Create placement** (place widget in app/page/section)

Request:
```json
{
  "appID": "...",
  "widgetID": "...",
  "appPageID": null,
  "sectionName": "main",
  "displayOrder": 1,
  "configuration": { /* optional override */ }
}
```

Returns: `appWidgetID`, full AppWidget object

#### `PUT /apps/{appID}/widgets/{id}`
**Update placement**

Request:
```json
{
  "appID": "...",
  "appWidgetID": "...",
  "appPageID": null,
  "sectionName": "...",
  "displayOrder": 1,
  "styleConfiguration": { /* CSS */ }
}
```

#### `DELETE /apps/{appID}/widgets/{id}`
**Delete placement**

#### `POST /apps/{appID}/widgets/{id}/set-default`
**Mark placement as default**

### Templates

#### `GET /templates`
**List templates**

Response: template array (name, description, ID only — no full content)

### Discovery

#### `GET /tools/list`
**List available MCP tools**

Returns schema for all endpoints, useful for discovering tool names and parameter shapes.

## Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---|
| 200 | Success | Request OK |
| 400 | Bad Request | Invalid params, malformed config |
| 401 | Unauthorized | Invalid API key or session |
| 403 | Forbidden | User doesn't have access to resource |
| 404 | Not Found | App/page/widget ID invalid |
| 409 | Conflict | Resource already exists (e.g., duplicate page slug) |
| 500 | Server Error | Backend issue (retry after wait) |

## Widget Configuration Validation

Each widget type has a `WidgetTypeCatalog` entry that validates configuration shape.

**If validation fails:**
- Check widget's Tier 1 doc for exact config shape
- Common mistakes: wrong field names, missing required fields, wrong JSON type
- Validator error message usually shows what was invalid

## MCP Tool Gaps & Workarounds

**Known gaps** (as of last documented build):

1. **No `delete_app_completely`** — only soft delete (`Deleted` flag)
2. **No bulk operations** — create/update one at a time
3. **No drag-drop simulation** — must use tool calls (can't automate Designer's canvas DnD)
4. **No style validation** — CSS is accepted as-is; bad CSS renders silently

**Workarounds:**
- Use Designer UI for structural operations when MCP tools are insufficient (rare)
- Test CSS in browser DevTools before applying via MCP
- For full deletes, contact DB team (out of scope for MCP)

## Rate Limits

(If enforced at this endpoint — check with backend team)

Typical: 100 requests/minute per API key. Retry with exponential backoff if hit.

## Real Request Examples

**Create a complete app:**

```javascript
// 1. Create Project + App
POST /projects
{
  "name": "My Store",
  "description": "Online shop",
  "projectTypeID": 20
}
// Returns: projectID, appID

// 2. Update app code
PUT /apps/{appID}
{
  "appCode": "my-store"
}

// 3. Create page
POST /apps/{appID}/pages
{
  "name": "Home",
  "title": "Welcome",
  "slug": "home",
  "isDefault": true
}
// Returns: pageID

// 4. Create section
POST /apps/{appID}/sections
{
  "name": "hero",
  "isPrimaryContentSection": true
}
// Returns: sectionName (auto-generated if not provided)

// 5. Create widget placement
POST /apps/{appID}/widgets
{
  "widgetID": "content-widget-id",
  "appPageID": "home-pageID",
  "sectionName": "hero",
  "configuration": {
    "content": "Welcome to my store!",
    "format": "html"
  }
}

// 6. Publish
POST /apps/{appID}/publish
```

---

**See Also:** [05-integration-guide.md](05-integration-guide.md) | [01-app-model.md](01-app-model.md) | [02-widget-types.md](02-widget-types.md)
