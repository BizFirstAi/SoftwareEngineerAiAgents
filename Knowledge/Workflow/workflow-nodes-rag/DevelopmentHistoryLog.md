# Development History Log — Workflow Nodes RAG

## 2026-09-20 - DB data-script tree cleaned: no obsolete/backup/unapproved/unsorted/deleted folders, standard documented

**Why:** clean slate requested by Binoy for `BizFirstFiDB\...\dbo\Data\projects` (95 files in banned folders or with TBR_/Std_/Ahsan_ prefixes).

**What changed:** each file proven against active scripts, the live local DB and the C# executors; 78 removed (duplicate/redundant), 17 promoted/moved/rewritten (Audio node, RAG document add/delete/update nodes, workflow-control form, RunTime forms 10002/10003, Stripe form without the dead secret field, knowledgebase args, approval render options). Details: workflow-development-node-forms/audit/cleanup-2026-09-20.md. New standard: workflow-development-node-forms/rag/db-project-folder-standard.md (layout ProcessElementTypes / Forms / DataTemplates / Credentials / Sync / Docs, guarded ASCII scripts, no banned folders).

**Reminder for nodes work:** new scripts go straight into the standard folders; never park anything in obsolete/backup/unsorted/unapproved (`.gitignore` `Backup*/` even hides such folders from git).

## 2026-09-20 - Node insertion audit of the live local DB (128 node folders)

**Why:** the palette search for "harshi" found nothing and many nodes were suspected missing from the DB.

**What changed:** no repo scripts were edited. Audit report: workflow-development-node-forms/audit/node-insertion-audit-2026-09-20.md. Inserted into data-ocean-platform-prod (local only): 3 Process_ProcessElementTypes (dataproof, safe, postgresql), 61 Atlas_Forms, 67 Template_DataTemplates (DataProof 9, Safe 19, PostgreSQL 38, Smtp 40019 extracted from Synchup_smtp.sql step 2), 1 AIExt_CredentialTypes (GOOGLE_OAUTH2). Counts before/after: PET 112->115, Forms 1394->1455, DataTemplates 1380->1447, CredentialTypes 10->11. Display-order normaliser ran (61 rows); the names normaliser updated 0 rows.

