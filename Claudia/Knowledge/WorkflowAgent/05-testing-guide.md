# Workflow Testing Guide

## Testing Levels

### Unit Testing (Per Node)
Test individual node behavior in isolation.

**What to test:**
- Correct operation (node type specific)
- Input validation (required fields, types)
- Error handling (missing credential, invalid input)
- Output schema (correct fields, data types)

**How to test:**
1. Use manual-trigger with specific input data
2. Execute single node
3. Inspect output
4. Verify against expected schema

### Integration Testing (Node Chain)
Test sequences of 2-3 nodes working together.

**What to test:**
- Data flow between nodes (output → input)
- Transitions (conditional, unconditional, error paths)
- Data transformation accuracy
- Credential handling

**How to test:**
1. Create workflow with subset of nodes
2. Trigger with known input
3. Inspect intermediate outputs at each node
4. Verify final output matches expected

### End-to-End Testing (Full Workflow)
Test complete workflow from trigger to final output.

**What to test:**
- All node types and paths
- All error conditions
- All branching logic
- Performance/timing

**How to test:**
1. Deploy workflow to test environment
2. Trigger via appropriate method (manual, webhook, schedule)
3. Monitor execution logs
4. Validate output against expected
5. Check external system side effects (email sent, record created, etc.)

### Load Testing (Concurrent Executions)
Test workflow under load.

**What to test:**
- Concurrent execution limits
- Resource contention
- Rate limiting behavior
- Error recovery at scale

**How to test:**
1. Simulate multiple concurrent triggers
2. Monitor performance metrics
3. Check for deadlocks or resource exhaustion
4. Verify rate limiting doesn't cause failures

## Testing Workflow by Node Type

### Triggers

**manual-trigger**
- Test with various input JSON payloads
- Verify each field is passed through correctly
- Test with empty/null/large inputs

**webhook-trigger**
- POST to webhook URL with sample payload
- Verify webhook URL is unique per workflow
- Test duplicate/concurrent webhooks
- Test webhook authentication (if configured)

**schedule-trigger**
- Verify cron expression is valid
- Test at scheduled time (or mock time)
- Verify trigger fires only at correct times
- Test timezone handling

### Control Flow

**if-condition**
- Test true and false paths independently
- Test with various expressions (comparisons, logical ops)
- Test null/undefined behavior
- Test type coercion edge cases

**loop**
- Test with small list (1-5 items)
- Test with empty list
- Test with large list (1000+ items)
- Verify per-item output is correct
- Test access to current_item variable

**parallel-fork/join**
- Test all branches execute
- Test branches complete before join
- Test with 2, 3, 5, 10 concurrent branches
- Test timeout behavior

### Integrations

**http-request**
- Test successful requests (2xx)
- Test error responses (4xx, 5xx)
- Test timeout
- Test with various HTTP methods
- Test with/without auth
- Test with different content types (JSON, form, XML)

**email nodes**
- Test sending to valid email
- Test with attachment
- Test with invalid email (should fail safely)
- Test with expired credential
- Test HTML vs plain text

**slack**
- Test message posting to valid channel
- Test with invalid token (should fail)
- Test formatted messages
- Test with attachments/files

**odoo**
- Test create record
- Test read record
- Test update record
- Test with invalid credentials
- Test rate limiting

### AI Nodes

**flow-ai-agent**
- Test with simple prompt
- Test with complex multi-step reasoning
- Test tool access (if configured)
- Test with various LLM models
- Test streaming vs non-streaming

**ai-agent**
- Test one-shot mode
- Test multi-turn chat mode
- Test with expected agent (e.g., AppDeveloper)
- Test error handling (agent unavailable)

## Test Data Strategy

### Create Representative Datasets

**Minimal dataset:**
```json
{
  "customer_id": "C123",
  "email": "test@example.com",
  "amount": 100.00
}
```

**Edge cases:**
```json
// Empty values
{ "customer_id": "", "email": null }

// Large values
{ "customer_id": "C" * 1000, "description": "..." }

// Special characters
{ "email": "test+alias@example.com", "name": "O'Brien" }

// Invalid formats
{ "email": "invalid", "amount": "not-a-number" }
```

**Volume dataset:**
```json
{
  "items": [
    // 1000+ items for load testing
  ]
}
```

### Test Credential Management

1. Create test credentials for each service
2. Use separate test accounts (never production)
3. Verify credentials work before testing
4. Clean up after tests (delete test records)
5. Rotate credentials regularly

## Testing Procedures

### Pre-Deployment Checklist

- [ ] All nodes have valid configuration
- [ ] All transitions are properly connected
- [ ] No disconnected nodes
- [ ] All required credentials exist and are valid
- [ ] Error paths are configured
- [ ] Timeout values are reasonable
- [ ] Variable references are correct
- [ ] Data schemas align between nodes

### Execution Test Procedure

1. **Set up test environment**
   - Deploy workflow to test tenant
   - Configure test credentials
   - Prepare test data

2. **Test trigger**
   - Manually trigger workflow
   - Verify execution starts
   - Check initial node receives input

3. **Inspect node outputs**
   - Execute to each node sequentially
   - Verify output shape and data
   - Check variable state

4. **Test all branches**
   - Force true condition → verify true path
   - Force false condition → verify false path
   - Test with loop (various sizes)

5. **Test error paths**
   - Inject credential error
   - Verify error path executes
   - Test retry behavior

6. **Validate end-to-end**
   - Execute full workflow
   - Check final output
   - Verify side effects (emails sent, records created, etc.)

### Performance Testing

```
Test: Execute workflow 100 times concurrently

Metrics:
- p50 latency: < 5 seconds
- p95 latency: < 15 seconds
- p99 latency: < 30 seconds
- Success rate: > 99%
- Error rate: < 1%
```

## Common Testing Issues

### Issue: "Credential not found"
**Cause:** Credential not created in test environment
**Fix:** Create test credential with correct name

### Issue: "Variable not found"
**Cause:** Reference to undefined variable
**Fix:** Check variable is set before reference; check spelling

### Issue: "Timeout"
**Cause:** Node takes longer than configured timeout
**Fix:** Increase timeout; check external service performance

### Issue: "Incorrect output data"
**Cause:** Data transformation error
**Fix:** Use code-execute to debug; add intermediate logging

### Issue: "Loop infinite"
**Cause:** Loop condition never becomes false
**Fix:** Check loop input; add iteration limit; debug condition

## Test Automation

### Workflow Testing Framework
```
Given: workflow deployed
And: test credentials configured
And: test data prepared

When: trigger workflow with input X
Then: output matches expected Y
And: email sent to recipient
And: record created in database
```

### Continuous Testing
- Run test suite on every workflow change
- Monitor production workflows for regressions
- Alert on increased error rate
- Automated rollback on critical failures

## See Also

- [Execution Flow & Error Handling](03-execution-flow.md) — Error recovery patterns
- [Integration Patterns](04-integration-patterns.md) — Testing integrations
- [Workflow Architecture](01-workflow-architecture.md) — Data flow understanding
