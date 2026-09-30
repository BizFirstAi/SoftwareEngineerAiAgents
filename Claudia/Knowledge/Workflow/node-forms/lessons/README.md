# Lessons Learned - Node Forms

Running dated log. Append an entry for any real finding before ending a session. Newest last.

## 2026-09-20 - SQL Server node showed only Common forms

**Symptom:** dropping a SQL Server node showed only the 24 Common forms; no query/row/table operation form, although 37
`SqlServerNode_*` forms existed in `Atlas_Forms`.

**Root cause:** operation forms are reachable only through the resolver's Profile tier, which needs
`connector.configuration.profileName` on the node. The node inherits it from its palette data template, and SQL Server had only
two generic templates (10000054, type 13; 40072, type 14) with no connector block. No profileName -> tier skipped -> Common only.
There is no `node-form-sqlserver` row, so the NodeType tier could not rescue it either.

**Fix:** 37 generated templates (IDs 91030001..91030037), one per form ordered by FormID, `TemplateName` 'SQL Server <Resource>
<Operation>', category 4 / type 13 / class 3, `DisplayOrder` 400+10n, profileName such as `sqlserver-query-execute`. Files under
`BizFirstFiDB\...\dbo\Data\projects\SqlServer\DataTemplates`; committed as e72dc863 on BizFirstFiDB main; the two old generic files
were deleted from the repo.

| # | Lesson |
|---|---|
| 1 | Forms in the DB are necessary, not sufficient. A palette template with `profileName` is what connects a node to its form. |
| 2 | Diagnose with `GetNodeForms`: `formsBySource` `Common:24` only means nothing matched; `+Profile:1` means one matched: verify it is the right one. |
| 3 | The Consolidated WebApi uses two databases. Inserting into local `.\SQLEXPRESS` had no effect: the API served the remote DB (API returned 1172 type-13 templates = local minus the 37 new). Compare API counts to each DB before applying; never trust a local SELECT alone. |
| 4 | Five caches (10-min template list, 1 h output cache, 24 h form cache, 60-min workflow cache, frontend startup load). A fix that does not show is unproven: restart the WebApi, then Ctrl+F5. |
| 5 | Nodes already on a canvas keep old connector config. They need re-dropping, or open + save so template defaults merge (`workflowStore.ts`). |
| 6 | Stale profileName gives the WRONG form: MCP-built Odoo/Apify nodes showed `odoo-custom-delete` / `apify-key-value-store-get-record`. |
| 7 | The Workflow MCP cannot write connector-layer config; `update_node_configuration` replaces the whole element config and validates against `ConfigurationSchema` (`parameters` must be an array). |
| 8 | Casing/shape mismatches exist between template profileName and form PrimaryUsage (`odoo-contact-getAll` vs `node-form-odoo-contact-get-all`): audit all nodes. |
| 9 | Scripts: UTF-8 BOM, `sqlcmd -f 65001`, `IF NOT EXISTS` guard. Many old DataTemplates scripts are plain INSERTs that fail harmlessly on PK when re-run; Forms/ProcessElementTypes scripts are usually guarded. |
| 10 | Choose IDs by querying the DB AND scanning the repo folders; a range free in one DB may be taken in the other or in an unapplied script. |
| 11 | Stale repo file `Atlas_Forms_18532_sqlserver_bulk_copy` duplicates form 25001 (Bulk_Copy) and is not in the DB: do not apply it. |
| 12 | MySql has the same gap (templates 10000051, 10000608, 40073; forms 25100+); PostgreSQL likely (unverified). |

**Tooling gotchas hit:** `sqlcmd -W` and `-y` are mutually exclusive; `ntext` needs `CAST` before `LEN`; Python is not installed (use
Node); repo-wide grep times out (scope searches); executor config keys are case-sensitive versus schema (`credentialId` vs
`credentialID`); Loop node ports are `loop` and `done`.

**Not verified at the time:** whether the remote DB is later synchronised from the DB project; PostgreSQL state; whether the
NodeFormResolver cache-hit return is still commented out.

## 2026-09-20 - DisplayOrder decides palette position and which form opens first

