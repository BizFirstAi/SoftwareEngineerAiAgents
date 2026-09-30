# Workflow-Creation RAG — Design

Scoped tonight per Binoy: *"for workflow creation, we need to create a rag as well... let us plan
smart... remember, like forms rag, we need to remember how a user ask to build a flow. user will ask
to modify individual nodes. also expression, policy and guardrails etc will be modified by user -
they are common files."*

**Relationship to `flow-workflow-mcp-design.md` (Task 22, same folder):** that doc already solved the
narrow question — the per-node-type `Configuration` JSON schema lookup — with a two-tier direct-DB-read
pattern (`list_node_types` / `get_node_type_schema` against `Process_ProcessElementTypes
.ConfigurationSchema`), explicitly rejecting RAG for that slice because the schema is already a
structured, DB-resident column. This doc is broader: it covers the *procedural* knowledge an agent
needs to go from a natural-language ask to a real `save_workflow`/`update_node_configuration` call, plus
the three cross-cutting concepts (expressions, node policies, guardrails) that apply across many node
types rather than being per-type. It does not re-litigate Task 22's conclusion — it extends the same
reasoning to this larger scope and reaches the same kind of answer for the same kind of reason.

## Problem statement

Building or modifying a workflow needs two genuinely different kinds of knowledge, plus one shared
substrate:

