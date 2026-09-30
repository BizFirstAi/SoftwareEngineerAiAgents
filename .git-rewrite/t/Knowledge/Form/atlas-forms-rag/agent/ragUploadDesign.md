# RAG Upload Design — Getting the Atlas Forms v2 Spec Into the Real Knowledge Base

Binoy's flag, verbatim (this session): "item 5 is rag upload that will also need to be designed."
The `v2\` spec (77 markdown files, Tier 1/Tier 2 structure per `octopus-agent-guidelines.md`) is
built and adapted for retrieval, but nothing has actually loaded it into whatever live store Octopus
agents query at conversation time. This document traces the real ingestion/retrieval mechanism as it
exists in code today, then proposes a concrete design for getting the v2 spec (and, generalizably,
future spec content) into it. **Design and investigation only — no code was written, nothing was
uploaded.**

Companion reading (do not re-litigate, only extend): `octopus-agent-guidelines.md` (how an agent
*uses* the spec once retrievable), `refreshFromCodeToDoc@agent.md` (how the spec content itself gets
re-verified and updated), and
`Documentation\Employees\agentic-coding\targets\rag-collection-name-flow-through-agent-metadata.md`
(dated 2026-08-19, this session — a prior pass that traced the *retrieval* side, `KnowledgeHook`, in
full; this document leans on its Finding 2/3 rather than re-deriving them, and its own Finding 0
already flagged the existence of three separate RAG stacks in this codebase — this document verifies
and uses that same Finding 0 for the *upload* side specifically).

**Revision note:** Binoy corrected mid-investigation — "also for rag we already have tools" — meaning
real, already-built ingestion tooling exists beyond the Octopus-native `IKnowledgeService` API/UI this
document originally led with. That tooling is real and is documented below (Part 1B): **FlowRag**, a
Flow Studio drag-and-drop ExecutionNode (Insert/Update/Delete/Search) that requires zero new code.
Part 3's proposed design now leads with FlowRag as the recommended path.

## Part 1 — the real ingestion mechanism today

**It exists and is operational — not code-only.** `IKnowledgeService`
(`BizFirst.Ai.Octopus.Plugin.KnowledgeBase.Services.KnowledgeService`, DI-registered scoped in
`KnowledgeBasePlugin.RegisterDI`) exposes two real ingestion methods:

| Method | Input | Chunking | Content-type detection |
|---|---|---|---|
| `UploadDocumentsToKnowledge(collectionName, IEnumerable<ExternalFileModel> files, ChunkOption? option)` | raw file bytes (base64 or URL) | `TextChopper.Chop()` runs internally | Yes — `FileExtensionContentTypeProvider` via `FileUtility.GetFileContentType`, then `GetFileContent` branches only on `text/plain` and `application/pdf` |
| `ImportDocumentContentToKnowledge(collectionName, fileName, fileSource, IEnumerable<string> contents, refData?, payload?)` | caller-supplied, already-split chunk strings | **none — caller owns chunking** | none — bypassed entirely |

Both methods end the same way: each chunk is embedded (`ITextEmbedding.GetVectorAsync`) and upserted
into `IVectorDb.Upsert(collectionName, id, vector, text, payload)`, then a per-file metadata row is
persisted via `IRepositoryBase.SaveKnolwedgeBaseFileMeta` and (for the file-upload path only) the raw
binary is saved via `IFileStorageProvider.SaveKnowledgeBaseFile`.

**Exposed operationally today via two real surfaces:**
- **REST** — `KnowledgeBaseController` (`BizFirst.Ai.Octopus.OpenAPI`, `[Authorize]`): `POST
  /knowledge/vector/create-collection`, `POST /knowledge/document/{collection}/upload` (JSON/base64),
  `POST /knowledge/document/{collection}/form-upload` (multipart), plus paged list/delete/download and
  full vector-collection CRUD (snapshots, payload indexes, direct point CRUD).
- **Admin UI** — `knowledge-app` micro-frontend (`BizFirstAI.V21\src\MicroFrontends\knowledge-app`).
  `KnowledgeBasePlugin.AttachMenu` adds a "Knowledge Base" menu item (Root/Admin/Engineer roles only)
  with Q&A / Relationships / Documents sub-pages. `DocumentUploadPage.tsx` → `DocumentUploader.tsx` →
  `FileDropzone.tsx` drives the `form-upload` endpoint with a drag-and-drop file picker and an
  "Advanced Config" chunk-option panel.

**No folder-scan / background-job / config-driven ingestion path exists.** There is nothing analogous
to `AIMCP_McpServerSettings`' "point the system at a config and it wires itself up" pattern for
knowledge content — every ingestion is an explicit, one-file (or one-batch-of-files)-at-a-time API/UI
action. This answers task item 2 directly: an operational upload workflow *does* exist (REST + admin
UI), it is just entirely manual/per-call, with no scheduled or config-driven bulk-load precedent to
reuse.

### Confirmed gap: the admin UI's own markdown upload path is broken for this spec's file type

`FileDropzone.tsx`'s accepted-type list includes `'text/markdown': ['.md']` — the UI genuinely lets a
user drag in `.md` files and will call `form-upload`. But `KnowledgeService.Document.cs`'s
`GetFileContent(contentType, binary, option)` only branches on `MediaTypeNames.Text.Plain` (exact
string `"text/plain"`) and `MediaTypeNames.Application.Pdf`; `text/markdown` matches neither branch,
so `results` stays an empty list, `TextChopper` never runs, `SaveToVectorDb` gets an empty `contents`
enumerable (guarded to return immediately), `dataIds` ends up empty, and
`UploadDocumentsToKnowledge`'s own logic correctly reports the file under `Failed` (not a silent
false-success — but the file-upload path genuinely cannot ingest `.md` today, full stop). This is a
real, currently-live bug independent of this design; see Open Question 7.

**Two ways around it, if the file-upload path were used anyway:** rename to `.txt` before upload (the
`text/plain` branch does work and does run `TextChopper`), or — the recommended path for this spec,
see Part 3 — skip file-upload entirely and call `ImportDocumentContentToKnowledge` with pre-read file
content, which never touches content-type detection.

### Chunking is NOT a hard global default — but it is boundary-unaware regardless of size

`ChunkOption { Size, Conjunction, SplitByWord }` is a real parameter on `UploadDocumentsToKnowledge`
(default `ChunkOption.Default()` = 1024 chars, 12-word overlap, split-by-word, per the confirmed
`TextChopper.Chop()` behavior from this session's earlier investigation) — any caller can pass a
different `Size`/`Conjunction`/`SplitByWord`. So per-document chunk size/overlap **is** controllable.
What is **not** controllable through `ChunkOption` at all is markdown/header-boundary awareness —
`SplitByWord` only toggles word-boundary vs. raw-character chopping, nothing more. Notably, the admin
UI's own `ChunkOption` TypeScript shape (`DocumentUploader.tsx`) is `{ size, overlap, separators:
['\n\n', '\r\n\r\n'] }` — implying paragraph-aware chunking — but the real backend `ChunkOption` model
has no `separators` concept whatsoever and `TextChopper` ignores it unconditionally. **The FE's
"advanced config" separator control is non-functional for boundary awareness; it does nothing
server-side.** This confirms task item 4's premise directly: the fixed-size, boundary-unaware
chunking is real and cannot be worked around via `ChunkOption` on the file-upload path. It CAN be
worked around by not using `TextChopper` at all — see Part 3.

## Part 1B — the tool that was missing from the first pass: FlowRag (Flow Studio, PayrollV3)

**Confirmed real, already built, requires zero new code.** `BizFirst.Ai.ExecutionNodes.Flow.FlowRag`
(`BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\Ai\Flow\FlowRag\`) is a Flow Studio
ExecutionNode with four operations, each independently invocable from a workflow with no code:
**Insert**, **Update**, **Delete**, **Search** — `KnowledgeInsertInfo`/`KnowledgeUpdateInfo`/
`KnowledgeDeleteInfo` node-config classes, `FlowRagNodeExecutor.Knowledge.{Insert,Update,Delete}.cs`.
This is almost certainly the tool Binoy means, and matches his own words already on record in the
companion doc: *"I have a knowledge app that saves documents into rag with documentCollectionName."*

**Insert node config** (`KnowledgeInsertInfo`, JSON keys as configured in the Flow Studio node UI):
`collectionName`, `providerName` (e.g. `"qdrant"`), `fileName`, `content` (plain string — the node
takes text directly, not a file upload, so there is **no content-type-detection step at all** — the
confirmed `.md`-content-type bug in Octopus Core's own `UploadDocumentsToKnowledge`, Part 1, simply
does not apply here), `source`, and an **optional caller-supplied `knowledgeID`** (must be a valid
GUID; the service generates one if omitted).

**Mechanics** (`FlowRagKnowledgeService.InsertKnowledgeAsync` →
`QdrantFlowRagProviderService.InsertAsync`): chunks the content via `IChunkingService.ChunkAsync`
(the registered implementation, `GenericChunkingService`, splits on whitespace into fixed **200-word
chunks with zero overlap** — boundary-unaware like `TextChopper`, and actually cruder: no overlap at
all, versus `TextChopper`'s 12-word overlap) → embeds each chunk (`IEmbeddingService`, OpenAI) →
upserts Qdrant points tagged with payload `knowledge_id` (the node's `knowledgeID`, or a fresh GUID),
`chunk_index`, `content`, `source`, `format`.

**Update is a real, clean re-index primitive — better than anything available on the Octopus-native
path (Part 1):** `QdrantFlowRagProviderService.UpdateAsync` deletes every existing point filtered by
`knowledge_id == oldKnowledgeID` (Qdrant payload filter, not a fragile ID-list lookup), then inserts
fresh points under a new `knowledgeID`. This means: if a refresh always supplies the **same
deterministic `knowledgeID`** for a given source file (e.g. a name-based/deterministic GUID derived
from the file's repo-relative path — `controls/select.md` always maps to the same GUID), calling
**Update** with that fixed ID atomically replaces all of that file's old chunks with the new ones,
with no orphaned points and no separate delete-then-reinsert choreography needed. This directly
improves on the manual delete-then-reinsert procedure the Octopus-native alternative is stuck with —
see Part 3.4 below.

**Credentials:** `FlowRagKnowledgeService.ResolveCredentialAsync` — an explicit per-node
`credentialId` wins; otherwise it falls back to a tenant's `"PrimarySystemRag"` vault entry
(`ICredentialResolver`, already the mandatory pattern per `feedback_credential_pattern`). No credential
picker is required if that tenant-level default is already configured.

**Confirmed real caveat — two separate bookkeeping trails, same underlying vector store:**
`FlowRagKnowledgeService`'s Insert/Update/Delete path writes **only** to the vector store (Qdrant
points) — it never touches Octopus Core's own SQL metadata
(`AIRag_KnowledgeFileMetas`/`IRepositoryBase.SaveKnolwedgeBaseFileMeta`, Part 1). Per Binoy's own
confirmation already on record in the companion doc ("KnowledgeBases is hooked into the same
datasource. all we need is collectionname."), content inserted via FlowRag **is** retrievable by
Octopus's `KnowledgeHook`/`SearchVectorKnowledge` once an agent's `AIAgent_KnowledgeBases` row points
at the same collection name — the two systems share the vector store. But content inserted via
FlowRag will **not** appear in Octopus Core's own Knowledge Base admin UI "Documents" list/delete
page (that page reads `AIRag_KnowledgeFileMetas`, which FlowRag never writes), and vice versa —
content uploaded through the Octopus-native admin UI won't have a `knowledge_id`-filterable identity
FlowRag's Delete/Update nodes can target. **Pick one ingestion path per collection and stay consistent
— don't mix the two for the same collection**, or the two systems' delete/refresh tooling silently
stops covering each other's content.

**Practical gap for 77 files:** the Insert node processes exactly one `KnowledgeItem` (one file's
content) per node execution — there is no batch/multi-file input on the node itself. Loading 77 files
means either 77 node configurations in one workflow, or a workflow that iterates a file list and calls
the node once per iteration (Process Engine's loop/iterator primitives — not traced in this pass, and
not yet a formal open question below since it's a research gap rather than a decision for Binoy; worth
tracing before committing to the FlowRag path at scale).

## Part 2 — how retrieval actually connects to an agent's conversation

**Not automatic, unlike memory.** `MemoryInjectionHook` (M-07) runs unconditionally before every LLM
generation and injects working/episodic memory into the prompt. Knowledge-base retrieval has no
equivalent always-on hook. It is **function-calling-tool-gated**:

1. `KnowledgeBaseUtilityHook` (`IAgentUtilityHook`) registers a utility exposing function
   `util-kg-knowledge_retrieval` to the LLM, schema `{ question: string }` (seeded per-agent under a
   specific `AgentID`'s data folder, `functions/util-kg-knowledge_retrieval.json` +
   `templates/util-kg-knowledge_retrieval.fn.liquid`, the latter instructing the agent: *"You must
   retrieve existing KnowledgeBase to get prerequisite informations before you writing SQL
   query...before calling a Web API"* — generic phrasing, not Atlas-Forms-specific).
2. When the LLM calls that function, `KnowledgeRetrievalFn.Execute` resolves every registered
   `IKnowledgeHook` via DI (currently just `KnowledgeHook`), calls
   `hook.GetDomainKnowledges(message, args.Question)`, concatenates results into `message.Content`
   for the LLM to read back.
3. `KnowledgeHook.GetDomainKnowledges` resolves **which collection(s) to search from
   `agent.KnowledgeBases`** — a list persisted on the Agent's own admin record, table
   `AIAgent_KnowledgeBases` (`AgentID` FK, `PrimaryCollectionName`, `RagRole`, `Priority`,
   `MaxResults`, `SimilarityThreshold`, plus the standard multi-tenant/audit columns) — then calls
   `IKnowledgeService.SearchVectorKnowledge(text, collectionName, options)` per configured KB
   (`Confidence` 0.25–0.5 depending on KB `Type`, `Limit` 5).
4. A per-invocation override (`documentCollectionNames` flowing from workflow input data → agent
   metadata → `KnowledgeHook`, letting a specific workflow execution point retrieval at a different
   collection without an admin edit) is **designed but not yet implemented** — per the companion
   doc's Finding 2/Gap 2, this remains "the real, and now the ONLY remaining, code change needed" in
   `KnowledgeHook.cs`. Today `KnowledgeHook` reads only the admin-persisted `agent.KnowledgeBases`
   list; there is no live per-execution collection targeting.

**Net effect for the Atlas Forms spec:** making any Octopus agent retrieve it requires two admin/config
steps independent of the upload itself — an `AIAgent_KnowledgeBases` row for that agent pointing
`PrimaryCollectionName` at wherever the spec is uploaded, **and** that agent having the
`util-kg-knowledge_retrieval` function actually registered (confirmed a real open gap in the companion
doc's Gap 3 — not every agent necessarily has it seeded). Neither is a code change; both are
data/admin-setup steps this design must call out explicitly (see Open Questions 2–3).

## Part 3 — proposed design for uploading the v2 spec

**Recommended path: FlowRag (Part 1B), not the Octopus-native API.** It requires zero new code (a
workflow + node configuration only), its Insert node takes raw text so the confirmed `.md`
content-type bug doesn't apply, and its Update operation already gives a clean, atomic
delete-then-insert-under-a-fixed-ID primitive for refresh — better than anything composable purely
from the Octopus-native `IKnowledgeService` surface. The Octopus-native path
(`ImportDocumentContentToKnowledge`) is kept below as a documented alternative/fallback, primarily for
if the spec's content should *also* be visible in Octopus Core's own Documents admin UI, or if the
77-file-per-node-execution overhead (Part 1B) makes FlowRag impractical without further Process
Engine iteration tooling than this pass traced.

### 3.1 Collection identity and one-time setup

1. Choose a collection name (see Open Question 2) — e.g. `atlas-forms-spec-v2`.
2. **If using FlowRag:** no separate create-collection step — `QdrantFlowRagProviderService.InsertAsync`
   calls `_collectionService.CreateAsync(...)` itself before the first upsert, so the collection is
   created implicitly on first Insert. **If using the Octopus-native path:** create it explicitly via
   `POST /knowledge/vector/create-collection` first (check `ExistVectorCollection(collectionName)` for
   idempotency).
3. Wire the agent(s) that should retrieve it: add/update their `AIAgent_KnowledgeBases` row with
   `PrimaryCollectionName` set to the created collection, and confirm the
   `util-kg-knowledge_retrieval` function is registered for that agent (Part 2, step 4). This step is
   identical regardless of which ingestion path is used — retrieval only cares about the collection
   name and the shared vector store, not which tool wrote the points into it.

### 3.2 Ingestion — FlowRag (recommended)

Build a small Flow Studio workflow: for each file under `v2\`, one **Knowledge Insert** node call with
`collectionName` = the chosen name, `providerName` = `"qdrant"`, `fileName` = the file's repo-relative
path (e.g. `"controls/select.md"`), `source` = `"atlas-forms-v2-spec"`, `content` = the file's raw
text, and — **required for the refresh story below** — `knowledgeID` = a **deterministic, stable GUID
derived from the file's repo-relative path** (e.g. a name-based/UUIDv5-style GUID, so the same file
path always maps to the same `knowledgeID` across every refresh run). Whether to split each file
further into multiple `KnowledgeItem`s (one Insert call per H2 section instead of per file) is Open
Question 5 — `KnowledgeInsertInfo`/`InsertKnowledgeRequest.Items` supports either, since `Items` is
already a list.

Chunking within each Insert call is `GenericChunkingService`'s fixed 200-word, zero-overlap split
(Part 1B) — boundary-unaware, same caveat as `TextChopper`. Choosing file-level (or deliberate
section-level) `content` boundaries per Insert call is the only lever available to keep chunk
boundaries meaningful, exactly as reasoned for the Octopus-native path in the original draft of this
section.

### 3.3 Ingestion — Octopus-native alternative (`ImportDocumentContentToKnowledge`)

If the Octopus-native path is preferred instead (Part 1), use `ImportDocumentContentToKnowledge`, not
`UploadDocumentsToKnowledge` — for two reasons: the `.md` content-type path is confirmed broken (Part
1), and `TextChopper` is boundary-unaware, so feeding it whole raw markdown files would re-chop across
the header/file boundaries the v2 spec's own build deliberately designed around (Tier 1/Tier 2 split,
consolidating near-identical control families into single files specifically *because* of
`TextChopper`'s lack of boundary awareness, per `refreshFromCodeToDoc@agent.md` Step 3).
`ImportDocumentContentToKnowledge(collectionName, fileName, fileSource: "atlas-forms-v2-spec",
contents: [caller-pre-chunked strings], payload: { tier, sourcePath, specVersion })` moves the
chunking decision to the loader, which is aware of the spec's own file/header structure.

### 3.4 Refresh without duplicating or orphaning chunks

**With FlowRag (recommended):** trivial, given the deterministic-`knowledgeID` convention from 3.2 —
call the **Update** node/operation with the same file-derived `knowledgeID` and the file's new
content. `QdrantFlowRagProviderService.UpdateAsync` deletes every point filtered by
`knowledge_id == thatID` and inserts fresh points under a new one, atomically, per file (Part 1B) — no
manifest, no enumerate-then-diff step needed for **changed** files. For files **removed** from `v2\`
since the last refresh, call the **Delete** node/operation with that file's (still-deterministic, so
still re-derivable) `knowledgeID` — this still requires the refresh process to know the full list of
`v2\` file paths that existed at the *previous* refresh (to detect removals), which in turn means a
manifest or the `CHANGELOG.md` `refreshFromCodeToDoc@agent.md` already asks for is still the right
place to track "what was uploaded last time," even though the per-file replace/delete mechanics
themselves need no manifest-driven lookup.

**With the Octopus-native alternative (3.3):** no equivalent clean upsert exists —
`ImportDocumentContentToKnowledge` always mints a new `fileId`/vector IDs, and
`AIRag_KnowledgeFileMetas.FileHash` is a real column but confirmed **unused** by
`KnowledgeService.Document.cs` today (its presence doesn't mean hash-based dedup is implemented). The
same delete-then-reinsert procedure as FlowRag's would have to be composed manually: enumerate via
`GetPagedKnowledgeDocuments(collectionName, filter: { FileSource: "atlas-forms-v2-spec" })`, call
`DeleteKnowledgeDocument(collectionName, fileId)` for any existing entry matching the file about to be
re-uploaded (this correctly cleans up both the vector points and the SQL meta row), then
`ImportDocumentContentToKnowledge` as a fresh insert — not atomic, and reliant on `FileName` being
honored as the stable per-source-file key.

Either way, recommend a small manifest file (e.g. `v2\.rag-manifest.json`: filename → tier →
content hash → last-uploaded timestamp) so a refresh knows what changed/was removed without
re-deriving it from scratch, as a natural companion to the `v2\CHANGELOG.md`
`refreshFromCodeToDoc@agent.md` already asks refreshers to maintain. Recommend the refresh runbook
eventually gain a final "upload changed/removed files per `ragUploadDesign.md`" step once this design
is built — deliberately **not** made to `refreshFromCodeToDoc@agent.md` as part of this pass (see
Non-goals).

### 3.5 Should this be its own MCP tool module?

Per `bizfirst-ai-mcp-servers-spec\architecture.md`'s established pattern (one project per domain,
~5–15 task-shaped tools, calls the domain's service in-process, gateway composes tool lists from
module assemblies): a "knowledge upload" capability is domain-generic, not Atlas-Forms-specific, so it
should **not** be bolted onto a future `BizFirst.Ai.Mcp.Tools.AtlasForms` module. Given Part 3's
FlowRag-first recommendation, an MCP module built for this should wrap the **same tool that's
recommended above**, not a competing implementation — three real options:

- **A new `BizFirst.Ai.Mcp.Tools.Knowledge` module wrapping `IFlowRagKnowledgeService`** —
  `upload_knowledge_document`/`refresh_knowledge_document`/`delete_knowledge_document` calling
  `InsertKnowledgeAsync`/`UpdateKnowledgeAsync`/`DeleteKnowledgeAsync` in-process, i.e. the exact same
  atomic-per-file Insert/Update/Delete mechanics Part 3.2/3.4 already recommend using directly via a
  workflow — an MCP tool here is just a second front door onto the same real mechanism, not new
  ingestion logic. This keeps the "pick one ingestion path per collection" rule from Part 1B intact.
- **A new module wrapping `IKnowledgeService` instead** (the Octopus-native alternative, Part 3.3) —
  only makes sense if Binoy's answer to the "which path" question below is the Octopus-native path,
  e.g. because Documents-admin-UI visibility is required.
- **Skip MCP for this entirely** — treat spec ingestion as an ops/seeding task (a Flow Studio workflow
  run once, or a script, run by a human or a build agent), not an agent-callable mid-conversation
  capability. Ingestion is infrequent (one-time load + occasional refreshes); MCP tools exist for
  things conversational agents need to invoke live, and "upload the Atlas Forms spec" reads closer to
  a deployment step than an agent capability — and Part 1B already establishes a genuinely
  zero-new-code path (a Flow Studio workflow) that doesn't need an MCP wrapper to be usable today.

Recommend deferring this specific decision (Open Question 6) until after the v2 spec's first real
upload/refresh has been done at least once via the FlowRag workflow — the tool's real shape should
come from an actual working procedure, not be designed blind ahead of one.

## Non-goals

- **Building any new ingestion service, pipeline, or storage mechanism.** Real, already-built tooling
  exists on both ends (Part 1's Octopus-native `IKnowledgeService` API/UI, and — per Binoy's own
  correction mid-investigation — Part 1B's FlowRag Insert/Update/Delete/Search Flow Studio nodes).
  This design's job is choosing and wiring up what already exists, not proposing a new pipeline; Part
  3 leads with FlowRag specifically because it needs zero new code, not a script or service.
- Implementing `KnowledgeHook`'s `documentCollectionNames` per-invocation metadata override — that is
  the separate, not-yet-implemented scope of
  `rag-collection-name-flow-through-agent-metadata.md`. This design assumes today's admin-list
  (`AIAgent_KnowledgeBases`) resolution path is what the Atlas Forms agent(s) will use.
- Fixing the confirmed `.md` content-type gap in `UploadDocumentsToKnowledge`/`GetFileContent` — a
  real Octopus Core code change, out of scope for a design-only pass. Both real workarounds identified
  (FlowRag's Insert node, which never touches content-type detection; and the Octopus-native
  `ImportDocumentContentToKnowledge`) sidestep it without requiring that fix.
- Implementing PDF ingestion (`ReadPdf` is a stub returning empty despite `IPdf2TextConverter`/
  `PigPdf2TextConverter` being DI-registered) — irrelevant to markdown spec content, noted only because
  it was seen in passing while reading the same file.
- Building the Flow Studio workflow itself, the refresh manifest tooling, or the MCP tool module
  described above — this document specifies the design; each is a separate build task. (The
  Octopus-native loader script from the earlier alternative in 3.3 is the one exception where a script
  would be genuinely new code — another reason FlowRag, needing only workflow configuration, is the
  lighter-weight recommendation.)
- Deciding collection naming/versioning policy across future spec major revisions (Open Question 2).
- Editing `refreshFromCodeToDoc@agent.md` or `octopus-agent-guidelines.md` — read for consistency
  only, left untouched.
- Actually uploading anything. No collection was created, no file was ingested, no agent record was
  modified as part of this investigation.

## Open questions for Binoy

1. **Which ingestion path should actually be used — FlowRag (Part 3.2, recommended, zero new code) or
   the Octopus-native alternative (Part 3.3)?** This is the single decision everything else in Part 3
   hangs off of. FlowRag wins on "no new code" and gives a cleaner atomic refresh (3.4); the
   Octopus-native path wins only if the spec's content needs to show up in Octopus Core's own
   Knowledge Base admin UI "Documents" list, or if 77-per-node workflow overhead (Part 1B) turns out
   to be impractical. Everything below assumes an answer to this exists but doesn't presume which one.
2. **Collection identity/versioning** — one fixed collection reused across every refresh
   (`atlas-forms-spec`), or a versioned collection per major spec revision (`-v2`, `-v3`, ...) with old
   versions explicitly deprecated/deleted? Determines both the `AIAgent_KnowledgeBases` wiring and
   whether the refresh procedure in 3.4 ever needs to migrate an agent from one collection to another.
3. **Which agent(s)** should actually get this collection wired into `AIAgent_KnowledgeBases` +
   `util-kg-knowledge_retrieval` today? Is the form-generation agent referenced throughout
   `octopus-agent-guidelines.md` already a provisioned real `AgentID`, or does it not exist yet as an
   Octopus Agent record — in which case this design's Part 3.1 step 3 has a hard prerequisite that
   isn't this design's to satisfy.
4. If FlowRag is the chosen path (Open Question 1): is the deterministic-`knowledgeID`-per-file
   convention (3.2/3.4) — needed so **Update** can atomically replace a file's chunks on refresh —
   an acceptable design, or does Binoy want a different stable-identity scheme? If the Octopus-native
   path is chosen instead: is its non-atomic delete-then-reinsert refresh procedure (3.4) acceptable,
   or is a true zero-downtime upsert (no window where a chunk is briefly missing) a hard requirement —
   the latter would need a real code change to `KnowledgeService` (an upsert-by-`FileName` path), not
   achievable by composing existing methods alone.
5. Should chunk boundaries for the v2 spec be one chunk per markdown file (simplest, relies on Tier 1's
   small size and Tier 2's already-consolidated files), or split further per-H2-section within larger
   Tier 2 files (i.e. multiple `KnowledgeItem`s per FlowRag Insert call, or multiple pre-chunked
   strings per Octopus-native `ImportDocumentContentToKnowledge` call)? This decides the actual
   chunking granularity and interacts with the ~1024-char practical budget the rest of the system
   defaults to, even though neither ingestion path enforces a size limit of its own.
6. Per `architecture.md`'s MCP module pattern (3.5): build a generalizable
   `BizFirst.Ai.Mcp.Tools.Knowledge` module now (wrapping whichever path Open Question 1 selects), or
   do the first Atlas Forms upload as a one-off FlowRag workflow and revisit the MCP-tool decision
   once a real usage pattern exists?
7. Should the FE's confirmed-broken `.md` upload path (accepted by `FileDropzone.tsx`, silently failed
   by backend `GetFileContent`) be filed as its own bug-fix task regardless of this design? It will
   surprise the next person who tries to drag-and-drop markdown into the existing admin UI expecting it
   to work.

## 2026-08-22 — Task 1 attempt outcome (Binoy authorized: fix the bug, then upload via the real UI)

**Part A, the `.md` bug — DONE.** `KnowledgeService.Document.cs`'s `GetFileContent` (BizFirstAI.V21,
`src\ApiServer\src\Plugins\BizFirst.Ai.Octopus.Plugin.KnowledgeBase\Services\`) now branches on
`MediaTypeNames.Text.Markdown` alongside `Text.Plain`, routing both through the existing `ReadTxt` →
`TextChopper.Chop` path. Plugin project builds clean (`dotnet build`, 0 errors, same pre-existing
warnings as before the change). Not yet exercised against a live upload — see below.

**Part B/C — blocked, not a design problem, an environment one.** This machine is running a
different, newer monorepo — `BizFirstAiStudio` (pnpm workspace, apps under `src/octopus`,
`src/atlas-forms`, etc., backed by the already-running `BizFirst.Ai.Consolidated.WebApi` on
`localhost:10001`) — as the actual live dev stack (confirmed: an authenticated browser session was
already active against it). This is a **separate codebase from `BizFirstAI.V21`**, which is where
`knowledge-app`, `DocumentUploadPage.tsx`, and `KnowledgeBaseController` (everything Part 1/3 of this
design is built against) actually live. Two independent findings, either one alone would block Part B:

1. `BizFirstAiStudio` has no Knowledge Base admin UI at all — no `FileDropzone`/`DocumentUploadPage`
   equivalent found by repo-wide search, and the live backend's own `swagger.json` on port 10001 has
   no `/knowledge/document/*/upload`, `/knowledge/document/*/form-upload`, or
   `/knowledge/vector/create-collection` routes (it does have unrelated `/knowledge/collections`,
   `/knowledge/items`, `/knowledge-bases` routes — a different, admin-CRUD-only surface, not the
   document/vector ingestion API this design describes).
2. `BizFirstAI.V21`'s own `WebStarter` (the process that *does* compile in the KnowledgeBase plugin,
   confirmed via its `.csproj`) is not running, and its two possible vector-store backends are both
   unreachable from this sandbox: SQL Server host `LAPTOP-HGRAER38` doesn't resolve, and Postgres
   (`KnowledgeBase:VectorDb:Provider = PgVector`, `localhost:5433`/`5432`) refuses connections. Starting
   it here would not produce a genuine, verifiable upload.

Separately, while trying to reach `BizFirstAiStudio`'s own admin UI (`octopus-admin`, port 6126, which
does have an `AgentsPage.tsx` — relevant to Part 3.1 step 3 / Open Question 3) to at least check for an
existing Atlas-Forms-relevant agent record, hit a real, reproducible SSO bug independent of this
design: with an already-active login-app (`localhost:8001`) session, both a bare `/login` visit and an
explicit `/login?returnUrl=...` dead-end at a generic `/post-login` "You're signed in" screen instead
of completing the handoff back to the requesting app; a full logout + fresh credentialed re-login hit
the same dead end. `octopus-admin`'s own `Agents` page was never actually reached, so **Task 1C's
agent-wiring investigation could not be completed either** — not a "no agent found" answer, a "couldn't
get into the admin UI to look" answer.

**Net:** the code fix is real and compiles; the actual upload and the agent-record check need either
(a) this sandbox pointed at a reachable DB for `BizFirstAI.V21`'s `WebStarter`, or (b) confirmation of
which app is actually meant to carry the Knowledge Base feature in the now-live `BizFirstAiStudio`
stack (it may simply not have been built there yet), plus a fix or workaround for the SSO handoff dead
end blocking admin-UI access in general. Reported to Binoy rather than guessed past.
