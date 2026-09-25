# Known deployed servers — Workflow MCP

Registry of real, externally-reachable deployments an agent might be asked to point MCP tool calls
at, as opposed to `localhost` dev ports. One entry per server. Verify reachability before trusting an
entry blindly — deployments move/change.

## lotus-demo

- **URL**: `http://40.160.138.67/mcp`
- **Host**: `40.160.138.67`. Port 80 (nginx) fronts the Consolidated WebApi + Flow Studio. Ports tried
  and found closed/filtered from outside: 443, 5000-5003, 8080, 8081, 3000, 3001, 8000, 8443, 9000,
  10001. **Correction (2026-09-18): port 8069 is also open** — a real Odoo instance
  (`http://40.160.138.67:8069`, database `bizfirst_test`, confirmed via `/odoo/apps` → 303 and a real
  `/jsonrpc` `common.version` call) — so nginx on port 80 is not the only way into this host; at least
  one other service is directly exposed. Don't assume "port 80 only" from the earlier pass without
  re-checking — see `WorkManagement\email-organizer\design\5.OdooLookupContact\needs-your-input.md` for
  how this workflow uses it.
- **What's actually running here**: the Consolidated WebApi (real REST routes live under
  `/api/v1/...` — e.g. `/api/v1/platform/servers` returns 401 Unauthorized on POST, i.e. real
  backend, auth required; `/swagger/v1/swagger.json` is live and lists the full `api/v1/ai-mcp/*`
  admin surface) plus the Flow Studio frontend (static SPA under `/flowstudio/staticD365/...`).
- **`/mcp` is NOT live as an MCP endpoint (confirmed 2026-09-18)**: `GET /mcp`, `GET /mcp/sse`,
  `POST /mcp`, `POST /mcp/sse` all return nginx's static-file fallback — the exact same 992-byte
  Flow Studio `index.html` (identical `ETag: "6aa94fe4-3e0"`) served for `/`, `/health`, `/mcp`, and
  `/mcp/sse` alike, and POST gets a bare nginx `405 Not Allowed` (nginx itself rejecting the method
  on a static-file location, never reaching a backend). Binoy deployed the API and MCP to this host,
  but nginx has no `location /mcp` (or `/mcp/sse`) proxy block routing to the actual MCP process —
  this looks like a missing/incomplete nginx reverse-proxy config, not the MCP server being down.
  Per `mcp-servers\mcp-servers-and-auth-explained.html`, the real live MCP transport elsewhere in
  this system is `/mcp/sse` (SSE) on the Consolidated WebApi at port 10001 — that internal port is
  one of the ones confirmed closed from outside here.
- **Before using this server for a real MCP tool call**: re-verify `/mcp/sse` isn't still falling
  through to the SPA (compare `ETag`/`Content-Length` against `/` — if they match, it's still the
  static fallback, not a live MCP session) rather than assuming the gap above has been fixed.
