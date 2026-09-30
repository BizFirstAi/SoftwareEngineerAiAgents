# Add a New Node Type to `workflow-nodes-rag`

Use this runbook whenever a node type needs a Tier 1 doc — either a new `ExecutionNode` was added to
the codebase, or one of the 89 node types listed in `..\..\Knowledge\Workflow\workflow-nodes-rag\00-overview.md`'s "Not yet covered" list is
next up. This file is written to be handed directly to a fresh agent as its task prompt — it assumes
zero prior context on this doc set. Mirrors the discipline `atlas-forms-rag\agent\
refreshFromCodeToDoc@agent.md` established for its own doc set — same two-tier shape, same
"ground truth is the code, never a prior doc or the DB column" rule — adapted for workflow nodes.

## The one non-negotiable rule

**Read the real executor + settings C# source first. Read the DB seed (`Process_ProcessElementTypes_
*.data.sql`) only afterward, as a factual comparison to record in the doc's Gotchas section — never as
a template for what the doc should say.** This doc set exists specifically because that DB column is
confirmed unreliable in multiple distinct ways (stale, empty-stub, copy-pasted from an unrelated node
type) with no way to tell which failure mode (if any) applies to a given node type without reading the
code yourself. Trusting the DB schema as a starting point defeats the purpose of this doc set.

## Step 1 — find the real source

1. Locate the executor: `BizFirstPayrollV3\src\mvc-server\Ai\ExecutionNodes\**\*NodeExecutor.cs` (or a
   non-matching name — some real executors don't end in `NodeExecutor`, e.g. `ChatExecutor.cs`,
   `AddRagDocExecutor.cs` — search by the node's `ProcessElementTypeCode`/`NodeTypeName` constant if
   the file name doesn't obviously match).
2. Read the executor's `.cs` file and every partial-class sibling (`.Config.cs`, `.Execute.cs`,
   `.Validate.cs`, feature-specific partials) — node behavior is frequently split across several
   partial-class files, not one.
3. Find and read the paired settings class (`*NodeExecutorSettings.cs`/`*NodeSettings.cs`) — this is
   where every real `Configuration` JSON key, its type, default, and validation rule actually lives,
   read via `ReadConfigByKey`/`ReadConfigByKey_Int`/`ReadConfigByKeyBool`/`FromDictionary`, etc. Use
   the **exact JSON key string** passed to these methods, not the C# property name, when they differ
   (a common trap — several node types intentionally keep a legacy lowercase wire key like `sessionId`
   even though the repo's naming convention would suggest `SessionID`).
4. If the node uses a **resource/operation dispatch pattern** (settings class delegates to
   `*OperationInfoFactory.Create(Resource, Operation, ConfigReader)` — seen in `email-smtp`, `slack`,
   `email-gmail`, `ai-agent`, `ai-function`): find the factory and enumerate every real
   resource/operation combination it supports. Document the most common one in full field detail; list
   the rest by name so an agent knows they exist even if not fully detailed yet.
5. Find the output port mapping (`*OutputPortMapping.cs` or the executor's
   `CreateInstanceOutputPortMapping()`/`GetOrCreatePortSuccessAndError()` calls) — do not assume
   `main`/`error` are the only ports; several node types have more (`loop`'s `main`/`done`, `delay`'s
   `main`/`cancelled`/`waiting`/`error`), and at least one (`switch`) has **dynamic**, config-declared
   ports rather than a fixed set.

## Step 2 — decide: single doc, or split doc?

**Default: one flat `..\..\Knowledge\Workflow\workflow-nodes-rag\nodes\{code}.md` file.** This is right for the large majority of node types —
even ones with a dozen-plus fields, as long as those fields are essentially one flat property list
(optionally grouped into a resource/operation dispatch, per Step 1.4).

**Split one level deeper when the node genuinely qualifies.** The qualifying rule (Binoy's framing,
applied retroactively to `ai-agent`/`flow-ai-agent` on 2026-08-20): if the real settings class has
**more than ~2-3 genuinely independent sub-objects/concerns** — not just scalar fields, but things like
a nested config object, an override-vs-merge pair, a set of mutually-exclusive per-strategy field
groups, or a family of independently-addable segments — apply the *same* two-tier pattern one level
deeper:

- `..\..\Knowledge\Workflow\workflow-nodes-rag\nodes\{code}\00-index.md` — a lean index: what the node does overall, credential/ID
  requirements, any fields that are genuinely core/always-relevant (not owned by one sub-feature), and
  a short table of sub-features, each with a one-line description and a pointer to its own doc.
- `..\..\Knowledge\Workflow\workflow-nodes-rag\nodes\{code}\{sub-feature}.md` — one focused doc per genuinely-independent sub-feature, same
  minimum-content bar as a single-doc node type (what the feature does, its applicable properties,
  valid values per property — types/enums/ranges — and the meaning/purpose of each, all from real
  source).

Don't force a fixed sub-feature count — group by what the real settings class actually contains.
`ai-agent` split into 5 (`conversation-scope.md`, `hil-features.md`,
`invocation-and-agent-resolution.md`, `prompt-overrides.md`, `tool-servers-and-llm.md`); `flow-ai-agent`
also split into 5 (`llm-and-prompt.md`, `tools.md`, `loop-and-memory.md`, `sql-agent.md`,
`streaming-agent.md`) — one file per FA-strategy-specific field group plus one for the always-relevant
core. A node type with, say, 3 independent concerns might split into only 3 files; don't pad to match
either example.

If you're not sure whether a given node type qualifies, default to the single-doc pattern — splitting
a node that doesn't need it just adds retrieval hops for no benefit. Splitting is a retrieval-quality
decision, not a content-reduction one either way: never drop real content to avoid a split, and never
split just to hit a target file count.

## Step 3 — write the Tier 1 doc(s)

`{code}` is the exact string the executor's `ProcessElementTypeCode`/`NodeTypeName` override returns —
**verify this against the DB seed's `Code` column too**, since at least two node types this pass found
have a compile-time constant that does not match what actually gets registered
(`schedule-trigger`'s `NodeTypeName = "scheduled-trigger"` literal is misleading; `email-gmail`'s
informal name "gmail" is not the real code). If the two disagree, use the DB `Code`/what
`ProcessElementTypeCode` actually returns, and flag the mismatch prominently in the doc itself — the
constant-name trap is exactly the kind of thing an agent authoring a workflow would get wrong by
guessing.

**Single-doc structure** (mirrors `atlas-forms-rag\v2\controls\{type}.md`'s depth/format — read a
couple of existing `..\..\Knowledge\Workflow\workflow-nodes-rag\nodes\*.md` files as a live example before writing a new one):

```
# `{node-type-code}`

