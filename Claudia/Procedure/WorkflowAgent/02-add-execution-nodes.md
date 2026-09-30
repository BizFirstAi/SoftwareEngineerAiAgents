# Add and Configure Execution Nodes

## Overview

Guide for adding and configuring different node types to workflows.

## Adding a Node

### Basic Add Node Call

```
add_node(
  workflow_id: "wf_abc123",
  node_type: "http-request",
  name: "Fetch API Data",
  position: { x: 500, y: 300 }
)
```

Returns: `node_id: "node_http_001"`

### Common Node Types to Add

| Node Type | Use Case | Credentials |
|-----------|----------|-------------|
| `manual-trigger` | User-initiated | None |
| `webhook-trigger` | External webhook | None |
| `schedule-trigger` | Scheduled execution | None |
| `http-request` | REST API | Optional (bearer token) |
| `email-smtp` | SMTP email | Required |
| `email-gmail` | Gmail | Required (OAuth2) |
| `slack` | Slack integration | Required (bot token) |
| `if-condition` | Branching logic | None |
| `loop` | Iterate over data | None |
| `code-execute` | Custom script | None |
| `flow-ai-agent` | AI-powered logic | Required (LLM) |

## Configuring Each Node Type

### HTTP Request

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_http_001",
  operation: "POST",
  config: {
    url: "https://api.example.com/data",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{credentials.api_key}}"
    },
    body: {
      name: "{{InputData.name}}",
      email: "{{InputData.email}}"
    }
  },
  credentials_id: "cred_api_001"
)
```

### Email (SMTP)

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_email_001",
  operation: "send_message",
  config: {
    to: "{{InputData.recipient_email}}",
    cc: "manager@company.com",
    subject: "Order Confirmation #{{InputData.order_id}}",
    body: "Thank you for your order..."
  },
  credentials_id: "cred_smtp_001"
)
```

### Email (Gmail)

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_gmail_001",
  operation: "send_message",
  config: {
    to: "{{InputData.customer_email}}",
    subject: "Your Receipt",
    body: "Order details..."
  },
  credentials_id: "cred_gmail_001"
)
```

### Slack

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_slack_001",
  operation: "post_message",
  config: {
    channel: "#notifications",
    text: "New order: {{InputData.order_id}} for {{InputData.customer}}",
    thread_ts: "{{nodes.previous_node.output.thread_id}}"
  },
  credentials_id: "cred_slack_001"
)
```

### If Condition

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_if_001",
  config: {
    expression: "InputData.amount > 100"
  }
)
```

Supports: `>`, `<`, `==`, `!=`, `&&` (and), `||` (or), `.includes()`, `.length`

### Loop

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_loop_001",
  config: {
    input_array: "{{InputData.items}}",
    iteration_variable: "current_item"
  }
)
```

### Code Execute

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_code_001",
  config: {
    code: `
      const total = InputData.items.reduce((sum, item) => sum + item.price, 0);
      return {
        total: total,
        item_count: InputData.items.length,
        average: total / InputData.items.length
      };
    `
  }
)
```

### Flow AI Agent

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_ai_001",
  operation: "reason",
  config: {
    strategy: "tools",
    prompt: "Analyze this customer feedback and classify sentiment",
    system_prompt: "You are a sentiment analyzer...",
    max_iterations: 5
  },
  credentials_id: "cred_llm_001"
)
```

## Node Output Variables

After configuring a node, reference its output:

```
{{nodes.Fetch_API_Data.output.status}}
{{nodes.Send_Email.output.message_id}}
{{nodes.Analyze_Feedback.output.sentiment}}
```

## Validation

After configuring each node:

```
validate_workflow(
  workflow_id: "wf_abc123"
)
```

**Look for errors:**
- Missing required configuration
- Invalid field references
- Type mismatches

## Testing Single Node

Test a node in isolation:

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: { /* test data */ },
  timeout_seconds: 30
)

get_execution_status(execution_id)
```

Inspect node output in execution logs.

## Common Mistakes

### Missing Credentials ID
**Error:** "Credential not found"
**Fix:** Ensure credentials exist and `credentials_id` is correct

### Invalid Variable Reference
**Error:** "Variable not found"
**Fix:** Check spelling, ensure variable is set before reference

### Type Mismatch
**Error:** "Expected array, got object"
**Fix:** Check input data type; use code-execute to transform if needed

### Circular References
**Error:** "Circular dependency"
**Fix:** Ensure nodes don't reference their own output

## See Also

- [01-create-basic-workflow.md](01-create-basic-workflow.md) — Basic workflow creation
- [03-configure-transitions.md](03-configure-transitions.md) — Connect nodes
- [Knowledge/WorkflowAgent/02-node-types.md](../../Knowledge/WorkflowAgent/02-node-types.md) — Node reference
- [Knowledge/WorkflowAgent/06-mcp-server-reference.md](../../Knowledge/WorkflowAgent/06-mcp-server-reference.md) — MCP API
