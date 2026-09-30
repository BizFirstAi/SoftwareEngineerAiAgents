# Workflow Nodes RAG — Overview (Tier 0 — always loaded)

Source of truth: BizFirst Flow Studio ExecutionNode source code under
`BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\`, read directly per node type (executor +
settings classes) — **not** `Process_ProcessElementTypes.ConfigurationSchema`, and not mirrored to
that column's shape or field set. Scanned/written 2026-08-20.

**This file is Tier 0 — the only part of this doc set that should ever be always-loaded into an
agent's context.** It stays a lean index on purpose: what node types exist, one-line descriptions,
category grouping, which ones have a real doc yet. It must never accumulate per-node-type
implementation detail (exact config fields, JSON examples, gotchas) — that content lives in Tier 1
(`nodes\{code}.md`) and is pulled in only when a request actually implies that node type is relevant
(e.g. the user's ask mentions Slack → retrieve `nodes\slack.md` then; a workflow with no Slack step
never loads it). Keeping this split strict is what keeps Tier 0 cheap for every workflow regardless of
which of the 107 node types it ends up using — see "Two-tier retrieval" below.

## Why a RAG doc set exists here at all

`flow-workflow-mcp-design.md` originally recommended skipping RAG for node configuration, reasoning
`ConfigurationSchema` was reliable — based on sampling only 2 node types. Binoy corrected this:
*"for flow mcp server, we need a rag system because the schema in the table is not reliable neither is
complete."* A wider pass across 18 node types confirmed it, and confirmed something sampling 2 types
couldn't reveal: reliability is **inconsistent per node type with no predictor** — some schemas are
genuinely accurate (`http-request`, `flow-ai-agent`), some are stale, some are empty stubs despite real
required fields, and at least one (`slack`) is a **verbatim copy-paste of an unrelated node type's
schema**. A copy-pasted schema is exactly as structurally well-formed as a correct one, so "the column
is structured" is not a safe proxy for "the column is correct." Each `nodes\{code}.md` file below was
written independently from real executor/settings source — the DB schema was consulted only
afterward, as a factual comparison recorded in that file's own Gotchas section, never as a template
for what the doc should contain. Full per-node evidence lives in each node's own doc, not repeated here.

This does not touch `workflow-creation-rag-design.md`'s conclusion for the **shared** tier
(expressions/guardrails/policies) — that substrate is small and stable enough to skip RAG, and that
conclusion stands. `00-looping-patterns.md` (same folder) is a second small, stable, always-loaded
Tier 0 doc in that same spirit — the Loop-Node-vs-inline-iteration decision needed on any "for each
item" request, regardless of which node types the flow ends up using.

## Two-tier retrieval — how an agent should actually use this

- **Tier 0 (this file, always loaded):** category table below + one-line descriptions. Answers "what
  node types exist and roughly what do they do" without costing per-node-type context on every turn.
- **Tier 1 (`nodes\{code}.md`, retrieved on demand via `util-kg-knowledge_retrieval` against the
  `workflow-nodes-spec` Qdrant collection — see `..\workflow-nodes-ingestion.md`):** full config field
  table, a real JSON example, and gotchas, for exactly the node type(s) the current request implies.
  Fetch once per distinct node type actually needed, not preemptively for every type in the table.
  For a node type complex enough to have multiple loosely-related sub-features (more than ~2-3
  genuinely independent sub-objects/concerns — not just scalar fields), Tier 1 itself splits one level
  deeper: `nodes\{code}\00-index.md` (what the node does, its sub-feature list, one line each) + one
  focused `nodes\{code}\{sub-feature}.md` per sub-feature, each retrieved independently. `ai-agent` and
  `flow-ai-agent` use this nested pattern (see their rows below); every other node type so far stays a
  single flat `nodes\{code}.md` file. See `agent\add-new-node-type.md` for the qualifying rule and how
  to apply either pattern when adding new coverage.
- **If a node type has no Tier 1 doc yet** (see "Not yet covered" below): fall back to
  `get_node_type_schema` (a direct `ConfigurationSchema` read) as a starting point only, and treat it
  as unverified — this doc set exists precisely because that column cannot be trusted blind.

## Node type index

One line per node type: `code` — category — what it does — credentials required — Tier 1 doc status.

| Code | Category | What it does | Creds | Tier 1 doc |
|---|---|---|---|---|
| `manual-trigger` | Core / Trigger | Starts a workflow run on manual/API invocation; passes InputData through unchanged. | No | `nodes\manual-trigger.md` |
| `webhook-trigger` | Core / Trigger | Starts a workflow when an external HTTP POST hits the workflow's webhook endpoint. | No | `nodes\webhook-trigger.md` |
| `schedule-trigger` | Core / Trigger | Starts a workflow on a cron schedule (validates the cron string; firing itself needs an external scheduler adapter). Real code is `schedule-trigger`, not "scheduled-trigger". | No | `nodes\schedule-trigger.md` |
| `http-request` | Standard | Makes an outbound HTTP call to any URL/API. | Optional (bearer/credential) | `nodes\http-request.md` |
| `email-smtp` | Standard / Email | Sends an email via a configured SMTP server. | Yes | `nodes\email-smtp.md` |
| `email-gmail` | Standard / Email | Multi-resource Gmail integration (message/draft/label/thread operations) via OAuth2. Real DB code is `email-gmail`, not the informal name "gmail". | Yes | `nodes\email-gmail.md` |
| `slack` | Social | Multi-resource Slack integration (post message and other operations) via bot token. | Yes | `nodes\slack.md` |
| `if-condition` | Core / Logic | Two-way branch (`true`/`false` ports) based on evaluating a condition/expression. | No | `nodes\if-condition.md` |
| `switch` | Core / Logic | Multi-way branch to dynamically-declared, per-case output ports. | No | `nodes\switch.md` |
| `loop` | Core / Flow | Iterates over a collection, firing `main` per item and `done` on completion. | No | `nodes\loop.md` |
| `delay` | Core / Flow | Pauses the workflow for a duration or until a timestamp/expression. | No | `nodes\delay.md` |
| `parallel-fork` | Core / Flow | Fans a single execution path out into concurrent branches (pairs with `parallel-join`). | No | `nodes\parallel-fork.md` |
| `parallel-join` | Core / Flow | Waits for and merges branches previously fanned out by `parallel-fork`. | No | `nodes\parallel-join.md` |
| `sub-workflow` | Core / Flow | Synchronously invokes another workflow (by ID/version) inline, with automatic full variable inheritance. | No | `nodes\sub-workflow.md` |
| `code-execute` | Core / Script | Runs a user-authored script (sandboxed) against the current InputData. | No | `nodes\code-execute.md` |
| `ai-agent` | Octopus/AI | Invokes an existing Octopus Agent — one-shot `send` or multi-turn HIL `chat`. | No (agent's own LLM credential) | `nodes\ai-agent\00-index.md` (split — 5 sub-feature docs) |
| `ai-function` | Octopus/AI | Invokes a single named tool/function on an Octopus tool server directly. | Depends on server | `nodes\ai-function.md` |
| `flow-ai-agent` | Octopus/AI | Self-contained LLM agent node (6 strategies: tools/reAct/conversational/planExecute/sql/stream) with its own LLM credential — no Octopus `AgentID` needed. | Yes | `nodes\flow-ai-agent\00-index.md` (split — 5 sub-feature docs) |

18 of 107 live node types have a Tier 1 doc so far — chosen per `flow-workflow-mcp-design.md`
Decision #3's priority order (triggers → HTTP/webhook → email/Slack → if/switch/control-flow → AI
Agent family), the types most likely to appear in an agent-authored workflow's first draft. 16 of
those 18 are a single flat `nodes\{code}.md` file each; `ai-agent` and `flow-ai-agent` are each split
into a `nodes\{code}\` folder (`00-index.md` + 5 sub-feature docs), for 28 Tier 1 files on disk total.

## Not yet covered — prioritized follow-up (89 remaining)

**Tier A — next in line:** remaining Core (`validation`, `variable-assignment`, `data-mapping`,
`json-transform`, `collection-operation`, `try-block`/`catch-block`/`finally-block`,
`break-statement`, `continue`, `stop-workflow`, `function`, `form`/`form-trigger`, `event-wait`,
`satellite`, `approval`, chat vendor nodes `chat-trigger`/`chat-gpt`/`claude`/`gemini`/
`huggingface`/`llama`); remaining Email (`imap`, `ses`, `mailgun` — same resource/operation shape as
`email-smtp`/`email-gmail`, should be fast once one is done).

**Tier B — integrations likely needed once workflows get specific:** Google Workspace (5:
`google-calendar` +trigger, `google-docs`, `google-drive` +trigger); Databases (3: `sql-server`,
`mysql`, `elastic-search`); Productivity (5: `gsheets`, `jira`, `mongodb`, `notion`, `s3`);
Distributed (2: `kafka`, `redis`); remaining Social (5: `facebook`, `instagram`, `tiktok`, `twilio`,
`whatsapp`).

**Tier C — lower frequency / specialist, document last or on-demand:** Blockchain (16: Binance,
Bitcoin, Centrifuge, ChainLink, Coinbase ×2, DataProof, Ethereum, HashiCorp, Hedera, IPFS, Ondo, Safe,
Solana, Wormhole); IaaS (5: Deploy, Docker, DockerCompose, Kubernetes, SSH); Microsoft Office (3:
Excel, PowerPoint, Word); Cloud/Config/Documents/Enterprise (~5: AzureBlob, CloudFlare,
EnvironmentVariables, SpreadsheetFile, Salesforce); ScrapeApi (3: Apify +trigger, Browserless);
`flow-rag` itself (ops tool, not a business-workflow node).

To add coverage for any of these, follow `agent\add-new-node-type.md` — the extensibility runbook for
this doc set.

## Ingestion pipeline

See `..\workflow-nodes-ingestion.md` for the concrete ingestion design (FlowRag mechanics, Qdrant
collection identity, `AIAgent_KnowledgeBases` wiring, and what remains a manual/deferred step).
