# Agentic Testing — Nodes

A repeatable system for testing Flow Studio / Octopus **workflow execution node types** — the
building blocks a user drags onto a workflow canvas (an Elasticsearch node, an HTTP node, a SQL
node, an AI Agent node, ...) — with an AI agent building a real minimal workflow, executing it, and
recording real evidence. Sibling system to `Documentation\Employees\agentic-testing\` (that one drives React apps end to
end through a browser) and, closer in spirit, to `Documentation\Employees\agentic-testing\features\` (backend
features/protocols with no dedicated app UI).

**Start here:**
- [`about.html`](about.html) — landing page, links to everything below. Open the local file directly
  in a browser (`file:///...`) or read the source — this is a plain local HTML file in this repo, not
  hosted anywhere.
- [`01-Getting-started\`](01-Getting-started\index.html) — the methodology: what a node is, the
  two-phase testing structure, the direct-DB workflow automation, and the standing
  credential-sourcing instruction. Read this before testing your first node. Also a plain local file.
- [`02-guidelines.md`](02-guidelines.md) — the concrete, step-by-step procedure for bootstrapping
  testing on a brand-new node type that doesn't have a folder here yet (written for zero prior
  context — this is what Sajira or a future operator follows).
- `globals.md` (below) — the shared mechanics reference: Pass/Fail/Blocked verdicts, what
  "resources" means, `results.md` format. `01-Getting-started` explains the *why*; this file is the
  terse mechanics every node's testing round actually runs against.

## Why this exists

A node type only does something once it's wired into a real workflow and executed — you cannot
"open" an Elasticsearch node the way you open Document Manager. Testing one for real means: confirm
its config schema/Atlas Form/backend code are all in lockstep, build a small real workflow that uses
it (via Flow Studio's actual UI through claude-in-chrome, or a direct DB/API build — see
`globals.md`), execute it for real, and capture what actually happened — including, where the node
needs real external credentials (a database, an API), stopping cleanly to ask for them rather than
inventing a result.

## Structure

```
agentic-testing-nodes\
  README.md              this file
  globals.md              shared facts: what "node"/"resources" mean here, test-plan shape,
                           how automated testing works for a node, credential-request protocol
  {node-slug}\
    README.md              entry point for this node's testing — what it is, where its real
                            registry row/executor/forms live, testing status
    resource.md              the index — prior DB-side work, backend code, feature/test-case
                            map, credential-sourcing checklist (see globals.md/02-guidelines.md)
    test-plan.md            Phase 0 (static coverage) + Phase 1 (isolated, per-feature) +
                            Phase 2 (combined chained workflow)
    resources\               config schema, credential model, backend project path(s), DB
                            catalog script pointers — stable across rounds
    workflow-build\          the automation itself: how a minimal real workflow using this node
                            gets built (Chrome-driven and/or direct-DB/API), ready to run
    lessons\README.md          running, dated log of real findings — read first, append always,
                            see 02-guidelines.md's "Lessons" section
    testround\
      r1\                     one round's actual output — created when a round runs, never
                            hand-authored
        results.md            pass/fail/blocked per test case, with evidence pointers
        screenshots\          captured images (Flow Studio canvas/observer, mostly)
      r2\                     next round, same shape — rounds are never overwritten
      ...
```

## Per-node folder — what each file is for

- **`README.md`** — 2-minute orientation: what the node does, its confirmed real
  `Process_ProcessElementTypes.Code`, its C# executor path, its Atlas Form(s), and current testing
  status. Written so a fresh agent with zero prior context can start a round from this file alone.
- **`resource.md`** — the index every node folder needs: prior-reviewed DB-side config data to reuse
  (not redo), backend code (and whether its own tests still build), a feature/capability breakdown
  mapped one-to-one to Phase 1 test cases, and the credential-sourcing checklist. See
  `02-guidelines.md` step 3 for the required shape.
- **`test-plan.md`** — Phase 0 (static config coverage, no live system needed) + Phase 1 (isolated,
  one feature at a time — every capability proven alone first) + Phase 2 (one combined chained
  workflow, built only after Phase 1 is fully done). Every case specific enough a fresh agent can
  execute it without guessing.
- **`resources\`** — the node's real config schema (cross-checked Atlas Form vs. C# `LoadFrom`),
  its credential model, backend project path(s), and DB catalog script pointers. See `globals.md`
  for exactly what belongs here.
- **`workflow-build\`** — the concrete automation: a documented Chrome-driven build procedure and/or
  a direct-DB/API build script, ready to execute once credentials (if needed) are supplied.
- **`lessons\README.md`** — a running, dated log of real findings for this node — defects, pitfalls,
  technique corrections. Every node folder is a **living, continuously-improving knowledge base**, not
  a one-off deliverable: read this file before starting any work on the node, and append a new dated
  entry for any real finding before considering that work done. Also check other nodes' lesson logs
  before starting a brand-new node type — see `02-guidelines.md`'s "Lessons" section for the
  cross-pollination rule.
- **`testround\r{N}\`** — the actual record of one executed round, same shape as the sibling system.

## Nodes currently covered

| Node | Registry code | Status |
|---|---|---|
| [Elasticsearch](elasticsearch\README.md) | `elasticsearch` | Build-verified: 10 Phase 1 + 1 Phase 2 real workflows built and DB-confirmed. Live execution blocked on real Elasticsearch credentials + backend reachability (see `elasticsearch\resource.md` §5-6, `elasticsearch\testround\r1\results.md`) |

More nodes get added the same way — a new `{node-slug}\` folder following the exact structure above,
only after confirming the node type is real per `globals.md`'s "What 'node' means here."
