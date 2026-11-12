# Fix Playbook - generate per-operation data templates for a node type

Use after `debug-runbook.md` concluded: forms exist, but the node has no per-operation template with a
`connector.configuration.profileName` (or has a wrong one). Files only until step 5.

## 1. Inputs

- `<node>`: node type code; `<Group>\<Node>`: its DB-project folder (find with a scoped Glob under
  `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\`).
- The forms: Q1 in the runbook, ordered by `FormID`.
- A reference template: SQL Server's `...\projects\SqlServer\DataTemplates\Template_DataTemplates_91030001_sqlserver-query-execute.data.sql`
  (skeleton in `rag\data-template-anatomy.md`). For a non-database node, copy ports/credential types from that node's existing
  generic template instead of the SQL Server ones (`acceptedCredentialTypes` differs per node).

## 2. Choose an unused ID range (query the DB AND scan the repo)

Used so far (do not reuse): Odoo 91020123..91020157, SQL Server 91030001..91030037, Apify 10000127..10000137 and 10000395.
Next candidate block: `9104xxxx` (unverified free: check).

```sql
-- both DBs the API may serve (database-topology.md); run each, take the max
SELECT MIN(DataTemplateID) AS MinID, MAX(DataTemplateID) AS MaxID, COUNT(*) AS Cnt
FROM dbo.Template_DataTemplates WHERE DataTemplateID BETWEEN 91040000 AND 91049999;
```
```bash
# repo scan, scoped to the DataTemplates parent, no repo-wide grep
find "/c/BizFirstGO_FI_AI/BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/projects" -name "Template_DataTemplates_9104*" | head
```
Pick a block with zero rows in every DB and zero files; reserve `count(forms)` consecutive IDs; tell the user the range.

## 3. Generator approach (pseudo-code, proven on SQL Server)

```
forms = SELECT FormID, PrimaryUsage, FormCode FROM Atlas_Forms
        WHERE Deleted=0 AND PrimaryUsage LIKE 'node-form-<node>-%' AND NodeSubUsage='DesignTime'
        ORDER BY FormID
base  = parse JSON of the reference template's @ContentData          // ports, colours, credential types
id    = firstFreeID
for n, form in enumerate(forms, start=1):
    profileName = form.PrimaryUsage minus leading 'node-form-'         // e.g. sqlserver-query-execute
    (resource, operation) = split profileName tokens after '<node>-'   // review multi-word resources by hand
    label   = "<NodeDisplay> " + Title(resource) + " " + Title(operation)     // TemplateName
    content = clone(base)
    content['design-class']  = profileName
    content.displayName      = label
    content.description      = "<NodeDisplay> <resource> <operation> operation"
    content.settings.data.connector.configuration = {
        profileName, resource, operation,
        flowPath: "", alias: "", enableTrustedExecutionEnvironment: false,
        acceptedCredentialTypes: base.acceptedCredentialTypes }
    row = { DataTemplateID: id, CategoryID: 4, TypeID: 13, ClassificationID: 3,
            TemplateName: label, DisplayOrder: 400 + 10*n }
    sql = render(SQL template, row, JSON.stringify(content, null, 4).replace(/'/g, "''"))
    write file "Template_DataTemplates_<id>_<profileName>.data.sql"  as '﻿' + sql   // UTF-8 BOM
    id += 1
```

Node sketch (run with `node gen.js`, credentials never involved; forms exported to JSON first):
```js
// gen.js - reads forms.json exported by: sqlcmd ... -Q "SELECT FormID, PrimaryUsage FROM ... FOR JSON PATH" -o forms.json (UTF-8)
const fs = require('fs'), path = require('path');
const [node, display, firstID, outDir, refFile] = process.argv.slice(2);
const forms = JSON.parse(fs.readFileSync('forms.json', 'utf8').replace(/^﻿/, ''));
const ref = fs.readFileSync(refFile, 'utf8').replace(/^﻿/, '');
const base = JSON.parse(ref.match(/@ContentData NVARCHAR\(MAX\) = N'([\s\S]*?)'\r?\n\r?\nSET IDENTITY_INSERT/)[1].replace(/''/g, "'"));
let id = Number(firstID);
forms.sort((a, b) => a.FormID - b.FormID).forEach((f, i) => {
  const profileName = f.PrimaryUsage.replace(/^node-form-/, '');
  const tokens = profileName.slice(node.length + 1).split('-');
  const resource = tokens[0], operation = tokens.slice(1).join('-');      // review multi-word resources
  const title = s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const label = `${display} ${title(resource)} ${title(operation)}`;
  const c = structuredClone(base);
  c['design-class'] = profileName; c.displayName = label;
  c.settings.data.connector.configuration = { profileName, flowPath: '', alias: '',
    enableTrustedExecutionEnvironment: false, resource, operation, acceptedCredentialTypes: base.acceptedCredentialTypes };
  const json = JSON.stringify(c, null, 4).replace(/'/g, "''");
  const sql = `SET QUOTED_IDENTIFIER ON\nGO\nBEGIN TRY\n\nDECLARE @ContentData NVARCHAR(MAX) = N'${json}'\n\nSET IDENTITY_INSERT [dbo].[Template_DataTemplates] ON\n\nIF NOT EXISTS (SELECT 1 FROM [dbo].[Template_DataTemplates] WHERE [DataTemplateID] = ${id})\nINSERT [dbo].[Template_DataTemplates] ([DataTemplateID], [DataTemplateCategoryID], [DataTemplateTypeID], [DataTemplateClassificationID], [TemplateName], [ContentData], [IsTemplate], [HasWildCards], [DisplayOrder], [Enabled], [IsPublic], [IsGlobal], [Published], [TenantID], [Deleted], [Archived], [LastModifiedOn], [LastModifiedBy], [CreatedOn], [CreatedBy], [SourceAppID], [ClientAccountID], [AppDomainID], [DataDomainID], [DataSegmentID], [ResID])\nVALUES (${id}, 4, 13, 3, N'${label.replace(/'/g, "''")}', @ContentData, 1, 0, ${400 + 10 * (i + 1)}, 1, 1, 1, 1, 1, 0, 0, SYSUTCDATETIME(), NULL, SYSUTCDATETIME(), NULL, NULL, NULL, NULL, NULL, NULL, NEWID())\n\nSET IDENTITY_INSERT [dbo].[Template_DataTemplates] OFF\n\nEND TRY\nBEGIN CATCH\n    SET IDENTITY_INSERT [dbo].[Template_DataTemplates] OFF; THROW;\nEND CATCH;\nGO\n`;
  fs.writeFileSync(path.join(outDir, `Template_DataTemplates_${id}_${profileName}.data.sql`), '﻿' + sql, 'utf8');
  id++;
});
```
This is a sketch: it is untested here. Dry-run into a scratch folder, diff one output against the reference file, then copy.
Keep `CreatedBy` NULL as in the reference (project standard says CreatedBy is INT).

## 4. Rules for the output

| Rule | Value |
|---|---|
| File name | `Template_DataTemplates_<ID>_<node>-<op>.data.sql` (the SQL Server files use the full profileName, e.g. `..._91030001_sqlserver-query-execute.data.sql`) |
| Folder | `...\dbo\Data\projects\<Group>\<Node>\DataTemplates\` |
| Guard | `IF NOT EXISTS (... WHERE [DataTemplateID] = <ID>)` (re-runnable) |
| Encoding | UTF-8 **with BOM** (icons like emoji in ContentData) |
| Ordering | by `FormID`; `DisplayOrder` = 400 + 10 * n |
| Category / type / class | 4 / 13 / 3 (verify against the node's existing template) |
| Standards | `TenantID` 1, `Deleted`/`Archived` 0, `ResID` NEWID(), `DATETIME` semantics via `SYSUTCDATETIME()` |

**4b - correcting an existing wrong profileName** (casing/hyphen mismatch): prefer editing the repo script for that template and
re-issuing it as an `UPDATE ... SET ContentData = ... WHERE DataTemplateID = <ID>` script the user approves; do not hand-edit rows.

**Old generic templates:** if the node has generic type-13/14 templates without connector block that would duplicate palette
entries, propose deleting their repo files and soft-deleting (`Deleted=1`) the rows only with user approval (SQL Server: both
old files were deleted from the repo). Type-14 card can stay if it has no ports and does not clash.

## 5. Apply (needs user confirmation naming the target DB)

```bash
# local example; loop over the new files only. -f 65001 = UTF-8 codepage, -b stop on error, -I QUOTED_IDENTIFIER
for f in /c/BizFirstGO_FI_AI/BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/projects/<Group>/<Node>/DataTemplates/Template_DataTemplates_9104*.data.sql; do
  sqlcmd -S ".\SQLEXPRESS" -d data-ocean-platform-prod -E -C -f 65001 -b -I -i "$f" || break
done
```
For the remote DB use its host/db with credentials read from appsettings at run time (never in a saved script).
Then clear caches (`rag\caching-layers.md`): user restarts WebApi, Ctrl+F5.

## 6. Verify

```sql
-- DB level: every new template has a connector block and a matching form (binary collation)
SELECT COUNT(*) AS NewTemplates FROM dbo.Template_DataTemplates WHERE DataTemplateID BETWEEN <first> AND <last>;
-- then run runbook Q3 for the node: expect zero findings
```
API level: J2 count increased by the number applied; J1 on a freshly dropped node: `Tier (Profile): 1`, the right form.
UI level: Ctrl+F5, drop each operation, confirm the first form in the dialog matches; existing nodes need re-drop / open+save.

## 7. Log

Append to `DevelopmentHistoryLog.md`: node, ID range, DB written (host/db only), count, evidence, and unverified items.
Update `rag\node-type-status-table.md`. Do not commit unless asked; when the user does ask, commit in the BizFirstFiDB repo
(SQL Server precedent: commit e72dc863 on BizFirstFiDB main).

> POLICY: profile-driven and node-type forms must have Atlas_Forms.DisplayOrder strictly between 100 and 500 (101..499); common forms stay at 1002 and above. See rag/display-order-and-menu.md (section POLICY) for the detector SQL and the normaliser script. Check it in every fix and audit.
