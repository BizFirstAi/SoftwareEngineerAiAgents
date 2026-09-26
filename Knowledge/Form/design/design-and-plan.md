# Atlas Forms Automation Agent — Design & Plan

Status: in progress. Written 2026-08-22 as the three tasks below were actively being dispatched and
run. This is the living design/plan doc for the project; `lessons/` in this same folder captures
concrete learnings as each task completes — update both as work lands, don't let this go stale.

**2026-08-23 update**: Binoy expanded the plan to 5 tasks. This doc's original "Task 1/2/3" numbering
below is preserved as-is (do not renumber, it's referenced elsewhere), but it now corresponds to what
became Tasks 1(RAG)/2(agent setup)/3(Flow Studio build) of the 5-task plan; Task 4 is a new
"Understand the whole work, flow, lifecycle and figure out end to end design" research pass (this pass
— see `architecture.md`, the new full end-to-end design doc it produced) and Task 5 is "create and
modify a sample form" (the live functional test). `architecture.md` is now the authoritative reference
for the whole system's execution lifecycle — read it before starting Task 3's actual build; it resolves
several things that were open questions when this doc and `ragUploadDesign.md`/`octopus-agent-
guidelines.md` were first written.

## Goal

Stand up a real, working Octopus AI agent (or small team of agents) that can build and edit Atlas
Forms through natural-language conversation, backed by the already-built Atlas Forms v2 RAG spec
(`Knowledge\Form\atlas-forms-rag\v2\`, 77 files, Tier 1/Tier 2 structure) and the
8 real Atlas Forms MCP tools, then prove it works end-to-end via a real Flow Studio workflow that
creates a sample form live.

## Prior art this plan builds on — read before touching any of the three tasks

- `Knowledge\Form\atlas-forms-rag\agent\ragUploadDesign.md` — full design for how
  RAG ingestion actually works in this codebase (two real ingestion mechanisms exist: FlowRag and the
  Octopus-native Knowledge Base API/UI; the `.md` upload path in the admin UI was found broken).
- `Knowledge\Form\atlas-forms-rag\agent\octopus-agent-guidelines.md` — the
  behavioral spec for how an Atlas-Forms-building agent should use the RAG spec (Tier 1 always in
  context, Tier 2 retrieved on demand) and the tool-call patterns it should follow
  (`create_form`/`get_form_schema`/etc.).
- `Knowledge\Form\mcp-servers\atlas-forms-design.md` — the 8
  Atlas Forms MCP tools' real design.
- `Documentation\Employees\agentic-coding\test-plan\04-01-mcp-atlas-forms-tools.md` — the (previously
  never-executed) live test plan for those same 8 MCP tools.
- `Documentation\Employees\agentic-coding\targets\hil-parallel-multi-agent-correlation-design.md` — a
  parallel architecture review done the same day, relevant here because it traced Octopus's real
  Team/Router/sub-agent data model (`RoutingAgentHook`, canvas `team-member` satellites) — Task 2 below
  uses that same real model rather than inventing a new one.

## Decisions already made by Binoy (product owner) — don't re-litigate these

1. **RAG ingestion path: the Octopus-native Knowledge Base admin UI**, not FlowRag. Verbatim: "Use the
   knowledge UI. You can use the app to upload."
2. **Task ordering**: RAG upload → agent/team/member setup (+ MCP + RAG wiring) → Flow Studio workflow
   build + live test. Each task's output feeds the next; don't parallelize past what's explicitly
   independent.
3. Task 2 must wire **both** MCP tool access and RAG/Knowledge-Base retrieval into whatever agent(s)
   get created — a system prompt describing tool use isn't enough, the agent needs genuine
   function-calling access to the real 8 MCP tools.
4. Task 3's definition of done includes an actual functional test: configure the AI Agent node in a
   new Flow Studio workflow, run it, and confirm it creates a real sample form — not just that the
   workflow is wired correctly.

## Task 1 — Load the Atlas Forms v2 spec into a real Knowledge Base collection

**What**: fix the confirmed `.md` content-type bug in the Knowledge Base upload backend
(`KnowledgeService.Document.cs`'s `GetFileContent` never handled `text/markdown`, so `.md` uploads
silently failed via the admin UI), then use the real `knowledge-app` admin UI (not a script, not
FlowRag) to upload all v2 spec `.md` files (Tier 1 + Tier 2, excluding `worked-examples/*.json`) into a
new collection, `atlas-forms-spec-v2`.

**Status**: attempted twice, still not actually uploaded. Attempt #1 (see `ragUploadDesign.md`'s own
2026-08-22 log) fixed the `.md` content-type bug but couldn't reach a live stack. Attempt #2
(2026-08-23, this pass — full detail in `lessons/README.md`) found the live stack (`document-manager`
at localhost:6110 / `BizFirst.Ai.Consolidated.WebApi` on 10001) and resolved the collection-identity
question for good: **`atlas-forms-automation` is a single row in `Doc_DocumentCollections`
(`DocumentCollectionID = 1`, `TenantID = 1`)** — the "Library Collections" vs "Knowledge Collections"
distinction in the UI is cosmetic, both are views over the same table. But the actual upload never
happened, blocked by three independent things: the backend was down for the whole session (transient —
an unrelated concurrent rebuild), Qdrant (`localhost:6333`) is unreachable with no Docker/Qdrant binary
available in this sandbox to fix that, and no authenticated browser session existed to drive either the
UI or the API (this agent cannot log in on Binoy's behalf). Concretely proven via direct SQL that RAG
indexing is failing right now for two documents already in that collection (`RagKnowledgeID` etc. all
NULL). See `lessons/README.md`'s 2026-08-23 entry for full detail and the unblock order.

## Task 2 — Set up the Octopus agent(s)/team for Atlas Forms automation

**What**: query the real database first to check whether an Atlas-Forms-relevant Agent/Team/TeamMember
setup already exists; if not, create one, grounded in the real Team/Agent data model (not invented).
The agent's system prompt/instructions should reflect `octopus-agent-guidelines.md`'s behavioral spec.
Must also wire:
- **RAG**: once Task 1's collection exists, an `AIAgent_KnowledgeBases` row pointing at
  `atlas-forms-spec-v2`, plus the `util-kg-knowledge_retrieval` function registered for the agent (per
  `ragUploadDesign.md` Part 2).
- **MCP**: real function-calling access to the 8 Atlas Forms MCP tools, wired via whatever mechanism
  Octopus agents actually use to bind MCP tools into their callable function set (investigate the real
  mechanism, don't invent one).

**Status**: dispatched, in progress (includes a mid-flight addition for the MCP wiring requirement).
See `lessons/` for the real agent/team IDs and names once created — Task 3 depends on these exact
values.

## Task 3 — Build and live-test a Flow Studio workflow using the new agent

**What**: once Task 2 reports real agent/team IDs, create a brand-new Flow Studio project/workflow
with a Trigger node and an AI Agent node, configure the AI Agent node to use the agent created in Task
2, then actually execute the workflow and have the agent create a sample form — confirming the whole
chain (agent → RAG retrieval → MCP tool calls → real Atlas Forms output) genuinely works, not just that
it's wired.

**Status**: not yet dispatched — blocked on Task 2's real output (agent ID/name). **2026-08-23**:
`architecture.md` §7 now specifies exactly what this task needs to build (minimal node config, two real
ways to persist the workflow without the Flow Studio UI — direct `Process_ProcessElements`/
`Process_Connections` CRUD or `ProcessStudio`'s atomic `save`/`create-with-structure` calls — and how to
execute/verify). The one still-missing input is Task 2's real `AgentID`: this doc and `lessons/
README.md` don't yet have it recorded despite Task 2 being reported complete elsewhere — reconcile that
before dispatching Task 3.

## Task 4 — Understand the whole work, flow, lifecycle end to end (this pass, 2026-08-23)

**What**: a research/documentation-only pass (no code, no DB changes) to trace the real, current-code
execution lifecycle from "Flow Studio AI Agent node executes" through to "LLM responds, possibly
calling a real MCP tool" — resolving the biggest standing open question (does agent execution bridge to
`BizFirstAI.V21` over the network, or run natively) and documenting how MCP tools, built-in functions,
and RAG retrieval actually fit together.

**Status**: complete. Full findings in the new `architecture.md` in this folder. Headline results: (1)
the V21 "bridge" is a same-process, in-process DI call chain — V21's Octopus Core is `ProjectReference`d
directly into `BizFirst.Ai.Consolidated.WebApi`, not a separate networked service; (2) MCP tools
(`AIMCP_McpTools`) and built-in functions (`AIFunction_AgentFunctions`) are two genuinely separate
dispatch mechanisms, both with real (non-DB-catalog) live resolution, so their empty/NULL DB rows are
not blockers; (3) Atlas Forms MCP tool-calling appears mechanically live right now, with a real open gap
— no authorization enforcement on MCP tool calls; (4) RAG retrieval's dead end is now pinned precisely:
`BizFirst.Ai.Octopus.Plugin.KnowledgeBase` is absent from the live host's `PluginLoader:Assemblies`
config, i.e. genuinely not loaded in the running binary, not merely unpopulated.

## Task 5 — Create and modify a sample form (live functional test)

**What**: per Binoy's plan, the actual proof-of-life test once Tasks 2-4 are complete — have the agent
create a sample form, then modify it (add/remove/reorder a control), confirming the full agent → MCP
tool-call → real `Atlas_Forms` row round trip works for both creation and editing.

**Status**: not yet dispatched — blocked on Task 3.

## Open risks/questions carried over from prior design work (not yet resolved, watch for these)

- Collection versioning policy (one fixed `atlas-forms-spec-v2` reused forever vs. versioned per major
  spec revision) — not decided, currently just using the v2 name as-is.
- Chunk-boundary granularity (one chunk per file vs. per-H2-section) — Task 1 uses the admin UI's
  default chunking; this may or may not turn out to be fine for retrieval quality once Task 3's live
  test exercises real retrieval — watch for this in Task 3's results.
- Whether a dedicated `BizFirst.Ai.Mcp.Tools.Knowledge` MCP module should eventually wrap the upload
  path — explicitly deferred in `ragUploadDesign.md` until after a real upload/refresh cycle exists;
  this project's Task 1 is that first real cycle, so this question may be worth revisiting afterward.
