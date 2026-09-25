# Odoo Node — DB Catalog

Path: `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\RealEstate\Odoo\`

## 1. `Process_ProcessElementTypes` (the registry row)

`ProcessElementTypes\Process_ProcessElementTypes_Odoo.data.sql` — inserts one row, `Code = 'odoo'`.
Confirmed live via direct query, 2026-09-06:

```sql
SELECT ProcessElementTypeID, Code, Name, Enabled FROM Process_ProcessElementTypes WHERE Code = 'odoo'
-- 337, odoo, Odoo, 1
```

## 2. `Atlas_Forms` (35 forms — one per operation, no satellite form for this node)

Path: `Forms\Atlas_Forms_{FormID}_odoo_{resource}_{operation}.data.sql`. `FormID` range 36000-36034
(contiguous), `PrimaryUsage = node-form-odoo-{resource}-{operation}` style — see `Forms\README.md`
for the exact `PrimaryUsage`/`FormCode` conventions (all verified `node-form-` prefixed, not the
`nodeForm-` mistake an earlier revision had made and corrected, per that README).

| FormID | Resource/Operation | FormID | Resource/Operation |
|---|---|---|---|
| 36000 | contact/create | 36018 | activity/update |
| 36001 | contact/get | 36019 | activity/delete |
| 36002 | contact/getAll | 36020 | activity/markDone |
| 36003 | contact/update | 36021 | activityType/getAll |
| 36004 | contact/delete | 36022 | stage/getAll |
| 36005 | lead/create | 36023 | team/getAll |
| 36006 | lead/get | 36024 | tag/getAll |
| 36007 | lead/getAll | 36025 | lostReason/getAll |
| 36008 | lead/update | 36026 | utmSource/getAll |
| 36009 | lead/delete | 36027 | utmMedium/getAll |
| 36010 | lead/convert | 36028 | utmCampaign/getAll |
| 36011 | lead/markWon | 36029 | custom/create |
| 36012 | lead/markLost | 36030 | custom/get |
| 36013 | lead/logNote | 36031 | custom/getAll |
| 36014 | lead/scheduleActivity | 36032 | custom/update |
| 36015 | activity/create | 36033 | custom/delete |
| 36016 | activity/get | 36034 | trigger/poll |
| 36017 | activity/getAll | | |

## 3. `Template_DataTemplates` (35 templates — the palette entries a user drags onto the canvas)

Path: `DataTemplates\Template_DataTemplates_{ID}_odoo-{resource}-{operation}.data.sql`, IDs
91020123-91020157, one-to-one with the 35 forms above in the same order (91020123=contact-create …
91020157=trigger-poll). `configFormId` intentionally empty on all (form resolution goes through
`PrimaryUsage` matching, same convention as Elasticsearch's templates).

## Coverage verdict (independently derived, no `NodeReport.md` exists for this project to cite)

35/35 operations have a form (§2) and a template (§3) — confirmed by directory listing on 2026-09-06,
counts match on both sides. The C#-route side of this same coverage claim (does every one of the 35
form/template pairs have a real, reachable feature-partial route) is **not yet independently
verified operation-by-operation** — the 5 feature partials and their resource/operation `switch`
routing exist and were read at a high level (`resources\backend-projects.md`), but a full 35-row
cross-check table (the equivalent of Elasticsearch's `NodeReport.md`-derived 10/10 table) has not
been built. See `test-plan.md` P0-01 for this as an explicit open item.
