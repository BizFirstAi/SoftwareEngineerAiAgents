# Connect to the App Studio MCP server from the browser

Every create or change an App agent makes goes through the BizFirst MCP server
(rules in [`AGENTS.md`](../../AGENTS.md)). The agent runs in Claude in Chrome with no MCP connector,
so it calls the server from the studio tab with JavaScript `fetch`. This file covers the API key,
the connection, how to call a tool, and which tools are missing today.

## Facts this relies on (checked in the code, 2026-09-26)

- Endpoint: `https://localhost:10001/mcp` (Streamable HTTP, JSON-RPC), on the Consolidated WebApi.
- CORS allows any `http://localhost:1000-20000` page (so App Studio on 6109 and App Player on
  6130), any header, and exposes the `Mcp-Session-Id` response header. That last part was added
  2026-09-26 and needs a WebApi build that includes it.
- The caller's identity is captured **once, on the `initialize` call**, and used for the whole
  session. Credentials sent only on later calls are ignored.
- App Studio tools need scope `mcp:app-studio:read` (list/get) or `mcp:app-studio:write` (create,
  update, delete) for an API key. A signed-in user's own session also passes.
- A failed tool call still returns HTTP 200, in one of two ways:
  - Access problems and bad arguments come back as `isError: true` with a text message, e.g.
    "Access denied: No valid MCP caller identity found".
  - An App Studio tool that ran but failed replies normally with
    `{"success": false, "errors": [...]}`.
  - The helper below turns both into a thrown error, and returns the `data` part on success.

## Step 1 — Get an API key (the user creates it)

Creating a key is a write, so **the user does it, not the agent**. Open the admin app on a new
tab (navigation only) and guide them:

1. Open `http://localhost:5173/api-keys` (Passport admin, **API Keys**).
2. Ask the user to click **Create**, name the key (e.g. "App Studio agent"), tick the scopes
   **"Read App Studio (MCP)"** (`mcp:app-studio:read`) and **"Write App Studio (MCP)"**
   (`mcp:app-studio:write`), and create it. Or they can reuse an existing key with both scopes.
3. Ask them to paste the key into the chat.
4. **Keep the key only in memory for this session.** Never write it into a file, a widget, a
   page, a URL or the chat summary, and never repeat it back.

If the user can't open API Keys (the page may need an admin account), ask them to have their
tenant admin create a key with those two scopes.

*Alternative, not yet tested:* the user's own sign-in token (`Authorization: Bearer …`) is also
accepted by the MCP guard. Use it only if the user explicitly asks, never by copying a token out
of a URL, and test one read call first. It is not known yet whether every write tool gets a user
id this way.

## Step 2 — Connect (in the Build using AI tab)

Run this once in the App Studio tab where the user pasted the prompt. **Keep that tab as the
agent's working tab and don't navigate it away**: reloading it drops the connection. Show previews
in a second tab ([`preview-and-focus.md`](preview-and-focus.md)).

```js
window.bfMcp = (() => {
  const URL = 'https://localhost:10001/mcp';
  let sid = null, key = null, seq = 0;
  async function post(body) {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
    if (sid) h['Mcp-Session-Id'] = sid;
    if (key) h['X-Api-Key'] = key;
    const r = await fetch(URL, { method: 'POST', headers: h, body: JSON.stringify(body) });
    const s = r.headers.get('mcp-session-id'); if (s) sid = s;
    const t = await r.text(); if (!t) return null;
    const data = t.split('\n').filter(l => l.startsWith('data:')).pop();   // SSE-framed reply
    return JSON.parse(data ? data.slice(5) : t);
  }
  return {
    async connect(apiKey) {
      key = apiKey; sid = null;
      const r = await post({ jsonrpc: '2.0', id: ++seq, method: 'initialize', params: {
        protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'bizfirst-app-agent', version: '1' } } });
      await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
      if (!sid) throw new Error('No Mcp-Session-Id readable: the WebApi needs the 2026-09-26 CORS build (restart it)');
      return r.result.serverInfo;
    },
    async tools() { return (await post({ jsonrpc: '2.0', id: ++seq, method: 'tools/list', params: {} })).result.tools; },
    async call(name, args) {
      const r = await post({ jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args } });
      if (r.error) throw new Error(JSON.stringify(r.error));
      const text = (r.result.content || []).map(c => c.text).join('\n');
      if (r.result.isError) throw new Error(text);               // access denied, bad arguments
      let body; try { body = JSON.parse(text); } catch { return text; }
      // App Studio tools reply {success, errors, data}; a failure is success:false, NOT isError
      if (body && body.success === false) throw new Error(JSON.stringify(body.errors));
      return body && 'data' in body ? body.data : body;
    },
  };
})();
await bfMcp.connect('<the key the user pasted>');
```

