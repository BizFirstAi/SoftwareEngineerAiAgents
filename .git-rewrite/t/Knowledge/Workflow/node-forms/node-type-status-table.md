# Node Type Status Table

Started 2026-09-20 from the audit facts. Update it at the end of every run. "unverified" means not checked live.

| Node type | Operation forms | Per-operation templates | connector.configuration profileName | Status | Notes |
|---|---|---|---|---|---|
| sqlserver | 37 (`SqlServerNode_*`, FormCode like `SQLSERVER_QUERY_EXECUTE`) | 37, IDs 91030001..91030037 | yes, e.g. `sqlserver-query-execute` | FIXED in repo (commit e72dc863 on BizFirstFiDB main); applied/served state on the API's DB: verify | Old generic 10000054 (type 13) and 40072 (type 14) files deleted. Form file `Atlas_Forms_18532_sqlserver_bulk_copy` is stale, duplicates form 25001 (Bulk_Copy), not in DB. |
| mysql | forms 25100+ (count unverified) | 3 generic: 10000051, 10000608, 40073 | none | GAP (same as SQL Server before fix) | Needs generation per `..\..\..\Procedure\Workflow\node-forms\fix-playbook.md`. |
| postgresql | unverified | unverified | unverified | LIKELY GAP (unverified) | Folder `projects\PostgreSQL` exists. Run the audit. |
| odoo | forms exist | 35, IDs 91020123..91020157 | yes, e.g. `odoo-contact-create` | WORKING pattern; casing mismatch risk | `odoo-contact-getAll` vs form `node-form-odoo-contact-get-all`; MCP-built nodes carried stale `odoo-custom-delete`. Audit all 35. |
| apify | 12 forms, FormIDs 20200..20211 | 12, IDs 10000127..10000137 and 10000395 | yes; all 12 match the 12 forms exactly | WORKING (reference) | MCP-built nodes showed stale `apify-key-value-store-get-record`. |
| elasticsearch | 11 forms 203{00-10} | 10 op templates 100001{09-18} | unverified | unverified | See `..\..\..\Agents\Testers\WorkflowTester\testing\elasticsearch\resource.md`. |
| slack | unverified | unverified | unverified | unverified | |
| all others | unverified | unverified | unverified | unverified | Run `..\..\..\Procedure\Workflow\node-forms\audit-all-datatemplates.md` and fill this table from its output. |

Template type IDs: 13 palette node, 14 node-type card, 15 category.