**Finding:** the palette is ONE flat list sorted by `Template_DataTemplates.DisplayOrder` (then `TemplateName`) and the frontend
never re-sorts it; category is only a filter, type 15 `ContentData.sortOrder` and type 14 cards do not affect order, and
isFrequent/isFavorite/isTopRated only filter. Operation templates of one node interleave with other nodes wherever their
numbers collide (SQL Server: 38 templates spread over palette ranks 357..1155). In the config dialog the client sorts ALL forms
(Profile, NodeType, Common) by `Atlas_Forms.DisplayOrder` ascending and `forms[0]` is the main form, so a profile/node-type form
with DisplayOrder >= 1002 lands after Data Mapping/Output Data/Autonomous Identity (1002/1003/2000) or below all commons.

**Rule:** profile/node-type forms 1-999 (first form of the node lowest), common forms 1002+; give each node code a private
contiguous DisplayOrder band in the palette. Detector and normaliser SQL: `..\display-order-and-menu.md` section 5.

**Caveat:** local DB showed max 1001 for profile/node-type forms, so the reported large values (Odoo 3601+, Jira 30001+,
Docker 40363, SSH 40202+) are in the served REMOTE DB or unapplied scripts: unverified. Always query the DB the API serves.

## 2026-09-20 - DisplayOrder policy for profile forms
Forms were displayed in the middle (Odoo at 3601) or on top (SQL Server at 1000) depending on an arbitrary DisplayOrder chosen per node. Policy set: profile/node-type forms 101..499, common forms 1002+. Always check the band when creating or auditing forms.

## 2026-09-20 - Lessons from the SQL Server / Odoo / Apify form work (Binoy's session)

1. **A node shows an operation form only if its connector carries a matching profileName.** The resolver does an exact match on Atlas_Forms.PrimaryUsage = 'node-form-' + profileName. Every node type with per-operation forms needs one palette template (Template_DataTemplates type 13) per form with settings.data.connector.configuration = {profileName, resource, operation}. SQL Server and MySql had none; Odoo and Apify did.
2. **Template names must carry the node type.** Palette entries such as "Compose: Update Service" are meaningless on their own. Policy: TemplateName and ContentData.displayName = "<Node type> - <Resource>: <Operation>" (drop a redundant "<Word>:" prefix when the word is already in the node name). 639 of 1209 templates violated this; fixed by Sync_DataTemplates_2026_09_20_add_node_type_to_names.sql and the 548 per-template scripts.
3. **Scripts must be ASCII-only.** UTF-8 characters (em dash, bullet, arrow, emoji) become mojibake when a script is run through sqlcmd without -f 65001 ("SQL Server a-euro-quote Query Execute"). Use plain '-' / '->', JSON \uXXXX escapes, and NCHAR() in T-SQL. Always run with -f 65001 anyway.
4. **DisplayOrder policy.** Per-node (profile-driven and node-type) forms: strictly between 100 and 500. Common forms: 1002 and above. The config dialog sorts all forms by DisplayOrder and opens on the first one, so a value like Odoo 3601 puts the operation form below the common forms. Normaliser: Sync_AtlasForms_2026_09_20_profile_forms_display_order_on_top.sql. The seed scripts under projects\<Group>\<Node>\Forms were rewritten to the same values (1229 files, numbers only).
5. **Designer save can stamp the WRONG template on a node.** workflowStore.ts builds new Map(templates.map(t => [t.code, t])) so the last template of a code wins when the node has no designer.ui.dataTemplateID; the stamped connector config (profileName AND resource/operation) then beats the template on later saves. Nodes created through the Workflow MCP have no dataTemplateID. Always set designer.ui.dataTemplateID on the element and verify/repair the connector via PUT /api/v1/ai-extension/connectors/{id} (body {metadata, data:{ConnectorID, Name, Configuration}}); the MCP has no connector-config tool. Wrong resource/operation on a connector can make the node run the wrong operation, not only show the wrong form.
6. **Verify through the API, not just SQL.** Call GetNodeForms for a real element and read resolutionSummary / each form's source tier and displayOrder. A local SELECT proves rows exist, not that the running API serves them: the API caches type-13 templates for 10 minutes per process (DataTemplateRepository.GetByTypeAsync) and the served site is the IIS deployment (C:\inetpub\wwwroot\consolidated-webapi), so recycle the IIS app pool and hard-refresh the browser after data changes.
7. **Validate config types before update_node_configuration.** It replaces the whole configuration and validates the schema: 'parameters' must be an array (not the string "[]") and Odoo 'fields' must be an object (not a JSON string). Anit's copied configs used strings.

## 2026-09-20 - Node insertion audit: 128 node folders vs the live local DB

**Symptom:** searching the palette for "harshi" found nothing; suspicion that many node scripts were never inserted.