Then check it with read-only calls before any write:

1. `bfMcp.tools()`. Keep the list: it tells you which optional tools exist (see "Known tool
   gaps" below).
2. `bfMcp.call('list_widget_types', {})`. It should return the 18 widget types.

If `connect` throws about `Mcp-Session-Id`, the running WebApi is older than the CORS fix. Ask the
user to restart it; after a restart they must sign in to the studio again
(`site-building-lessons.md` §6). If a call says "Access denied", the key is wrong or lacks a scope.
Ask for a correct key and call `connect` again.

## Calling a tool: argument rules

Checked against the tool source (`BizFirst.Ai.Mcp.Tools.AppStudio\Tools\*.cs`, 2026-09-26):

1. **Send every property the tool's `inputSchema` lists**, even ones you don't need: every
   property is listed as required, and leaving a key out causes the generic "An error occurred
   invoking '…'" failure (`site-building-lessons.md` §12).
2. **Use `null` for anything you are not setting.** The update tools (`update_widget_placement`,
   `update_page`, `update_app`) treat `null` as "leave unchanged". Any other value is written:
   `0` moves a widget to the top (`displayOrder`), `false` turns a flag off, `""` or `"{}"`
   replaces the stored value. Never send those as a placeholder.
3. **`appPageID: null` means shared** (shown on every page). `0` is not shared: it ties the
   widget to a page that doesn't exist, so it never shows.
4. **`create_widget` does not set a display order**, so set one right after with
   `update_widget_placement` (see [`create-website.md`](create-website.md) step 7).
5. **JSON-string fields** (`configuration`, `styleConfiguration`, `widgetStyle`) take a string of
   JSON. Build them with `JSON.stringify(obj)` so quotes inside HTML are escaped.
6. `update_app` with `appCode` set changes only the code. Leave `name` and `description` null.
   It returns an error if the code is taken.

Examples:
```js
const w = await bfMcp.call('create_widget', {
  appID, widgetType: 'content', name: 'Home - Hero', sectionName: 'main', appPageID: homePageID,
  configuration: JSON.stringify({ content: html, format: 'html', allowScripts: true }),
});   // w = { widgetID, appWidgetID, widgetType, sectionName }
await bfMcp.call('update_widget_placement', {
  widgetPlacementID: w.appWidgetID, displayOrder: 10,
  styleConfiguration: null, widgetStyle: null, widgetCss: null, showInNav: null, navPosition: null,
});
```
What `bfMcp.call` returns for the creating tools (from the source):
`create_project_with_app` → `{projectID, appID}`; `create_page` → `{appPageID}`;
`create_widget` → `{widgetID, appWidgetID, widgetType, sectionName}`;
`create_section` → `{appID, sectionName, region, isPrimaryContentSection, totalSections}`.

## Known tool gaps (current build)

Check `bfMcp.tools()` each session. If a missing tool appears, use it and update the procedures.

| Missing | Effect | Workaround used by the procedures |
|---|---|---|
| `update_app` has no `theme` parameter | The app theme can't be set through MCP. App Player's default dark theme applies | Put the chosen palette as a local `--app-var-*` block on each widget's wrapper (`section-recipes.md`, "Picking colors") |
| `update_widget_definition` | A widget's content can't be edited | One widget per section. Replace it and hide the old one ([`update-section.md`](update-section.md)) |
| `update_section` (e.g. `widgetLayout`) | A section's layout can't be changed after it's created | Header widgets stack. Style them with `update_widget_placement` |
| Any delete for a widget placement | Placements can't be removed | Hide with `display:none` (`site-building-lessons.md` §15) |
| A publish tool | Can't release through MCP | The user publishes ([`publish-app.md`](publish-app.md)) |
| Image/document upload | Can't add photos | The user uploads images in the app's media library, or gives public image URLs |

The first two (and `delete_project`, plus the Documents and Knowledge MCP modules) existed on
2026-09-14 and were removed by the revert commit `345703c7a` in BizFirstPayrollV3 on 2026-09-17.
Branch `origin/archive/pre-revert-2026-09-17` still has them.
