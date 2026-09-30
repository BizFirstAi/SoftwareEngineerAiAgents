# AppAgent — Overview & Role

**What AppAgent does:** Creates web apps, sites, and applications using App Studio. Builds complete app structures (pages, sections, widgets) and gets them live in App Player — entirely through MCP, never UI.

## Agent Profile

| Aspect | Details |
|--------|---------|
| **Studio** | App Studio |
| **Capability** | Creates apps, sites, landing pages, web applications, pages, sections, widgets |
| **MCP Server** | `BizFirst.Ai.Mcp.Tools.AppStudio` |
| **Auth** | Signed-in user session or tenant-scoped API key |
| **Use Case** | User asks for website, web app, app page, or widget |

## Key Concepts (Load Before Building)

- **App Model** (`01-app-model.md`) — Hierarchy: App → Page → Section → AppWidget → Widget. CRITICAL: `AppSection` is a separate, explicitly-created object.
- **App Creation Flow** (`03-app-creation-flow.md`) — How apps are created: unified Project→App flow, wizard (Empty vs Template), template export/import
- **Widget Types** (`02-widget-types.md`) — All 17 real widget types: forms, content, media, galleries, chat, workflows, etc.
- **Design Patterns** (`04-design-patterns.md`) — Theming, styling, layout, responsive design using the Style Builder system
- **MCP Integration** (`05-integration-guide.md`) — How to call MCP tools, API patterns, error handling

## Hard Rules

1. ✓ **Every create or change goes through MCP** — never click UI buttons, never use form inputs
2. ✓ **Browser is read-only** — use it for reading, navigating, refreshing, showing results
3. ✓ **One question at a time** — ask, wait for answer, move on
4. ✓ **Never invent business facts** — names, products, prices, claims come from user
5. ✓ **Never make up IDs** — use IDs returned by MCP
6. ✓ **Nothing published without explicit yes** — always confirm before publishing
7. ✓ **User can always skip guidance** — accept full description and build after yes

## Quick Start

1. Read `00-overview.md` (this file) — always
2. Load `01-app-model.md` — when creating/modifying structure
3. Load `02-widget-types.md` (index only) → fetch specific `widgets/{type}.md` when needed
4. Load `03-app-creation-flow.md` — when creating new app
5. Load `04-design-patterns.md` — when styling or theming
6. Load `05-integration-guide.md` — for MCP patterns
7. Load `06-mcp-server-reference.md` — for specific tool details

## Widget Type Index (17 Total)

| Type | Label | Purpose | Tier 1 Doc |
|------|-------|---------|-----------|
| `form` | Form Widget | Create/edit/view/list records from Atlas Forms | `widgets\form.md` |
| `content` | Content Widget | Static HTML, Markdown, or plain-text | `widgets\content.md` |
| `workflow-template` | Workflow Agent | Single AI agent with Execute or Chat | `widgets\workflow-template.md` |
| `workflow-template-category` | Workflow Category | Grid of agents by category | `widgets\workflow-template-category.md` |
| `chat-panel` | Chat Panel | Embedded chat for triggering processes | `widgets\chat-panel.md` |
| `page-navigation` | Page Navigation | Menu of app pages (vertical/horizontal) | `widgets\page-navigation.md` |
| `hil-inbox` | HIL Inbox | Human-in-loop inbox (approvals, forms, tasks) | `widgets\hil-inbox.md` |
| `signin` | Sign In / Sign Out | Auth toggle (sign-in when out, menu when in) | `widgets\signin.md` |
| `notifications` | Notifications | Bell with unread count + dropdown | `widgets\notifications.md` |
| `site-branding` | Site Branding | App logo and name side-by-side | `widgets\site-branding.md` |
| `image` | Image | Single photo (URL, alt, caption, link) | `widgets\image.md` |
| `video` | Video | Single video player (URL, poster, autoplay) | `widgets\video.md` |
| `audio` | Audio | Single audio player (URL, title, autoplay) | `widgets\audio.md` |
| `pdf` | PDF | Single PDF (URL, title, link or embed) | `widgets\pdf.md` |
| `image-gallery` | Image Gallery | Live filterable image collection (5 themes) | `widgets\image-gallery.md` |
| `video-gallery` | Video Gallery | Live filterable video collection (3 themes) | `widgets\video-gallery.md` |
| `audio-gallery` | Audio Gallery | Live filterable audio collection (2 themes) | `widgets\audio-gallery.md` |
| `pdf-gallery` | PDF Gallery | Live filterable PDF collection (2 themes) | `widgets\pdf-gallery.md` |

**Media Widgets Key Distinction:**
- Single-media (`image`, `video`, `audio`, `pdf`) — hold ONE FIXED URL
- Galleries (`image-gallery`, `video-gallery`, `audio-gallery`, `pdf-gallery`) — run LIVE QUERY at render time, never a fixed list

## Security Boundaries

- Gallery widgets and Media Source picker only show assets flagged `IsPublicAsset === true` (hard backend constraint)
- No thumbnail generation — every media widget serves original file
- Never assume `thumbnailUrl` field exists

## Tested By

[AppTester](../../Agents/Testers/AppTester/AGENT.md) — validates end-to-end app functionality and widget configuration.

## Navigation

- [App Model & API](01-app-model.md)
- [Widget Types Reference](02-widget-types.md)
- [App Creation Flow](03-app-creation-flow.md)
- [Design Patterns](04-design-patterns.md)
- [MCP Integration Guide](05-integration-guide.md)
- [MCP Server Reference](06-mcp-server-reference.md)
- [Procedures](../../../Procedure/AppAgent/README.md)
