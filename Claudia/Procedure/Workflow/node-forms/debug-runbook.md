# Debug Runbook - node shows no form / the wrong form

All queries are read-only. Local run form:
`sqlcmd -S ".\SQLEXPRESS" -d data-ocean-platform-prod -E -C -W -s "|" -Q "<query>"`.
For the remote DB use host/db from `..\..\..\Knowledge\Workflow\node-forms\resource.md` with credentials from appsettings or from the user (never saved).
Column names of `Atlas_Forms` other than `FormID, FormCode, PrimaryUsage, NodeUsage, NodeSubUsage, Deleted` are unverified:
if a query errors, run `sp_help 'dbo.Atlas_Forms'` and adjust. `<node>` = node type code.

## Queries

**Q1 - operation forms for a node**
```sql
SELECT FormID, FormCode, PrimaryUsage, NodeUsage, NodeSubUsage,
       ProfileName = STUFF(PrimaryUsage, 1, 10, '')
FROM dbo.Atlas_Forms
WHERE Deleted = 0 AND PrimaryUsage LIKE 'node-form-<node>%'
ORDER BY PrimaryUsage;
```

**Q2 - palette templates for a node, with profileName**
```sql
SELECT d.DataTemplateID, d.DataTemplateTypeID, d.TemplateName, d.DisplayOrder,
       NodeCode    = JSON_VALUE(x.c, '$.code'),
       ProfileName = JSON_VALUE(x.c, '$.settings.data.connector.configuration.profileName'),
       HasConnectorBlock = CASE WHEN JSON_QUERY(x.c, '$.settings.data.connector.configuration') IS NULL THEN 0 ELSE 1 END
FROM dbo.Template_DataTemplates d
CROSS APPLY (SELECT CAST(d.ContentData AS NVARCHAR(MAX)) AS c) x
WHERE d.Deleted = 0 AND d.DataTemplateTypeID IN (13, 14)
  AND ISJSON(x.c) = 1 AND JSON_VALUE(x.c, '$.code') = '<node>'
ORDER BY d.DataTemplateTypeID, d.DisplayOrder, d.DataTemplateID;
```

**Q3 - forms vs templates for a node (exact, binary collation)**
```sql
;WITH F AS (
  SELECT FormID, PrimaryUsage, ProfileName = STUFF(PrimaryUsage, 1, 10, '')
  FROM dbo.Atlas_Forms
  WHERE Deleted = 0 AND PrimaryUsage LIKE 'node-form-<node>-%' AND NodeSubUsage = 'DesignTime'),
T AS (
  SELECT d.DataTemplateID, ProfileName = JSON_VALUE(x.c, '$.settings.data.connector.configuration.profileName')
  FROM dbo.Template_DataTemplates d
  CROSS APPLY (SELECT CAST(d.ContentData AS NVARCHAR(MAX)) AS c) x
  WHERE d.Deleted = 0 AND d.DataTemplateTypeID = 13 AND ISJSON(x.c) = 1 AND JSON_VALUE(x.c, '$.code') = '<node>')
SELECT F.FormID, F.PrimaryUsage, T.DataTemplateID, T.ProfileName,
       Finding = CASE WHEN T.DataTemplateID IS NULL THEN 'FORM WITHOUT TEMPLATE' END
FROM F LEFT JOIN T ON T.ProfileName COLLATE Latin1_General_100_BIN2 = F.ProfileName COLLATE Latin1_General_100_BIN2
UNION ALL
SELECT NULL, NULL, T.DataTemplateID, T.ProfileName, 'TEMPLATE PROFILE WITHOUT FORM'
FROM T WHERE NOT EXISTS (SELECT 1 FROM F WHERE F.ProfileName COLLATE Latin1_General_100_BIN2 = T.ProfileName COLLATE Latin1_General_100_BIN2);
```

**Q4 - duplicate palette entries for a node**
```sql
SELECT JSON_VALUE(x.c,'$.code') AS NodeCode, d.TemplateName, COUNT(*) AS Cnt, MIN(d.DataTemplateID) AS FirstID, MAX(d.DataTemplateID) AS LastID
FROM dbo.Template_DataTemplates d CROSS APPLY (SELECT CAST(d.ContentData AS NVARCHAR(MAX)) AS c) x
WHERE d.Deleted = 0 AND d.DataTemplateTypeID = 13 AND ISJSON(x.c) = 1 AND JSON_VALUE(x.c,'$.code') = '<node>'
GROUP BY JSON_VALUE(x.c,'$.code'), d.TemplateName HAVING COUNT(*) > 1;
```

**Q5 - registry row**
```sql
SELECT * FROM dbo.Process_ProcessElementTypes WHERE ProcessElementTypeCode = '<node>';   -- column name unverified
```

**Q6 - stored connector config of a placed node (stale profileName check)**
```sql
SELECT pe.ProcessElementID, c.*
FROM dbo.Process_ProcessElements pe
JOIN dbo.AIExt_Connectors c ON c.ConnectorID = pe.ConnectorID      -- join columns unverified: check sp_help first
WHERE pe.ProcessElementID = <processElementID>;
```

