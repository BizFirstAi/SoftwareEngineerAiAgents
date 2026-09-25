# Display Order: Palette Menu and Config-Dialog Form Order

## POLICY (mandatory): DisplayOrder band for profile-driven node forms

| Form kind | PrimaryUsage | Atlas_Forms.DisplayOrder |
|---|---|---|
| Profile-driven and node-type forms (per node / per resource-operation) | `node-form-<node>[-<resource>-<operation>]` | **strictly above 100 and below 500 (101..499)** |
| Common forms | `node-form-common` | 1002 and above (unchanged) |

- Why: the config dialog sorts every form by `DisplayOrder` ascending and opens on the first one, so the operation form must always sort before every common form.
- Values <= 100 and >= 500 are violations. Reserve 1..100 and 500..1001 for future use; do not put per-node forms there.
- Within a node type with several forms (ai-agent, flow-ai-agent, guardrails, approval, ...) keep their relative order inside 101..499 (101, 102, ...). Node types with one form per operation simply use 101 (order does not matter between different operations, only one profile form resolves per node).
- Any agent or script that creates or edits `Atlas_Forms` rows for a node MUST set `DisplayOrder` inside the band; the fix playbook and the audit both check it.
- Detector (run against the DB the API actually serves):
  `SELECT FormID, FormCode, PrimaryUsage, DisplayOrder FROM Atlas_Forms WHERE PrimaryUsage LIKE 'node-form-%' AND PrimaryUsage <> 'node-form-common' AND Deleted = 0 AND (DisplayOrder <= 100 OR DisplayOrder >= 500)`
- Normaliser (idempotent, ASCII-only, tested on local `data-ocean-platform-prod`: 1282 of 1292 rows renumbered, 0 violators after):
  `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\Sync_AtlasForms_2026_09_20_profile_forms_display_order_on_top.sql`
  The seed scripts under `projects\<Group>\<Node>\Forms\*.sql` still carry the original values; re-run the normaliser after any fresh seed, or edit new scripts to the band from the start.
- The configurable part: the band is fixed, the order inside it is whatever each form's `DisplayOrder` says (edit the column to reorder within a node).


Researched 2026-09-20, read-only (code and DB untouched). Facts marked "verified" were read from source or from the LOCAL
DB (`.\SQLEXPRESS`, `data-ocean-platform-prod`). Anything else is marked "unverified".

IMPORTANT database caveat: the API serves the REMOTE DB (see `database-topology.md`). The local DB is older (newest
`Atlas_Forms` node-form row `LastModifiedOn` = 2026-09-09). The per-node form DisplayOrder figures reported by the user
(SQL Server 1000-1036, Apify 1001-1012, Odoo 3601-3635, Jira 30001+, Docker up to 40363, SSH 40202+, Guardrails 13001,
Policies 14001; 590 of 1292 profile/node-type forms >= 1002) were NOT reproduced locally: see section 4. They are
"unverified (remote)". Run the detector SQL of section 5 against the served DB before acting.

## 1. Palette menu (LeftToolbar) - verified

### 1.1 Data flow and where order is decided

| Step | What happens | File:line |
|---|---|---|
| 1 | Three by-type POSTs, `PageSize 10000`, `DataTemplateTypeID` 13 / 14 / 15, in parallel | `BizFirstAiStudio\src\NodeTemplates\ApiClient\NodeTemplateApiClient.ts:124-136, 239-243` |
| 2 | Server returns rows `ORDER BY DisplayOrder, TemplateName` (also for the cached 13/14/15 path) | `BizFirstPayrollV3\src\mvc-server\AI\Template\BizFirstAi.Template.Infrastructure\Repositories\DataTemplateRepository.cs:77-80` (cache 84-110, key `DataTemplate:by-type:{TenantID}:{typeId}`) |
| 3 | Rows are parsed from `ContentData` JSON with `.map` (order kept) | `NodeTemplateApiClient.ts:107-111, 245-246` |
| 4 | Enhancer merges NodeType/Category defaults with `templates.map` (order kept, no sort) | `NodeTemplates\MapperServices\NodeTemplateEnhancer.ts:18-66` |
| 5 | Store gets `getTemplates()` as `nodeTypes` (the palette list) and `getCategories()` as `nodeCategories` | `flow-studio-store\src\workflowStore.ts:786-790` (refresh 808-813) |
| 6 | Palette filters with `.filter(...)` only and renders in array order | `flow-studio-designer\src\components\Toolbar\LeftToolbar.tsx:102-109, 231` |

