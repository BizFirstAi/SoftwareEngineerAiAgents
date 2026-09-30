# Integrate External Systems

## Overview

Connect workflows to external APIs, services, and databases.

## Integration Nodes

| Node | System | Credentials |
|------|--------|-------------|
| `http-request` | Any REST API | Optional |
| `email-smtp` | SMTP server | Required |
| `email-gmail` | Gmail | Required (OAuth2) |
| `slack` | Slack | Required (bot token) |
| `odoo` | Odoo ERP | Required |
| `elasticsearch` | Elasticsearch | Optional |
| `sql-server` | SQL Server DB | Required |

## HTTP Request Pattern

### Step 1: Create Credential
If not exists, create API key credential in Credentials service.

### Step 2: Add Node
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "http-request",
  name: "Call External API"
)
```

### Step 3: Configure
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_http_001",
  operation: "POST",
  config: {
    url: "https://api.partner.com/v1/customers",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      name: "{{InputData.name}}",
      email: "{{InputData.email}}"
    },
    timeout: 30
  },
  credentials_id: "cred_partner_api"
)
```

### Step 4: Handle Response
Reference node output:
```
{{nodes.Call_External_API.output.body.customer_id}}
{{nodes.Call_External_API.output.status}}
{{nodes.Call_External_API.output.headers.x-ratelimit-remaining}}
```

## Email Integration (Gmail)

### Step 1: OAuth2 Setup
Create Gmail OAuth2 credential in Credentials service.

### Step 2: Add Node
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "email-gmail",
  name: "Send Email"
)
```

### Step 3: Configure
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_gmail_001",
  operation: "send_message",
  config: {
    to: "{{InputData.recipient}}",
    cc: "manager@company.com",
    subject: "Order {{InputData.order_id}}",
    body: "Thank you for your order...",
    html_body: "<h1>Order Confirmation</h1>..."
  },
  credentials_id: "cred_gmail_oauth2"
)
```

## Slack Integration

### Step 1: Create Bot Token
Setup bot in Slack workspace, get token.

### Step 2: Create Credential
Store token in Credentials service.

### Step 3: Add Node
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "slack",
  name: "Notify Team"
)
```

### Step 4: Configure
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_slack_001",
  operation: "post_message",
  config: {
    channel: "#orders",
    text: "New order: {{InputData.order_id}}",
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Order Details*" }
      }
    ]
  },
  credentials_id: "cred_slack_bot"
)
```

## Database Integration (SQL Server)

### Step 1: Create Credential
Database connection string in Credentials service.

### Step 2: Add Node
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "sql-server",
  name: "Write to Database"
)
```

### Step 3: Configure
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_sql_001",
  operation: "execute",
  config: {
    query: `
      INSERT INTO Customers (Name, Email, CreatedOn)
      VALUES (@name, @email, @now)
    `,
    parameters: {
      "@name": "{{InputData.name}}",
      "@email": "{{InputData.email}}",
      "@now": "{{now()}}"
    }
  },
  credentials_id: "cred_db_connection"
)
```

## Odoo ERP Integration

### Step 1: Create Credential
Odoo URL, database, username, password.

### Step 2: Add Node
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "odoo",
  name: "Create Order in Odoo"
)
```

### Step 3: Configure
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_odoo_001",
  operation: "create_record",
  config: {
    model: "sale.order",
    values: {
      partner_id: "{{InputData.partner_id}}",
      order_line: [
        { product_id: "{{InputData.product_id}}", product_qty: 1 }
      ]
    }
  },
  credentials_id: "cred_odoo"
)
```

## Error Handling

### Add Error Handler
```
add_node(
  workflow_id: "wf_abc123",
  node_type: "email-gmail",
  name: "Alert on Error"
)

add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_http_001",
  to_node_id: "node_error_handler",
  output_port: "error"
)
```

### Retry with Backoff
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_http_001",
  config: {
    retry_count: 3,
    retry_backoff: "exponential",
    timeout: 30
  }
)
```

## Rate Limiting

### Parallel Calls
```
add_node(node_type: "parallel-fork")
add_node(node_type: "http-request", name: "API Call 1")
add_node(node_type: "http-request", name: "API Call 2")
add_node(node_type: "parallel-join")
```

### Sequential with Delay
```
Loop items
  → HTTP Request
  → Delay (1 second)
  → Next item
```

## Real-World Example: Customer Sync

```
Webhook (customer update)
  ↓
Fetch from external CRM via HTTP
  ↓
If status = active?
  ├─ Yes: Write to local DB
  │       Send confirmation email
  │       Notify Slack
  └─ No: Archive locally
```

## Testing Integration

### Pre-Deployment
1. Verify credential works
2. Test with real external system in staging
3. Check response data format
4. Test error scenarios

### Execution Test
```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: { test_customer_id: "test_123" }
)

get_execution_status(execution_id)
```

Verify:
- External system received data
- Response data parsed correctly
- Records created/updated as expected

## See Also

- [04-integration-patterns.md](../../Knowledge/WorkflowAgent/04-integration-patterns.md) — Real-world patterns
- [Knowledge/Credentials](../../Knowledge/Credentials/) — Credential management
- [02-add-execution-nodes.md](02-add-execution-nodes.md) — Node configuration
