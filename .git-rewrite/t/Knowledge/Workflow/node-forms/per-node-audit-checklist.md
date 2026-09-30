# Per-Node Audit Checklist

Run for ONE node type. SQL is in `..\..\..\Procedure\Workflow\node-forms\debug-runbook.md` (Q1-Q5); the all-node version is `..\..\..\Procedure\Workflow\node-forms\audit-all-datatemplates.md`.
Replace `<node>` with the node type code. Record results in `node-type-status-table.md`.

| # | Check | How | Pass condition |
|---|---|---|---|
| 1 | Registry row exists | Q5 (`Process_ProcessElementTypes` by code) | 1 live row |
| 2 | Executor exists | scoped Glob under `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\` | folder found |
| 3 | Operation forms exist | Q1: `Atlas_Forms` `PrimaryUsage LIKE 'node-form-<node>-%'`, `NodeSubUsage='DesignTime'` | one form per operation |
| 4 | Forms are `PrimaryConfigPage` / `DesignTime` | Q1 columns | yes for all |
| 5 | No stray `node-form-<node>` row (NodeType tier) | Q1 | absent, or intentionally the one shared form |
| 6 | Type 13 templates exist per operation | Q2 | one per form |
| 7 | Every template has `connector.configuration` | Q2 `HasConnectorBlock` | 1 for all |
| 8 | Every template has profileName | Q2 | non-empty |
| 9 | profileName == PrimaryUsage minus `node-form-` (binary collation) | Q3 | 0 mismatches |
| 10 | No orphan profileName (template without form) | Q3 | 0 |
| 11 | No orphan form (form without template) | Q3 | 0 (except NodeType-tier forms) |
| 12 | No duplicate palette entries | Q4 | 0 duplicates by code+TemplateName / profileName |
| 13 | Type 14 card present and not shadowing | Q2 | 1 card, no ports |
| 14 | Repo scripts match DB | `ls` of `...\projects\<Group>\<Node>\DataTemplates` vs Q2 IDs | same IDs; no stale/duplicate form files |
| 15 | Serving DB identified | `database-topology.md` | stated |
| 16 | API check | `GetNodeForms` on a freshly dropped node | `Tier (Profile): 1`, right form |
| 17 | Palette check in UI | Ctrl+F5, drop each operation | correct label and form |

Stop at the first failing row that explains the symptom; do not batch-fix unrelated findings without telling the user.

> POLICY: profile-driven and node-type forms must have Atlas_Forms.DisplayOrder strictly between 100 and 500 (101..499); common forms stay at 1002 and above. See rag/display-order-and-menu.md (section POLICY) for the detector SQL and the normaliser script. Check it in every fix and audit.