Answer: the frontend KEEPS the server order. There is no `.sort` anywhere between the HTTP response and the rendered
palette (LeftToolbar, NodeSearchModal `Modals\NodeSearchModal.tsx:248-268`, Enhancer, Service `Services\NodeTemplateService.ts:111-143`).
The palette is a single FLAT list sorted by `Template_DataTemplates.DisplayOrder` ascending, ties by `TemplateName`
(case-insensitivity depends on the DB collation: unverified). Category does NOT group or sort the list.

### 1.2 Folders / categories

- The palette has no folders. The "All Categories" control is a dropdown FILTER (`LeftToolbar.tsx:94-100`, filter at 107:
  `nodeType.category === selectedCategory`). Selecting a category keeps the same relative order.
- Dropdown options come from type 15 templates (category templates 50001..), in server order = type-15 `DisplayOrder`, then
  `TemplateName`. `ContentData.sortOrder` on category rows is declared (`NodeTemplates\Domain\NodeCategory.ts:15`) but is
  NEVER read by any sort (verified by grep of NodeTemplates, flow-studio-designer/store/services/category-filter;
  `flow-studio-api\src\clients\nodeTypeApiClient.ts:58-79` maps `DisplayOrder -> sortOrder` for a different endpoint
  `/api/v1/process/process-element-categories/list`, and `getNodeCategories` has no caller: not the palette source).
- A palette entry's category is `ContentData.category` (matched to a type-15 `ContentData.code`). `DataTemplateCategoryID`
  (DB column) is not used by the palette; the server only uses it in `GetByCategoryAsync` (`DataTemplateRepository.cs:58-69`).
- Type 15 rows and dropdown order (local DB, verified): Triggers 10, Social Media 16, HTTP 20, Database 30, Transform 40,
  Notifications 60, Files 70, Blockchain 80, Language Models 100, Agent Tools 110, Human-in-Loop 120, Infrastructure 140,
  RAG 140 (tie, name order puts Infrastructure first), Workflow 150, Error Handling 160. `ContentData.sortOrder` is 1..16
  and disagrees (Social Media is `sortOrder` 16 but `DisplayOrder` 16 puts it second): only `DisplayOrder` matters.
- 11 type-13 `category` values have no type-15 row and therefore cannot be selected in the dropdown (they show only under
  "All Categories"): ai-agent, ai-function, chat, cloud, communication, enterprise, flow-ai-agent, integration, logic,
  productivity, satellite (296 of 1209 templates locally).

### 1.3 Type 14 (node-type cards 40xxx)

Type 14 rows (44 locally) are NOT palette entries. They feed only the Enhancer lookup `nodeTypeMap.get(template.nodeTypeCode
|| template.code)` to back-fill displayName/description/color/icon/ports/help (`NodeTemplateEnhancer.ts:22-45`). Their
`DisplayOrder` and `ContentData.sortOrder` (e.g. 40072 SQL Server = 201, 40003 Database = 30, 40020 MongoDB = 200,
40073 MySQL = 202) have no effect on the palette. All 44 rows carry `sortOrder`; none carry isFrequent/isFavorite/isTopRated.

### 1.4 Frequent / Favorite / Top-rated

