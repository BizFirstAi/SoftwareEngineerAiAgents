# Data Template Anatomy (`Template_DataTemplates`)

Reference file (generated for SQL Server, verified on disk 2026-09-20):
`BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\SqlServer\DataTemplates\Template_DataTemplates_91030001_sqlserver-query-execute.data.sql`

## Template types

| `DataTemplateTypeID` | Meaning | Ports? |
|---|---|---|
| 13 | Palette node (what the user drags) | yes |
| 14 | Node-type catalog card | no |
| 15 | Category | n/a |

Old SQL Server had only two generic templates: 10000054 (type 13) and 40072 (type 14, sortOrder 201) with no connector block.

## Row columns used by generated scripts

`DataTemplateID, DataTemplateCategoryID, DataTemplateTypeID, DataTemplateClassificationID, TemplateName, ContentData, IsTemplate,
HasWildCards, DisplayOrder, Enabled, IsPublic, IsGlobal, Published, TenantID, Deleted, Archived, LastModifiedOn, LastModifiedBy,
CreatedOn, CreatedBy, SourceAppID, ClientAccountID, AppDomainID, DataDomainID, DataSegmentID, ResID`.

Values for the SQL Server set: category 4, type 13, class 3, `IsTemplate=1`, `HasWildCards=0`, `DisplayOrder` 400+10*n,
`Enabled/IsPublic/IsGlobal/Published=1`, `TenantID=1`, `Deleted/Archived=0`, dates `SYSUTCDATETIME()`, `ResID=NEWID()`,
the rest NULL. `IDENTITY_INSERT` is toggled ON around the insert.

## ContentData JSON (skeleton)

```json
{
  "code": "sqlserver",                          // node type code (ProcessElementTypeCode)
  "design-class": "sqlserver-query-execute",
  "displayName": "SQL Server Query Execute",    // palette label
  "category": "database", "color": "#7c3aed", "iconUrl": "...",
  "isAsync": true, "supportsMultipleOutputs": true, "requiresCredentials": true,
  "defaultInputPorts":  [ { "portKey": "main", "portType": "input",  ... } ],
  "defaultOutputPorts": [ { "portKey": "main", ... }, { "portKey": "error", "isErrorPort": true, ... } ],
  "runtime-class": "",
  "settings": {
    "data": {
      "configFormId": "",
      "processElement": { "configuration": { "designer": { "ui": { "nodeType": "sqlserver", "category": "database", ... } } } },
      "connector": {
        "configuration": {                       // <-- THE BLOCK THAT MATTERS
          "profileName": "sqlserver-query-execute",
          "flowPath": "", "alias": "",
          "enableTrustedExecutionEnvironment": false,
          "resource": "query", "operation": "execute",
          "acceptedCredentialTypes": [ { "code": "DATABASE" } ]
        }
      }
    },
    "ui":   { "badgeText": "SQL", "badgeColor": "#7c3aed" },
    "rule": { "requiresConfiguration": true }
  },
  "disabledOnToolbar": false,
  "acceptedCredentialTypes": [ { "code": "DATABASE" } ]
}
```
(Comments are for reading only; real JSON has none. `configFormId` is the legacy key spelling as it appears in the file.)

JSON path to check in SQL: `$.settings.data.connector.configuration.profileName`.

## Script layout (must be reproduced exactly)

1. UTF-8 **with BOM**.
2. `SET QUOTED_IDENTIFIER ON` / `GO`.
3. `BEGIN TRY`, `DECLARE @ContentData NVARCHAR(MAX) = N'...'` (single quotes in JSON doubled).
4. `SET IDENTITY_INSERT [dbo].[Template_DataTemplates] ON`
5. `IF NOT EXISTS (SELECT 1 ... WHERE [DataTemplateID] = <ID>)` then `INSERT ... VALUES (...)`.
6. `SET IDENTITY_INSERT ... OFF`, `END TRY`, `BEGIN CATCH ... OFF; THROW; END CATCH; GO`.

## How the frontend uses it

`workflowStore.ts` finds the template by `designer.ui.dataTemplateID`, else by node type code, and merges its default
`connector.configuration` into the node's connector config on save. The palette loads templates from
`POST /api/v1/ai/template/data-template/by-type` at startup.
