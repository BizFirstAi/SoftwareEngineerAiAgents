# Audit All Data Templates (all node types)

Repeatable, read-only. Purpose: list every node type whose forms and palette templates do not line up, so
`..\..\..\Knowledge\Workflow\node-forms\node-type-status-table.md` can be filled from facts. Run against the DB the API actually serves
(`..\..\..\Knowledge\Workflow\node-forms\database-topology.md`); repeat for the other DB if in doubt.

## Findings reported

| Code | Meaning |
|---|---|
| FORM_NO_TEMPLATE | `Atlas_Forms` `node-form-<x>` with no type-13 template whose profileName equals `<x>` (exact) |
| TEMPLATE_NO_FORM | template profileName with no form `node-form-<profileName>` |
| NO_CONNECTOR_BLOCK | type-13 template with no `settings.data.connector.configuration` |
| NO_PROFILENAME | connector block present but profileName empty |
| CASE_MISMATCH | matches a form only after normalising case/hyphens (e.g. `odoo-contact-getAll` vs `node-form-odoo-contact-get-all`) |
| DUPLICATE_PALETTE | same node code + TemplateName, or same profileName, on more than one live type-13 row |

Forms that are NodeType-tier (`node-form-<nodeTypeCode>`, no operation suffix) and `node-form-common` are excluded from
FORM_NO_TEMPLATE (they do not need a profileName). The exclusion below uses the registry table
(`Process_ProcessElementTypes.ProcessElementTypeCode`, column name unverified).

## Ready-to-run SQL

```sql
;WITH F AS (
  SELECT f.FormID, f.PrimaryUsage, ProfileName = STUFF(f.PrimaryUsage, 1, 10, '')
  FROM dbo.Atlas_Forms f
  WHERE f.Deleted = 0 AND f.PrimaryUsage LIKE 'node-form-%' AND f.PrimaryUsage <> 'node-form-common'
    AND f.NodeSubUsage = 'DesignTime'
    AND NOT EXISTS (SELECT 1 FROM dbo.Process_ProcessElementTypes t
                    WHERE t.ProcessElementTypeCode COLLATE Latin1_General_100_BIN2 = STUFF(f.PrimaryUsage, 1, 10, '') COLLATE Latin1_General_100_BIN2)
),
T AS (
  SELECT d.DataTemplateID, d.TemplateName,
         NodeCode    = JSON_VALUE(x.c, '$.code'),
         ProfileName = JSON_VALUE(x.c, '$.settings.data.connector.configuration.profileName'),
         HasBlock    = CASE WHEN JSON_QUERY(x.c, '$.settings.data.connector.configuration') IS NULL THEN 0 ELSE 1 END
  FROM dbo.Template_DataTemplates d
  CROSS APPLY (SELECT CAST(d.ContentData AS NVARCHAR(MAX)) AS c) x
  WHERE d.Deleted = 0 AND d.DataTemplateTypeID = 13 AND ISJSON(x.c) = 1
),
N AS (  -- normalised comparison key: lower case, hyphens removed
  SELECT 'F' AS Src, FormID AS RefID, ProfileName AS Name, LOWER(REPLACE(ProfileName, '-', '')) AS Norm FROM F
  UNION ALL
  SELECT 'T', DataTemplateID, ProfileName, LOWER(REPLACE(ProfileName, '-', '')) FROM T WHERE ProfileName <> ''
)
SELECT Finding, NodeCode, RefID, Name, Detail FROM (
  SELECT 'FORM_NO_TEMPLATE' AS Finding, LEFT(F.ProfileName, CHARINDEX('-', F.ProfileName + '-') - 1) AS NodeCode,
         F.FormID AS RefID, F.PrimaryUsage AS Name, CAST(NULL AS NVARCHAR(200)) AS Detail
  FROM F WHERE NOT EXISTS (SELECT 1 FROM T WHERE T.ProfileName COLLATE Latin1_General_100_BIN2 = F.ProfileName COLLATE Latin1_General_100_BIN2)
  UNION ALL
  SELECT 'TEMPLATE_NO_FORM', T.NodeCode, T.DataTemplateID, T.ProfileName, T.TemplateName
  FROM T WHERE T.ProfileName IS NOT NULL AND T.ProfileName <> ''
    AND NOT EXISTS (SELECT 1 FROM F WHERE F.ProfileName COLLATE Latin1_General_100_BIN2 = T.ProfileName COLLATE Latin1_General_100_BIN2)
  UNION ALL
  SELECT 'NO_CONNECTOR_BLOCK', T.NodeCode, T.DataTemplateID, T.TemplateName, NULL FROM T WHERE T.HasBlock = 0
  UNION ALL
  SELECT 'NO_PROFILENAME', T.NodeCode, T.DataTemplateID, T.TemplateName, NULL
  FROM T WHERE T.HasBlock = 1 AND (T.ProfileName IS NULL OR T.ProfileName = '')
  UNION ALL
  SELECT 'CASE_MISMATCH', T.NodeCode, T.DataTemplateID, T.ProfileName, F.ProfileName
  FROM T JOIN F ON LOWER(REPLACE(T.ProfileName,'-','')) = LOWER(REPLACE(F.ProfileName,'-',''))
  WHERE T.ProfileName COLLATE Latin1_General_100_BIN2 <> F.ProfileName COLLATE Latin1_General_100_BIN2
  UNION ALL
  SELECT 'DUPLICATE_PALETTE', T.NodeCode, MIN(T.DataTemplateID), T.TemplateName, CONCAT(COUNT(*), ' rows')
  FROM T GROUP BY T.NodeCode, T.TemplateName HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'DUPLICATE_PALETTE', MIN(T.NodeCode), MIN(T.DataTemplateID), T.ProfileName, CONCAT(COUNT(*), ' rows, same profileName')
  FROM T WHERE T.ProfileName <> '' GROUP BY T.ProfileName HAVING COUNT(*) > 1
) R
ORDER BY NodeCode, Finding, RefID;
```
Caveat: `NO_CONNECTOR_BLOCK` will also list legitimate non-operation nodes (triggers, generic nodes) with one template per
node type: filter to node types that have operation forms (FORM_NO_TEMPLATE for the same NodeCode) before acting.
Adjust the `NodeCode` derivation (first hyphen token) for node codes containing hyphens.

