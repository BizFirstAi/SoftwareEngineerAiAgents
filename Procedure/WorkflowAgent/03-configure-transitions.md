# Configure Transitions (Routing & Branching)

## Overview

Transitions connect nodes and define the execution path through a workflow.

## Types of Transitions

### Unconditional (Default)
Always proceeds to next node.

```
add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_1",
  to_node_id: "node_2"
)
```

### Conditional (Based on Output Port)
Routes based on node output (especially if-condition, switch).

```
add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_if_001",
  to_node_id: "node_email_001",
  output_port: "true"
)

add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_if_001",
  to_node_id: "node_error_handler",
  output_port: "false"
)
```

### Conditional (Based on Expression)
Routes based on evaluating an expression.

```
add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_1",
  to_node_id: "node_notify",
  condition: "{{nodes.node_1.output.status}} == 'success'"
)
```

## Creating a Branch

```
If condition node → true → Send Email
                  → false → Error Handler
```

Step 1: Add if-condition node
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "if-condition",
  name: "Valid Order?"
)
```

Step 2: Add action nodes
```
add_node(workflow_id, node_type: "email-gmail", name: "Confirmation")
add_node(workflow_id, node_type: "slack", name: "Alert Team")
```

Step 3: Configure if-condition
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_if_001",
  config: {
    expression: "InputData.total_amount >= 10 && InputData.customer_verified == true"
  }
)
```

Step 4: Add transitions
```
add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_if_001",
  to_node_id: "node_email_001",
  output_port: "true"
)

add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_if_001",
  to_node_id: "node_slack_001",
  output_port: "false"
)
```

## Multi-Way Branching (Switch)

```
add_node(workflow_id, node_type: "switch", name: "Route by Status")

configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_switch_001",
  config: {
    cases: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" }
    ],
    expression: "InputData.status"
  }
)

add_transition(from_node_id: "node_switch_001", to_node_id: "node_wait", output_port: "pending")
add_transition(from_node_id: "node_switch_001", to_node_id: "node_process", output_port: "approved")
add_transition(from_node_id: "node_switch_001", to_node_id: "node_reject", output_port: "rejected")
```

## Error Path Transitions

Route to error handler on failure:

```
add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_http_001",
  to_node_id: "node_error_handler",
  output_port: "error"
)
```

## Conditional Transition Expression

Transitions can evaluate expressions:

```
condition: "{{nodes.fetch_data.output.record_count}} > 0"
condition: "{{InputData.status}} == 'active'"
condition: "{{nodes.previous.output.timestamp}} > new Date() - 3600000"
```

## Loop Transitions

Loops create implicit transitions:
- Inside loop → normal transitions between nodes
- After loop → transition continues after all iterations

```
add_transition(from_node_id: "node_loop_001", to_node_id: "node_summarize")
```

This transition executes after loop completes (not per iteration).

## Parallel Fork/Join Transitions

```
add_node(workflow_id, node_type: "parallel-fork")
add_node(workflow_id, node_type: "parallel-join")

// Fork branches
add_transition(from_node_id: "fork", to_node_id: "task_1")
add_transition(from_node_id: "fork", to_node_id: "task_2")
add_transition(from_node_id: "fork", to_node_id: "task_3")

// Rejoin
add_transition(from_node_id: "task_1", to_node_id: "join")
add_transition(from_node_id: "task_2", to_node_id: "join")
add_transition(from_node_id: "task_3", to_node_id: "join")

// Continue after join
add_transition(from_node_id: "join", to_node_id: "finalize")
```

## Updating Transitions

Change a transition condition:

```
update_transition(
  workflow_id: "wf_abc123",
  transition_id: "trans_001",
  condition: "{{nodes.check.output.result}} == 'OK'"
)
```

## Deleting Transitions

Remove a transition:

```
delete_transition(
  workflow_id: "wf_abc123",
  transition_id: "trans_001"
)
```

This disconnects nodes but doesn't delete the nodes themselves.

## Validation

After configuring transitions:

```
validate_workflow(workflow_id)
```

Checks for:
- Disconnected nodes (unreachable)
- Dead ends (nodes with no outgoing transitions)
- Circular loops (if-condition loops back to itself)

## Visualization

Workflow diagram with transitions:

```
Trigger
  ↓
Fetch Data
  ↓
If Status Valid?
  ├─ true ─→ Send Email ─→ Log Success
  └─ false → Alert Error → Retry
```

## See Also

- [01-create-basic-workflow.md](01-create-basic-workflow.md) — Basic workflow
- [Knowledge/WorkflowAgent/03-execution-flow.md](../../Knowledge/WorkflowAgent/03-execution-flow.md) — Execution model
