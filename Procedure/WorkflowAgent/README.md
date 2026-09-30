# WorkflowAgent Procedures

Step-by-step guides for building, testing, and deploying workflows.

## Workflows

Each procedure covers one task end-to-end. Start with **Create Basic Workflow**, then branch to other tasks as needed.

### 1. [Create Basic Workflow](01-create-basic-workflow.md)
**When:** You're starting a new workflow from scratch

What you'll do:
- Define requirements
- Create workflow in MCP server
- Add trigger node
- Add action node
- Connect nodes
- Validate
- Test
- Deploy

**Time:** ~15 minutes

**Example:** Customer signup → Send confirmation email

---

### 2. [Add Execution Nodes](02-add-execution-nodes.md)
**When:** You need to add more nodes to an existing workflow

What you'll do:
- Understand node types (HTTP, email, Slack, AI, etc.)
- Add nodes to workflow
- Configure each node type
- Reference node outputs
- Validate configuration

**Time:** ~10 minutes per node

**Examples:** 
- Add HTTP request to fetch data
- Add email node to send notifications
- Add Flow AI Agent for intelligent routing

---

### 3. [Configure Transitions](03-configure-transitions.md)
**When:** You're connecting nodes and adding branching logic

What you'll do:
- Create unconditional transitions (direct routing)
- Create conditional transitions (if-condition, switch)
- Create branching paths (true/false)
- Create multi-way branching (switch cases)
- Handle errors with error paths

**Time:** ~10 minutes

**Examples:**
- Route based on order amount
- Different paths for approved/rejected
- Error handler on API failure

---

### 4. [Integrate External Systems](04-integrate-external-system.md)
**When:** You're connecting to APIs, email, Slack, databases, ERP, etc.

What you'll do:
- Create credentials
- Add integration node
- Configure API calls, email, Slack, database, Odoo
- Handle errors and retries
- Implement rate limiting

**Time:** ~15 minutes per integration

**Examples:**
- Call REST API to fetch customer data
- Send email via Gmail
- Post message to Slack
- Create record in Odoo ERP
- Write to SQL Server database

---

### 5. [Test Workflow](05-test-workflow.md)
**When:** Before deploying to production

What you'll do:
- Validate workflow structure
- Unit test individual nodes
- Integration test node chains
- End-to-end test full workflow
- Test error paths
- Load test
- Generate test report

**Time:** ~30 minutes

**Checklist:**
- [ ] Validation passes
- [ ] All nodes work in isolation
- [ ] Nodes chain together correctly
- [ ] Error paths execute
- [ ] Side effects verified (emails, records, messages)
- [ ] Performance acceptable

---

### 6. [Deploy Workflow](06-deploy-workflow.md)
**When:** Workflow is tested and ready for production

What you'll do:
- Final validation
- Create backup
- Deploy workflow
- Verify deployment
- Monitor first executions
- Set up alerts

**Time:** ~5 minutes deployment + 24h monitoring

**Checklist:**
- [ ] All tests pass
- [ ] Code/workflow review approved
- [ ] Credentials configured
- [ ] Deploy command executed
- [ ] Deployment confirmed
- [ ] First executions monitored

---

## Usage Patterns

### I'm building a new workflow
Follow in order:
1. Create Basic Workflow
2. Add Execution Nodes (as needed)
3. Configure Transitions (when branching)
4. Integrate External Systems (when needed)
5. Test Workflow
6. Deploy Workflow

### I'm fixing an existing workflow
1. Update node configuration in Add Execution Nodes
2. Re-configure transitions if needed
3. Test affected sections in Test Workflow
4. Deploy updated workflow in Deploy Workflow

### I'm adding a new feature
1. Add nodes in Add Execution Nodes
2. Configure transitions in Configure Transitions
3. Integrate systems in Integrate External Systems
4. Test new paths in Test Workflow
5. Deploy in Deploy Workflow

## Quick Reference

| Task | Document | Time |
|------|----------|------|
| Create new workflow | 01-create-basic-workflow | 15m |
| Add HTTP node | 02-add-execution-nodes | 10m |
| Add email notification | 02 + 04 | 15m |
| Add branching (if/condition) | 03-configure-transitions | 10m |
| Integrate external API | 04-integrate-external-system | 15m |
| Test workflow | 05-test-workflow | 30m |
| Deploy to production | 06-deploy-workflow | 5m + 24h monitoring |

## Related Knowledge

- **Knowledge/WorkflowAgent/** — Complete reference docs
  - [00-overview.md](../../Knowledge/WorkflowAgent/00-overview.md) — Concepts
  - [01-workflow-architecture.md](../../Knowledge/WorkflowAgent/01-workflow-architecture.md) — Data flow
  - [02-node-types.md](../../Knowledge/WorkflowAgent/02-node-types.md) — Node reference
  - [03-execution-flow.md](../../Knowledge/WorkflowAgent/03-execution-flow.md) — Debugging
  - [04-integration-patterns.md](../../Knowledge/WorkflowAgent/04-integration-patterns.md) — Integration examples
  - [05-testing-guide.md](../../Knowledge/WorkflowAgent/05-testing-guide.md) — Testing reference
  - [06-mcp-server-reference.md](../../Knowledge/WorkflowAgent/06-mcp-server-reference.md) — MCP API

- **Knowledge/Credentials/** — Credential management
- **Knowledge/Servers/** — Execution infrastructure
- **Agents/Testers/WorkflowTester/** — Automated testing

## Tools Reference

### MCP Server
`BizFirst.Ai.Mcp.Tools.Workflow`

**Core tools:**
- `create_workflow` — Create new workflow
- `add_node` — Add ExecutionNode
- `configure_node` — Set node configuration
- `add_transition` — Connect nodes
- `execute_workflow` — Test workflow
- `deploy_workflow` — Publish workflow
- `validate_workflow` — Check for errors

See [06-mcp-server-reference.md](../../Knowledge/WorkflowAgent/06-mcp-server-reference.md) for complete API.

### Credentials Service
Referenced in integrations.

### Monitoring
Post-deployment in production.

## Tips & Best Practices

**Design First**
- Sketch workflow before building
- Define inputs and outputs clearly
- List all integrations upfront

**Test Incrementally**
- Test each node independently
- Test chains of 2-3 nodes
- Test error paths early
- Load test before deployment

**Handle Errors**
- Always add error paths
- Test credential failures
- Test timeout scenarios
- Log issues for debugging

**Monitor Production**
- Set success rate alerts (>95%)
- Monitor latency (baseline + 2x)
- Track error rate (<1%)
- Review logs regularly

## Support

If issues arise:
1. Check [Knowledge/WorkflowAgent/03-execution-flow.md](../../Knowledge/WorkflowAgent/03-execution-flow.md) — "Common Issues"
2. Review [05-testing-guide.md](05-test-workflow.md) — "Common Testing Issues"
3. Check logs in execution history
4. Trace node outputs step-by-step

## Updates

- **2026-09-29** — Procedures reorganized as dedicated WorkflowAgent procedures
- **2026-08-20** — Node configuration examples updated
- **2026-07-15** — MCP API reference finalized