`isFrequent`, `isFavorite`, `isTopRated` are read from the TYPE 13 `ContentData` (`NodeTemplates\Domain\NodeType.ts:72-74`;
edited in `DataTemplates\Components\EditDataTemplateForm.tsx:101-106`). `CurationFilter\useCurationFilter.ts:26-35`
only FILTERS (all / frequent / favorite / topRated); it never reorders. Local counts, type 13: 169 frequent, 105 favorite,
167 top-rated. `ContentData.sortOrder` exists on 0 of 1209 type-13 rows.

### 1.5 What the user actually sees (local DB, verified)

- Distribution of type-13 `DisplayOrder` (1209 rows, none archived): 75 negative, 1 zero, 413 in 1-99, 677 in 100-999,
  43 >= 1000; up to 49 rows share one value (`DisplayOrder = 10`).
- The list starts with negative values: rank 1-15 Salesforce (-9990234..-9990220, category enterprise), 16-35 Ondo
  (-9990219..-9990200), 36-52 Jira (-9990199..-9990183), then Cloudflare -9990182..: so those families sit at the top.
- Operation templates of one node type do NOT cluster; they interleave with unrelated nodes, ordered by name inside each tie:
  - `DisplayOrder = 40` has 29 rows from 29 different node codes, alphabetical: ... "Merge", "Place Binance Limit Order",
    "Preview Coinbase Order", "Query Notion Database", "S3 Upload", "Scheduled Trigger", **"SQL Server"** (10000054),
    "Start Container", "TikTok Video Get Status", "Update Odoo Contact" (91020126), "Update Slack Message", "Wormhole ...".
  - `DisplayOrder = 410` has 9 rows: "Add Users to Slack User Group", "Apify Actor Run" (x2: 10000127, 91020113),
    "Ethereum - Transfer NFT", "IPFS - Key: Rename", "Kubernetes - Get Node", "Mailgun - Bulk Upload Members (JSON)",
    **"SQL Server Query Execute"** (91030001), "Wormhole - Get Contract Addresses". `420` repeats the pattern with
    "SQL Server Row Insert" (91030002) etc.
  - The 38 SQL Server templates (10000054 at 40; 91030001-91030037 at 410..770 step 10, IDs are sequential by DisplayOrder) occupy
    palette ranks 357..1155 with 761 foreign entries between them. Odoo (35) spans ranks 95..825 (696 foreign between),
    MongoDB (12) 245..1097. Apify (12; 10000127.. at 410..510 plus 91020113) and Redis (103, 300..402) are tighter but
    interleave with the 410.. band of other nodes (Apify ranks 936..1021, 74 foreign between).
  - Jira (17), Cloudflare (23), Ondo, Salesforce are contiguous only because they use large negative numbers.
- Consequence: DisplayOrder is one GLOBAL sequence for all palette entries. Two authors who each pick 410, 420, ... for a
  new node will interleave. To cluster a node's operations, its templates need a private contiguous band (or the palette must
  sort by category, then node type, then DisplayOrder: not implemented).

## 2. Config dialog form order - verified

### 2.1 The rule

| Layer | Behaviour | File:line |
|---|---|---|
| Form fetch | `getNodeFormsBySubUsage(processElementID, NodeDesignConfiguration)` | `flow-studio-designer\src\components\Modals\ConnectorConfigDialog.tsx:395-398` |
| Sort | `[...response.data].sort((a,b) => a.displayOrder - b.displayOrder)`: ONE global ascending sort over all tiers | `ConnectorConfigDialog.tsx:410` |
| Main form | `forms[0]` is used as THE schema (main form) and, after values load, as the active tab | `ConnectorConfigDialog.tsx:411, 487, 526` |
| Tabs | when `configForms.length > 1` a left sidebar is shown | `ConnectorConfigDialog.tsx:1323` |
| Sidebar | `ENABLE_FORM_LABEL_MENU = true` selects `FormLabelMenu` (label folders), else `FlatFormTabList` (input order) | `Modals\formLabelMenu\index.ts:14`, `ConnectorConfigDialog.tsx:1324-1338`, `FlatFormTabList.tsx:16-31` |
| Label folders | folders sorted by `label.displayOrder ?? first item's Atlas_Forms.DisplayOrder ?? MAX`, then title; forms WITHOUT `Metadata.Labels` are listed AFTER all folders, in input order | `atlas-forms-bridge\src\formLabelMenu\buildFormMenuTree.ts:22-58`, `mapNodeFormsToMenuItems.ts:24` |
| Read-only list | properties modal also sorts by `displayOrder` | `Modals\NodePropertiesModal.tsx:281` |