**Findings:** "harshi" does not exist anywhere (scripts, DB, C#, git). 123 of 128 nodes were already complete. Unguarded scripts risk duplicates: DataTemplates use plain INSERT with explicit IDs (PK protects), some PET scripts are guarded only by IF NOT EXISTS on Code, and Synchup_smtp.sql switches DB with USE and deletes rows, so only its missing step was run. 21 C# executors have no PET script (listed in the audit); 325 type-13 templates have profileName MISSING or MISMATCH (not fixed). The API caches type-13 templates for about 10 minutes: recycle IIS and press Ctrl+F5 before expecting palette changes.

## 2026-09-20 — Lesson: create apps as Workflow apps (Workflow Apps tab filters on Project.ProjectTypeID = WORKFLOW; MCP and Flow Studio creation fixed in StudioProjectService); see agent/build-and-verify-workflow-via-mcp.md

## 2026-09-20 — Runbook: calling the Workflow MCP directly from a shell (LeadFirst-to-Odoo recreation)

**Why:** Recreating Anit's LeadFirst→Apify→AI Agent→Odoo workflow locally (project 1094, thread 1079, version 1077)
needed the Workflow MCP tools, but no MCP client was attached to the session. The endpoint could be driven directly, and
the first attempts failed in ways worth recording.

**What changed:** `agent/build-and-verify-workflow-via-mcp.md` gained a "Driving the MCP endpoint from a shell" section.

**Findings (all confirmed live on `https://localhost:10001/mcp`):**

1. The endpoint speaks streamable HTTP. A plain POST returns `406` unless `Accept: application/json, text/event-stream`
   is sent. Handshake: `initialize`, capture the `mcp-session-id` response header, send `notifications/initialized`, then
   `tools/list` / `tools/call` with `Mcp-Session-Id`. Replies arrive as `event: message` / `data: {json}` lines.
2. Every tool returns `Access denied: No valid MCP caller identity found` without an identity. A scoped `X-Api-Key`
   request header fixes it (the browser session token is not needed). Never write the key into a doc or script that is committed.
3. `get_workflow` takes only `processThreadId` (not a version ID) — passing `processThreadVersionId` gives the unhelpful
   `An error occurred invoking 'get_workflow'.`
4. `loop` exposes output ports `loop` and `done` (no `main`); Anit's doc describes a `main` port.
5. Node config key casing differs from Anit's config: the Apify schema says `credentialId`, her config uses `credentialID`.
6. Credentials 20/21/22 from the remote workflow database do not exist in the local DB (local list stops at 19), so the
   recreation leaves credential fields unbound.
7. No Python on this machine; Node 20 `fetch` works for scripting the calls. Set `NODE_TLS_REJECT_UNAUTHORIZED=0` for the dev cert.
8. Nodes carry `continueOnFail`, `retryOnFail`, `maxRetries` and `alwaysOutputData` fields — available for the error-handling fix.

## 2026-08-20 (later same day) — Retroactive split-doc pattern applied to `ai-agent`/`flow-ai-agent`

**Why:** Binoy refined the two-tier design after the initial build (below): for most node types, one
Tier 1 doc per type is right, but a node type whose real settings class has more than ~2-3 genuinely
independent sub-objects/concerns (not just a flat property list) should apply the same two-tier
pattern one level deeper — a lean per-node index doc + one focused doc per sub-feature, retrieved
separately. `ai-agent` and `flow-ai-agent` were identified as qualifying and split retroactively.

**What changed:**

1. **Re-read the real source fresh** for both node types rather than trusting the existing single-file
   docs' own breakdown. `ai-agent`'s (`OctopusAiAgentNodeExecutorSettings` +
   `OctopusAiAgentBridgeOriginReader` and its 6 partial-class files) confirmed the prior
   characterization (HIL feature-flag overrides, `ConversationScope`, `InvocationMode`, agent-ID
   resolution, tool-server/LLM delegation) and found real content the original single-file doc had
   missed entirely: the `eConversationScope`/`eConversationScopeMode`/`eConversationIsolation` enums'
   actual value sets (11/3/9 values respectively, sourced from `BizFirst.SuperCommon\Scoping\
   ConversationScope.cs` — the old doc's claim that `ConversationScope` was a 2-value enum
   `ProcessElement`/`ProcessDefinition` was itself only correct as a description of the *wrong* DB
   schema, not the real type), 4 action-context inclusion flags
   (`includeInputDataInActionContext`/`includeInputItemsInActionContext`/
   `includeWorkflowMemoryInActionContext`/`customDataInActionContext`), a `sampleData` field, and
   `agentResID`/`agentName`/`userInstructions`/`userInstructionsFieldName`/`agentChannels`/
   `additionalAgentChannels` config keys. `flow-ai-agent`'s (`FlowAiAgentSettings`) was confirmed
   field-for-field accurate against the original doc — the settings class's own 8 source regions
   (`Agent Type`/`LLM`/`Prompt`/`Tools`/`Loop Control`/`Memory`/`SQL Agent`/`Streaming Agent`) matched
   what was already documented.
2. **Split `ai-agent`** into `nodes\ai-agent\00-index.md` (overview, core always-relevant fields,
   sub-feature table, both original JSON examples, the cross-cutting DB-schema-gap gotcha) + 5
   sub-feature docs: `conversation-scope.md` (operation selector, `ConversationScope` object with full
   real enum value tables, `conversationID`/`isNewConversation`, postback fields),
   `hil-features.md` (the fixed, non-configurable HIL feature-flag overrides and `IsHilApplicable`),
   `invocation-and-agent-resolution.md` (`invocationMode`, agent-ID resolution, channel routing,
   memory/owner-axis qualifiers, action-context flags), `prompt-overrides.md` (all 9 prompt-segment
   fields with their real `Purpose` strings from the `Prompts` dictionary), `tool-servers-and-llm.md`
   (the `llm` override, `toolServers` merge, and canvas-wired sub-agent merge, grouped together because
   all three share the same override-vs-merge split implemented by `ProcessEngineAgentOverrideSource`).
3. **Split `flow-ai-agent`** into `nodes\flow-ai-agent\00-index.md` (overview, `agentType` selector,
   sub-feature table, both original JSON examples, the cross-cutting DB-schema-accuracy gotcha) + 5
   sub-feature docs: `llm-and-prompt.md` (provider/model/credential/temperature/tokens + prompt/system
   message — needed for every `agentType`), `tools.md` (tool wiring, `tools`/`reAct` only),
   `loop-and-memory.md` (iteration limits + memory backend/session identity), `sql-agent.md`
   (`agentType: "sql"` only), `streaming-agent.md` (`agentType: "stream"` only).
4. **No content lost in either split** — every field, example, and gotcha from the original
   `nodes\ai-agent.md`/`nodes\flow-ai-agent.md` single files is present in the new split docs (verified
   by walking the old files field-by-field against the new ones before deleting the originals), plus
   the newly-found fields/enum values above. The old single files were deleted only after this
   confirmation.
5. **Updated `00-overview.md`**: the two-tier retrieval section now describes the nested split-doc
   pattern and when it applies; the `ai-agent`/`flow-ai-agent` index rows now point at
   `nodes\{code}\00-index.md` with a "(split — 5 sub-feature docs)" note; the file-count line now notes
   28 Tier 1 files on disk (16 flat + 2×6 split) across the same 18 covered node types.
6. **Updated `agent\add-new-node-type.md`**: added a new Step 2 ("decide: single doc, or split doc?")
   stating the qualifying rule verbatim and both structures side by side; Step 3 (write the doc(s)) now
   documents the split-doc `00-index.md`/`{sub-feature}.md` shape alongside the original single-doc
   shape; Step 4 (update the index) and Step 5 (ingest, renumbered from the old Step 4) both note the
   split-node-type case explicitly (one Insert call per file, one `knowledgeID` per file); the old Step
   5 (independent review) renumbered to Step 6.
7. **Updated `..\workflow-nodes-ingestion.md`**: confirmed the deterministic-per-file `knowledgeID`
   convention needs no design change for the nested structure — a split node type is just more files at
   deeper paths, each with its own independent Insert/Update lifecycle; added an explicit note that
   refreshing one sub-feature doc never requires touching the other sub-feature files' `knowledgeID`s,
   and that retrieval for a split node type should fetch only the specific sub-feature doc(s) a request
   implies, not all of that node type's files reflexively. File-count references updated (18 node
   types / 28 Tier 1 files, up from 19 total files at the initial-build point in the count that includes
   Tier 0).

