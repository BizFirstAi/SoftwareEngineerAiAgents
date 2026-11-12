# WorkflowAgent Knowledge Base

Complete reference for building, testing, and maintaining Flow Studio workflows.

## Navigation

### Core Concepts (Start Here)
1. **[00-overview.md](00-overview.md)** — WorkflowAgent role, key concepts, lifecycle
2. **[01-workflow-architecture.md](01-workflow-architecture.md)** — Workflow structure, execution model, data flow

### Reference
3. **[02-node-types.md](02-node-types.md)** — All 18+ documented node types with quick reference table
4. **[03-execution-flow.md](03-execution-flow.md)** — How workflows execute, error handling, debugging
5. **[04-integration-patterns.md](04-integration-patterns.md)** — Real-world integration scenarios, external systems
6. **[05-testing-guide.md](05-testing-guide.md)** — Testing strategies and procedures
7. **[06-mcp-server-reference.md](06-mcp-server-reference.md)** — MCP tools and API reference

## Quick Paths by Task

### I want to...

**Create a new workflow**
1. Read [00-overview.md](00-overview.md) for lifecycle
2. Use [06-mcp-server-reference.md](06-mcp-server-reference.md) `create_workflow` tool
3. See [Procedure/WorkflowAgent/01-create-basic-workflow.md](../../Procedure/WorkflowAgent/01-create-basic-workflow.md)

**Configure a specific node type**
1. Check [02-node-types.md](02-node-types.md) for available nodes
2. Look up the deeper per-node docs in [`nodes/`](nodes/) for the 18 documented types (full depth for `ai-agent`, `flow-ai-agent` — 6 sub-docs each)
3. Use [06-mcp-server-reference.md](06-mcp-server-reference.md) `configure_node` tool
4. See [Procedure/WorkflowAgent/02-add-execution-nodes.md](../../Procedure/WorkflowAgent/02-add-execution-nodes.md)

**Resolve a node's config FORM** (distinct from node execution — the designer-side `Atlas_Forms.PrimaryUsage`/Profile-tier resolution pipeline)
1. See [`node-forms/`](node-forms/) — `rag/form-resolution-pipeline.md`, `rag/profilename-to-form-contract.md`, `debug-runbook.md`, `fix-playbook.md`

**Handle errors and retries**
1. Read [03-execution-flow.md](03-execution-flow.md) — "Error Handling" section
2. See [Procedure/WorkflowAgent/05-test-workflow.md](../../Procedure/WorkflowAgent/05-test-workflow.md) for testing error paths

**Integrate external systems**
1. Read [04-integration-patterns.md](04-integration-patterns.md)
2. Look up node type in [02-node-types.md](02-node-types.md)
3. Check credentials in [Procedure/WorkflowAgent/](../../Procedure/WorkflowAgent/)
4. See [Procedure/WorkflowAgent/04-integrate-external-system.md](../../Procedure/WorkflowAgent/04-integrate-external-system.md)

**Test a workflow**
1. Read [05-testing-guide.md](05-testing-guide.md)
2. Follow [Procedure/WorkflowAgent/05-test-workflow.md](../../Procedure/WorkflowAgent/05-test-workflow.md)
3. Use [06-mcp-server-reference.md](06-mcp-server-reference.md) `execute_workflow` tool

**Deploy to production**
1. Ensure workflow passes validation in [05-testing-guide.md](05-testing-guide.md)
2. Follow [Procedure/WorkflowAgent/06-deploy-workflow.md](../../Procedure/WorkflowAgent/06-deploy-workflow.md)
3. Use [06-mcp-server-reference.md](06-mcp-server-reference.md) `deploy_workflow` tool

## Node Type Coverage

| Node | Documented | Reference |
|------|-----------|-----------|
| manual-trigger | ✓ | [02-node-types.md](02-node-types.md) |
| webhook-trigger | ✓ | [02-node-types.md](02-node-types.md) |
| schedule-trigger | ✓ | [02-node-types.md](02-node-types.md) |
| http-request | ✓ | [02-node-types.md](02-node-types.md), [04-integration-patterns.md](04-integration-patterns.md) |
| if-condition | ✓ | [02-node-types.md](02-node-types.md) |
| switch | ✓ | [02-node-types.md](02-node-types.md) |
| loop | ✓ | [02-node-types.md](02-node-types.md) |
| delay | ✓ | [02-node-types.md](02-node-types.md) |
| parallel-fork | ✓ | [02-node-types.md](02-node-types.md) |
| parallel-join | ✓ | [02-node-types.md](02-node-types.md) |
| sub-workflow | ✓ | [02-node-types.md](02-node-types.md) |
| code-execute | ✓ | [02-node-types.md](02-node-types.md) |
| ai-agent | ✓ | [02-node-types.md](02-node-types.md) |
| ai-function | ✓ | [02-node-types.md](02-node-types.md) |
| flow-ai-agent | ✓ | [02-node-types.md](02-node-types.md) |
| email-smtp | ✓ | [02-node-types.md](02-node-types.md) |
| email-gmail | ✓ | [02-node-types.md](02-node-types.md) |
| slack | ✓ | [02-node-types.md](02-node-types.md), [04-integration-patterns.md](04-integration-patterns.md) |
| odoo | ✓ | [04-integration-patterns.md](04-integration-patterns.md) |
| elasticsearch | ◐ | [04-integration-patterns.md](04-integration-patterns.md) |

