# Agent Integration: How to Use Rouge

Guide for AI agents (AppDeveloper, FormDeveloper, WorkflowDeveloper, Testers) to store and retrieve memories using Rouge.

## Workflow: Store a Memory

When a user asks you to "remember" something or enforce a behavior, store it as a RougeNote:

1. **Ask permission** — "I'll save this to agent memory (Rouge) for future sessions"
2. **Classify** — Choose NoteType (Semantic/Episodic/Procedural)
3. **Store** — POST to /api/rouge-notes
4. **Confirm** — "Saved: [title]"

### Example

**User:** "Don't mock the database in these tests — we got burned last quarter"

**Agent steps:**
1. Recognize → Episodic memory (past incident, cautionary tale)
2. Store → POST /api/rouge-notes
   ```json
   {
     "title": "Mock Database Divergence Risk",
     "note": "Integration tests must hit a real database, not mocks. Last quarter, mocked tests passed but prod migration failed. Critical lesson: mock/prod divergence can hide broken migrations.",
     "noteType": "Episodic",
     "noteCategory": "RogueAgentMemory",
     "status": "Active"
   }
   ```
3. Confirm → "Saved: Mock Database Divergence Risk. Will apply this to test design going forward."

---

## Workflow: Retrieve and Apply Memories

Before starting a task, retrieve relevant memories:

### Query for Rules (Semantic)
```
GET /api/rouge-notes?noteType=Semantic&status=Active
```
Apply to: code generation, naming, architecture decisions.

**Agent use:**
> "Before generating code, I'll check Semantic memories for naming rules, database constraints, and architectural patterns."

### Query for User Preferences (Episodic)
```
GET /api/rouge-notes?noteType=Episodic&status=Active
```
Apply to: design decisions, workflow choices, what user has tried before.

**Agent use:**
> "Should I split this into multiple PRs? Let me check if user prefers bundled vs. separate PRs."

### Query for Procedures (Procedural)
```
GET /api/rouge-notes?noteType=Procedural&status=Active
```
Apply to: workflows, build steps, creation procedures.

**Agent use:**
> "When building .NET, I'll retrieve the build procedure to ensure I use -m:2 and build incrementally."

---

## Memory Retrieval Priority

Agents should retrieve memories in this order:

1. **User-specific** (TenantID + UserID + Active)
   ```
   GET /api/rouge-notes?status=Active
   ```
   Most relevant, personal preferences.

2. **Common/Shared** (TenantID + UserID=1 + Active)
   ```
   GET /api/rouge-notes?status=Active&userID=1
   ```
   Defaults, organization standards.

User-specific memories override shared ones.

---

## Best Practices

### ✓ DO
- Ask permission before storing memory
- Be specific in titles (e.g., "Naming Convention: Identifiers", not "Naming")
- Include context in episodic memories ("why" and "when")
- Group related memories (use same title prefix: "Database Constraint: ...", "Database Pattern: ...")
- Archive old memories instead of deleting
- Reference stored memories in conversation ("As noted in your previous preference...")

### ✗ DON'T
- Store ephemeral task details ("this PR", "this session")
- Assume memories are permanent (check Status=Active)
- Store contradictory memories without archiving old versions
- Clutter with low-value notes ("user said hello")
- Forget to retrieve before deciding ("have we done this before?")

---

## Common Agent Patterns

### Pattern: Code Generation with Rules

```
1. Retrieve Semantic memories (rules, patterns)
2. Check naming conventions, architecture constraints
3. Generate code following stored rules
4. Reference rules in comments ("Per naming rule: use ID, not Id")
5. If unsure about rule, store new Semantic memory
```

### Pattern: Workflow Decision

```
1. Retrieve Episodic memories (user preferences, past decisions)
2. Apply user's preferred approach (e.g., bundled vs. split)
3. If trying new approach, store as Episodic
4. If user confirms approach, update Status/note for future reference
```

### Pattern: Complex Task

```
1. Retrieve Procedural memories (step-by-step guides)
2. Follow stored procedure exactly
3. If procedure is outdated, archive old + create new version
4. If user suggests improvement, update Procedural note
```

---

## Lifecycle: Archiving Old Memories

When a memory becomes outdated or superseded:

1. **Create new memory** with updated content
2. **Archive old memory** → PATCH status="Archived"
3. **Note relationship** in both titles or notes

Example:
- **Old:** "App Studio: 10 Widget Types" → Status: Archived
- **New:** "App Studio: 17 Widget Types (updated 2026-09)" → Status: Active

---

## Multi-Agent Coordination

Agents share memories via TenantID isolation:

- **AppDeveloper** stores app patterns → **AppTester** retrieves and validates
- **FormDeveloper** stores form procedures → **FormTester** retrieves and tests
- **WorkflowDeveloper** stores workflow patterns → **WorkflowTester** retrieves and validates

All agents access the same TenantID memories, enabling consistent cross-agent workflows.

---

See [Implementation](04-implementation.md) for technical details on the RougeNote entity and database schema.
