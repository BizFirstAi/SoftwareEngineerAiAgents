# Memory Types: Semantic, Episodic, Procedural

Each RougeNote has a **NoteType** that describes the kind of memory being stored. Choose the right type so agents can retrieve and apply memories correctly.

## Semantic Memory

**What:** Facts, definitions, rules, patterns, domain knowledge that don't change.

**When to use:**
- Coding standards ("ID not Id", uppercase naming)
- Architecture rules ("Octopus.Core never references PayrollV3 service projects directly")
- Domain definitions ("What is a RougeNote?")
- Requirements that must always apply

**Examples:**

| Title | Content | Why Semantic |
|-------|---------|-------------|
| Naming Convention: Identifiers | Use "ID" (uppercase), never "Id". Apply everywhere: variables, parameters, tuple members, DB columns. | Unchanging rule for all code |
| Database Constraints | Every table must include: Deleted, Archived, LastModifiedOn/By, CreatedOn/By, SourceAppID, ClientAccountID, AppDomainID, DataDomainID, DataSegmentID, TenantID, ResID. | Permanent schema requirement |
| Repository Pattern | Use `IRepository<TEntity, TKey>` for all data access. Never direct DbContext access in services. | Architectural pattern |
| Widget Types in App Studio | 17 widget types available: Form, Content, Chat Panel, Page Navigation, Workflow Agent, galleries, media players, etc. | Domain knowledge reference |

**How agents use it:**
- Look up during code generation to validate naming
- Check before creating database columns
- Reference when designing APIs

---

## Episodic Memory

**What:** Events, interactions, session history, decisions made, what happened and when.

**When to use:**
- User preferences learned during interaction ("prefers X over Y")
- Past decisions ("we chose bundled PR instead of splitting")
- Session context ("user working on refactoring FormDeveloper")
- Lessons learned ("mock/prod divergence caused migration failure")

**Examples:**

| Title | Content | Why Episodic |
|-------|---------|-------------|
| User Prefers Single Bundled PRs | During refactor of AppStudio, user chose one bundled PR over many small ones. Avoid splitting this type of change in future. | Learned preference during specific session |
| Past Incident: Mock DB Divergence | Last quarter, mocked tests passed but prod migration failed. Integration tests must hit real database, not mocks, for this team. | Incident lesson for future decisions |
| Widget Test Plan Created | Michael Jackson site comprehensive test plan created. Use as template for similar projects. | Historical artifact/decision |
| User Skill Context | User has 10 years Go experience, new to React. Explain frontend concepts in terms of backend analogues. | Session-specific user context |

**How agents use it:**
- Retrieve when making design decisions ("have we tried this before?")
- Apply user preferences to current task
- Learn from past failures to avoid regression

---

## Procedural Memory

**What:** Workflows, step-by-step procedures, best practices, how-to guides, "do this way" instructions.

**When to use:**
- Build/deployment steps ("always build incrementally with -m:2")
- Testing workflows ("integration tests run before unit tests")
- Creation procedures ("create app: project → app → pages → widgets")
- Common operations ("how to soft delete a record")

**Examples:**

| Title | Content | Why Procedural |
|-------|---------|-------------|
| .NET Build Procedure | Always build incrementally: `dotnet build -m:2`. Cap MSBuild parallelism to 2 to avoid memory issues on shared machines. Never clean/rebuild. | Step-by-step build instruction |
| Create Form End-to-End | 1. Define entity model 2. Create form controls (65+ types available) 3. Add validation rules 4. Test end-to-end with search+edit form 5. Deploy | Complete workflow |
| Commit Workflow | Stage specific files (not `git add .` to avoid secrets). Review staged changes. Write message describing WHY. Create new commit, never amend. End with Co-Authored-By attribution line. | Procedural steps for consistent commits |
| Soft Delete Pattern | Set Deleted=true on entity, don't remove record. Query filters: `!e.Deleted`. Archive separately with Archived=true for historical records. | How-to for common operation |

**How agents use it:**
- Follow step-by-step guides for complex tasks
- Apply procedures consistently across sessions
- Reference when implementing similar features

---

## Choosing the Right Type

| Question | Type | Example |
|----------|------|---------|
| Is this a permanent rule or definition? | **Semantic** | "Use uppercase ID" |
| Did this happen to a user or team? | **Episodic** | "User prefers bundled PRs" |
| Is this a how-to or workflow? | **Procedural** | "Steps to build .NET" |

---

## Storage Format

```json
{
  "Title": "Name of the memory",
  "Note": "Full content/definition/workflow steps",
  "NoteType": "Semantic|Episodic|Procedural",
  "NoteCategory": "RogueAgentMemory",
  "Status": "Active|Archived",
  "TenantID": "from JWT claim"
}
```

---

See [API Reference](02-api-reference.md) for endpoint details.
