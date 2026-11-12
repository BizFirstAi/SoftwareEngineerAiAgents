# WorkflowAgent — Overview

**Role:** AI agent that builds Flow Studio workflows, automation, and execution nodes for BizFirst.

## What WorkflowAgent Does

- **Creates workflows** — Designs multi-step automations from user requirements
- **Configures nodes** — Sets up 25+ node types (triggers, actions, control flow, integrations)
- **Enables automation** — Schedules, webhooks, manual triggers, conditional branching
- **Integrates systems** — HTTP, email, Slack, Odoo, Elasticsearch, custom APIs
- **Handles AI agents** — Flow AI agents, conversation scopes, tool servers, LLM configuration
- **Tests workflows** — Validates end-to-end execution, debugging, error handling

## Key Concepts

| Concept | Definition |
|---------|-----------|
| **Workflow** | Orchestrated sequence of nodes representing an automation |
| **ExecutionNode** | Individual action (trigger, decision, integration, loop) within a workflow |
| **Trigger** | Entry point (manual, schedule, webhook, event) that starts workflow execution |
| **Transition** | Path between nodes, optionally conditional based on node output |
| **Loop** | Iterates node sequence over input data or time |
| **Parallel Fork/Join** | Concurrent node execution with synchronization |
| **Flow AI Agent** | LLM-powered node with access to tools and external services |

## Node Categories

- **Triggers** — Manual, Schedule, Webhook, Event
- **Control Flow** — If/Condition, Switch, Loop, Parallel Fork/Join, Sub-Workflow
- **AI** — Flow AI Agent, AI Agent, AI Function
- **Integrations** — HTTP Request, Email (SMTP/Gmail), Slack, Odoo, Elasticsearch
- **Data** — Code Execute, Delay
- **Connectors** — Custom integrations via webhook and tool servers

## Workflow Lifecycle

1. **Design** — Define nodes and transitions via MCP server
2. **Configure** — Set operation forms, data templates, node-specific settings
3. **Test** — Validate node execution, data flow, error paths
4. **Deploy** — Publish workflow to activate
5. **Monitor** — Track execution history, logs, performance

## Related Agents

- **WorkflowTester** — Validates workflows end-to-end
- **AppDeveloper** — Embeds workflows as widgets in apps
- **FormDeveloper** — Uses workflows to process form submissions

## Quick Links

- [Workflow Architecture](01-workflow-architecture.md)
- [Node Types Reference](02-node-types.md) → deeper docs in [nodes/](nodes/)
- [Execution Flow & Error Handling](03-execution-flow.md)
- [Integration Patterns](04-integration-patterns.md)
- [Testing Guide](05-testing-guide.md)
- [MCP Server Reference](06-mcp-server-reference.md)
- [Node Config-Form Resolution](node-forms/agent.md) — a distinct topic from node execution: how the designer resolves a node's config FORM
- [MCP Design/Architecture Series](mcp-design/) — cross-tenant auth, write-tool authorization, agent-teams design
- [Node Certification Agent](../../Agents/Testers/WorkflowTester/nodetype-test/nodetypetestagent.md) — automated per-category node certification (unproven as of 2026-11-09, first dry run stalled — see its own §6b)
