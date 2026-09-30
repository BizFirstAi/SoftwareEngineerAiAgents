# Workflow Tester

Tests Flow Studio node types and workflows: node test rounds, workflows built through MCP, and
AI Agent nodes.

| | |
|---|---|
| **Studio** | Flow Studio |
| **Pick this agent when** | the user asks to test a node type, a workflow or the Workflow MCP tools |
| **MCP server** | `BizFirst.Ai.Mcp.Tools.Workflow` |

This file is an index only. It uses the same knowledge as the
[Workflow Developer](../../Builders/WorkflowDeveloper/AGENT.md). Start with
[`testing/nodes-testing-README.md`](testing/nodes-testing-README.md).

## Procedure

[`Procedure/Workflow/build-and-verify-workflow-via-mcp.md`](../../../Procedure/Workflow/build-and-verify-workflow-via-mcp.md):
build a workflow through MCP and verify it at the MCP, database and UI levels.

## Test material in this folder

| File | What it is |
|---|---|
| [`testing/nodes-testing-README.md`](testing/nodes-testing-README.md) | Overview of node testing |
| [`testing/01-Getting-started/index.html`](testing/01-Getting-started/index.html) | Getting started |
| [`testing/02-guidelines.md`](testing/02-guidelines.md) | Bootstrapping node testing for a new node type |
| [`testing/globals.md`](testing/globals.md) | Shared facts used by every node test |
| [`testing/testing-flow-studio-ai-agent.md`](testing/testing-flow-studio-ai-agent.md) | Manually testing an AI Agent node in Flow Studio |
| [`testing/elasticsearch/`](testing/elasticsearch/README.md) | Elasticsearch node: test plan, test rounds, workflow build, lessons |
| [`testing/odoo/`](testing/odoo/README.md) | Odoo node: test plan, credential model, lessons |
| [`test-results/sample-workflow-mcp-test/`](test-results/sample-workflow-mcp-test/) | First end-to-end Workflow MCP write-path test |