**What's still open / explicitly deferred:** same as the initial-build entry below — no live ingestion
run yet for any file (split or unsplit), `AgentID` on `AIAgent_KnowledgeBases` still `NULL`,
`BizFirst.Ai.Mcp.Tools.Workflow` still a design. This pass was documentation-only, no code changes, no
live Flow Studio/Qdrant execution attempted (out of scope per the task's own constraints).

## 2026-08-20 — Initial build: DB schema unreliability confirmed, first-pass RAG doc set built

**Why:** `flow-workflow-mcp-design.md` (Task 22) originally recommended skipping RAG for workflow
node configuration, reasoning `Process_ProcessElementTypes.ConfigurationSchema` was a reliable,
structured source — based on sampling only 2 node types. Binoy corrected this directly: *"for flow
mcp server, we need a rag system because the schema in the table is not reliable neither is
complete."* This session re-investigated with a broader sample and built the real thing.

**What changed:**

1. **Confirmed the unreliability** across 18 node types (up from the original 2), spanning
   simple/moderate/complex tiers. Found the column's quality is inconsistent per node type with no
   reliable predictor (not "uniformly bad") — genuinely accurate for some (`http-request`,
   `flow-ai-agent`), stale for others (`ai-agent`), an empty stub despite real required fields for
   several (`if-condition`, `switch`, `webhook-trigger`, `schedule-trigger`, `loop`, `code-execute`),
   and for `slack` a verbatim copy-paste of the unrelated `ai-agent` node type's schema. Full evidence
   is recorded per-node in each `nodes\{code}.md` file's Gotchas section, not centralized — see
   `00-overview.md`'s summary table for the short version.
2. **Built a strict two-tier doc set** at `workflow-nodes-rag\`, mirroring `atlas-forms-rag\v2\`'s
   proven shape: Tier 0 (`00-overview.md`, always-loaded lean index — node type/category/one-line
   description/credentials/doc-status only) + Tier 1 (`nodes\{code}.md`, retrieved on demand, one file
   per node type with full config field table, a real JSON example, and Gotchas). Each Tier 1 file was
   written from the real executor + settings C# source **independently of the DB column's shape** —
   the DB schema was consulted only afterward as a comparison finding, never as a template.
3. **18 node types got real Tier 1 docs**: `manual-trigger`, `webhook-trigger`, `schedule-trigger`,
   `http-request`, `email-smtp`, `email-gmail`, `slack`, `if-condition`, `switch`, `loop`, `delay`,
   `parallel-fork`, `parallel-join`, `sub-workflow`, `code-execute`, `ai-agent`, `ai-function`,
   `flow-ai-agent` — chosen per `flow-workflow-mcp-design.md` Decision #3's existing priority order.
   The remaining ~89 of 107 live node types are a prioritized follow-up list in `00-overview.md`.
4. **Two real node-type-code naming traps found and corrected** during this pass (not schema-content
   bugs — a different failure mode): `schedule-trigger`'s executor has a `NodeTypeName` constant
   literal of `"scheduled-trigger"` that does **not** match what `ProcessElementTypeCode` actually
   resolves to / what the DB `Code` column says (`schedule-trigger`); `email-gmail`'s real DB `Code`
   is `email-gmail`, not the informally-used name "gmail". Both docs are filed under their real code,
   with the mismatch flagged prominently so an agent doesn't author the wrong `type` value.
5. **Wrote the extensibility runbook** `agent\add-new-node-type.md`, mirroring
   `atlas-forms-rag\agent\refreshFromCodeToDoc@agent.md`'s discipline — adding Tier 1 coverage for any
   of the other 89 node types (or a newly-added one in the future) is a defined, low-friction,
   per-file procedure, not a pipeline redesign.
6. **Designed (not executed) the ingestion pipeline**: `..\workflow-nodes-ingestion.md` specifies a
   new `workflow-nodes-spec` Qdrant collection, ingested via the `FlowRag` ExecutionNode
   (Insert/Update, deterministic-`knowledgeID`-per-file convention for atomic refresh), holding Tier 1
   content only (Tier 0 stays always-injected, never retrieved). Wired via a new `AIAgent_KnowledgeBases`
   DB seed row (`BizFirstFiDB\...\dbo\Data\Agents\_Shared\AIAgent_KnowledgeBases_WorkflowNodesSpec.
   data.sql`) following the existing table's real column set and DB standards. **No live ingestion was
   run** — no Qdrant collection was created, no file embedded — this pass had no live Flow
   Studio/Qdrant/embedding-provider environment to execute against within the session's time budget;
   the procedure is specified precisely enough to be a mechanical follow-up, not a design gap.
7. **Updated `flow-workflow-mcp-design.md`**'s §"RAG strategy for node configuration" — the original
   "skip RAG" recommendation is marked superseded with the correction and evidence, original reasoning
   kept under a collapsed `<details>` block for historical record rather than deleted.

**What's still open / explicitly deferred:**
- 89 of 107 node types have no Tier 1 doc yet — prioritized list in `00-overview.md`.
- No live ingestion run; `AgentID` on the new `AIAgent_KnowledgeBases` row is `NULL` pending a
  confirmed real "workflow-building agent" `AgentID` to bind it to.
- `BizFirst.Ai.Mcp.Tools.Workflow` (the MCP module that would call `util-kg-knowledge_retrieval`
  against this collection) remains a design, not yet built — see `flow-workflow-mcp-design.md`.
