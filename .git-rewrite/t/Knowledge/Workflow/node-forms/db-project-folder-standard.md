# DB project folder standard (BizFirstFiDB data scripts)

Applies to `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\<Group>\<Node>\`. Established 2026-09-20 by the cleanup in `.\audit\cleanup-2026-09-20.md`.

## The rule

No folder named `obsolete`, `backup`, `unapproved`, `unsorted`, `deleted` (any case), `*_deleted`, `*_backup`, `*_old`, and no `TBR_` / `Std_` / vendor-prefixed legacy copies. Git history is the archive. New work goes straight into the standard folders below; finished-with scripts are deleted with `git rm`, never parked. (`.gitignore` has `Backup*/`: content in such a folder is not even in git, so it is lost on delete.)

## Layout

```
<Group>\<Node>\
    ProcessElementTypes\   Process_ProcessElementTypes_<Node>.data.sql      (one PET per node type code)
    Forms\                 Atlas_Forms_<FormID>_<node>_<resource>_<operation>.data.sql
    DataTemplates\         Template_DataTemplates_<ID>_<node>-<resource>-<operation>.data.sql
    Credentials\           (only if the node has credential-type scripts)
    Sync\                  Sync_<Node>_<yyyy_mm_dd>_<what>.sql            (one-off repair / alignment scripts)
    Docs\                  NodeReport.md / README.md / design notes       (no SQL)
```

Group-level shared folders (`Core\DataTemplates`, `Standard\Standard\...`) follow the same names. No other sub-folder names (no `sub`, no per-category folders); a template that belongs to a node lives in that node's `DataTemplates\` directly.

## Script rules

| Topic | Rule |
|---|---|
| Guard | Every insert script is idempotent: `IF NOT EXISTS (SELECT 1 ... WHERE [<key>] = ...)`, `SET QUOTED_IDENTIFIER ON`, `BEGIN TRY ... END TRY BEGIN CATCH (turn IDENTITY_INSERT OFF) THROW END CATCH`, `GO` |
| Encoding | ASCII only. Emoji/icons as JSON `\uXXXX` escapes. Run sqlcmd with `-f 65001` |
| IDs | The ID in the file name equals the ID in the script and is unique across all active scripts and the DB. Check both before choosing (forms per node band, templates 10000625+ in the 10M block at the time of writing) |
| Forms | `PrimaryUsage` = `node-form-<node>[-<resource>-<operation>]`; `DisplayOrder` strictly between 100 and 500 (use 101); no field that collects a password, key or token (use a `credentialID` picker); identifiers use `ID` |
| Profile forms | `PrimaryUsage` minus `node-form-` must equal the palette template's `connector.configuration.profileName`; template `configFormId` stays empty |
| Templates | `TemplateName` "<Node type> - <Resource>: <Operation>" (or "<Node type> - <Operation>"); `displayName` identical |
| PET | `Code` equals the executor `ProcessElementTypeCode`; `ConfigurationSchema` lists the keys the settings class reads |
| Sync scripts | UPDATE only (never DELETE/DROP/TRUNCATE), guarded so a second run changes 0 rows, name states the date and what changed, kept in `Sync\` after running |
| After DB writes | Run the two normalisers in `dbo\Data\projects`: `Sync_AtlasForms_2026_09_20_profile_forms_display_order_on_top.sql` (forms) and `Sync_DataTemplates_2026_09_20_add_node_type_to_names.sql` (type-13 templates) |

## Keeping a script current against the code

Before adding or changing a form: open the executor (`NodeTypeName` / `ProcessElementTypeCode`) and the settings/operation-info classes under `BizFirstPayrollV3\src\mvc-server\AI\ExecutionNodes\...` (on disk `AI`, in git `Ai`); every control `id` (or binding path) must be a key the code reads (`ReadConfigByKey`, `ReadConfigNodeByKey`, `TryGetValue`), with the same casing. Cite `File.cs:line` in the script header. Record gaps (code reads more/less than the form) instead of inventing keys.

## Removing or replacing a script

1. Prove it is a duplicate (same ID/Code, same or newer content), superseded, or that the node no longer exists in code.
2. If it is the only definition of something the code still uses and the DB lacks it, promote it (rewrite to this standard, move to the right folder, run the guarded script) instead of deleting.
3. Delete with `git rm`; if a DB row remains without a script, list it for a human decision (rows are not deleted by scripts).
4. Fix any doc or `.sqlproj` that names the path (`BizFirstAtlasDB.sqlproj` currently has no entries for `Data\projects`).
