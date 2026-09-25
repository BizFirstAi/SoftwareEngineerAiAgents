# Octopus Agent Guidelines — Atlas Forms

How an Octopus AI agent should use the Atlas Forms RAG spec (this `v2/` directory) and the 8 Atlas
Forms MCP tools to generate and edit forms. This is the "how to think and act" layer. For tool
signatures, DTOs, memory design, and concurrency mechanics, see
`Documentation\Employees\agentic-coding\bizfirst-ai-mcp-servers-spec\atlas-forms-design.md` — this
doc does not re-litigate any decision made there, only operationalizes it.

**Note on sibling files:** as of this writing the sibling control-type reference files
(`00-overview.md`, `01-common-properties.md`, `controls/{type}.md`, `validation-rules.md`,
`conditional-logic.md`, `worked-examples/`) had not yet landed in this directory — they are written
by a separate pass. This document is authoritative against that *intended* structure regardless of
landing order; file-naming references below should be treated as the target layout, not a confirmed
listing.

## 1. Retrieval tiers — when to pull what

| Tier | Files | When loaded | Purpose |
|---|---|---|---|
| **Tier 1** | `00-overview.md`, `01-common-properties.md` | **Always in context** at the start of ANY form-building task — new form, or first touch of an existing form this session. Statically injected, not retrieved. | Breadth: control-type catalogue + shared properties, so the agent never needs N retrievals just to learn what exists. |
| **Tier 2** | `controls/{type}.md`, `validation-rules.md`, `conditional-logic.md`, `worked-examples/` | **On demand only** — once the agent has narrowed to a specific control type (or is choosing between 2-3 candidates), or needs deep detail on validation or conditional-logic behavior. | Depth: exact property shape, JSON examples, edge cases for the thing actually being built right now. |

Rules of thumb:
- Never pull a Tier 2 control file "just in case." Pull it when a specific control is about to be
  added/edited, or when narrowing between a short list of candidates (e.g. `select` vs `radio` vs
  `checkbox` for a multi-choice field).
- Building a form with 8 different control types is 8 targeted Tier 2 pulls, not one bulk pull of
  every `controls/*.md` file.
- `validation-rules.md` / `conditional-logic.md` are pulled the moment the user's request involves
  validation constraints or a show/hide-based-on-another-field rule — not upfront.
- If Tier 1 alone is enough to answer (e.g. "what control types do you support?"), stop there.

## 2. The two-phase flow — operational checklist

### Phase 1 — initial creation (new form)

1. Gather requirements via conversation only. **No tool calls in this phase.**
2. Pull Tier 2 control files as needed while proposing fields, to get properties right.
3. Iterate the proposed structure with the user until they explicitly approve it.
4. Only after approval: build the complete schema JSON in-context and call `create_form` **exactly
   once** with the full schema.
5. Return the resulting `FormID` and the `/design/{FormID}` URL to the user.

**Never:** loop `add_form_control` once per field during initial creation. If you catch yourself
about to call a control-mutation tool before `create_form` has ever been called for this form,
stop — you are still in Phase 1.

### Phase 2 — view/feedback/edit loop (existing form, any subsequent touch)

Trigger: the user has seen the form (via the URL) and gives feedback, OR the agent is editing a
form that was NOT just created in this same turn.

1. Identify the target `FormID` (see Section 3 if ambiguous).
2. Call `get_form_schema(formId)` **first, always** — re-ground against actual current
   server-side state before reasoning about the edit. Do this even if the schema was already
   fetched earlier in the conversation; state may have drifted (human edited via the UI directly).
3. Pull the relevant Tier 2 control file if the edit involves a control type not already
   well-understood from Tier 1.
4. Make **exactly one** targeted tool call per user request: `add_form_control`,
   `update_form_control`, `remove_form_control`, or `reorder_form_controls`.
5. If the user's message bundles multiple distinct edits ("add phone, remove middle name, move
   email above phone"), make one tool call per distinct edit, in order — still not a full-schema
   resubmission, just multiple single-intent calls back to back.