1. **Building a whole new flow from a natural-language request** — "build me a workflow that emails
   the sales team when a Slack message contains 'urgent'." The agent needs to know: how to discover
   candidate node types, how a trigger differs from an action node, how nodes connect (ports, edges,
   conditional branches), and the actual tool sequence (`create_workflow_project` → per-distinct-type
   `get_node_type_schema` → one `save_workflow`, per Task 22's "Agent conversation flow" §Phase 1).
2. **Modifying one existing node** — "change the SMTP node's `toEmail`," "add a guardrail to the AI
   Agent node." Narrower: `get_workflow` to re-ground, then a single targeted
   `update_node_configuration`/`update_workflow_node` call (Task 22's Phase 2).
3. **The shared substrate** — expressions, node policies, and guardrails are not properties of *one*
   node type; they're mechanisms available on (in principle) *any* node's `Configuration`, so
   duplicating their explanation into all ~107 per-node-type docs would be exactly the anti-pattern
   Atlas Forms RAG's own "common properties" tier was built to avoid.

## Investigation — what actually exists, and in what form

### 1. Node executor inventory — reused, not recounted

Per `flow-workflow-mcp-design.md` §3 (verified there tonight, not re-derived here): **107 live node
executor types**, cross-checked directly against `Process_ProcessElementTypes_*.data.sql` seed files
under `BizFirstFiDB\...\dbo\Data\projects\`. Category breakdown (Core ~25, Blockchain 16, Social 6,
Email 5, Google Workspace 5, Microsoft Office 3, IaaS 5, Databases 3, Distributed 2, Octopus/AI 3,
Productivity 5, ScrapeApi 3, Cloud/Config/Documents/Enterprise ~5) is in that doc; not repeated here.

### 2. Expressions — `ConfigExpressionResolver` / `IExpressionOrchestrator`

Confirmed real and generic (per Task 22's own Task-22-adjacent research and independently re-read
tonight):

- `Ai\ProcessEngine\...\Service\Services\Expressions\ConfigExpressionResolver.cs` — walks a node's
  entire `Configuration` dictionary after the 3-layer config merge, evaluating any string value that
  contains an expression pattern (recursing into nested dictionaries, max depth 50), before the node's
  typed settings class ever reads it. This is genuinely **cross-node** — it runs identically regardless
  of node type, which is exactly why it belongs in a shared tier, not a per-node-type doc.
- `Expressions\Domain\Utilities\ExpressionDetector.cs` — the actual grammar an agent must know to write
  a syntactically valid expression: 7 patterns — `{@...}` (brace-at), `{{...}}` (template),
  `@{...}` (directive, e.g. `@{js:...}`, `@{csharp:...}`, `@{jsonpath:...}`, `@{template:...}`),
  `{%...%}` (percent-brace), and three variable shorthands, `$json.field` / `$input.field` /
  `$var.field` (registry-based prefixes, not hardcoded — enterprise apps can add custom ones).
- `Expressions\Scripting.Js.Services\Qualifiers\*.md` — **4 existing markdown docs, 727 lines total**
  (`USAGE_GUIDE.md` 147, `NODE_USAGE.md` 244, `INTEGRATION_ALL_DIRECTIVES.md` 209,
  `EXPRESSION_PIPELINE.md` 127) documenting the `$`/`item.*` ObjectQualifier accessor pattern
  (`item.first()`, `item.last()`, `item.at(n)`, `item.next()`, `item.index`, `item.count`) usable
  inside any of the 7 patterns above, plus concrete per-directive examples
  (`@{js: $ && $.role == 'admin' }`, `{{json.firstName}}`, etc.). `Expressions\Domain\Docs\MOVED.md`
  points at `Documentation\V2\WebSites\BizFirstExpressions` as a further relocated doc site — that path
  did not resolve in this pass (empty/not found); the 4 in-repo files above are the confirmed, readable
  source.
- `BaseNodeExecutor.Expression.cs` — the public `EvaluateExpressionAsync` passthrough an executor (or a
  Bridge-service caller) uses directly; confirms expression evaluation is a first-class capability of
  every node, not an opt-in add-on.

**This is real prose documentation, not a DB column** — same *kind* of substrate as Atlas Forms, but a
different *scale*: 4 files / 727 lines, not 69 files covering 88+ control types.

### 3. Node Policies and GuardRails — two separate real systems

Confirmed via `guardrails-system-inventory.md` (read in full, not re-derived): these are genuinely two
different systems, both real, both live, that "compose, not compete":

- **GuardRails** (`Ai\GuardRails\*`) — coarse-grained pre/post **execution gates**. Exactly **5
  built-in guard types** (`Timeout`, `InputValidation`, `PiiDetection`, `RateLimiting`,
  `CircuitBreaker`), each with one matching `*ConfigValidator` class (confirmed: exactly 5 files in
  `Provider.Core\Validators\`) and one matching Atlas Forms config form (`Atlas_Forms_13001`–`13006`,
  13000 being the picker/list form). Config lives in the node's own
  `Process_ProcessElements.Configuration` JSON under a `"guardRails.individual"` key — no separate
  guardrails table. A blocked guard routes the node to `OutputPortKey = "GuardrailsViolation"`.
- **Node Policies** (`Ai\ProcessNodePolicies\*`) — per-field metadata: visibility, editability,
  required-ness, expression-evaluation timing (`ExpressionPolicy`: stage
  AtConfigLoad/AtInputReady/NodeControlled/AsLiteral × evaluator Template/JavaScript/JsonPath/None —
  this is the direct link between this tier and the expressions tier above), HIL display/input mode,
  sensitivity/masking, plus an opt-in node-level `SuspensionPolicy` (timeout/reminder/SLA/admin-force).
  Confirmed broadly consumed — `using BizFirst.Ai.ProcessNodePolicies.Domain.Models` appears across
  ~30+ execution-node projects. Manifests are **code-defined defaults** merged with
  **Extension-JSON overrides** (`NodeFieldManifestResolver`) — again no dedicated policy table.
  4 existing markdown docs, 547 lines total, under
  `Ai\ProcessNodePolicies\...\Service\Docs\` (`Concept.NodeFieldDescriptor.md` 104,
  `Sample.ApprovalNodeManifest.md` 211, `Sample.ExtensionJsonOverride.md` 112,
  `Sample.LlmNodeManifest.md` 120) — including a ready-made LLM-node sample manifest.
- A **third, differently-scoped, near-identically-named** `NodePolicy` model exists under
  `Ai\ProcessEngage\Admin\...\Domain\Models\NodePolicy.cs` (namespace `ProcessEngage.Domain.Models`,
  not `ProcessNodePolicies.Domain.Models`) — a naming trap the inventory flags explicitly. Its live
  call-site status is unconfirmed by the inventory. Out of scope for this design; flagged so it is not
  silently conflated with `ProcessNodePolicies` when this content is authored.
- `Go\Plan`'s "guardrail"-flavored billing/quota system is confirmed unrelated (no code
  cross-reference into `Ai.GuardRails`) — explicitly excluded from this shared tier.

### 4. Structured-vs-scattered determination (the decision this task hinges on)

| Substrate | Structured/DB-resident? | Actual form | Volume |
|---|---|---|---|
| Node config schema (Task 22's scope) | **Yes** — `ProcessElementType.ConfigurationSchema` | JSON Schema per type, DB column | 107 rows |
| Expressions | **No** | Prose markdown + C# doc comments | 4 files / 727 lines |
| GuardRails | **Partially** — the 5 guard types' *properties* are already Atlas-Forms-structured (13001–13006); the *concept/when-to-use* is prose | Fixed enum of 5 types + Atlas Forms field defs + design-corpus prose | 5 known types; a 79-file *design* corpus exists but is history/rationale, not operational reference |
| Node Policies | **No** (code-defined manifests + JSON overrides, no table) | Prose markdown + sample manifests | 4 files / 547 lines |

None of the three shared-tier substrates are unstructured **at Atlas-Forms scale** (88+ control types
known only as frontend TypeScript, 69 RAG doc files). Each is either already partially structured
(GuardRails' 5 fixed types with Atlas Forms field definitions) or small enough in raw doc volume
(expressions + policies, ~1,270 combined lines across 8 files) to be treated as static reference
content rather than something that needs semantic retrieval to find the "relevant chunk." Atlas Forms
RAG earned its vector-search mechanism because no single agent turn could hold 88 control types' worth
of scattered TypeScript in context at once; that condition does not hold here for any of the three
shared concepts.

## Recommended design: extend Task 22's tiering, no new RAG pipeline

**Recommendation: skip RAG-over-Qdrant for this task too — same conclusion as Task 22, extended over a
broader scope, for the same underlying reason (structured-enough-or-small-enough source, not
"scattered across dozens of files nobody can hold in context").** Build a tiered *static/direct-read*
structure instead:

### Tier 0 — shared/common (expressions + policy + guardrails)

One compact doc set, analogous to Atlas Forms RAG's "common properties" tier — written once, referenced
by both Tier 1 and Tier 2, never duplicated per node type:

- `00-expressions.md` — the 7 patterns, the `$`/`item.*` accessor grammar, one example per directive
  type (js/csharp/jsonpath/template), and the one operational rule an agent must never violate: on
  evaluation failure the raw string is preserved and only a warning is logged, so a broken expression
  does not fail the node — but it also silently does *not* do what the user asked, which matters when
  an agent is deciding whether to trust a generated expression without a dry-run.
- `00-guardrails.md` — the 5 guard types, one paragraph each (what it checks, its config shape mirrored
  from Atlas Forms 13001–13006, the `"guardRails.individual"` config-key convention, and the
  `GuardrailsViolation` output port an agent must account for when wiring edges out of a guarded node).
- `00-node-policies.md` — `ExpressionPolicy`/`DataFlowPolicy`/`HilPolicy`/`SecurityPolicy` shape, the
  code-default + Extension-JSON-override merge model, and a pointer to the existing
  `Sample.LlmNodeManifest.md`/`Sample.ApprovalNodeManifest.md` as worked examples an agent can pattern-
  match against for AI-agent or approval-style nodes specifically.

Source material for all three already exists in-repo (the 8 markdown files inventoried above, plus the
5 `*ConfigValidator.cs` classes and `ConfigExpressionResolver.cs`/`ExpressionDetector.cs` for ground
truth) — this tier is a **curation/compression pass over real existing docs**, not new invention, and
at ~1,300 source lines compresses comfortably into always-loaded MCP tool context the same order of
magnitude as Task 22's Tier 0 node-type catalog.

### Tier 1 — build-a-flow

Not a documentation corpus at all — a **procedural guide** (a few hundred words, embedded in the MCP
tool module's own description/system context, not retrieved): discovery order (`list_node_types` for
candidates → `get_node_type_schema` once per distinct type, never once per instance → assemble the full
node/edge list in-context → one `create_workflow_project` (if new) → one `save_workflow`), when to
reach for Tier 0 (any time a candidate node's config needs a computed/dynamic value → expressions; any
time the user says "add a guardrail"/"require approval" → guardrails/policies), and the same
don't-loop-per-node discipline Task 22's "Agent conversation flow" §Phase 1 already specifies. This
tier is process knowledge Task 22 already wrote down once — referenced here, not re-authored.

### Tier 2 — modify-a-node

Narrower procedural guide: `get_workflow` to re-ground against current server state → identify the
target node → decide whether the edit is (a) a plain config value (direct
`update_node_configuration`), (b) something that needs an expression (Tier 0 expressions doc first),
or (c) a policy/guardrail change (Tier 0 guardrails/policies doc first, since these live in the same
`Configuration` JSON under their own keys, not a separate call). Mirrors Task 22's Phase 2.

### No Tier 3 / fallback RAG needed for this scope

Task 22 already reserved a fallback RAG tier for node types whose `ConfigurationSchema` proves
irreducibly complex for a single JSON Schema column (`ai-agent`, `flow-ai-agent`, other HIL-backed
types) — that fallback, if built, would live under a `workflow-nodes-spec` Qdrant collection per that
doc's §"RAG strategy for node configuration." This task's three shared concepts don't need their own
fallback: none of them is per-node-type-divergent in the way a single complex node's settings class is
— expressions/guardrails/policies behave the same regardless of which of the 107 node types hosts them,
which is precisely the property that makes a small static doc set sufficient rather than requiring
retrieval.

## Open questions for Binoy

1. **Confirm the "common, not per-node-type" framing is exactly what "they are common files" meant.**
   This design assumes expressions/policy/guardrails are genuinely node-type-agnostic (true per the
   code: `ConfigExpressionResolver` and the 5 guard types run identically regardless of
   `ProcessElementTypeID`) — if any node type has materially different expression/guardrail/policy
   behavior this pass didn't surface, that node type may need its own supplementary note layered on top
   of Tier 0 rather than Tier 0 alone.
2. **Where should the curated Tier 0 docs physically live?** Options: alongside Task 22's own future
   `flow-workflow-mcp-design.md` implementation (e.g. `BizFirst.Ai.Mcp.Tools.Workflow`'s own
   `/Docs` folder, mirroring `atlas-forms-rag`'s repo-adjacent placement) vs. under
   `Documentation\Employees\agentic-coding\bizfirst-ai-mcp-servers-spec\` alongside this design doc.
   Not assumed here.
3. **`Documentation\V2\WebSites\BizFirstExpressions`** (the redirect target in
   `Expressions\Domain\Docs\MOVED.md`) did not resolve in this pass — confirm the real current location
   of that expressions doc site before authoring Tier 0's `00-expressions.md`, in case it has newer
   content than the 4 in-repo `.md` files this pass read.
4. **The `ProcessEngage.Admin.NodePolicy`/`NodePolicyEvaluator` naming-trap model** (§3) — confirm it
   should stay fully out of scope for this shared tier (this design assumes yes, since its live-caller
   status is unconfirmed per the inventory doc) rather than needing its own mention to avoid an agent
   confusing it with `ProcessNodePolicies`.
5. **Sequencing against Task 22.** This design's Tier 1/Tier 2 procedural guides assume Task 22's tool
   names (`list_node_types`, `get_node_type_schema`, `save_workflow`, `update_node_configuration`,
   etc.) ship as designed there. If Task 22's tool list changes materially before implementation, this
   doc's Tier 1/Tier 2 text needs a pass to match.
