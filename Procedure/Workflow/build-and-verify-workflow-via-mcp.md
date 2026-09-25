# Runbook — build and verify a real workflow via the Workflow MCP tools

Written after the first real end-to-end write-path test of the Workflow MCP module (2026-09-10,
`..\..\Agents\Testers\WorkflowTester\test-results\sample-workflow-mcp-test\`). That pass found and fixed three real bugs by
actually building something, not by reading code — this runbook exists so the next agent doing this
doesn't have to rediscover the same traps.

## The sequence

1. `tools/list` first, always. Don't guess a tool's param names or shapes — they drift (e.g.
   `add_workflow_node` takes `configuration`; `update_node_configuration` takes `configurationJson`
   — same concept, different key, easy to get wrong by analogy).
2. `create_workflow_project` once, to get `processThreadID`/`processThreadVersionID` — every other
   tool call in the session targets these IDs.
3. `get_node_type_schema` for every distinct node type before configuring it. **Cross-reference the
   result against this node's own `nodes\{code}.md` doc, don't just trust the tool output** — the
   schema comes straight from the DB `ConfigurationSchema` column, which this doc set's own
   `00-overview.md` already documents as unreliable per node type. The `email-smtp` `username`/
   `userName` casing trap (documented in `email-smtp.md`'s Gotchas section for a long time before
   anyone actually hit it live) is the concrete proof this cross-check matters, not a hypothetical.
4. `add_workflow_node` per node (or `save_workflow` for a bulk/atomic build of several at once).
5. `add_connection` to wire ports. Every optional field in its schema (`sourcePortKey`,
   `targetPortKey`, `connectionTypeId`, `condition`) still needs to be sent explicitly (`null` if
   unused) — omitting an optional key crashes the SDK's argument binder before the tool method ever
   runs, a general gotcha across every tool in every module, not specific to this one.
6. `get_workflow` to confirm the round trip.
7. **Verify at three independent levels, not just one**: the MCP response, a direct SQL query
   against `Process_ProcessElements`/`AIExt_Connectors`/`Process_Connections` (confirms the
   Connector-pairing invariant — one Connector row per node, correctly linked — at the data layer,
   not just "the API said success"), and the real Flow Studio Designer UI (confirms the node
   actually renders and its config dialog opens with the right values — an MCP-created node that
   looks fine via MCP but is broken/uneditable in the real UI is the specific failure mode this
   module's own design doc flagged as the highest risk).
8. If wiring a credentialed node (SMTP, any OAuth-based node, etc.), call `find_credentials` first
   to check for a reusable one — never fabricate a fake credential or attempt a real send/call with
   one just to "complete" a test. A missing credential is an honest, reportable blocker, not a
   failure to work around.

## Reusable diagnostic pattern: use SQL to settle ambiguity, not just re-reading via MCP

When an MCP response and your expectation disagree, a direct read-only `SELECT` against the real
tables (see `C:\BizFirstGO_FI_AI\BizFirstFiDB\.claude\connectonstring.md` for connection details) is
faster and more conclusive than re-calling the same MCP tool again. This is how the `list_workflows`
pagination bug in this pass was confirmed as real (rather than a fluke): the tool's own
`totalRecords: 65` field, from the *outer* unfiltered query, already contradicted its own
`workflows: []` result for a row that demonstrably existed — worth noticing in the raw JSON itself
before reaching for SQL, but SQL is what confirms root cause once you suspect a filtering/pagination
bug specifically.

## Known, general gotchas to expect (not re-derive)

- **Explicit `null`, never an omitted key**, for every optional MCP tool parameter across every
  module — an SDK-level constraint, not per-tool.
- **A tool's advertised schema (from the DB) can silently diverge from what the real executor
  reads** — this doc set's whole reason for existing. `get_node_type_schema`'s live output is a
  starting point, not a guarantee; the per-node `nodes\{code}.md` doc's Gotchas section is where the
  divergence, if any, is already recorded.
- **Client-side filtering after server-side pagination is a real, recurring bug shape** in this
  codebase — the same defect (filter a substring match against only the first fetched page, report
  the pre-filter total) was independently found in both this module's `list_workflows` and, in an
  earlier session pass, Atlas Forms' form-search feature. If a new discovery/search-style MCP tool
  is added anywhere in this system, check explicitly whether its filter runs before or after
  pagination.
- **The Designer UI's own config-dialog form can have a field-to-JSON-key binding that's
  independent of both the DB schema and the executor** — fixing the schema doesn't guarantee the
  human-facing form picks up the correct value. Confirmed live for `email-smtp`'s `Username` field
  (still shows a placeholder after the schema fix); not yet confirmed whether this is isolated to
  this one node type or a broader Designer-form pattern — a real open question for whoever picks
  this up next.

## Driving the MCP endpoint from a shell (no MCP client attached)

Added 2026-09-20. Use this when the session has no Flow Studio MCP tools but the WebApi is up on port 10001.

1. POST JSON-RPC to `https://localhost:10001/mcp` with headers `Content-Type: application/json`,
   `Accept: application/json, text/event-stream` (without it: `406`) and `X-Api-Key: <scoped key>`
   (without an identity every tool answers `Access denied: No valid MCP caller identity found`).
2. Handshake: `initialize` → read the `mcp-session-id` response header → `notifications/initialized` →
   then send `Mcp-Session-Id` on every call. Replies are SSE (`data: {json}` lines); tool output is a JSON string in
   `result.content[0].text`.
3. Use Node (`fetch`) for scripting; Python is not installed on this machine. The dev cert needs
   `NODE_TLS_REJECT_UNAUTHORIZED=0`. Keep the API key in an environment variable, never in a committed file.
4. `get_workflow` takes `processThreadId` only. `add_workflow_node` returns `{processElementID}`; `add_connection`
   returns `{connectionID}`.
5. Check port keys with `get_node_type_schema` before wiring: `loop` outputs `loop` and `done`, not `main`.
6. Credentials that exist on another environment's database are absent locally: run `find_credentials` and leave
   the field unbound rather than reuse a stale ID.

Worked example: LeadFirst→Odoo recreation, project 1094 / thread 1079 / version 1077 (see
`Documentation\projects-worflow\leadFirst-to-Odoo\`).

## Lesson: nodes built through the MCP need their template and connector set (added 2026-09-20)

Nodes added with add_workflow_node have no designer.ui.dataTemplateID and an empty connector configuration. The first time the workflow is saved in Flow Studio the designer stamps the connector from the LAST template registered for the node code (odoo -> odoo-custom-delete, apify -> apify-key-value-store-get-record), including a wrong resource/operation. To avoid it:
1. After add_workflow_node, call update_node_configuration with the full configuration plus designer.ui.dataTemplateID (the per-operation template ID) and profileName; use real types (parameters as an array, Odoo fields as an object).
2. Verify the connector with POST /api/v1/ai-extension/connectors/get-by-id and, if wrong, correct it with PUT /api/v1/ai-extension/connectors/{id} using the browser session (the MCP cannot write connector config).
3. Verify the form with GET /api/v1/process-engine/node-forms/standard/GetNodeForms/DesignTime/{processElementID} (expect one Tier (Profile) form matching the operation, DisplayOrder 101..499, listed above the common forms).
See workflow-development-node-forms\lessons\README.md and its rag\ folder for the full mechanism, the DisplayOrder policy and the ASCII-script rule.

## Lesson: create apps as Workflow apps (added 2026-09-20)

The Flow Studio dashboard tabs (All / Web Apps / Workflow Apps) filter on `Project_Projects.ProjectTypeID`: Workflow Apps
shows only `ProjectTypeID = 21` (Project_ProjectTypes Code `WORKFLOW`); Web Apps shows everything else. `AIExt_Apps.AppTypeID`
plays no part (it is NULL for workflow apps). A project created with a NULL type silently vanishes from the Workflow Apps tab.

- `create_workflow_project` and the Flow Studio "+ Create Project" button share `StudioProjectService.CreateProjectWithStructureAsync`;
  it now sets the WORKFLOW type (looked up by Code, never a hard-coded ID). MCP tools for App Studio create web apps and are unaffected.
- Verify: open the dashboard "Workflow Apps" tab, or run
  `SELECT ProjectID, Name, ProjectTypeID FROM Project_Projects WHERE ProjectID = <id>` (expect the ID of Code WORKFLOW, 21 locally;
  `SELECT ProjectTypeID FROM Project_ProjectTypes WHERE Code = 'WORKFLOW'`).
- Repair an existing project: `UPDATE Project_Projects SET ProjectTypeID = (SELECT ProjectTypeID FROM Project_ProjectTypes WHERE Code='WORKFLOW'), LastModifiedOn = GETDATE() WHERE ProjectID = <id>` (roll back by setting it to NULL).
  Check the Project row exists first: the App row (`AIExt_Apps.ProjectID`) can exist while the Project row does not.
- Code changes reach the running API only after rebuild/republish of the consolidated WebApi and an app-pool recycle; until then
  fix newly created MCP projects with the UPDATE above.
