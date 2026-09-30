# Rouge: Agent Memory System

**Purpose:** Persistent knowledge store for AI agents across sessions. Enables agents to remember user preferences, workflows, domain facts, and interaction history.

## What Is Rouge?

Rouge is a **multi-tenant, persistent memory service** built into BizFirst. Agents store and retrieve memories as **RougeNotes** — structured records with type, category, and status.

- **Service Location:** BizFirstPayrollV3/src/mvc-server/Ai/Rouge
- **Database:** Rouge_Notes table (multi-tenant, soft-delete compliant)
- **Access:** REST APIs + Service layer integration

## Key Concepts

### Memory Types (NoteType)
- **Semantic** — Facts, definitions, patterns, domain knowledge
- **Episodic** — Events, interactions, session history, what happened
- **Procedural** — Workflows, steps, best practices, how-to guides

### Standard Fields
| Field | Value | Purpose |
|-------|-------|---------|
| NoteCategory | RogueAgentMemory | Isolates agent memory from other use cases |
| Status | Active / Archived | Control visibility and retrieval |
| TenantID | ← from JWT | Multi-tenant isolation |

## Use Cases

### Agent Learning
> "User prefers single bundled PRs over many small ones" → **Episodic**, Status=Active  
> Result: Agent remembers for future code reviews in this session's tenant

### Domain Knowledge
> "Use ID (uppercase), never Id, for all identifiers" → **Semantic**, Status=Active  
> Result: Agent references when naming variables, parameters, DB columns

### Workflow Automation
> "Always build incrementally with -m:2 for .NET" → **Procedural**, Status=Active  
> Result: Agent follows when executing dotnet build commands

## Who Uses It?

- **AppDeveloper, FormDeveloper, WorkflowDeveloper** — Store design decisions, patterns
- **Testers** — Remember failure cases, edge cases, regression risks
- **Any AI Agent** — Access shared knowledge (user memories + common memories)

## Memory Retrieval

Agents retrieve memories in this order:
1. **User-specific** — Tenant + UserID + Active status
2. **Common/Shared** — Tenant + UserID=1 + Active status

This allows global defaults (UserID=1) to be overridden by personal preferences.

## Related Documentation
- [Memory Types](01-memory-types.md) — Detailed definitions and examples
- [API Reference](02-api-reference.md) — REST endpoints and payloads
- [Agent Integration](03-agent-integration.md) — How agents use Rouge
- [Implementation](04-implementation.md) — Database schema, entity structure
