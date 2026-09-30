# Rouge Agent Memory System — Knowledge Base

Complete reference for building, storing, and retrieving agent memories using Rouge.

## Quick Start

**First time?** Start here:
1. [00-overview.md](00-overview.md) — What is Rouge? Why use it?
2. [01-memory-types.md](01-memory-types.md) — Semantic vs. Episodic vs. Procedural
3. [03-agent-integration.md](03-agent-integration.md) — How agents use it

**Need technical details?**
- [02-api-reference.md](02-api-reference.md) — REST endpoints and payloads
- [04-implementation.md](04-implementation.md) — Database schema, validation, DI

---

## Core Concepts

### What Is Rouge?
**Persistent memory service for AI agents** across sessions. Agents store and retrieve memories as **RougeNotes** — structured records with type, category, and status.

### Memory Types (NoteType)

| Type | Use Case | Example |
|------|----------|---------|
| **Semantic** | Facts, rules, patterns, domain knowledge | "Use uppercase ID, never Id" |
| **Episodic** | Events, interactions, user preferences | "User prefers bundled PRs" |
| **Procedural** | Workflows, steps, how-to guides | "Build with -m:2 for .NET" |

### Standard Fields

```json
{
  "Title": "...",
  "Note": "...",
  "NoteType": "Semantic|Episodic|Procedural",
  "NoteCategory": "RogueAgentMemory",
  "Status": "Active|Archived",
  "TenantID": "from JWT"
}
```

---

## File Navigation

### 📖 Overview & Concepts
- **[00-overview.md](00-overview.md)**
  - What is Rouge?
  - Key concepts and use cases
  - Who uses it and why
  - Related documentation links

### 💡 Memory Types (Definition & Examples)
- **[01-memory-types.md](01-memory-types.md)**
  - Semantic memory — definitions and examples
  - Episodic memory — interactions and lessons learned
  - Procedural memory — workflows and guides
  - How to choose the right type
  - Storage format reference

### 🔌 API Reference
- **[02-api-reference.md](02-api-reference.md)**
  - REST endpoints (CREATE, READ, SEARCH, UPDATE, DELETE)
  - Request/response formats with examples
  - Query parameters and filters
  - Common queries
  - Error handling

### 🤖 Agent Integration (How-To)
- **[03-agent-integration.md](03-agent-integration.md)**
  - Workflow: store a memory
  - Workflow: retrieve and apply memories
  - Memory retrieval priority (user-specific vs. shared)
  - Best practices (do's and don'ts)
  - Common agent patterns
  - Multi-agent coordination
  - Memory lifecycle (archiving)

### 🛠️ Implementation (Technical Details)
- **[04-implementation.md](04-implementation.md)**
  - Project structure
  - RougeNote entity definition
  - Database schema with indexes
  - Constants (NoteType, NoteCategory, Status)
  - Validation rules (Fluent validation)
  - Dependency injection setup
  - Multi-tenancy isolation
  - Known issues (Status column)

---

## Common Workflows

### I want to store a memory
1. Read: [01-memory-types.md](01-memory-types.md) — Choose type
2. Read: [02-api-reference.md](02-api-reference.md) — See POST endpoint
3. Follow: [03-agent-integration.md](03-agent-integration.md) — Store workflow

### I want to retrieve memories
1. Read: [03-agent-integration.md](03-agent-integration.md) — Retrieval priority
2. Read: [02-api-reference.md](02-api-reference.md) — See GET/search endpoints

### I'm building an agent that uses Rouge
1. Read: [00-overview.md](00-overview.md) — Understand purpose
2. Read: [03-agent-integration.md](03-agent-integration.md) — Common patterns
3. Reference: [02-api-reference.md](02-api-reference.md) — API details

### I need to implement or fix Rouge
1. Read: [04-implementation.md](04-implementation.md) — Full technical spec
2. Check: [02-api-reference.md](02-api-reference.md) — Expected behavior
3. Reference: [01-memory-types.md](01-memory-types.md) — Validation rules

---

## Key Rules

✓ **NoteType** must be one of: Semantic, Episodic, Procedural  
✓ **NoteCategory** must be: RogueAgentMemory  
✓ **Status** must be one of: Active, Archived  
✓ **Title** max 200 chars (required)  
✓ **Note** max 10,000 chars  
✓ **TenantID** auto-populated from JWT claim  
✓ **Soft delete** — Status is !Deleted, not physically removed  

---

## Related Documentation

- **Procedure Guide** — [Rouge_Notes.md](../../Procedure/General/Rouge_Notes.md)
- **Backend Source** — BizFirstPayrollV3/src/mvc-server/Ai/Rouge/
- **Agent Specs** — [AppDeveloper](../../Agents/Builders/AppDeveloper/AGENT.md), [FormDeveloper](../../Agents/Builders/FormDeveloper/AGENT.md), [WorkflowDeveloper](../../Agents/Builders/WorkflowDeveloper/AGENT.md)

---

## Quick Reference: API Endpoints

```bash
# Create memory
POST /api/rouge-notes
Body: { "title": "...", "note": "...", "noteType": "Semantic", "noteCategory": "RogueAgentMemory", "status": "Active" }

# Get all Semantic memories
GET /api/rouge-notes?noteType=Semantic&status=Active

# Get all Episodic memories
GET /api/rouge-notes?noteType=Episodic&status=Active

# Get all Procedural memories
GET /api/rouge-notes?noteType=Procedural&status=Active

# Get specific memory
GET /api/rouge-notes/{id}

# Update memory
PATCH /api/rouge-notes/{id}
Body: { "title": "...", "status": "Archived" }

# Archive memory
PATCH /api/rouge-notes/{id}
Body: { "status": "Archived" }

# Soft delete memory
DELETE /api/rouge-notes/{id}
```

---

**Last Updated:** 2026-09-29
