# Workflow Nodes RAG — Ingestion Pipeline

Companion to `workflow-nodes-rag\00-overview.md` (the content) and `flow-workflow-mcp-design.md`
(the MCP module this collection serves). Follows the exact mechanism `atlas-forms-rag\agent\
ragUploadDesign.md` already designed and proved out for Atlas Forms' own RAG collection — this is a
second application of that same mechanism, not a new pipeline.

## Collection identity

- **Collection name:** `workflow-nodes-spec` — separate from Atlas Forms' own collection
  (`atlas-forms-spec` / `BizFirstAI`, per whichever name that pass ultimately used), per the task's
  explicit instruction to keep the two collections independent.
- **Vector DB provider:** Qdrant, via the `FlowRag` ExecutionNode
  (`BizFirst.Ai.ExecutionNodes.Flow.FlowRag`) — the same tool `ragUploadDesign.md` recommended for
  Atlas Forms, for the same reasons: it takes raw text directly (no `.md` content-type detection bug
  to work around), and its **Update** operation gives a clean, atomic per-file replace when a node
  doc is revised later.
- **DB wiring:** `AIAgent_KnowledgeBases` row created this pass —
  `BizFirstFiDB\...\dbo\Data\Agents\_Shared\AIAgent_KnowledgeBases_WorkflowNodesSpec.data.sql`
  (`Name = 'Workflow Nodes Spec'`, `PrimaryCollectionName = 'workflow-nodes-spec'`,
  `VectorDbProvider = 'Qdrant'`, `RagRole = 'workflow-node-config'`, `MaxResults = 5`,
  `SimilarityThreshold = 0.35`). `AgentID` is deliberately left `NULL` — see "What's deferred" below.

## Ingestion procedure (FlowRag)

