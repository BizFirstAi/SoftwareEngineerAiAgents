# Node Forms RAG - Overview (index)

Backing knowledge for `..\..\..\Agents\Builders\WorkflowDeveloper\node-forms-fixer.md`. Verified live 2026-09-20 on the SQL Server case; anything not so verified is
labelled "unverified". Read in this order when debugging a node type:

| # | Doc | Answers |
|---|---|---|
| 1 | `form-resolution-pipeline.md` | How the designer request becomes a list of forms; the five resolver tiers |
| 2 | `profilename-to-form-contract.md` | The exact-match rule: `profileName` == `PrimaryUsage` minus `node-form-` |
| 3 | `data-template-anatomy.md` | What a palette `Template_DataTemplates` row contains and where `profileName` lives |
| 4 | `caching-layers.md` | Why a correct fix "does not show" (five caches) |
| 5 | `database-topology.md` | Which of the two databases the API actually serves |
| 6 | `per-node-audit-checklist.md` | The checklist to run for one node type |
| 7 | `node-type-status-table.md` | Known state per node type (sqlserver fixed; mysql/postgres open; ...) |
| 8 | `display-order-and-menu.md` | How DisplayOrder orders the palette (flat, global) and the config-dialog forms (global sort, main form = first); bands, detector and normaliser SQL |
| 9 | `db-project-folder-standard.md` | The standard layout, naming and script rules for the BizFirstFiDB data-script tree; no obsolete/backup/unsorted/unapproved/deleted folders |
| 10 | `observability-in-nodes.md` | How the common Observability form (11109) is stored and read by the node runtime (per-control WIRED/PARTIAL/not-wired table, flat-vs-nested key mismatch), event/record flow, sensitive-data gaps, recommendations, and what each Observer / Flow Insights panel needs |

Also in the parent folder: `..\..\..\Procedure\Workflow\node-forms\debug-runbook.md` (decision tree + SQL/JS), `..\..\..\Procedure\Workflow\node-forms\fix-playbook.md` (script generation),
`..\..\..\Procedure\Workflow\node-forms\audit-all-datatemplates.md` (all-node audit), `.\lessons\README.md` (SQL Server lessons), `.\resource.md`.

## One-paragraph model

The Flow Studio designer asks the server for a node's forms. The server looks forms up by exact
`Atlas_Forms.PrimaryUsage` in tiers. Operation-specific forms (`node-form-<node>-<resource>-<operation>`) can only be
reached through the **Profile** tier, which reads `connector.configuration.profileName` from the node. That value is
copied onto the node from the **palette data template** it was dropped from. So: no per-operation template carrying
`connector.configuration.profileName` means no operation form, even if every form row exists.