**Never:** skip `get_form_schema` before an edit because you remember the schema from earlier in
the conversation. **Never:** resubmit the whole schema (`create_form` again, or hand-building the
full control array) for a single-field change — that is exactly the whole-blob-PATCH failure mode
the granular tools exist to avoid.

## 3. Multi-form conversation tracking

`formsInThisConversation` (list of `{FormID, Name, lastTouchedAt}`) and `activeFormId` are
maintained automatically by Octopus's memory hooks — the agent does not write these itself and
does not need to remember to persist anything. They are auto-injected into context on every LLM
turn.

What the agent DOES have to do is reason about which form a request targets:

- **Only one form touched so far, or the request clearly matches one by name** → proceed against
  that form (or `activeFormId`), no need to ask.
- **Two or more forms touched in this conversation AND the request doesn't name one** → **ask the
  user which form**, do not guess and do not default silently to `activeFormId`. Ambiguity is a
  reasoning problem the tool schema cannot enforce for you.
- **Resuming a past conversation that touched multiple forms** → surface what you have (the stored
  list) rather than silently assuming only one form exists.
- A request that clearly introduces a new form ("now also build a shipping address form") starts a
  fresh Phase 1, even while another form is still "active" — don't fold new-form requests into an
  edit of the active form.

## 4. Failure and guardrail handling

| Situation | Agent action |
|---|---|
| User asks for a control type not in the Tier 1 catalogue | Do **not** fabricate a plausible-sounding type. State it isn't supported, offer the closest real match from the catalogue, let the user choose. |
| `add_form_control` rejected — duplicate control `id`/key | Don't retry with the same key. Pick a distinct key (or ask the user to disambiguate if the collision implies a naming conflict in intent, e.g. two "email" fields) and retry. |
| Mutation rejected — `ConcurrencyConflict` (`LastModifiedOn` mismatch) | Someone (possibly the user, via the UI) changed the form concurrently. Do not force-overwrite. Re-fetch via `get_form_schema` (the conflict response already carries the current schema — reuse it, no need for a second round trip), re-apply the intended edit against the current state, retry once. |
| Control removed that had dependents (`visibilityRule`/`fieldActions` referencing it) | No agent action needed — `remove_form_control` cleans up dangling conditional-logic references server-side automatically. Be aware it happens (a dependent rule may be downgraded or trimmed), but do not attempt to clean this up yourself. |
| `reorder_form_controls` rejected — key set mismatch | Re-fetch current control keys via `get_form_schema` rather than guessing what was missing/extra, then resubmit a complete, correct ordered list. |
| Any tool call fails for a reason not listed above | Surface the actual error to the user in plain terms; do not silently retry with fabricated/guessed values. |

## 5. Explicit anti-patterns

- Looping `add_form_control` once per field during initial bulk creation instead of one
  `create_form` call.
- Doing a whole-schema resubmission (`create_form` again, or hand-reconstructing the full control
  array) to make a single-field edit.
- Inventing control types or properties not present in Tier 1/Tier 2 spec files.
- Silently guessing which form an ambiguous request targets instead of asking.
- Skipping `get_form_schema` before an edit and relying on conversation memory of the schema — it
  can drift if a human edited the form via the UI between agent turns.
- Force-overwriting on a concurrency conflict instead of re-fetching and retrying.
- Pulling every Tier 2 `controls/{type}.md` file up front "to be safe" instead of on demand.

## 6. What good looks like — example trace

```
User: "Create a customer onboarding form."
Agent: [Tier 1 already in context] Asks: which fields — name, email, phone, address?
       Anything conditional (e.g. show company field only for business customers)?
User: [answers; agent proposes a field list, pulls controls/select.md and
       conditional-logic.md while shaping the "customer type" + conditional company field]
User: "Looks good, create it."
Agent: -> create_form(name, full schema)   [ONE call]
       Returns FormID + /design/{FormID} URL.
User: [opens the URL, comes back] "Add a phone field, and move email above phone."
Agent: -> get_form_schema(formId)          [re-ground first]
       -> add_form_control(formId, phone control, position)
       -> reorder_form_controls(formId, new order)
       [two distinct edits -> two targeted calls, no full resubmission]
```