**Only Tier 1 content goes into the vector collection — `00-overview.md` (Tier 0) is deliberately NOT
ingested here.** Per Binoy's explicit two-tier framing: Tier 0 is "always execute" — loaded whole into
the MCP tool module's static context/description regardless of what the user asks, the same way
`atlas-forms-rag`'s own `00-overview.md` is "always-injected/loaded whole... not retrieval-dependent"
(`refreshFromCodeToDoc@agent.md` Step 3). Putting it in Qdrant too would be harmless but pointless —
nothing should ever need to *retrieve* the always-loaded file. Tier 1 (`nodes\{code}.md`) is the
"optional" tier — pulled in only when a request implies that specific node type is relevant (e.g. a
user's ask mentions Slack → retrieve `nodes\slack.md` then, not before) — and is the only content this
collection exists to serve.

One **Knowledge Insert** node call **per file** under `workflow-nodes-rag\nodes\` — 28 files as of the
2026-08-20 split-doc pass (16 node types stay one flat file each; `ai-agent` and `flow-ai-agent` are
each a folder of 6 files — `00-index.md` + 5 sub-feature docs). A split node type is not one Insert
call with concatenated content — it is one independent Insert call per file, exactly like every
unsplit node type, just more of them for that one node type:

| Field | Value |
|---|---|
| `collectionName` | `"workflow-nodes-spec"` |
| `providerName` | `"qdrant"` |
| `fileName` | the file's repo-relative path, e.g. `"nodes/ai-agent.md"` for an unsplit node type, or `"nodes/ai-agent/00-index.md"` / `"nodes/ai-agent/conversation-scope.md"` etc. for a split one — the folder segment is just part of the path, nothing special about it |
| `source` | `"workflow-nodes-rag"` |
| `content` | the file's raw Markdown text |
| `knowledgeID` | a **deterministic GUID derived from `fileName`** (e.g. UUIDv5 over the repo-relative path) — required so a future **Update** call with the same derived ID atomically replaces that file's old chunks, same convention `ragUploadDesign.md` §3.2 established for Atlas Forms. Do not omit this and let the service mint a random one, or refresh loses its atomic-replace property. For a split node type, this means N independent `knowledgeID`s (one per sub-feature file, including the index) — updating one sub-feature doc later only needs an **Update** call for that one file's `knowledgeID`, not a re-ingest of the whole node type. |

This confirms the deterministic-per-file `knowledgeID` design holds cleanly under the nested
`nodes\{code}\{sub-feature}.md` structure with no change needed: chunking, retrieval, and refresh are
all already file-scoped, and a folder is just more path segments feeding the same UUIDv5-over-path
derivation. The only design implication of a split node type is retrieval-side, not ingestion-side: a
request that only needs one sub-feature (e.g. "what LLM providers does flow-ai-agent support") should
retrieve only that one file's chunks (e.g. `nodes/flow-ai-agent/llm-and-prompt.md`), not all 6 files
for that node type — the same "fetch only what the request implies" discipline `00-overview.md`
already describes for Tier 1 generally, just one level more granular for split node types.

Chunking is `GenericChunkingService`'s fixed 200-word, zero-overlap split (confirmed in
`ragUploadDesign.md` Part 1B) — boundary-unaware. Every doc in `workflow-nodes-rag\nodes\` was kept to
one node type **or, for a split node type, one sub-feature** per file specifically so a chunk boundary
landing mid-file still stays within one coherent concern's content — the same reasoning
`ragUploadDesign.md` applied to Atlas Forms' per-control-type files, carried one level deeper for
`ai-agent`/`flow-ai-agent`. This is exactly why the split-doc pattern's per-sub-feature file boundary
matters for retrieval quality, not just for readability: a flat single file covering, say, `ai-agent`'s
full config surface would risk a 200-word chunk straddling e.g. `ConversationScope`'s enum table and
the HIL feature-flag notes, landing an ambiguous half-chunk in the vector store.

**Refresh:** when a `nodes\{code}.md` file (or, for a split node type, one `nodes\{code}\{sub-
feature}.md` file) is edited, call **Update** with that one file's own deterministic `knowledgeID` and
its new content — no delete-then-reinsert choreography needed, matching `ragUploadDesign.md` §3.4.
Editing one sub-feature doc of a split node type never requires touching the other sub-feature files'
`knowledgeID`s or re-ingesting the node type's `00-index.md`.

**Adding a new node type's coverage** (extending past this pass's 18 node types / 28 files) follows
`workflow-nodes-rag\agent\add-new-node-type.md` end to end — write the Tier 1 doc (single file, or a
split-doc folder if it qualifies), add its one-line Tier 0 index row, then run the Insert step above
once per file written. That runbook is this doc set's
extensibility story, mirroring why `atlas-forms-rag\agent\refreshFromCodeToDoc@agent.md` exists for
Atlas Forms: adding coverage should be a well-defined, low-friction, per-file procedure, never a
redesign of this pipeline.

## What was actually done vs. deferred in this pass

**Done:**
- 19 Markdown files written initially (Tier 0 `00-overview.md` + 18 Tier 1 `nodes\*.md`), each Tier 1
  file written independently from real executor/settings source (never mirrored to the DB column's
  shape), then cross-checked against its DB seed's `ConfigurationSchema` as a factual finding recorded
  in its own Gotchas section. A same-day follow-up pass split 2 of those 18 (`ai-agent`,
  `flow-ai-agent`) into `nodes\{code}\00-index.md` + 5 sub-feature docs each, per the qualifying rule
  in `add-new-node-type.md` — net file count is now 29 (`00-overview.md` + 16 flat Tier 1 files + 12
  split-doc Tier 1 files across the 2 split node types), still 18 node types covered.
- `workflow-nodes-rag\agent\add-new-node-type.md` — the extensibility runbook for adding Tier 1
  coverage for any of the other 89 node types, or a newly-added node type in the future.
- `AIAgent_KnowledgeBases` seed row authored, following the exact column set and DB standards
  (`DATETIME`, named `DF_`/`PK_` constraints already on the table, standard audit columns) already
  established by the existing `AIAgent_KnowledgeBases_1_BizFirstAI Knowledge Base.data.sql` row.

**Deferred — explicitly, not silently:**
- **No Qdrant collection was actually created and no file was actually embedded/upserted.** Running
  the FlowRag Insert workflow requires a live Flow Studio + Qdrant + embedding-provider environment
  this documentation-editing pass does not have direct access to execute against, and the task's own
  20-minute-per-slow-operation budget rules out attempting an unverified live ingestion blind. The
  procedure above is written precisely enough (exact field values, deterministic-ID convention) that
  running it is a mechanical Flow Studio workflow-build step, not a design decision, for whoever picks
  it up next — same deferral shape `ragUploadDesign.md` itself used for Atlas Forms ("Actually
  uploading anything" was explicitly a Non-goal there too).
- **`AgentID` on the new KnowledgeBases row is `NULL`** — no live Octopus Agent record for a
  "workflow-building agent" was confirmed to exist in this pass (the same open question
  `ragUploadDesign.md` left unresolved for Atlas Forms' own collection). Binding this row to a real
  `AgentID` and confirming that agent has `util-kg-knowledge_retrieval` registered is a prerequisite
  for retrieval to actually work end-to-end, and is not something this pass can satisfy without a
  confirmed target agent.
- **The Flow Studio workflow itself (the 18 Tier 1 Insert node calls) was not built** — same reasoning
  as Atlas Forms' 77-file version: no batch/multi-file input exists on the Insert node, so this is
  either 18 node configurations in one workflow or an iterator-driven loop calling the node once per
  file.
- **`get_node_type_schema`/a new dedicated retrieval tool in `BizFirst.Ai.Mcp.Tools.Workflow`** was
  not implemented as code in this pass (that MCP module itself remains a design, not yet built, per
  `flow-workflow-mcp-design.md`) — see that doc's updated RAG section for which tool should call into
  this collection once the module is built.
