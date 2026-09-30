# Preview and focus: show the user what was just built

Used after every MCP write in [`create-website.md`](create-website.md) and
[`update-section.md`](update-section.md). This is the **only** thing the agent does in the
browser UI: navigate, reload, scroll and highlight so the user can see the result. It never
clicks a control that saves, creates, deletes or publishes, and never types into the studio.

## Where to show it (ask the user once, then remember)

| View | URL | Default port |
|---|---|---|
| **App Studio designer** *(default)* | `http://localhost:6109/{app}/page/{slug}` | 6109 |
| **App Player** (what visitors see) | `http://localhost:6130/{app}/page/{slug}?tenantID={tenantID}` | 6130 |

- `{app}` is the AppCode if the app has one, otherwise the numeric AppID. Both work.
- `{slug}` is the page's slug. Leave `/page/{slug}` off to open the app's default page.
- `{tenantID}` is required by App Player. On the designer tab, read it with
  `localStorage.getItem('x-tenant-id')`. If that is empty, ask the user.
- App Player reads the user's sign-in from their existing session. **Never put a token in the
  URL yourself**, and never copy one from another URL.

## Use a second tab for previews

The Build using AI tab holds the MCP connection ([`connect-to-mcp.md`](connect-to-mcp.md)), and
navigating it would drop that connection. Open a **second tab** for previews the first time, and
reuse it after that.

## Steps

1. **Reload the preview tab.** Neither the designer nor App Player picks up server changes on its
   own, so after every MCP write navigate the preview tab to the URL above (or reload it if it's
   already there).
2. **Wait for the page to load**, then find the section:
   - A section built from a recipe has its own id, so use `document.getElementById('{p}-hero')`.
   - A whole App Studio section (header, main, footer):
     `document.querySelector('[data-section="' + CSS.escape(name) + '"]')`.
   - One widget placement: `document.querySelector('[data-widget="' + appWidgetID + '"]')`.
3. **Scroll and highlight** (display only, nothing is saved):
   ```js
   const el = document.getElementById('nh-hero');
   el.scrollIntoView({ behavior: 'smooth', block: 'start' });
   const old = el.style.outline;
   el.style.outline = '3px solid #f5a623'; el.style.outlineOffset = '4px';
   setTimeout(() => { el.style.outline = old; }, 2500);
   ```
   In the designer the canvas scrolls inside its own panel. `scrollIntoView` handles that. The
   canvas is not an iframe, so `document` reaches it.
4. **Take a screenshot** and look at it before asking the user. If the section looks unstyled
   (default blue links, text against the edge), check that its widget config has
   `"allowScripts": true` and a `<style>` block (`site-building-lessons.md` §1) before telling the
   user it is done.

## If the page asks the user to sign in

The session has expired, for example after the WebApi restarted (`site-building-lessons.md` §6).
Stop and ask the user to sign in again. **Never fill in a sign-in form yourself.**
