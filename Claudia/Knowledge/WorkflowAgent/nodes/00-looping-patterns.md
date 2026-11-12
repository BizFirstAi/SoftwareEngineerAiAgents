# Looping Patterns — When a Workflow Must Do Something "For Each Item" (Tier 0 — always loaded)

Companion to `00-overview.md`. Small and stable enough to stay always-loaded, same reasoning
`workflow-creation-rag-design.md` gives for the expressions/guardrails/policies shared tier: this is a
cross-cutting decision an agent needs on any "for each X" request, regardless of which node types end
up in the flow — not per-node-type detail, which stays in Tier 1 (`nodes\{code}.md`).

## The question to ask first

Does the user's request need to repeat a step once per element of a collection — "send an email to
each person in this list," "call this API once per record," "create a task for every open ticket"?
If yes, there are two structurally different ways to build that in BizFirst Flow Studio. Pick the
right one before wiring anything.

## Pattern 1 — Loop Node → child action node (default choice, works today)

Add a `loop` node (see `nodes\loop.md` for its full config) upstream of the node that does the actual
work (e.g. `email-smtp` to send the email, `http-request` to call the API). The orchestrator
re-invokes the `loop` node once per item; each invocation routes the current item out its `main` port
to the child node, which itself is re-executed fresh, once per item, with that item's data. A `done`
port fires once after the last item for whatever should run after the loop.

**This is the pattern to reach for by default.** It is fully live, safe for any child node type
(the child's config is resolved fresh on every invocation, so a field like "recipient email" that
needs to be different per item works correctly), and is what every other node type in this doc set
assumes when its own doc doesn't say otherwise.

## Pattern 2 — inline/intra-node iteration (structural, not yet safe to choose per-record)

Some nodes (the `loop` node itself, when configured `isExternalLoop: false`) can iterate over a list
inside a single invocation instead of one invocation per item, via the framework's shared
`ExecuteItemsAsync` mechanism. This exists at the framework level and, in principle, any node type
could opt into it via a `supportsItemIteration` config flag.

**Do not choose this pattern for a node whose fields need a different value on each item** (e.g. a
recipient address, a per-record ID) unless that specific node type's own Tier 1 doc
(`nodes\{code}.md`) explicitly documents inline-iteration support with correct per-item field
resolution. As of this writing, no node type's doc makes that claim — treat its absence as "not
supported yet," not as an oversight to route around.

Why this caveat exists, briefly: inline iteration only resolves a node's config **once**, before the
first item, unless that node's executor was specifically written to re-resolve its per-item fields on
every iteration. A framework-level bug that made this silently produce wrong/stale values (e.g. every
item getting the first item's recipient address) was fixed 2026-09-07, but fixing the framework
primitive is not the same as any given node type actually using it correctly yet — that requires
per-node-type work. Full engineering detail: `Documentation\WorkManagement\inline-loop\design.html`.

## Rule of thumb for building a flow

- Different value needed per item (recipient, record content, per-item ID, etc.) → **Pattern 1, Loop
  Node**, always, today.
- Truly identical operation repeated a fixed/variable number of times with no per-item data
  variation (rare) → inline iteration may be appropriate, but confirm against the specific node
  type's own doc first.
- When in doubt, use Pattern 1. It is the only pattern currently verified safe across arbitrary node
  types.

## Status note (check before relying on this for a specific node type)

`email-smtp` is the first node type this doc set expects to gain documented, verified inline-iteration
support (per-item recipient resolution) — check `nodes\email-smtp.md`'s own Gotchas section for
whether that has landed before assuming it. If that section is silent on inline iteration, assume
Pattern 1 (Loop Node) is still the only safe way to send a personalized email per recipient.
