# Create a Basic Workflow

## Overview

This procedure guides you through creating a simple workflow from scratch using the Flow Workflow MCP Server.

## Prerequisites

- Access to Flow Studio
- Workflow MCP Server available
- Credentials service ready
- Understanding of [WorkflowAgent architecture](../../Knowledge/WorkflowAgent/01-workflow-architecture.md)

## Step 0 — Preflight Tool Check (Required)

Before proceeding, confirm that the WorkflowAgent's MCP server tools are available:

1. Look for tools whose names start with `BizFirst.Ai.Mcp.Tools.Workflow` or call the server's list/health tool.
2. **If tools ARE available:** Continue with Step 1 below.
3. **If tools are NOT available:** STOP.
   - Do not publish an artifact, HTML page, or standalone file.
   - Tell the user in plain words: "The BizFirst Flow Studio MCP tools are not available in this session, so I cannot build this in Flow Studio."
   - Ask: "(a) connect the MCP server and retry, or (b) explicitly approve a named fallback"
4. Only proceed with a fallback if the user explicitly approves. Label the result as a draft, not built in Flow Studio.
5. Report which tools you checked and what you found. Never assume tools exist.

## Step-by-Step

### Step 1: Define Requirements
Before creating, document:
- **Purpose:** What does this workflow do?
- **Trigger:** Manual, webhook, schedule, or event?
- **Inputs:** What data does it need?
- **Outputs:** What does it produce?
- **Integrations:** Which external systems?

**Example:**
```
Purpose: Send confirmation email when customer signs up
Trigger: Webhook (from signup form)
Input: { customer_email, customer_name, signup_date }
Output: Email sent confirmation
Integrations: Gmail via OAuth2
```

### Step 2: Create Workflow
Use MCP tool `create_workflow`:

```
create_workflow(
  name: "Customer Signup Email",
  description: "Sends confirmation email when customer signs up via webhook",
  project_id: "project_123"  // optional
)
```

**Output:** Returns `workflow_id: "wf_abc123"`

### Step 3: Add Trigger Node
Use MCP tool `add_node`:

```
add_node(
  workflow_id: "wf_abc123",
  node_type: "webhook-trigger",
  name: "Webhook: Customer Signup"
)
```

**Output:** Returns `node_id: "node_webhook_001"`

### Step 4: Add Action Node
Add the main action node (e.g., email):

```
add_node(
  workflow_id: "wf_abc123",
  node_type: "email-gmail",
  name: "Send Confirmation Email",
  position: { x: 400, y: 200 }
)
```

**Output:** Returns `node_id: "node_email_001"`

### Step 5: Configure Action Node
Use MCP tool `configure_node`:

```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_email_001",
  operation: "send_message",
  config: {
    to: "{{InputData.customer_email}}",
    subject: "Welcome {{InputData.customer_name}}!",
    body: "Thank you for signing up..."
  },
  credentials_id: "cred_gmail_001"
)
```

### Step 6: Connect Nodes (Add Transition)
Use MCP tool `add_transition`:

```
add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_webhook_001",
  to_node_id: "node_email_001"
)
```

**Output:** Returns `transition_id: "trans_001"`

### Step 7: Validate Workflow
Use MCP tool `validate_workflow`:

```
validate_workflow(
  workflow_id: "wf_abc123"
)
```

**Expected Result:** No errors or warnings

**If errors found:**
- Fix node configuration
- Re-validate
- Repeat until clean

### Step 8: Test Workflow
Use MCP tool `execute_workflow`:

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    customer_email: "john@example.com",
    customer_name: "John Smith",
    signup_date: "2026-09-29"
  },
  timeout_seconds: 30
)
```

**Output:** Returns `execution_id: "exec_xyz789"`

### Step 9: Check Execution Status
Use MCP tool `get_execution_status`:

```
get_execution_status(
  execution_id: "exec_xyz789"
)
```

**Expected:** Status is "Completed", no errors, email sent

**If failed:**
- Review error message
- Fix issue in workflow
- Re-test

### Step 10: Deploy Workflow
Once testing passes, use MCP tool `deploy_workflow`:

```
deploy_workflow(
  workflow_id: "wf_abc123"
)
```

**Result:** Workflow is now active and receives webhook triggers

## Common Additions

### Add Notification (Slack Alert)
After email node:

```
add_node(
  workflow_id: "wf_abc123",
  node_type: "slack",
  name: "Notify Team"
)

configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_slack_001",
  operation: "post_message",
  config: {
    channel: "#signups",
    text: "New signup: {{InputData.customer_name}}"
  },
  credentials_id: "cred_slack_001"
)

add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_email_001",
  to_node_id: "node_slack_001"
)
```

### Add Conditional Logic (If Email Valid)
Add if-condition before email:

```
add_node(
  workflow_id: "wf_abc123",
  node_type: "if-condition",
  name: "Is Email Valid?",
  position: { x: 300, y: 150 }
)

configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_if_001",
  config: {
    expression: "InputData.customer_email.includes('@')"
  }
)

add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_webhook_001",
  to_node_id: "node_if_001"
)

add_transition(
  workflow_id: "wf_abc123",
  from_node_id: "node_if_001",
  to_node_id: "node_email_001",
  output_port: "true"
)
```

## Workflow Diagram

```
Webhook Trigger
    ↓
(If Valid?) ← if-condition
    ↓
  true
    ↓
Send Email ← email-gmail
    ↓
Notify Team ← slack
    ↓
 Complete
```

## Verification Checklist

- [ ] Workflow created with clear name and description
- [ ] Trigger node configured
- [ ] Action nodes added
- [ ] All transitions connected
- [ ] Credentials configured
- [ ] Validation passes (no errors)
- [ ] Test execution successful
- [ ] Workflow deployed

## See Also

- [02-add-execution-nodes.md](02-add-execution-nodes.md) — Add more node types
- [03-configure-transitions.md](03-configure-transitions.md) — Conditional routing
- [05-test-workflow.md](05-test-workflow.md) — Complete testing guide
- [Knowledge/WorkflowAgent/02-node-types.md](../../Knowledge/WorkflowAgent/02-node-types.md) — Node type reference