## JS snippets (Chrome page context, see `..\..\..\Knowledge\Workflow\node-forms\resource.md` section 5)

**J1 - GetNodeForms summary** (returns tier counts and form usages, no token):
```js
(async () => {
  const t = localStorage.getItem('authToken'), id = 2361;   // processElementID
  const r = await fetch(`https://localhost:10001/api/v1/process-engine/node-forms/standard/GetNodeForms/DesignTime/${id}?includeSchema=false`,
    { headers: { Authorization: `Bearer ${t}`, 'X-Tenant-ID': '1' } });
  const j = await r.json(); const d = j.data ?? j;
  return JSON.stringify({ status: r.status, formsBySource: d.resolutionSummary?.formsBySource,
    forms: (d.forms ?? []).map(f => f.primaryUsage ?? f.formCode) });   // field names unverified: inspect j if undefined
})()
```

**J2 - palette templates from the API** (count and lookup by ID or code):
```js
(async () => {
  const t = localStorage.getItem('authToken');
  const r = await fetch('https://localhost:10001/api/v1/ai/template/data-template/by-type', { method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'X-Tenant-ID': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ DataTemplateTypeID: { ID: 13 }, PageSize: 10000 }) });   // copy exact body from DevTools if 400
  const j = await r.json(); const rows = j.data?.items ?? j.data ?? j.items ?? [];
  const sql = rows.filter(x => /sqlserver/i.test(JSON.stringify(x).slice(0, 4000)));   // change the filter to the node under test
  return JSON.stringify({ total: rows.length, matching: sql.length });
})()
```

## Decision tree

```
START: node <node> shows no / wrong operation form
 |
 1. J1 on a node of this type. What is formsBySource?
 |   a) Common:24 only ................................ go to 2
 |   b) Common:24 + Profile:1, form is WRONG .......... go to 5
 |   c) Common:24 + Profile:1, form is RIGHT, UI empty  go to 6
 |
 2. Q1: do operation forms exist for <node>?
 |   no  -> CAUSE: forms missing. FIX: node-engineer pipeline (out of scope); report.
 |   yes -> go to 3
 |
 3. Q2: do type-13 templates exist with HasConnectorBlock=1 and a profileName?
 |   no connector block (generic templates only) ....... CAUSE: SQL Server case. FIX: fix-playbook.md
 |   profileName present but Q3 says mismatch ......... CAUSE: casing/shape mismatch. FIX: correct the template
 |                                                        profileName from the form PrimaryUsage (fix-playbook.md 4b)
 |   templates fine, node placed BEFORE they existed .. go to 5b
 |   templates fine and node is fresh ................. go to 4
 |
 4. Does the API see them? J2 count vs local count.
 |   API count == local count minus your new rows ..... CAUSE: API serves the REMOTE DB (database-topology.md).
 |                                                      FIX: apply to the serving DB after user confirmation.
 |   API sees them, palette does not .................. CAUSE: caches (a,b,e). FIX: restart + Ctrl+F5 (caching-layers.md)
 |
 5. Wrong form. Q6 / J1: what profileName does the node's connector carry?
 |   a) stale value from an old template/MCP build .... 5b
 |   b) mismatch in casing/hyphens vs form ............ correct the template (fix-playbook.md 4b), then 5b
 |   5b) CAUSE: existing node keeps old connector config. FIX: delete + re-drop from palette, or open and save the node
 |       in the designer so template defaults merge (workflowStore.ts). MCP cannot write connector config.
 |
 6. "Forms exist in DB but UI shows none" (API returns the form, dialog is empty)
     - Check NodeSubUsage: dialog requests DesignTime; forms marked other sub-usages are never returned (Q1).
     - Check Deleted flag / NodeUsage = PrimaryConfigPage (Q1).
     - Check the frontend tab is the one that changed: ConnectorConfigDialog uses first form as schema by displayOrder;
       a lower-displayOrder Common form can win. Compare displayOrder in J1 output.
     - Hard refresh, and confirm the browser is hitting the API you queried (port 10001 vs another host).
     - If the API also returns none: return to step 4 (wrong DB) before suspecting the frontend.
```

## "One form shows but it is the wrong one" - detail

1. J1 shows `Tier (Profile): 1` and the returned form belongs to a different operation (e.g. `odoo-custom-delete` on a create node).
2. The node's saved connector `profileName` is stale (built via MCP, or dropped from an old template, or the template profileName
   was wrong). Q6/J1 show the value.
3. Fix the template first if Q3 shows a mismatch, then repair the node: re-drop, or open + save. Do not edit connector JSON by hand
   in the DB without the user's approval (shared data).

## "Forms exist in DB but UI shows none" - detail

Almost always one of, in order of frequency: (1) no per-operation template with a profileName, so the Profile tier skips;
(2) template exists but only in the DB the API does not serve; (3) caches; (4) node placed before the fix. Steps 3 and 4 of the tree.
