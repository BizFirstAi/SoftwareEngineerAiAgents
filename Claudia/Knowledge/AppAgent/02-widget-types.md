# Widget Types Reference Index

**Tier 1 On-Demand:** Load only the widget types needed for the current app.

This file is the index. For any specific widget type being configured, load its dedicated doc from the `widgets/` folder.

## All 17 Widget Types

### Interactive & Form

1. **`form`** — Form Widget
   - **Purpose:** Create/edit/view/list records from Atlas Forms
   - **Config:** Requires `formId`
   - **Read:** [widgets/form.md](widgets/form.md)

2. **`workflow-template`** — Workflow Agent
   - **Purpose:** Single AI agent execution with Execute or Chat Now
   - **Config:** Requires `executionTemplateID`
   - **Read:** [widgets/workflow-template.md](widgets/workflow-template.md)

3. **`workflow-template-category`** — Workflow Category
   - **Purpose:** Grid of every agent in one execution-template category
   - **Config:** Requires `executionTemplateCategoryID`
   - **Read:** [widgets/workflow-template-category.md](widgets/workflow-template-category.md)

4. **`chat-panel`** — Chat Panel
   - **Purpose:** Embedded chat window for triggering/conversing with one process
   - **Config:** Requires `processID`
   - **Read:** [widgets/chat-panel.md](widgets/chat-panel.md)

5. **`hil-inbox`** — HIL Inbox
   - **Purpose:** Human-in-the-loop inbox (approvals, forms, tasks)
   - **Config:** None (auth/tenant only)
   - **Read:** [widgets/hil-inbox.md](widgets/hil-inbox.md)

### Navigation & Layout

6. **`page-navigation`** — Page Navigation
   - **Purpose:** Placeable menu of app pages (vertical or horizontal, nested-page aware)
   - **Config:** Yes (layout options)
   - **Read:** [widgets/page-navigation.md](widgets/page-navigation.md)

7. **`site-branding`** — Site Branding
   - **Purpose:** App's logo and name side by side
   - **Config:** Optional
   - **Read:** [widgets/site-branding.md](widgets/site-branding.md)

### Authentication

8. **`signin`** — Sign In / Sign Out
   - **Purpose:** Sign-in link when signed out; user menu with sign-out when signed in
   - **Config:** Optional
   - **Read:** [widgets/signin.md](widgets/signin.md)

### Notifications & Communication

9. **`notifications`** — Notifications
   - **Purpose:** Notifications bell with unread count and dropdown list
   - **Config:** Optional
   - **Read:** [widgets/notifications.md](widgets/notifications.md)

### Content

10. **`content`** — Content Widget
    - **Purpose:** Static HTML, Markdown, or plain-text content
    - **Config:** Yes (`content` + `format`)
    - **Read:** [widgets/content.md](widgets/content.md)

### Media - Single Files

11. **`image`** — Image Widget
    - **Purpose:** Single photo (URL, alt text, caption, object-fit, optional link)
    - **Config:** Requires `imageUrl`
    - **Read:** [widgets/image.md](widgets/image.md)

12. **`video`** — Video Widget
    - **Purpose:** Single video player (URL, poster, caption, autoplay, loop, controls)
    - **Config:** Requires `videoUrl`
    - **Read:** [widgets/video.md](widgets/video.md)

13. **`audio`** — Audio Widget
    - **Purpose:** Single audio player (URL, title, caption, autoplay, loop)
    - **Config:** Requires `audioUrl`
    - **Read:** [widgets/audio.md](widgets/audio.md)

14. **`pdf`** — PDF Widget
    - **Purpose:** Single PDF (URL, optional title, link or inline embed)
    - **Config:** Requires `pdfUrl`
    - **Read:** [widgets/pdf.md](widgets/pdf.md)

### Media - Collections (Live Query)

15. **`image-gallery`** — Image Gallery
    - **Purpose:** Live, filterable collection of public images (5 themes)
    - **Config:** Yes (theme, filter options)
    - **Read:** [widgets/image-gallery.md](widgets/image-gallery.md)

16. **`video-gallery`** — Video Gallery
    - **Purpose:** Live, filterable collection of public videos (3 themes)
    - **Config:** Yes (theme, filter options)
    - **Read:** [widgets/video-gallery.md](widgets/video-gallery.md)

17. **`audio-gallery`** — Audio Gallery
    - **Purpose:** Live, filterable collection of public audio tracks (2 themes)
    - **Config:** Yes (theme, filter options)
    - **Read:** [widgets/audio-gallery.md](widgets/audio-gallery.md)

18. **`pdf-gallery`** — PDF Gallery
    - **Purpose:** Live, filterable collection of public PDFs (2 themes, link or inline embed)
    - **Config:** Yes (theme, filter options)
    - **Read:** [widgets/pdf-gallery.md](widgets/pdf-gallery.md)

## Key Distinction: Single Media vs. Galleries

| Aspect | Single Media (`image`, `video`, `audio`, `pdf`) | Galleries (`*-gallery`) |
|--------|-----|---------|
| **URL handling** | ONE FIXED URL per widget instance | LIVE QUERY at render time |
| **Data model** | Static config | Filters public assets dynamically |
| **Use case** | Specific file, manual management | Browsable collection, auto-updated |
| **Config** | URL field is required | Category/filter options |

**Important:** Galleries are NOT "a list of chosen items" — they run live queries. Never assume gallery config holds a fixed asset list.

## Configuration Pattern

Every widget config is **arbitrary JSON** with an index signature `[key: string]: unknown`. When configuring a widget:

1. Check the widget's Tier 1 doc for required vs. optional fields
2. Some widgets have a creation modal (required fields); some are safe-default drag-to-place
3. Widgets in creation modal: `form`, `image`, `video`, `audio`, `pdf`, `chat-panel`, `workflow-template`, `workflow-template-category`
4. Safe-default widgets: `content`, `page-navigation`, `signin`, `notifications`, `site-branding`, `hil-inbox`, galleries

## Security & Access

- All galleries and media pickers only show assets flagged `IsPublicAsset === true` (hard backend constraint, not UI-only)
- No thumbnail generation — all media widgets serve original uploaded file
- Don't assume `thumbnailUrl` field exists

## Load Strategy

**For any widget type being configured:**

1. Check this index (02-widget-types.md) to understand the widget's purpose
2. Load the widget's Tier 1 doc from `widgets/{type}.md` for full config details
3. Never preemptively load all 17 — load only what's needed for this app

---

**See Also:** [00-overview.md](00-overview.md) — widget type quick summary and complete index
