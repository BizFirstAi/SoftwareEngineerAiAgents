# App Developer

Builds App Studio apps for a user (web sites and web applications made of pages, sections and
widgets) and gets them live in App Player.

| | |
|---|---|
| **Studio** | App Studio |
| **Pick this agent when** | the user is in App Studio, or asks for a web site, web app, landing page, app page or widget |
| **MCP server** | `BizFirst.Ai.Mcp.Tools.AppStudio` (accepts a signed-in user session or a tenant-scoped API key. Some tools behave differently per auth type, see `site-building-lessons.md`) |

This file is an index only. The knowledge and the steps live in the shared folders below. Load
only what the current request needs.

## Start here

1. Read [`Knowledge/App/00-overview.md`](../../../Knowledge/App/00-overview.md): the widget type
   index. It is the only App file to load every time.
2. Follow [`Procedure/App/create-website.md`](../../../Procedure/App/create-website.md). It is
   the default for any "build me a site/app" request, and it guides the user step by step.

**Every write goes through MCP. The browser is only for reading and showing results** (see the
rules in [`AGENTS.md`](../../../AGENTS.md)).

## Procedures

| Procedure | Use when |
|---|---|
| [`create-website.md`](../../../Procedure/App/create-website.md) | **Default.** Guided build of a web site, web application or content site |
| [`connect-to-mcp.md`](../../../Procedure/App/connect-to-mcp.md) | Calling the App Studio MCP tools from the browser; the API key; known tool gaps |
| [`preview-and-focus.md`](../../../Procedure/App/preview-and-focus.md) | Showing the user what was just built (reload, scroll, highlight) |
| [`update-section.md`](../../../Procedure/App/update-section.md) | Changing or removing a section that already exists |
| [`publish-app.md`](../../../Procedure/App/publish-app.md) | Releasing the app, after the user's explicit yes |
| [`create-app-from-description@agent.md`](../../../Procedure/App/create-app-from-description@agent.md) | Unguided build from one full description, or from a saved template |
| [`add-new-widget-type.md`](../../../Procedure/App/add-new-widget-type.md) | A new widget type was added to the code and needs a knowledge doc (maintenance, not for end users) |

## Knowledge (load on demand)

| File | Load when |
|---|---|
| [`app-model.md`](../../../Knowledge/App/app-model.md) | Creating or changing app structure: App, Page, AppWidget, Widget, and the CRUD API |
| [`app-creation-flow.md`](../../../Knowledge/App/app-creation-flow.md) | Creating a new app: the Project flow, the template wizard, template export/import |
| [`widgets/{type}.md`](../../../Knowledge/App/widgets/) | Configuring a widget. Load only the types the request uses |
| [`section-recipes.md`](../../../Knowledge/App/section-recipes.md) | Writing any page content: ready-made, theme-aware section designs and palettes |
| [`styling-and-common-properties.md`](../../../Knowledge/App/styling-and-common-properties.md) | Styling sections and widgets through the structured style system |
| [`theming.md`](../../../Knowledge/App/theming.md) | Theme variables (`--app-var-*`) |
| [`site-building-lessons.md`](../../../Knowledge/App/site-building-lessons.md) | Building through MCP, including known MCP tool bugs and workarounds |
| [`architecture.md`](../../../Knowledge/App/architecture.md) | Understanding how App Studio works internally |
| [`lessons/README.md`](../../../Knowledge/App/lessons/README.md) | Why a site looks unstyled, and other findings from past work |
| [`mcp-servers/app-studio-mcp-server-design.md`](../../../Knowledge/App/mcp-servers/app-studio-mcp-server-design.md) | Which MCP tools exist and their real routes |

Design history (not needed to build an app): [`Knowledge/App/design/`](../../../Knowledge/App/design/).

## Tested by

[`Agents/Testers/AppTester`](../../Testers/AppTester/AGENT.md)
