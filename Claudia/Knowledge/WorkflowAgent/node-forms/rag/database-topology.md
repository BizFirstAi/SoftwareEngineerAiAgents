# Database Topology (critical, easy to get wrong)

The Consolidated WebApi (`BizFirstPayrollV3\src\mvc-server\Solutions\AiUltimate\BizFirst.Ai.Consolidated.WebApi`,
`https://localhost:10001` and `http://localhost:5001`, launchSettings `TENANT_CODE=bizfirst`) uses **two** databases:

| | Local | Remote |
|---|---|---|
| Server | `.\SQLEXPRESS` | `15.204.243.180,1433` |
| Database | `data-ocean-platform-prod` (DefaultConnection, `appsettings.Development.json`) | `workstation-1-prod-platform-octopus` |
| Access | `sqlcmd -S ".\SQLEXPRESS" -d data-ocean-platform-prod -E -C` | credentials from appsettings at run time, or ask the user; never store them |
| Write policy | user confirmation in session | **explicit confirmation naming the DB, every time** |

The log `logs\detailed\app-YYYYMMDD.log` shows connections to both.

Other local DBs (`data-ocean-acme-coN-Prod`, `BizFirstAi-acme-coN-Prod`) are per-tenant copies with 1152 type-13 templates
each; the `bizfirst` tenant API does not serve them.

## Evidence (2026-09-20)

- Template/palette data and MCP-created workflow elements (IDs 2361+) came from the REMOTE DB.
- Inserting the 37 SQL Server templates into the LOCAL DB changed nothing in the UI: the API returned 1172 type-13
  templates, i.e. the local count minus the 37 new rows.

## Rule: identify the serving DB BEFORE fixing

1. Local count: `SELECT COUNT(*) FROM dbo.Template_DataTemplates WHERE DataTemplateTypeID=13 AND Deleted=0;`
2. API count: run `by-type` (runbook J2) and count the array.
3. Compare, and look up one specific known ID (a recently created template, or an MCP-created element ID) in each DB.
4. Same on remote (read-only SELECT, credentials from appsettings) if the local count does not match the API.
5. State the conclusion to the user, naming host and database, before writing.

Verify by calling the API, never by a local SELECT alone.

## Consequence for scripts

The repo scripts are DB-agnostic. The same script may need to run against both databases so the repo, local dev and the
served DB stay consistent; each apply is a separate confirmation. Unverified: whether the remote DB is later synchronised
back from the DB project by a deployment process.
