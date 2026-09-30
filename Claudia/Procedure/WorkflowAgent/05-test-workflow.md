# Test Workflow

## Pre-Deployment Checklist

- [ ] All nodes configured
- [ ] All transitions connected
- [ ] No disconnected nodes
- [ ] Credentials created and valid
- [ ] Error paths defined
- [ ] Data schemas align between nodes

## Validation

### Step 1: Validate Workflow
```
validate_workflow(
  workflow_id: "wf_abc123"
)
```

**Expected:** No errors or warnings

**Common errors:**
- Disconnected nodes → Connect via transitions
- Missing credential → Create in Credentials service
- Invalid expression → Check if-condition syntax
- Type mismatch → Verify node output schema

### Step 2: Fix Issues
If errors found:
1. Identify issue
2. Fix in workflow
3. Re-validate

## Unit Testing (Per Node)

### Test HTTP Request Node

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    api_url: "https://httpbin.org/post",
    api_method: "POST",
    api_body: { test: "data" }
  }
)

get_execution_status(execution_id)
```

Verify:
- HTTP request sent
- Response received
- Status code is 200-299

### Test Email Node

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    recipient: "test@example.com",
    subject: "Test Email",
    body: "This is a test"
  }
)

get_execution_status(execution_id)
```

Verify:
- Email sent successfully
- Recipient received message
- No credential errors

### Test Slack Node

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    channel: "#testing",
    message: "Test message from workflow"
  }
)
```

Verify:
- Message posted to channel
- Formatting correct
- No rate limit errors

## Integration Testing (Node Chain)

### Test HTTP → Email Chain

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    customer_id: "C123",
    api_endpoint: "https://api.example.com/customer",
    recipient_email: "manager@company.com"
  }
)

get_execution_status(execution_id)
```

Inspect intermediate outputs:
- HTTP node → Verify response data
- Email node → Verify email sent with HTTP response data

### Test If Condition Branch

```
// Test true branch
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: { status: "approved" }
)

// Verify: Email node executed (true path)

// Test false branch
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: { status: "rejected" }
)

// Verify: Error handler executed (false path)
```

## End-to-End Testing

### Full Workflow Execution

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    customer_id: "C123",
    customer_name: "John Smith",
    order_total: 500.00
  }
)
```

### Check Execution

```
get_execution_status(execution_id)
```

Verify:
- Status: "Completed"
- No errors
- All nodes executed
- Final output matches expected

### Validate Side Effects

After workflow execution:
1. **Email sent?** Check recipient inbox
2. **Database updated?** Query database for new records
3. **Slack notified?** Check channel for message
4. **External system called?** Check audit logs

## Error Path Testing

### Test Missing Credential
```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: { /* valid data */ }
)
```

With credential removed/invalid:
- Verify error handler executes
- Check alert sent to team
- Confirm workflow doesn't completely fail

### Test Invalid Input

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    email: "invalid-email",  // Missing @
    amount: "not-a-number"   // Type error
  }
)
```

Verify:
- If-condition catches validation error
- Error handler executes
- Notification sent

### Test Timeout

Configure short timeout:
```
configure_node(
  workflow_id: "wf_abc123",
  node_id: "node_http_001",
  config: { timeout: 1 }  // 1 second
)
```

Call slow API:
- Verify timeout triggers
- Error path executes
- Retry logic works

## Performance Testing

### Load Testing (10 Concurrent)

```
for i in 1..10:
  execute_workflow(workflow_id, input_data_i)
```

Monitor:
- All executions complete
- Average latency
- Success rate
- Concurrent limit hit?

### Loop Performance

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: {
    items: [ 100 items ]
  }
)
```

Monitor:
- Execution time
- Per-iteration latency
- Total memory usage
- Timeout not hit

## Test Data

### Sample Datasets

**Minimal:**
```json
{
  "customer_id": "C123",
  "email": "john@example.com"
}
```

**Edge cases:**
```json
{
  "customer_id": "",
  "email": "john+alias@sub.example.com",
  "notes": "Special chars: & < > \" '"
}
```

**Large:**
```json
{
  "items": [ 1000 items ],
  "description": "... 10000 characters ..."
}
```

## Test Report Template

```
Workflow: [Name]
Date: [Date]
Tester: [Name]

Validation:
  ✓ No structural errors
  ✓ All nodes configured
  ✓ Credentials valid

Unit Tests:
  ✓ HTTP node: Response parsed correctly
  ✓ Email node: Sent to recipient
  ✓ Slack node: Message posted

Integration Tests:
  ✓ HTTP → Email: Data flows correctly
  ✓ Branching: Both paths execute

End-to-End:
  ✓ Full execution: Completed successfully
  ✓ Side effects: All verified

Error Handling:
  ✓ Missing credential: Handled gracefully
  ✓ Invalid input: Error path executes
  ✓ Timeout: Retry logic works

Performance:
  ✓ 10 concurrent: All succeed
  ✓ 100 loop items: < 30 seconds
  ✓ Success rate: 99%+

Status: APPROVED FOR PRODUCTION
```

## See Also

- [05-testing-guide.md](../../Knowledge/WorkflowAgent/05-testing-guide.md) — Detailed testing reference
- [06-deploy-workflow.md](06-deploy-workflow.md) — Deployment