**Not yet documented (89 more):** validation, variable-assignment, data-mapping, json-transform, Google Workspace, databases, blockchain, and others. See [02-node-types.md](02-node-types.md) "Not Yet Documented" section.

## Key Sections

### Execution & Debugging
- [03-execution-flow.md](03-execution-flow.md) — State machines, error handling, common issues
- [05-testing-guide.md](05-testing-guide.md) — Pre-deployment checklist, test procedures

### Integration & Real-World Usage
- [04-integration-patterns.md](04-integration-patterns.md) — HTTP, email, chat, database, ERP, AI patterns
- [06-mcp-server-reference.md](06-mcp-server-reference.md) — Complete API reference

### Per-Node Deep Reference (ported 2026-11-12)
- [nodes/](nodes/) — one file per node type beyond the `02-node-types.md` summary table, plus `nodes/ai-agent/` (conversation-scope, HIL features, invocation/agent resolution, prompt overrides, tool servers/LLM) and `nodes/flow-ai-agent/` (LLM/prompt, loop-and-memory, sql-agent, streaming-agent, tools) sub-docs
- [nodes/00-looping-patterns.md](nodes/00-looping-patterns.md) — cross-node looping patterns
- [Procedure/WorkflowAgent/add-new-node-type.md](../../Procedure/WorkflowAgent/add-new-node-type.md) · [build-and-verify-workflow-via-mcp.md](../../Procedure/WorkflowAgent/build-and-verify-workflow-via-mcp.md)

### Node Config-Form Resolution (distinct topic from node execution above)
- [node-forms/](node-forms/) — the `Atlas_Forms.PrimaryUsage`/Profile-tier/`Template_DataTemplates` resolution pipeline, `debug-runbook.md`, `fix-playbook.md`, `audit/`, `lessons/`

### MCP Design/Architecture Series (distinct from the 06 reference doc)
- [mcp-design/](mcp-design/) — cross-tenant auth, write-tool authorization, agent-teams, Octopus MCP integration, servers-mcp design docs

### Standalone Reference
- [flow-webhooks-rag.md](flow-webhooks-rag.md) · [known-servers.md](known-servers.md) · [workflow-creation-rag-design.md](workflow-creation-rag-design.md) · [workflow-nodes-ingestion.md](workflow-nodes-ingestion.md)

### Procedures
- [Procedure/WorkflowAgent/](../../Procedure/WorkflowAgent/) — Step-by-step guides for all common tasks

## Architecture Overview

```
Workflow (orchestration)
  ├── Trigger (manual/webhook/schedule/event)
  ├── ExecutionNodes (25+ types)
  │   ├── Control Flow (if/switch/loop/parallel)
  │   ├── Integrations (HTTP/email/Slack/Odoo/etc)
  │   └── AI (flow-ai-agent, ai-agent, ai-function)
  ├── Transitions (conditional/unconditional)
  └── Error Handling (try/catch/finally, error paths)

MCP Server: BizFirst.Ai.Mcp.Tools.Workflow
  ├── Workflow management (create/update/deploy)
  ├── Node management (add/configure/delete)
  └── Transition management (add/update/delete)
```

## Common Patterns

### Sequential Pipeline
Trigger → Fetch Data → Transform → Store → Notify

### Conditional Processing
Trigger → Validate → [If Valid → Process | If Invalid → Error Handler]

### Parallel Operations
Trigger → Fork → [Task1, Task2, Task3] → Join → Finalize

### Loop with Integration
Trigger → Loop Items → HTTP Request (per item) → Aggregate → Send Report

### Human-in-the-Loop
Trigger → AI Analysis → Slack (request decision) → Wait → Process Approval

## Troubleshooting

**Workflow won't deploy?**
→ Use [06-mcp-server-reference.md](06-mcp-server-reference.md) `validate_workflow` to identify errors

**Node not executing?**
→ Check transitions in [03-execution-flow.md](03-execution-flow.md) "Execution States"

**Data not flowing correctly?**
→ Inspect node outputs in [05-testing-guide.md](05-testing-guide.md) "Execution Test Procedure"

**External integration failing?**
→ Review [04-integration-patterns.md](04-integration-patterns.md) "Error Recovery Patterns"

**Performance slow?**
→ See [03-execution-flow.md](03-execution-flow.md) "Performance Optimization"

## Related Knowledge

- **[Knowledge/Notes](../Notes/)** — Rouge agent memory system
- **[Knowledge/Credentials](../Credentials/)** — Credential types and management
- **[Knowledge/Servers](../Servers/)** — Workflow execution infrastructure
- **[Agents/Testers/WorkflowTester](../../Agents/Testers/WorkflowTester/AGENT.md)** — Testing workflows

## Updates

- **2026-09-29** — Reorganized as dedicated WorkflowAgent knowledge base
- **2026-08-20** — Node type documentation based on ExecutionNode source code
- **2026-07-15** — MCP server design finalized