The server side already orders inside each tier and by priority, but the client sort in line 410 discards the tier grouping:

| Server step | File:line |
|---|---|
| One query per usage, `ORDER BY DisplayOrder, Name` | `BizFirstPayrollV3\src\mvc-server\AtlasForms\BizFirst.Atlas.Forms.Manager\BizFirst.Atlas.Forms.Manager.Infrastructure\Repositories\FormRepository.cs:94-104` |
| Tiers fetched in `FormUsages` order (documented avatar, profile, node-type, common); settings tier first | `...\ProcessEngine.Service\Services\Executor\Service\Base\Forms\NodeFormResolver.cs:56-84, 106-121` |
| `Merge()`: per set `OrderBy(DisplayOrder)`, first set claiming slot `FormCode\|NodeUsage\|NodeSubUsage` wins (profile beats common on a slot clash) | `BizFirst.Ai.ProcessEngine.Domain\Node\Services\NodeFormSets.cs:30-44, 48-51` |
| Tier stamped on each form: `Source = "Tier (<Description>)"`, copied to `ResolutionTier` | `NodeFormResolver.cs:113, 140-146`; `NodeFormsExtendedService.cs:173-174` |

So the server returns Profile forms, then NodeType forms, then Common forms (each ascending by DisplayOrder). The client
re-sorts the whole list purely by `DisplayOrder`. Whether the wire response preserves the merge order (NodeFormsService
layer) is unverified, but irrelevant because of line 410. JS `Array.sort` is stable, so equal `DisplayOrder` keeps the server
(tier) order.

### 2.2 Consequence of mixed bands

Common forms (`PrimaryUsage = 'node-form-common'`, 24 rows, local verified): 100803=1002, 100805=1003, 100890=2000,
801007..801009 and 801001 = 5500-5503, 801002..801006 = 5510-5514, 14000=9080, 13000=9081, 11110=9082, 100700=9083,
11109/100800=9084, 100801=9085, 100802=9086, 100804=9087, 10006/10000=9099, 10008=9900.

A profile/node-type form sorts:
- below 1002: ABOVE all common forms, and is `forms[0]` = the main form. This is the desired outcome.
- between 1003 and 5500 (Odoo 3601-3635, reported): in the MIDDLE, after Data Mapping (1002), Output Data (1003) and
  Autonomous Identity (2000) and before HIL/Response/Policy commons: the main form is then `100803`
  (`NodeConfiguration_DataMapping_InitialDataSource`), NOT the operation form, so the dialog opens on the wrong form and the
  operation form is a secondary tab.
- >= 5500 (Jira 30001+, Docker 40363, SSH 40202+, reported): at the BOTTOM, after all commons, and the dialog opens on
  the first common form.
With label folders (`ENABLE_FORM_LABEL_MENU = true`) the visible sidebar order additionally depends on `Metadata.Labels`;
`forms[0]` (schema/active tab) is still chosen by the flat sort, so the sidebar top item and the opened form can differ
(unverified in the UI; derived from code).

## 3. Relation of `Tier` (Profile / NodeType / Common) to order

- The tier is only a label (`ResolutionTier`/`source`) plus the merge priority on slot clashes; it is NOT an ordering key
  on the client. The client orders by `displayOrder` alone (`ConnectorConfigDialog.tsx:410`).
- Server order is tier-first (settings, avatar, profile, node-type, common), so with a tier-aware client the result would be
  correct regardless of numbers. Today, correctness depends on numbers: profile/node-type must be below every common form.
