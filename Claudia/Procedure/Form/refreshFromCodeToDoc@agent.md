# Refresh: Atlas Forms RAG Spec (v2) From Code

**Use this runbook when Atlas Forms code has changed since `v2\` was last generated/refreshed** — new
control types added/removed, a control's properties changed, the schema top-level shape changed, or
enough time has passed that you don't trust `v2\` still matches reality. This file is written to be
handed directly to a fresh agent as its task prompt — it assumes zero prior context on this project.

## What you're refreshing, and why the discipline matters

`Knowledge\Form\atlas-forms-rag\v2\` is a multi-file spec fed
into a RAG/knowledge-base pipeline so Octopus AI agents can generate Atlas Forms schemas (JSON) from
natural-language requests. It exists specifically because **two older spec locations went stale and
were actively wrong** — not just outdated in tone, wrong in ways that would have produced broken form
JSON if trusted:
- `Documentation\Employees\atlas-forms\FormBuilder\` (the original v1 spec).
- `Documentation\AboutProducts\AtlasForms\Spec\FormSchemaSpecV.1.0\` (a second, separately-discovered
  stale spec — missing `FormSchema.apiActions` entirely, missing ~15 real `FormMetadata` fields, wrongly
  claimed regex-timeout protection is 5 seconds when the real code enforces 100ms, and documented
  `editable-grid`/`display-grid` control variants while missing the real, fully-built `grid` control).
- Even a Claude *memory* file (`formmaker_system.md`) had drifted: claimed "12 total control types"
  when the real, code-verified count at the last v2 build was **115 declared control types, 113 with a
  confirmed render path** — not a rounding error, an order-of-magnitude miss.

**The one non-negotiable rule for every refresh: re-verify against real code every time. Never trust
what a prior version of `v2\` (or any other doc, including this file's own stated numbers) says without
re-checking it against the actual source.** Numbers, control lists, and "confirmed absent" claims below
are snapshots from the last build — restate them as "verify this is still true," not as facts.

## Step 0 — read the current state first (don't refresh blind)

1. Read `v2\00-overview.md` and `v2\01-common-properties.md` in full — these are Tier 1 (see below),
   the current source of truth for what the spec currently claims exists.
2. Skim the `v2\controls\` directory listing (file names only) to see the current control-file
   inventory before re-scanning code — you're diffing against this, not starting from nothing.
3. Read `agent\octopus-agent-guidelines.md` (sibling file to this one) — the operational "how an
   Octopus agent uses this spec" layer. If your refresh changes the Tier 1/Tier 2 file structure,
   check whether its file-name references still resolve.
4. Check whether a changelog/refresh-log already exists in `v2\` or `agent\` from a prior refresh (if
   none exists yet, this is your first refresh since the original build — consider creating one, see
   "Leave a trail" below).

## Step 1 — re-scan ground truth (the actual code, not any doc)

- **Control registry**: `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\atlas-form-builder\src\controls\` —
  the real control-type source of truth. Get the current real list/count yourself; do not carry over
  the "115/113" numbers above without re-deriving them.
- **Top-level schema shape**: `C:\BizFirstGO_FI_AI\BizFirstAiStudio\src\atlas-forms\` and
  `...\atlas-forms-manager\` (the runtime/manager apps that actually consume the schema) — confirm
  `version`/`metadata`/`layout`/`sections[]`/`controls[]`/`apiActions[]` (note: it's `apiActions`, NOT
  `actions` — the original spec's own prose got this wrong once; re-verify it's still `apiActions` in
  case it's changed again, don't just copy this note forward blindly).
- **Backend persistence boundary**: `C:\BizFirstGO_FI_AI\BizFirstPayrollV3\src\mvc-server\AtlasForms\
  BizFirst.Atlas.Forms.Manager\BizFirst.Atlas.Forms.Manager.Domain\Entities\Form.cs` and `IFormService.cs`
  — only to confirm the `Schema` column's shape round-trips as expected. **Do not pull persistence/DB/
  audit-column content into the spec** — wrong audience. This spec is for an LLM deciding what schema
  JSON to emit, not a backend developer. (A companion implementation now exists —
  `BizFirst.Atlas.Forms.Extended.Services\IFormsExtendedService` — for granular control-level
  add/update/remove/reorder operations; that's a separate concern from this content-accuracy spec, but
  worth knowing it exists if a refresh ever needs to reconcile terminology with it.)
- **Regex-timeout enforcement** — find wherever this is actually enforced in code and confirm the real
  value (100ms as of the last build; the second stale spec claimed 5 seconds — this exact number is a
  known trap, re-verify it explicitly rather than assuming it hasn't changed).
- **RAG chunking mechanics**: `TextChopper.Chop()` in `BizFirst.Ai.Octopus.Abstraction`
  (`C:\BizFirstGO_FI_AI\BizFirstAI.V21\...`) — confirm the real chunking behavior is still fixed
  1024-character, word-boundary splitting, 12-word overlap, **with no awareness of file or markdown-
  header boundaries**. This is the technical justification for the Tier 2 consolidation strategy below
  — if this mechanism changes (e.g. a future RAG pipeline upgrade adds header-aware chunking), the
  consolidation strategy should be revisited, not assumed to still apply.

## Step 2 — diff against what's currently in `v2\`

For each real control type found in Step 1: is it already documented in `v2\controls\`? New → needs a
new entry. Removed from code → the doc entry should be removed too (don't leave stale entries "just in
case"). Properties changed → update the existing entry's property table and worked JSON example.

Also re-verify these specific "confirmed absent" claims from the last build, since code changes could
make either of them true again:
- `credential` control type.
- The old `showWhen` conditional-logic shorthand.

## Step 3 — apply the two-tier structure (do not flatten it)

**Tier 1 — `00-overview.md` + `01-common-properties.md`.** Small, meant to be always-injected/loaded
whole for any form-generation task (not retrieval-dependent) — this is what lets an agent generate a
brand-new form in one shot instead of needing N separate RAG retrievals just to learn what control
types exist. **Budget discipline is the real risk here as the control count grows**: the original
design target was under ~800 tokens for the overview's decision table alone. With 115+ real control
types, this was already under strain at the last build — if your refresh adds more controls, actively
manage this (tighter one-line descriptions, grouping related controls under one decision-table row with
a pointer to a Tier 2 index, etc.) rather than letting the file grow unchecked. If Tier 1 has drifted
past a size where it can genuinely still be "always injected cheaply," that's a real finding to flag in
your report, not something to silently accept.

**Tier 2 — `controls/*.md`, `validation-rules.md`, `conditional-logic.md`, `advanced-capabilities.md`,
`worked-examples/`.** Retrieved on demand. **Consolidate tightly-coupled, near-identical control
families into single cross-referenced files** rather than producing many near-duplicate stubs — this
was a deliberate adaptation to `TextChopper`'s lack of file/header-boundary awareness (many tiny
near-identical files don't retrieve better than one well-organized file under fixed-size chunking; they
just multiply near-duplicate content). The precedent examples from the last build: ~13 chart-type
controls consolidated into one file, 4 "pixel-identical" dev-tool viewer controls into another. Apply
the same judgment for any new near-identical families you find — but don't over-consolidate genuinely
distinct controls just because it's convenient; if in doubt, keep them separate and let a reviewer catch
over-consolidation.

## Step 4 — the "hidden features" pass (repeat every refresh, don't assume it's done once and stays done)

`advanced-capabilities.md` exists because Binoy explicitly flagged that surface-level control scanning
misses real, non-obvious capabilities. Re-check for: a plugin/extension registration mechanism (any way
to register a control type from outside the core `controls/` folder), computed/formula fields, custom
validators beyond the standard rule vocabulary, custom renderers or field-level lifecycle hooks, dynamic
API-backed options for select/radio, and anything else that reads as "advanced" relative to the basic
property-table-per-control-type content. If a prior refresh already found and documented something
here, re-verify it's still accurate rather than trusting it forward — code changes could add, remove, or
change any of these. If you search thoroughly and find nothing new or changed, say so explicitly in your
report rather than silently leaving the file untouched with no confirmation it was checked.

## Step 5 — compactness and audience discipline (unchanged from the original build)

Tables over prose. No persistence/DB/audit-column content. No API-endpoint documentation. This spec's
only audience is an LLM deciding what schema JSON to emit.

## Step 6 — independent review, every time, not optional

**Do not treat your own refresh as verified just because you wrote it carefully.** The original v2
build was reviewed by a separate, independent agent that was explicitly told not to trust the builder's
self-report and to re-verify claims against real code itself — that review caught real issues a
self-review would have missed. Every refresh should get the same treatment: after finishing, request
(or if you're already the orchestrator, dispatch) a fresh, independent reviewer agent with a similarly
skeptical brief — spot-check a representative sample of changed/new files against real code, verify
Tier 1's size budget, check internal cross-references still resolve, and confirm the hidden-features
pass was genuinely done, not just present as a file. Do not skip this step because a refresh feels
smaller/lower-risk than the original build — the whole reason v2 exists is that unverified spec content
silently drifts from reality.

## Leave a trail — make the NEXT refresh cheaper

After a refresh, append a dated entry to a changelog (create `v2\CHANGELOG.md` if none exists yet)
noting: what changed in the real code since the last refresh, which files you added/updated/removed,
the current verified control-type count, and anything you found still-accurate-but-worth-re-checking-
next-time versus anything you found had silently drifted. A future refresh should be able to read this
changelog plus Step 0 above and know roughly how much re-verification is actually needed, rather than
re-deriving everything from zero every single time.

## Constraints (binding, same as the original build)

- Documentation only — do not modify any Atlas Forms code as part of a spec refresh.
- Do not commit or push anything without being explicitly asked in that specific request.
- Ground every claim in real, currently-read code — not in this file's own numbers, not in `v2\`'s
  existing content, not in any other doc. This file tells you *where to look and what to watch for*; it
  is not itself a source of current truth about Atlas Forms.
