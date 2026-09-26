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
- A failed tool call still returns HTTP 200. The JSON-RPC result has `isError: true` and a text
  message, e.g. "Access denied: No valid MCP caller identity found".

## Step 1 — Get an API key (the user creates it)

Creating a key is a write, so **the user does it, not the agent**. Open the admin app on a new
tab (navigation only) and guide them:

1. Open `http://localhost:5173/api-keys` (Passport admin, **API Keys**).
2. Ask the user to click **Create**, name the key (e.g. "App Studio agent"), tick the
   **`mcp:app-studio:read`** and **`mcp:app-studio:write`** scopes, and create it. Or they can
   reuse an existing key with those scopes.
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
      if (r.result.isError) throw new Error(text);
      try { return JSON.parse(text); } catch { return text; }
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

These avoid the generic "An error occurred invoking '…'" failure
(`site-building-lessons.md` §12):

1. **Send every property the tool's `inputSchema` lists**, even ones you don't need. Every
   property is marked required. Use `0`, `false`, `""` or `null` for the ones you leave alone.
2. **JSON-string fields** (`configuration`, `styleConfiguration`, `widgetStyle`, `theme`) take a
   string of JSON. Use `"{}"` as "no change", never `""`. Plain-string fields (`widgetCss`,
   `appCode`, `navPosition`) may be `""`.
3. Build `configuration` with `JSON.stringify(obj)` so quotes inside the HTML are escaped.

Example:
```js
await bfMcp.call('create_widget', {
  appID, widgetType: 'content', name: 'Home - Hero', sectionName: 'main', appPageID: homePageID,
  configuration: JSON.stringify({ content: html, format: 'html', allowScripts: true }),
});
```

## Known tool gaps (current build)

Check `bfMcp.tools()` each session. If a missing tool appears, use it and update the procedures.

| Missing | Effect | Workaround used by the procedures |
|---|---|---|
| `update_app` has no `theme` parameter | The app theme can't be set through MCP | Put the chosen palette in every `var()` fallback (`section-recipes.md`) |
| `update_widget_definition` | A widget's content can't be edited | One widget per section. Replace it and hide the old one ([`update-section.md`](update-section.md)) |
| `update_section` (e.g. `widgetLayout`) | A section's layout can't be changed after it's created | Header widgets stack. Style them with `update_widget_placement` |
| Any delete for a widget placement | Placements can't be removed | Hide with `display:none` (`site-building-lessons.md` §15) |
| A publish tool | Can't release through MCP | The user publishes ([`publish-app.md`](publish-app.md)) |
| Image/document upload | Can't add photos | The user uploads images in the app's media library, or gives public image URLs |

The first two (and `delete_project`, plus the Documents and Knowledge MCP modules) existed on
2026-09-14 and were removed by the revert commit `345703c7a` in BizFirstPayrollV3 on 2026-09-17.
Branch `origin/archive/pre-revert-2026-09-17` still has them.