- Exact label text for the NodeType tier (`Tier (NodeType)`?) comes from `usage.Description`, defined outside the files read:
  unverified. The Profile and Common labels are documented in `form-resolution-pipeline.md` as `Tier (Profile)` and `Tier (Common)`.

## 4. Real DisplayOrder data of profile/node-type forms (LOCAL DB, verified)

Scope: `Atlas_Forms` rows with `PrimaryUsage LIKE 'node-form-%'`, `Deleted = 0`, excluding `node-form-common`.

| Family | Rows | Min | Max |
|---|---|---|---|
| all profile/node-type | 1292 | 0 | 1001 |
| sqlserver | 37 | 100 | 1001 (18500 = 1000, 18501 = 1001, 25001 bulk-copy = 1001, the other 34 = 100) |
| apify | 12 | 100 | 1001 |
| docker | 44 | 100 | 1001 |
| odoo | 35 | 100 | 100 |
| jira | 23 | 100 | 100 |
| ssh | 9 | 100 | 100 |
| guardrails | 7 | 100 | 106 (13001..13007 -> 100..106) |
| policies | 6 | 100 | 105 |

Most common values: 1001 x568, 100 x562, 1 x67. Rows with DisplayOrder >= 1002: 0 locally. Multi-form node types locally
(ascending = intended order): approval 10002..800004 = 100..106, ai-agent 100..106, flow-ai-agent 100..105, ai-tool-server 100..103,
chat 100..103, ai-function 100..101, form-trigger 100..101, http-request 100..101, guardrails 100..106, policies 100..105,
form: 12001 = 1, 11000 = 1, 11014 = 1001 (two forms tie at 1, order between them is by `Name`).

Discrepancy: the local DB is already inside the recommended band, and differs from the reported values (Odoo 3601-3635,
Jira 30001+, Docker 40363, SSH 40202+, SQL Server 1000-1036, 590 rows >= 1002). Conclusion: the reported values are
either in the served REMOTE DB (unverified) or in repo scripts not applied locally (unverified; repo scripts not scanned).
Also note: the value `100` is shared by 562 rows and `1001` by 568 rows; ties resolve by `Name` (server) and stay stable on
the client, so only relative order among a node's own multiple forms needs preserving.

## 5. Recommended convention, detector and normaliser

### 5.1 Convention (proposal)

| Band | Use |
|---|---|
| 1 - 999 | Profile and node-type forms. Suggested: first form of a node = 100 (or lower), others +1 in intended tab order. Profile forms before node-type forms of the same node |
| 1000 - 1001 | Legacy values already in use; accept but do not create |
| 1002 - 9999 | Common forms only (`PrimaryUsage = 'node-form-common'`) |
| Palette (type 13) | one private contiguous band per node code, e.g. start at (node-type card `sortOrder` x 1000) and +10 per operation; do not reuse 10..770 without checking the code's neighbours |

Optional client hardening (proposal, not implemented): at `ConnectorConfigDialog.tsx:410` sort by tier rank
(Profile < NodeType < Common, from `source`/`resolutionTier`) then `displayOrder`, so a wrong number can never demote the
operation form below a common form. For the palette, sort by category `DisplayOrder`, then node-type card `sortOrder`, then
template `DisplayOrder`, so operations cluster.

### 5.2 Detector SQL (read-only, run on EVERY database that may be served)

