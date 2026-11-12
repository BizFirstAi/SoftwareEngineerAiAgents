# Caching Layers - why a correct fix "does not show"

Five layers. Walk them top to bottom before deciding a fix failed. Verified/read 2026-09-20 unless marked.

| # | Layer | Where | TTL | Scope | Clear by |
|---|---|---|---|---|---|
| a | Template list cache | `DataTemplateRepository.GetByTypeAsync` (`BizFirstAi.Template.Infrastructure\Repositories\DataTemplateRepository.cs`) `IMemoryCache`, types 13/14/15 | 10 min | per tenant, per process | wait 10 min or restart WebApi |
| b | Output cache on `/assets` | `BizFirstAi.Template.Api.Base` `NodeTemplateCachePolicy` | 1 h (code comment says 24 h) | varied by `X-Tenant-ID` | restart WebApi |
| c | Form set cache | `NodeFormResolver`, `IMemoryCache` per usage | 24 h | per process | restart WebApi. Cache-hit return is commented out so it always refetches: **verify** |
| d | Workflow definition cache | ProcessEngine workflow loader | up to 60 min, NOT cleared on save (Anit's doc) | per process | restart WebApi; check log `Thread Starting ... TotalNodes=N` |
| e | Frontend template load | Studio calls `POST /api/v1/ai/template/data-template/by-type` (body `DataTemplateTypeID {ID:13}`, PageSize 10000, header `X-Tenant-ID: 1`) at startup | until reload | per browser tab | hard refresh (Ctrl+F5) AFTER the API restart |

## Practical order after applying a DB fix

1. Restart the Consolidated WebApi (user's action) - clears a, b, c, d.
2. Tail `logs\detailed\app-YYYYMMDD.log` for startup complete.
3. Call `by-type` (runbook J2) and confirm the new IDs appear. If not: wrong DB (`database-topology.md`), not cache.
4. Ctrl+F5 the Flow Studio tab - clears e.
5. Drop a NEW node from the palette. Nodes already on the canvas keep their saved connector config: re-drop them, or open and
   save them so template defaults merge in (`workflowStore.ts`).

## Diagnosing "stale" vs "wrong DB"

- API row count == local count minus the rows you just inserted -> the API reads a different DB (remote). Not a cache issue.
- API row count includes the new rows but the palette does not -> layers a/b/e.
- `by-type` correct, palette correct, dialog wrong -> the node's saved connector config (stale profileName) or layer c.
