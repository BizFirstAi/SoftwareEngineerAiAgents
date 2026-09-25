# Workflow Developer

Builds Flow Studio workflows for a user, and fixes node types whose configuration forms are
missing or wrong.

| | |
|---|---|
| **Studio** | Flow Studio |
| **Pick this agent when** | the user is in Flow Studio, or asks for a workflow, an automation, a node, or says a node's config dialog shows no form or the wrong form |
| **MCP server** | `BizFirst.Ai.Mcp.Tools.Workflow` |

This file is an index only. The knowledge and the steps live in the shared folders below. Load
only what the current request needs.

## Start here

1. Read [`Knowledge/Workflow/workflow-nodes-rag/00-overview.md`](../../../Knowledge/Workflow/workflow-nodes-rag/00-overview.md)
   and [`00-looping-patterns.md`](../../../Knowledge/Workflow/workflow-nodes-rag/00-looping-patterns.md).
   Both are marked as always loaded.
2. Pick a procedure below.

## Procedures

| Procedure | Use when |
|---|---|
| [`build-and-verify-workflow-via-mcp.md`](../../../Procedure/Workflow/build-and-verify-workflow-via-mcp.md) | Building a workflow through the MCP tools and verifying it |
| [`node-forms/node-forms-fixer.md`](../../../Procedure/Workflow/node-forms/node-forms-fixer.md) | A node shows no operation form, or the wrong one |
| [`node-forms/debug-runbook.md`](../../../Procedure/Workflow/node-forms/debug-runbook.md) | Triage steps used by the node-forms fixer |
| [`node-forms/fix-playbook.md`](../../../Procedure/Workflow/node-forms/fix-playbook.md) | Generating per-operation data templates for a node type |
| [`node-forms/audit-all-datatemplates.md`](../../../Procedure/Workflow/node-forms/audit-all-datatemplates.md) | Auditing data templates across all node types |
| [`add-new-node-type.md`](../../../Procedure/Workflow/add-new-node-type.md) | A node type needs a knowledge doc (maintenance, not for end users) |

## Knowledge (load on demand)

| File | Load when |
|---|---|
| [`workflow-nodes-rag/nodes/`](../../../Knowledge/Workflow/workflow-nodes-rag/nodes/) | Configuring a node. Load only the node types the workflow uses |
| [`flow-webhooks-rag.md`](../../../Knowledge/Workflow/flow-webhooks-rag.md) | Workflows triggered by webhooks |
| [`known-servers.md`](../../../Knowledge/Workflow/known-servers.md) | Which Workflow MCP servers are deployed |
| [`mcp-servers/flow-workflow-mcp-design.md`](../../../Knowledge/Workflow/mcp-servers/flow-workflow-mcp-design.md) | Which Workflow MCP tools exist |
| [`mcp-servers/bizfirst-mcp-servers-architecture.md`](../../../Knowledge/Workflow/mcp-servers/bizfirst-mcp-servers-architecture.md) | How the BizFirst MCP servers fit together |
| [`node-forms/00-overview.md`](../../../Knowledge/Workflow/node-forms/00-overview.md) | Index of the node-forms knowledge used by the fixer procedures |
| [`node-forms/resource.md`](../../../Knowledge/Workflow/node-forms/resource.md) | Paths, connections and tool caveats for node-forms work |
| [`node-forms/lessons/README.md`](../../../Knowledge/Workflow/node-forms/lessons/README.md) | Findings from past node-forms fixes |
| [`workflow-creation-rag-design.md`](../../../Knowledge/Workflow/workflow-creation-rag-design.md), [`workflow-nodes-ingestion.md`](../../../Knowledge/Workflow/workflow-nodes-ingestion.md) | How this knowledge set is designed and ingested |

Other MCP design docs: [`Knowledge/Workflow/mcp-servers/`](../../../Knowledge/Workflow/mcp-servers/).

## Tested by

[`Agents/Testers/WorkflowTester`](../../Testers/WorkflowTester/AGENT.md)