**Finding:** "harshi" exists nowhere (no script, no DB row, no C# folder, no git message). Of 128 node folders, 123 were complete;
Blockchain/DataProof (3 forms, 9 templates, PET), Blockchain/Safe (PET, 19 forms, 19 templates), PostgreSQL (PET, 39 forms, 38 templates),
Standard/Smtp (template 40019) and the GOOGLE_OAUTH2 credential type were missing. Inserted: 3 PET, 61 forms, 67 templates, 1 credential type
(counts PET 112->115, Atlas_Forms 1394->1455, Template_DataTemplates 1380->1447, AIExt_CredentialTypes 10->11). Audit: audit/node-insertion-audit-2026-09-20.md.

**Procedure (repeatable):** parse every INSERT ... VALUES/SELECT in each node folder (skip obsolete/backup/unapproved/unsorted), key rows by
FormID (or FormCode when no FormID), DataTemplateID and Code; dump keys from the live DB with sqlcmd (ISJSON, JSON_VALUE profileName) and diff; then
run only the scripts whose rows are missing, one file at a time with -b, then re-diff. Also grep C# NodeTypeName constants to find executors with no scripts
(21 candidates, listed in the audit).

| # | Lesson |
|---|---|
| 1 | Guarded scripts (IF NOT EXISTS on Code/FormCode) are safe to re-run; unguarded DataTemplates scripts are plain INSERTs with explicit IDs, safe only because the PK rejects duplicates. Any unguarded ProcessElementTypes INSERT can create duplicate Code rows: SELECT the Code first. |
| 2 | Never run a Synchup_*.sql blindly: Synchup_smtp.sql starts with USE [BIZFIRSTATLASDB] and DELETEs then re-inserts rows. Extract only the missing guarded step. |
| 3 | The API caches type-13 templates for about 10 minutes; recycle IIS and hard refresh (Ctrl+F5) before new palette rows show. Confirm the API points at the same DB you inserted into (see 2026-09-20 SQL Server lesson). |
| 4 | Tooling: sqlcmd -i needs Windows backslash paths (run from PowerShell); a forward-slash path from Git Bash fails with "Access is denied". |
| 5 | Result counts: 128 nodes scanned, 123 complete before, 5 fixed, 0 missing after; 325 type-13 templates have profileName MISSING/MISMATCH (informational, not fixed); 21 C# executors have no PET script. |

## 2026-09-20 - DB data-script tree cleanup (banned folders removed)

**Symptom:** `dbo\Data\projects` held 95 files in `obsolete`, `backup`, `unapproved`, `unsorted` folders and with `TBR_` / `Std_` / vendor prefixes; nobody could tell which script was the live definition, and some "parked" scripts were the only definition of nodes that exist in code (Audio, RAG document add/delete/update, workflow-control, RunTime forms 10002/10003) while the DB lacked them.

**What was done:** every file was proven against active scripts, the live DB and the C# executor/settings classes; duplicates and redundant items were `git rm`-ed, unique ones promoted with guarded scripts and inserted, stale ones rewritten to the executor keys. Full table: `audit\cleanup-2026-09-20.md`. Standard: `..\db-project-folder-standard.md`.

| # | Lesson |
|---|---|
| 1 | "Obsolete/unsorted" is not a verdict. Decide by evidence: same ID with same or newer content (duplicate), node/operation gone from code (redundant), node still in code and DB lacks it (promote). 17 of 95 items were promoted, moved or rewritten, not deleted. |
| 2 | Parked scripts drift: two thirds of the "unsorted" content used keys the code no longer reads (`ParentFormID`, `chatConfig.flowConfiguration`, snake_case `bearer_token`) or tables that do not exist. Always compare control IDs with `ReadConfigByKey` in the settings class before promoting. |
| 3 | ID collisions hide in parked files: FormID 21023 (Kafka) and template IDs 10000410/413 (Mailgun) were taken by live rows, so the "unique" Audio scripts needed new IDs (21100, 10000625/626). Check active scripts and the DB before reusing an ID. |
| 4 | `.gitignore` pattern `Backup*/` meant two backup folders were never in git; deleting them is irreversible, so archive first. Do not create such folders at all. |
| 5 | A secrets-policy conflict can be a dead field: the Stripe form's `webhookSecret` was never read (the executor uses appsettings), so removing it was safe. Check the executor before deciding whether a policy fix breaks a node. |
| 6 | Orphan DB rows (stub forms 10007/10009, duplicate 11059, dead root form 25000) cannot be removed by scripts under the no-delete rule; list them for a human. |