```sql
-- A. Profile/node-type forms that sort at or after the first common form (violators)
SELECT PrimaryUsage, COUNT(*) AS FormCount, MIN(DisplayOrder) AS MinDisplayOrder, MAX(DisplayOrder) AS MaxDisplayOrder
FROM dbo.Atlas_Forms
WHERE Deleted = 0 AND Archived = 0
  AND PrimaryUsage LIKE 'node-form-%' AND PrimaryUsage <> 'node-form-common'
  AND DisplayOrder >= 1002
GROUP BY PrimaryUsage
ORDER BY MinDisplayOrder DESC;

-- B. Summary
SELECT COUNT(*) AS NonCommonForms,
       SUM(CASE WHEN DisplayOrder >= 1002 THEN 1 ELSE 0 END) AS AtOrAbove1002
FROM dbo.Atlas_Forms
WHERE Deleted = 0 AND Archived = 0
  AND PrimaryUsage LIKE 'node-form-%' AND PrimaryUsage <> 'node-form-common';

-- C. Palette: node codes whose templates interleave with others (type 13)
WITH r AS (
  SELECT JSON_VALUE(ContentData,'$.code') AS Code,
         ROW_NUMBER() OVER (ORDER BY DisplayOrder, TemplateName) AS Rn
  FROM dbo.Template_DataTemplates
  WHERE DataTemplateTypeID = 13 AND Deleted = 0 AND Archived = 0)
SELECT Code, COUNT(*) AS Templates, MIN(Rn) AS FirstRank, MAX(Rn) AS LastRank,
       MAX(Rn) - MIN(Rn) + 1 - COUNT(*) AS ForeignEntriesBetween
FROM r GROUP BY Code HAVING MAX(Rn) - MIN(Rn) + 1 - COUNT(*) > 0
ORDER BY ForeignEntriesBetween DESC;
```

### 5.3 Normaliser (DO NOT RUN without explicit confirmation naming the database)

Renumbers ALL forms of every violating `PrimaryUsage` group into 100, 101, 102, ... keeping the group's existing relative
order (ties broken by `FormID`, matching the server tiebreak by `Name` only approximately: review ties first). Multi-form node
types (approval, form, form-trigger, ai-agent, flow-ai-agent, chat, http-request, ai-function, ai-tool-server, guardrails,
policies) keep their internal tab order because rank is computed per `PrimaryUsage`. A group larger than 899 rows would
overflow the band (none known).

```sql
;WITH Violators AS (
  SELECT DISTINCT PrimaryUsage
  FROM dbo.Atlas_Forms
  WHERE Deleted = 0 AND Archived = 0
    AND PrimaryUsage LIKE 'node-form-%' AND PrimaryUsage <> 'node-form-common'
    AND DisplayOrder >= 1002),
Ranked AS (
  SELECT f.FormID, f.DisplayOrder AS OldDisplayOrder,
         99 + ROW_NUMBER() OVER (PARTITION BY f.PrimaryUsage ORDER BY f.DisplayOrder, f.FormID) AS NewDisplayOrder
  FROM dbo.Atlas_Forms f
  INNER JOIN Violators v ON v.PrimaryUsage = f.PrimaryUsage
  WHERE f.Deleted = 0 AND f.Archived = 0)
UPDATE f
SET f.DisplayOrder = r.NewDisplayOrder,
    f.LastModifiedOn = GETDATE()
FROM dbo.Atlas_Forms f
INNER JOIN Ranked r ON r.FormID = f.FormID
WHERE r.NewDisplayOrder <> r.OldDisplayOrder;
```

Side effects to check first: `DisplayOrder` is also the fallback folder order for `Metadata.Labels` without their own
`displayOrder` (`buildFormMenuTree.ts:43`) and the `Merge()` order (`NodeFormSets.cs:37`); the form cache is 24 h
(`caching-layers.md`), so restart the WebApi and hard-refresh after applying. Save the before-values first
(`SELECT FormID, DisplayOrder ... INTO` a backup table, or export) so the change is reversible. Repo scripts that seed these
forms must be corrected too, or a re-run will reintroduce the values.

## 6. Where ordering is controlled

