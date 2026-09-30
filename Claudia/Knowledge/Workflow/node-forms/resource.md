# Node Forms Agent - Resource Sheet

Everything the agent needs in one place. Facts verified live 2026-09-20 unless marked "unverified".
Index of deep-dive docs: `.\00-overview.md`.

## 1. Repo paths

| What | Path |
|---|---|
| Docs / this agent | `C:\BizFirstGO_FI_AI\Documentation\Employees\agentic-development-engineers\workflow-development-node-forms\` |
| Sibling runbooks | `..\` (testing\elasticsearch, rag\workflow-nodes-rag, testing) |
| Forms endpoint controller | `BaseNodeFormsController` (route below), inside `BizFirstPayrollV3\src\mvc-server\AI\ProcessEngine\` (exact file: locate with a scoped Glob) |
| Forms service | `BaseNodeFormsService.GetFormsAsync` (same project area) |
| Executor forms partial | `BizFirstPayrollV3\src\mvc-server\AI\ProcessEngine\BizFirst.Ai.ProcessEngine.Service\06_BaseNodeExecutor\Capabilities\BaseNodeExecutor.Forms.cs` |
| Resolver | `BizFirstPayrollV3\src\mvc-server\AI\ProcessEngine\BizFirst.Ai.ProcessEngine.Service\Services\Executor\Service\Base\Forms\NodeFormResolver.cs` (siblings in the same folder: `NodeFormSource.cs`, `ResolutionSummaryBuilderService.cs`) |
| Template cache repo | `BizFirstPayrollV3\src\mvc-server\AI\Template\BizFirstAi.Template.Infrastructure\Repositories\DataTemplateRepository.cs` |
| Frontend store (template merge) | `BizFirstAiStudio\src\flow-studio\packages\flow-studio-store\src\workflowStore.ts` (~lines 274-320) |
| Frontend config dialog | `BizFirstAiStudio\src\flow-studio\packages\flow-studio-designer\src\components\Modals\ConnectorConfigDialog.tsx` (~line 395, `getNodeFormsBySubUsage`) |
| Consolidated WebApi | `BizFirstPayrollV3\src\mvc-server\Solutions\AiUltimate\BizFirst.Ai.Consolidated.WebApi\` (appsettings.json, appsettings.Development.json, `logs\detailed\app-YYYYMMDD.log`) |
| DB project data scripts | `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\<Group>\<Node>\{DataTemplates,Forms,ProcessElementTypes}` |
| Connection notes | `BizFirstFiDB\.claude\connectonstring.md` (read for local details; never copy secrets out of it) |

Folders seen under `...\dbo\Data\projects\`: `00_DataTemplates, Ai, Blockchain, Cloud, Core, DB, Distributed,
Enterprise, FlowAiAgent, Gateways, IaaS, Mail, MySql, Ondo, PostgreSQL, Productivity, Providers, RealEstate,
ScrapeApi, Social, SqlServer, Standard`. SqlServer, MySql, PostgreSQL sit directly under `projects\`; others
(e.g. Elasticsearch) sit under a group (`DB\ElasticSearch`). Find a node's folder with a scoped Glob; do not assume.
Do not apply scripts from folders named `obsolete`, `backup`, `unapproved`, `unsorted` (2794 `.sql` files in total).

## 2. Databases (summary - full detail in `.\database-topology.md`)

| DB | Where | How to reach |
|---|---|---|
| Local | `.\SQLEXPRESS`, database `data-ocean-platform-prod` (DefaultConnection in `appsettings.Development.json`) | `sqlcmd -S ".\SQLEXPRESS" -d data-ocean-platform-prod -E -C` (Windows auth; read-only queries by default) |
| Remote | SQL Server host `15.204.243.180,1433`, database `workstation-1-prod-platform-octopus` | Credentials are in the WebApi's appsettings: **read them from there at run time or ask the user. Never write them into a file or a saved command.** Write access only after explicit user confirmation. |
| Per-tenant copies | `data-ocean-acme-coN-Prod`, `BizFirstAi-acme-coN-Prod` (local) | Not served to tenant `bizfirst`; 1152 type-13 templates each. |

Template/palette data is served from the **remote** DB (evidence 2026-09-20). Always confirm which DB serves the API by
comparing counts/IDs before applying anything.

Useful sqlcmd flags: `-W` trim trailing spaces; `-h -1` no header; `-s "|"` separator; `-f 65001` UTF-8 codepage for
scripts with emoji/unicode; `-b` exit non-zero on error; `-I` QUOTED_IDENTIFIER ON. **`-W` and `-y` are mutually
exclusive.** `ntext` columns need `CAST(col AS NVARCHAR(MAX))` before `LEN`.

## 3. Endpoints

| Purpose | Method + URL | Notes |
|---|---|---|
| Node forms for a node | `GET https://localhost:10001/api/v1/process-engine/node-forms/standard/GetNodeForms/{nodeSubUsage}/{processElementID}?includeSchema=false` | `nodeSubUsage` = `DesignTime`. Needs browser JWT. |
| Palette templates by type | `POST https://localhost:10001/api/v1/ai/template/data-template/by-type` | Body has `DataTemplateTypeID {ID:13}` and `PageSize 10000`; header `X-Tenant-ID: 1`. Copy the exact body shape from DevTools (unverified casing). |
| Template asset endpoints | `/assets` endpoints in `BizFirstAi.Template.Api.Base` | Output-cached (`NodeTemplateCachePolicy`), varied by `X-Tenant-ID` |
| Workflow MCP | `POST https://localhost:10001/mcp` | Section 4 |
| Health | `https://localhost:10001/swagger/index.html` -> 200 | Also `http://localhost:5001` |

