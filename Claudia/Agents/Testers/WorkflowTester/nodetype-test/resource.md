# Node Type Test – Resources

Source locations used by the Node Certification Agent (see `input.md` for the task, `nodetypetestagent.md` for the agent spec).
All three paths were checked on 2026-11-07 and exist.

| Layer | Path | What to look for |
|---|---|---|
| UI (Flow Studio) | `C:\BizFirstGo_FI_AI\BizFirstAiStudio\src\flow-studio\apps\flow-studio` | Workflow canvas, node config forms, Observe panel / execution logs |
| API (execution nodes) | `C:\BizFirstGo_FI_AI\BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes` | Node implementations, config schemas, execution handlers |
| DB (schema) | `C:\BizFirstGo_FI_AI\BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo` | `Tables\*.sql` and `Data\...` for node types and node-related tables |

## Output folders (this directory)

| Folder | Purpose |
|---|---|
| `nodetype-list\` | Discovered nodes per node type |
| `nodetype-config\` | Collected configuration per node |
| `nodetype-screenshot\` | Evidence screenshots from test runs |
| `nodetype-status\` | Per-node certification status |

## Notes

- Do not add credentials or connection strings to this file.
- The DB path is the schema source of truth. Use `origin/main` of BizFirstFiDB, because `pre-main` lags far behind.