| Surface | Table / column or JSON field | File:line | Default / effect |
|---|---|---|---|
| Palette entry order | `Template_DataTemplates.DisplayOrder` (type 13), then `TemplateName` | `DataTemplateRepository.cs:77-80` | Flat global list; frontend keeps it (`LeftToolbar.tsx:102-109, 231`) |
| Palette category dropdown order | `Template_DataTemplates.DisplayOrder` (type 15), then `TemplateName` | `DataTemplateRepository.cs:77-80`; `LeftToolbar.tsx:94-100` | Filter only, not grouping |
| Palette category membership | `ContentData.category` (type 13) = `ContentData.code` (type 15) | `LeftToolbar.tsx:107` | 11 categories not selectable (no type-15 row) |
| Category `sortOrder` | `ContentData.sortOrder` (type 15) | `NodeCategory.ts:15` | Ignored |
| Node-type cards | type 14 `DisplayOrder`, `ContentData.sortOrder` | `NodeTemplateEnhancer.ts:22-45` | Not used for order; only metadata back-fill |
| `DataTemplateCategoryID` | `Template_DataTemplates.DataTemplateCategoryID` | `DataTemplateRepository.cs:58-69` | Not used by palette |
| Frequent / Favorite / Top-rated | `ContentData.isFrequent/isFavorite/isTopRated` (type 13) | `useCurationFilter.ts:26-35` | Filter only, no reorder |
| Config dialog form order | `Atlas_Forms.DisplayOrder` | `ConnectorConfigDialog.tsx:410` | Global ascending; `forms[0]` = main form |
| Server form order per tier | `Atlas_Forms.DisplayOrder`, then `Name`; tiers in `FormUsages` order | `FormRepository.cs:94-104`; `NodeFormSets.cs:30-44` | Tier-first, discarded by client sort |
| Sidebar folders | `Atlas_Forms.Metadata` `Labels[].displayOrder` (fallback `Atlas_Forms.DisplayOrder`) | `buildFormMenuTree.ts:43, 53-57` | Folders first, unlabelled forms after |
| Sidebar mode | constant `ENABLE_FORM_LABEL_MENU` | `formLabelMenu\index.ts:14` | `true` |
| Tier label | `NodeForm.Source` / `ResolutionTier` | `NodeFormResolver.cs:113, 140-146`; `NodeFormsExtendedService.cs:173-174` | Label only, not an ordering key on the client |

## 7. Unverified / not done

- Remote (served) DB values: not queried (credentials are not stored by policy). All reported figures for Odoo/Jira/Docker/SSH
  and the 590 count are unverified; local data shows none of them.
- Case sensitivity of the `TemplateName` / `Name` tiebreak (collation): unverified.
- Exact `Tier (NodeType)` label and whether the wire response keeps merge order: unverified.
- Visual confirmation in the running UI (sidebar order with folders vs `forms[0]`): not done; derived from code.
- Repo seed scripts for Atlas_Forms were not scanned for the reported values.

## Correction: why the local DB shows no forms at DisplayOrder >= 1002 (added 2026-09-20)

The values quoted above (Odoo 3601+, Jira 30001+, Docker up to 40363, SSH 40202+, 590 of 1292 profile/node-type forms at 1002 or higher) were
measured in the local `data-ocean-platform-prod` DB BEFORE the normalisation script
`BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\Sync_AtlasForms_2026_09_20_profile_forms_display_order_on_top.sql` was run on it
(598 forms renumbered into the band 101..499 (policy above); groups already below 1002 were left alone, e.g. SQL Server 1000, 1001). A query run after that script
shows a maximum of 1001 for profile/node-type forms. That is not a discrepancy with a remote DB; it is the result of the fix.

Consequences for anyone verifying:
- The seed scripts under `projects\<Group>\<Node>\Forms\*.sql` still contain the ORIGINAL DisplayOrder values. A fresh DB built from them will show the
  problem again until the Sync script is run (or the scripts are edited). Re-run the Sync script after every fresh seed.
- The API can keep serving the old order until the WebApi caches expire or the IIS site is recycled: a node checked right after the script still
  returned Odoo Custom_Delete at order 3634 while the DB said 100.
- The pre-change values were saved to a rollback CSV (FormID, DisplayOrder, PrimaryUsage for every node-form-* row) in the session scratchpad; regenerate
  from the seed scripts if it is gone.
