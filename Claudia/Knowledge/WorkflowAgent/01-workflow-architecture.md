# Workflow Architecture

## Core Concepts

### Workflow
- **Definition:** Ordered sequence of ExecutionNodes with transitions between them
- **Scope:** Single tenant, versionable, deployable automation
- **Metadata:** ID, name, description, version, status (draft/active/archived), created/modified timestamps
- **Execution:** Triggered manually, via webhook, on schedule, or via event

### ExecutionNode
- **Definition:** Atomic unit within a workflow — a single action, decision, or integration
- **Types:** 107 types categorized as Triggers, Control Flow, AI, Integrations, Data operations
- **Configuration:** Operation-specific form fields, data templates, credentials, error handling
- **Execution:** Synchronous or asynchronous depending on node type

### Transitions
- **Definition:** Directed edge between nodes with optional conditions
- **Types:** Unconditional (always proceed), Conditional (based on node output/expression), Error paths
- **Output:** Nodes produce output (success data, error, etc.) that feeds into next node's input

### Data Flow
```
Workflow Input → Trigger Node → [Sequential Nodes] → Transitions → Final Output
                                    ↓
                            [Decision Branches]
                                    ↓
                            [Parallel Execution]
                                    ↓
                            [Loop Iterations]
```

## Execution Model

### Workflow Lifecycle
1. **Create** → Define nodes and transitions in MCP server
2. **Configure** → Set up node operations, data templates, credentials
3. **Draft** → Save as editable version
4. **Test** → Validate execution path and data transformations
5. **Deploy** → Publish/activate workflow
6. **Execute** → Run triggered by external event (manual, schedule, webhook, event)
7. **Monitor** → Track execution logs, performance metrics, errors
8. **Iterate** → Fix issues or enhance based on real-world execution

### Execution States
- **Pending** — Waiting to start (scheduled or queued)
- **Running** — Currently executing
- **Paused** — Awaiting human input (approval, HIL) or external event
- **Completed** — Finished successfully
- **Failed** — Stopped due to error (unhandled exception, timeout, missing credential)

### Error Handling
- **Try/Catch/Finally** — Node-level error boundaries
- **Error Paths** → Transitions to error handler nodes from failed nodes
- **Retry** → Auto-retry with backoff (configurable per node)
- **Timeout** → Max duration before node execution fails
- **Fallback** → Alternative node sequence if primary fails

## Node Categories

### Triggers (Workflow Entry Points)
- **manual-trigger** — API/UI invocation
- **webhook-trigger** — HTTP POST webhook
- **schedule-trigger** — Cron schedule
- **event-trigger** → External event stream

### Control Flow (Logic & Branching)
- **if-condition** — Binary branch (true/false)
- **switch** — Multi-way branch
- **loop** — Iterate over data
- **parallel-fork/join** — Concurrent execution
- **sub-workflow** — Nested workflow invocation

### AI & Agents
- **ai-agent** — Call existing Octopus agent (one-shot or chat)
- **flow-ai-agent** — Self-contained LLM agent with tools
- **ai-function** — Call specific tool/function on tool server

### Integrations
- **http-request** — Generic HTTP/REST API calls
- **email-smtp/gmail** — Email delivery
- **slack** — Slack bot integration
- **odoo** — Odoo ERP connector
- **elasticsearch** — Search/index operations
- [And 80+ more services...]

### Data Operations
- **code-execute** — Run sandboxed script
- **delay** — Pause execution
- **data-mapping** — Transform data structure
- **variable-assignment** — Set workflow variables

## Data Templates

Each node operation has a **data template** — JSON schema defining:
- **Input fields** → What data the node accepts
- **Output schema** → What data the node produces
- **Validation rules** → Required fields, type constraints, ranges
- **Transformation** → How input maps to operation parameters

Templates ensure type safety and prevent invalid configurations.

## Variables & Scope

- **Workflow variables** → Accessible across all nodes in the workflow
- **Node output** → Available to downstream nodes via reference syntax
- **Context variables** → Workflow/execution metadata (execution ID, timestamp, tenant ID)
- **Credential references** → Secure references to stored credentials (never exposed)

## Multi-Tenancy

- **Tenant isolation** → Each workflow scoped to single tenant
- **Credential isolation** → Credentials never shared across tenants
- **Execution logs** → Tenant-scoped, not visible to other tenants
- **Rate limiting** → Per-tenant workflow execution limits

## MCP Integration

WorkflowAgent uses **Flow Workflow MCP Server** for:
- Create/update/delete workflows
- Add/configure/delete nodes
- Manage transitions and data templates
- Deploy/activate workflows
- Query execution history

See [MCP Server Reference](06-mcp-server-reference.md) for tool details.

## Performance Considerations

- **Sequential execution** → Default; each node waits for previous completion
- **Parallel execution** → Fork/join for concurrent branches
- **Async operations** → Long-running integrations (HTTP, email) don't block
- **Loop optimization** → Large iterations (>1000) may impact performance
- **Timeout defaults** → 5min standard; configurable per node

## Related Systems

- **ExecutionNodes** → Octopus runtime executing nodes
- **Octopus Agents** → AI agents callable from workflows
- **Tool Servers** → External services providing tools/integrations
- **Credentials Service** → Manages encrypted credentials
- **Process Studio** → Legacy process automation (being replaced by Flow Studio)
