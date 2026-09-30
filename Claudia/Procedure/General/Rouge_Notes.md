# Rouge Notes Agent Memory System

**Purpose:** Persistent memory for AI agents across sessions via Rouge_Notes MCP server.

## Memory Types (NoteType)
- **Semantic** — Facts, definitions, domain knowledge, patterns
- **Episodic** — Events, interactions, session history
- **Procedural** — Workflows, steps, best practices, how-to guides

## Standard Fields
| Field | Value |
|-------|-------|
| NoteCategory | RogueAgentMemory |
| Status | Active |
| UserID | 1 (common) or specific user |

## Usage
1. User asks to memorize or enforce a behavior
2. Fetch existing memory for user and common user (ID=1)
3. Store as appropriate NoteType with RogueAgentMemory category
4. Retrieve when relevant to current task

## Examples
- **Semantic:** "Use ID (uppercase), never Id" → NoteType: Semantic
- **Procedural:** "Always build incrementally with -m:2" → NoteType: Procedural
- **Episodic:** "User prefers single bundled PRs" → NoteType: Episodic