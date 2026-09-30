# Workflow MCP Server Reference

**MCP Server:** `BizFirst.Ai.Mcp.Tools.Workflow`

WorkflowAgent uses this MCP server to create, configure, and manage workflows.

## Core Tools

### Workflow Management

#### create_workflow
Creates a new workflow.

**Parameters:**
- `name` (string, required) — Workflow name
- `description` (string, optional) — Workflow description
- `project_id` (string, optional) — Associated project ID
- `tenant_id` (string) — Tenant identifier

**Returns:** Workflow ID, metadata

**Example:**
```json
{
  "name": "Customer Email Workflow",
  "description": "Sends confirmation email on customer signup",
  "project_id": "proj_123"
}
```

#### update_workflow
Updates workflow metadata.

**Parameters:**
- `workflow_id` (string, required) — Workflow to update
- `name` (string, optional) — New name
- `description` (string, optional) — New description
- `status` (string, optional) — draft/active/archived

**Returns:** Updated workflow object

#### get_workflow
Retrieves workflow details.

**Parameters:**
- `workflow_id` (string, required)

**Returns:** Full workflow definition (nodes, transitions, metadata)

#### delete_workflow
Deletes a workflow (soft delete).

**Parameters:**
- `workflow_id` (string, required)

**Returns:** Success/error

#### list_workflows
Lists all workflows for a tenant.

**Parameters:**
- `status` (string, optional) — Filter by status
- `project_id` (string, optional) — Filter by project
- `limit` (integer, optional) — Page limit

**Returns:** Array of workflows

#### deploy_workflow
Publishes workflow to active state.

**Parameters:**
- `workflow_id` (string, required)

**Returns:** Deployment confirmation

#### get_workflow_versions
Lists all versions of a workflow.

**Parameters:**
- `workflow_id` (string, required)

**Returns:** Version history

### Node Management

#### add_node
Adds an ExecutionNode to a workflow.

**Parameters:**
- `workflow_id` (string, required)
- `node_type` (string, required) — e.g., "http-request", "email-smtp"
- `position` (object, optional) — UI coordinates {x, y}
- `name` (string, optional) — Node label

**Returns:** Node ID, default configuration schema

**Example:**
```json
{
  "workflow_id": "wf_123",
  "node_type": "http-request",
  "name": "Fetch Customer Data"
}
```

#### configure_node
Sets up node operation and data templates.

**Parameters:**
- `workflow_id` (string, required)
- `node_id` (string, required)
- `operation` (string, required) — Node-specific operation
- `config` (object) — Operation configuration
- `credentials_id` (string, optional) — Credential reference

**Returns:** Configuration validation result

**Example:**
```json
{
  "workflow_id": "wf_123",
  "node_id": "node_456",
  "operation": "POST",
  "config": {
    "url": "https://api.example.com/customers",
    "method": "POST",
    "headers": { "Content-Type": "application/json" }
  }
}
```

#### get_node_type_schema
Gets configuration schema for a node type.

**Parameters:**
- `node_type` (string, required)

**Returns:** JSON schema (input/output fields, validation rules)

#### delete_node
Removes a node from workflow.

**Parameters:**
- `workflow_id` (string, required)
- `node_id` (string, required)

**Returns:** Success/error

#### list_nodes
Lists all nodes in workflow.

**Parameters:**
- `workflow_id` (string, required)

**Returns:** Array of nodes with configuration

### Transition Management

#### add_transition
Creates a link between nodes.

**Parameters:**
- `workflow_id` (string, required)
- `from_node_id` (string, required)
- `to_node_id` (string, required)
- `output_port` (string, optional) — Output name (for conditional nodes)
- `condition` (string, optional) — Expression for conditional transition

**Returns:** Transition ID

**Example:**
```json
{
  "workflow_id": "wf_123",
  "from_node_id": "if_condition_001",
  "to_node_id": "email_smtp_001",
  "output_port": "true",
  "condition": "InputData.status == 'approved'"
}
```

#### update_transition
Modifies an existing transition.

**Parameters:**
- `workflow_id` (string, required)
- `transition_id` (string, required)
- `condition` (string, optional) — Update condition

**Returns:** Updated transition

#### delete_transition
Removes a transition.

**Parameters:**
- `workflow_id` (string, required)
- `transition_id` (string, required)

**Returns:** Success/error

### Execution & Testing

#### execute_workflow
Runs a workflow manually with input data.

**Parameters:**
- `workflow_id` (string, required)
- `input_data` (object) — Initial workflow input
- `timeout_seconds` (integer, optional) — Max execution duration

**Returns:** Execution ID, initial status

#### get_execution_status
Retrieves execution progress and logs.

**Parameters:**
- `execution_id` (string, required)

**Returns:** Status, node outputs, errors, logs

#### cancel_execution
Stops a running workflow.

**Parameters:**
- `execution_id` (string, required)

**Returns:** Success/error

#### get_execution_history
Lists past executions of a workflow.

**Parameters:**
- `workflow_id` (string, required)
- `limit` (integer, optional)
- `status` (string, optional) — Filter by status

**Returns:** Execution records with summary

### Validation & Testing

#### validate_workflow
Checks workflow for errors before deployment.

**Parameters:**
- `workflow_id` (string, required)

**Returns:** Validation result (errors, warnings)

**Common issues detected:**
- Disconnected nodes
- Missing required configuration
- Invalid transitions
- Unresolved credential references
- Type mismatches between nodes

#### test_node_configuration
Validates a single node's configuration.

**Parameters:**
- `node_type` (string, required)
- `config` (object) — Node configuration

**Returns:** Validation result

#### get_available_node_types
Lists all supported node types.

**Returns:** Array of node types with categories and descriptions

## Error Handling

### Common Error Responses

**400 Bad Request**
- Missing required parameters
- Invalid node type
- Malformed configuration

**404 Not Found**
- Workflow not found
- Node not found
- Credential not found

**409 Conflict**
- Workflow already deployed
- Node already exists
- Circular transition detected

**503 Service Unavailable**
- MCP server down
- Database unreachable

## Usage Patterns

### Pattern 1: Create and Configure
```
1. create_workflow(name, description)
2. add_node(workflow_id, "manual-trigger")
3. add_node(workflow_id, "http-request")
4. configure_node(workflow_id, http_node_id, {...config})
5. add_transition(workflow_id, trigger_id, http_node_id)
6. validate_workflow(workflow_id)
7. deploy_workflow(workflow_id)
```

### Pattern 2: Test Before Deploy
```
1. get_workflow(workflow_id)
2. execute_workflow(workflow_id, {test input})
3. get_execution_status(execution_id)
4. Inspect node outputs
5. If OK: deploy_workflow(workflow_id)
6. If errors: update nodes and re-test
```

### Pattern 3: Update Existing Workflow
```
1. Verify workflow is not active (or create new version)
2. update_workflow(workflow_id, {metadata})
3. For each modified node:
   - delete_node(workflow_id, node_id)
   - add_node(workflow_id, new_config)
   - add_transition(...)
4. validate_workflow(workflow_id)
5. Test with execute_workflow
6. deploy_workflow(workflow_id)
```

## Rate Limits

| Operation | Limit | Note |
|-----------|-------|------|
| create_workflow | 10/min | Per tenant |
| execute_workflow | 100/min | Per workflow |
| add_node | 100/min | Per workflow |
| update_workflow | 50/min | Per tenant |

## See Also

- [Node Types Reference](02-node-types.md) — Detailed node configuration
- [Workflow Architecture](01-workflow-architecture.md) — Data flow concepts
- [Integration Patterns](04-integration-patterns.md) — Real-world examples
