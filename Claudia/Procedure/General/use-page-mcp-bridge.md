# Use the page's MCP bridge (Claude in Chrome)

**Read this first when you run in a browser extension (e.g. Claude in Chrome) on a studio's
Build using AI page.** It is the way to build through MCP from the browser: no API key, no
connector, no clicking in the studio.

## What it is

While a studio's **Build using AI** page is open, the page provides `window.bizfirstAgent`. It
opens the MCP session itself using the **user's own sign-in**. You never see or handle a key or
token, and you must not ask the user for one when the bridge is available.

| Call | What it does |
|---|---|
| `window.bizfirstAgent.studio` | Which studio this is, e.g. `"App Studio"` |
| `await window.bizfirstAgent.mcp.status()` | `{ connected, toolCount, server, error? }`, read-only |
| `await window.bizfirstAgent.mcp.listTools()` | Every tool with its `inputSchema`. Call it before building; tool names and parameters come from here, not from memory |
| `await window.bizfirstAgent.mcp.call(toolName, args)` | Calls one tool and returns its `data`, or throws an Error with the server's message |

The page also shows an **Agent connection (MCP)** card with the same status for the user.

## Steps

1. On the Build using AI page, run `await window.bizfirstAgent.mcp.status()` in the page.
   - `connected: true`: the preflight passes. Continue with the agent's procedure.
   - `window.bizfirstAgent` missing: the user isn't on the Build using AI page. Ask them to open it
     (the robot button in the studio header) and keep that tab open.
   - `connected: false`: tell the user the error shown on the card. If it mentions access or
     sign-in, ask them to sign in to the studio again. Don't fall back to anything else.
2. Run `listTools()` once and keep the list. Use only tools that are in it.
3. Build with `call(...)`. Every property listed in a tool's `inputSchema` must be present in
   `args`; use `null` for anything you're not setting (App Studio update tools treat `null` as
   "unchanged", while `0`, `false`, `""` and `"{}"` overwrite).
4. **Keep this tab on the Build using AI page.** Leaving it removes the bridge. Show results in a
   second tab (open, reload, scroll to the new part) — the browser is only for showing results.

## Rules

- Never create or change anything by clicking or typing in the studio UI. Every write is a `call`.
- Never ask the user to paste an API key or token into the chat when the bridge is available.
- If the bridge isn't available and can't be made available, stop and say so. Never build,
  publish, keep or **offer** a standalone page, theme, artifact or file instead, not even as an
  option or with the user's approval. The only options you offer are ways to restore the bridge.