Launch profile sets `TENANT_CODE=bizfirst`. Curling local ports is pre-authorised; do not restart the WebApi yourself.

## 4. Workflow MCP handshake (source: `..\..\..\Procedure\Workflow\build-and-verify-workflow-via-mcp.md`)

1. `POST https://localhost:10001/mcp` with headers `Content-Type: application/json`,
   `Accept: application/json, text/event-stream` (without it: `406`) and `X-Api-Key: <value the USER supplies>`.
   Keep the key in an environment variable; never in a file.
2. `initialize` -> read the `mcp-session-id` response header -> `notifications/initialized` -> send `Mcp-Session-Id` on every call.
3. Replies are SSE (`data: {json}`); tool output is a JSON string in `result.content[0].text`.
4. `get_workflow` takes **`processThreadID` only** (a version ID gives a generic error).
5. Send optional params explicitly as `null`; never omit them.
6. `update_node_configuration` **replaces the whole element configuration JSON** and validates against `ConfigurationSchema`
   (`parameters` must be an array, not the string `"[]"`). There is **no MCP tool that writes connector-layer config**.
7. `NODE_TLS_REJECT_UNAUTHORIZED=0` for the dev cert. Loop node ports are `loop` and `done`.

## 5. Browser-authenticated REST via the Chrome page context

GetNodeForms needs the user's JWT. Load the `claude-in-chrome` tools (ToolSearch), open a **new tab** on Flow Studio
(user logged in) and run in the page with `javascript_tool`. The user has authorised reading the token from localStorage
for this; **never print or save the token value**.

```js
// Runs in the Flow Studio page. Returns only non-secret data.
(async () => {
  const token = localStorage.getItem('authToken');   // key name as of 2026-09-20; if null, inspect Application > Local Storage
  const processElementID = 2361;                      // a node of the type under test
  const url = `https://localhost:10001/api/v1/process-engine/node-forms/standard/GetNodeForms/DesignTime/${processElementID}?includeSchema=false`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-ID': '1' } });
  const j = await r.json();
  return JSON.stringify({ status: r.status, summary: j.resolutionSummary ?? j.data?.resolutionSummary });
})()
```
If it 401s or header names differ, copy the real request from `read_network_requests` instead of guessing.

## 6. Tool caveats (this machine)

- **Node, not Python** (Python is not installed). Node 20 `fetch` works.
- **Windows + Git Bash** (POSIX syntax, forward slashes). PowerShell 5.1 has no `&&`.
- **No repo-wide grep**: it times out on `C:\BizFirstGO_FI_AI`. Scope every Grep/Glob to one directory
  (e.g. one `projects\<Node>\` folder) or use `ls` / `find <dir> -maxdepth N`.
- Scripts you generate must be **UTF-8 with BOM** (`fix-playbook.md`).
- Do not start/stop React dev servers; the user manages them.
- Git: never commit/push unless the user asks in that message.
- .NET builds (if ever needed): `dotnet build -m:2`, never clean/rebuild.
- Long heredocs with mixed quotes can break in Git Bash; write files with the Write tool.

## 7. Glossary

| Term | Meaning |
|---|---|
| `PrimaryUsage` | `Atlas_Forms` column, the form lookup key, e.g. `node-form-sqlserver-query-execute` |
| profileName | `connector.configuration.profileName` on a node; equals `PrimaryUsage` minus `node-form-` |
| Data template | `Template_DataTemplates` row; type 13 = palette node, 14 = node-type card, 15 = category |
| Tier | Resolver stage: Settings, Avatar, Profile, NodeType, Common |
| 3-layer config | Layer1 `Extension.Configuration`, Layer2 `Connector.Configuration`, Layer3 `ProcessElement.Configuration` |