One paragraph: what the node does, when to use it, output ports, whether it requires credentials.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
... every real field, exact wire-format key, sourced from Step 1 ...

## Example

```json
{ ...a realistic, complete Configuration JSON for a typical use... }
```

## Gotchas
- anything a config-authoring agent would get wrong by guessing instead of reading this doc
- the DB-schema comparison finding — state plainly whether ConfigurationSchema was accurate, stale,
  an empty stub, or wrong/fabricated, with the specific field-level evidence either way
```

**Split-doc structure** — `00-index.md` follows the same paragraph-plus-Gotchas shape but replaces
`## Config` with `## Sub-features` (a table: sub-feature / what it covers / doc path) and keeps only
core/always-relevant fields plus any cross-cutting Gotcha (e.g. a DB-schema-gap finding that spans the
whole config surface belongs in the index, not duplicated into every sub-feature file). Each
`{sub-feature}.md` follows the same `## Config` / `## Example` / `## Gotchas` shape as a single-doc
file, scoped to just that sub-feature's fields — see `..\..\Knowledge\Workflow\workflow-nodes-rag\nodes\ai-agent\` or
`..\..\Knowledge\Workflow\workflow-nodes-rag\nodes\flow-ai-agent\` for a worked example of both the index and sub-feature shape.

**Keep all field-level/example/gotcha content here, in Tier 1 (whichever shape) — never promote any of
it into `00-overview.md` (Tier 0).** Tier 0 gets exactly one line for the new node type: `code` /
category / one-sentence description / credentials required / doc-status (for a split node type, the
doc-status cell points at `nodes\{code}\00-index.md` and notes it's split). Binoy's explicit framing:
Tier 0 is "always execute" (always loaded regardless of what the user is asking for) and must stay
lean; Tier 1 is "optional" (retrieved only when a request implies that specific node type is relevant,
and for a split node type, only the specific sub-feature doc(s) the request implies). A Slack-specific
field list sitting in Tier 0 would bloat context for every workflow that never touches Slack — that
failure mode is exactly what the two-tier split exists to prevent, and it re-appears any time new
per-node detail gets added to the wrong tier (including a sub-feature's field list leaking into a
split node's own `00-index.md`).

## Step 4 — update the index

In `..\..\Knowledge\Workflow\workflow-nodes-rag\00-overview.md`: add one row to the node type index table (code / category / one-line
description / credentials / doc path — `nodes\{code}\00-index.md` with a "(split — N sub-feature
docs)" note if you split), and remove the node type from whichever "Not yet covered" tier list it was
in. Do not add anything beyond that one row — see the "keep Tier 0 lean" rule above.

## Step 5 — ingest

Add one **Knowledge Insert** (or, if refreshing an existing doc, **Update**) call to the FlowRag
ingestion workflow per `..\..\Knowledge\Workflow\workflow-nodes-ingestion.md`, **once per file** — for a single-doc node
type that's one call (`fileName` = `"nodes/{code}.md"`); for a split node type that's one call per
file under `nodes/{code}/` (`fileName` = `"nodes/{code}/00-index.md"`, `"nodes/{code}/{sub-
feature}.md"`, etc.). `knowledgeID` = the deterministic GUID derived from that exact file path (same
convention as every other file in the collection, required so a later refresh can atomically replace
that one file's chunks) — a split node type therefore gets multiple independent `knowledgeID`s, one
per sub-feature file, not one shared ID for the whole node type.

## Step 6 — independent review

Same discipline `refreshFromCodeToDoc@agent.md` requires for Atlas Forms: don't treat your own doc as
verified just because you wrote it carefully. Have a second pass (a fresh agent, or a careful
self-review done after a break) re-read the real source independently and check the doc's field list,
types, and Gotchas against it — self-review alone is exactly how a subtly wrong doc would slip in
undetected, the same risk this entire doc set exists to eliminate from the DB column.

## Constraints

- Documentation only — do not modify any ExecutionNode code as part of writing a Tier 1 doc.
- Do not commit or push anything without being explicitly asked in that specific request.
- Ground every claim in real, currently-read source code — not in `Process_ProcessElementTypes`, not
  in a prior doc's content, not in this runbook's own examples. This file tells you where to look and
  what traps to watch for; it is not itself a source of current truth about any node type.
