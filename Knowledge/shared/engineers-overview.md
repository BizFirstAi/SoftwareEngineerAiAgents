# Agentic Development Engineers

A system of AI agents, MCP servers, and RAG knowledge bases organized by **role** — each role is a
"development engineer" that can create real BizFirst AI objects (workflows, forms, apps, ...) using
AI. Binoy's framing (2026-09-04): "I want to create bizfirst ai objects using AI. I am looking for
a system of ai agents... I will add more to the list."

## Roles (extensible — more will be added)

| Role | Creates | Folder |
|---|---|---|
| Workflow Development Engineer | Flow Studio workflows / nodes | `workflow-development-engineer\` |
| Form Development Engineer | Atlas Forms forms | `form-development-engineer\` |
| App Development Engineer | App Studio apps | `app-development-engineer\` |

## The identical shape every role follows

```
{role}\
  agents\        — real, followable @agent.md specs an AI agent executes end-to-end
  mcp-servers\   — MCP server DESIGN docs (design only, per Binoy — none of these are implemented as
                   a running MCP server yet unless explicitly noted otherwise in the doc itself)
  rag\           — knowledge-base content: source-grounded reference docs the role's agents load
                   on demand (two-tier retrieval — see each rag set's own 00-overview.md)
  testing\       — QA/testing instruction docs and runbooks for the role's domain (distinct from
                   `agents\` — these are for a human or a testing-focused agent verifying behavior,
                   not for an agent that CREATES new objects)
  (role-specific extras, e.g. `design\`, `lessons\`, `STATUS.md`, `architecture.md` — project-status
   and design-history material that doesn't fit the four buckets above cleanly)
```

Adding a 4th+ role: create the same `agents\`/`mcp-servers\`/`rag\`/`testing\` shape under a new
`{role}\` folder — don't invent a different structure per role.

## What's real right now (2026-09-04 reorganization)

**Workflow Development Engineer**
- `rag\workflow-nodes-rag\` — mature, 18/107 node types documented, two-tier retrieval, real
  ExecutionNode-source-grounded (moved intact from `agentic-coding\bizfirst-ai-mcp-servers-spec\`).
- `mcp-servers\` — 7 real MCP design docs (architecture, flow-workflow-mcp-design,
  agent-teams-design, octopus-agent-mcp-design, cross-tenant-auth, write-tool-authorization, and a
  real scan report of Octopus's existing MCP integration).
- `testing\` — the elasticsearch node build/test round, the "how to manually test an Octopus AI
  Agent node" runbook, and the general node-testing guidelines/getting-started docs.
- **Gap**: no `agents\` content yet — no real "create a new workflow node" or "create a new
  workflow" agent spec exists. See Gaps below.

**Form Development Engineer**
- `rag\atlas-forms-rag\` — mature, ~65 control types documented, two-tier retrieval, worked
  examples, its own extensibility runbook (moved intact from `agentic-coding\
  atlas-form-automation-project\`).
- `rag\reference\atlas-forms-search\` — supporting schema/guide material for the Documents
  search/edit forms.
- `agents\entity-based-search\create-entity-search-form@agent.md` — a real, followable agent spec
  for generating Search+Edit forms for any entity table end-to-end (Task 12, built 2026-09-04).
- `mcp-servers\forms-studio\` — Forms Studio MCP design.
- `design\`/`STATUS.md`/`lessons\` — project history.

**App Development Engineer**
- `rag\app-studio-rag\` — NEW, built as part of this same reorganization (Task 51): full first-pass
  coverage of all 17 real widget types, the App/Page/Widget data model, the new template-based
  creation flow (Task 22/23), and the structured styling system. Two-tier retrieval, its own
  extensibility runbook. Supersedes an earlier, partial (`rag\_archive\
  app-studio-rag-v1-2026-08-30\`) attempt — see that RAG set's own `DevelopmentHistoryLog.md`.
- `testing\widgets\` — 18 per-widget-type QA testing READMEs (junior-developer-facing, kept updated
  for this session's real behavior changes) + `testing\app-studio-test-strategy.html`.
- `design\wix-style-design\` — the App Studio Designer builder-UX design series (click-to-edit,
  freeform positioning, undo/redo, responsive editing, widget toolbox, etc.) + a real
  Wix/Vercel/App-Studio capability comparison.
- `design\targets\` — 5 App Studio target/design specs (page-first-design, pages-navigation,
  project-app-unification, section-layout-model, workflow-widgets).
- `architecture.md`/`design-and-plan.md`/`STATUS.md`/`lessons\` — project history.
- `agents\create-app-from-description@agent.md` — NEW (2026-09-04, gap-fill): a real, followable
  agent spec that gathers requirements and builds a working app end-to-end (template or empty),
  grounded in the new RAG set.
- `mcp-servers\app-studio-mcp-server-design.md` — NEW (2026-09-04, gap-fill): a design-only MCP
  server wrapping the real App/Page/Widget/Template API as discoverable tools. Not implemented.

## Explicitly OUT of scope for this reorganization (left in place, not moved)

A full scan of `agentic-coding\`, `agentic-testing\`, and the rest of `agentic-testing-nodes\`
found a large amount of real content that does **not** map to one of the 3 named roles — different
concern entirely (testing/QA for already-built, deployed applications — ChatDesk, Octopus Admin,
WorkDesk, Conversations App, Admin Dashboard, and ~35 more `agentic-testing\` app folders — or
cross-cutting infrastructure not specific to one role, e.g. the A2A/DID identity work, usage-
tracking, the RAG-theory article series under `agentic-coding\docs\octopus-lifecycle\`). Moving
these would have been forcing a bad fit rather than genuine organization. They remain exactly where
they were; if a future 4th role (e.g. an "Agent Development Engineer" for Octopus AI agents
themselves — `mcp-server-spec`'s content strongly suggests this is coming) gets added, some of this
material (the Octopus MCP integration scan, `agentic-coding\agents\core\` ac-coder/ac-planner/
ac-reviewer/ac-tester — the meta agentic-coding pipeline's own agents) is a strong candidate to
revisit then.

## Gaps identified — status

1. **No `agents\` spec exists for Workflow Development Engineer** — nothing that takes a workflow
   description and builds+tests it end-to-end, the way `create-entity-search-form@agent.md` does
   for forms, or the new `create-app-from-description@agent.md` does for apps. Highest-value
   remaining gap — not filled this pass (budget went to the App role's gaps + the reorganization
   itself); real candidate for the next pass.
2. ~~No `agents\` spec exists for App Development Engineer~~ — **filled**:
   `app-development-engineer\agents\create-app-from-description@agent.md`.
3. ~~No `mcp-servers\` design exists for App Development Engineer~~ — **filled**:
   `app-development-engineer\mcp-servers\app-studio-mcp-server-design.md` (design only, per
   Binoy's instruction — not implemented).
4. Cross-reference note: a few files moved from `agentic-coding\bizfirst-ai-mcp-servers-spec\`
   mention sibling doc sets by relative path (e.g. `workflow-nodes-rag\agent\add-new-node-type.md`
   mentioning `atlas-forms-rag\agent\refreshFromCodeToDoc@agent.md` for pattern-precedent) — these
   are now cross-role references (different top-level role folders) and remain conceptually valid
   but the literal relative path no longer resolves if followed as a strict file link. Not fixed in
   this pass — flagging rather than silently leaving wrong.