Run: `sqlcmd -S ".\SQLEXPRESS" -d data-ocean-platform-prod -E -C -W -s "|" -i audit.sql -o audit.txt` (put `audit.sql` in the
scratchpad, not the repo).

## Node script sketch (same audit + repo file check)

```js
// audit.js - node audit.js  (Windows auth sqlcmd; no secrets)
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const q = fs.readFileSync(process.argv[2], 'utf8');                       // the SQL above
const out = execFileSync('sqlcmd', ['-S', '.\\SQLEXPRESS', '-d', 'data-ocean-platform-prod', '-E', '-C',
  '-W', '-h', '-1', '-s', '|', '-Q', q], { encoding: 'utf8', maxBuffer: 1 << 26 });
const rows = out.split(/\r?\n/).filter(l => l.includes('|')).map(l => l.split('|'));
const byNode = {};
for (const [finding, node, refID, name, detail] of rows) (byNode[node || '?'] ??= []).push({ finding, refID, name, detail });
console.log('| Node | Finding | Ref ID | Name | Detail |\n|---|---|---|---|---|');
for (const [n, list] of Object.entries(byNode))
  for (const r of list) console.log(`| ${n} | ${r.finding} | ${r.refID} | ${r.name} | ${r.detail ?? ''} |`);
// Optional: cross-check repo folders (scoped to the projects root, depth-limited)
const root = 'C:/BizFirstGO_FI_AI/BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/projects';
const skip = /obsolete|backup|unapproved|unsorted/i;
const files = []; (function walk(d, depth) { if (depth > 4) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory() && !skip.test(e.name)) walk(path.join(d, e.name), depth + 1);
    else if (/^Template_DataTemplates_\d+_/.test(e.name)) files.push(e.name); } })(root, 0);
console.log(`\nrepo DataTemplates scripts: ${files.length}`);
```
Sketch, untested. `-W` and `-y` cannot be combined; `-Q` with a long multi-line string can hit shell limits: prefer `-i file`.

## Output format

Deliver a table sorted by node, then finding, and a per-node summary that feeds `..\..\..\Knowledge\Workflow\node-forms\node-type-status-table.md`:

| Node | Finding | Ref ID | Name | Detail |
|---|---|---|---|---|
| mysql | FORM_NO_TEMPLATE | 25100 | node-form-mysql-... | |
| odoo | CASE_MISMATCH | 91020130 | odoo-contact-getAll | odoo-contact-get-all |

Do not fix from the audit output alone: hand each node with FORM_NO_TEMPLATE to `agent.md`.
