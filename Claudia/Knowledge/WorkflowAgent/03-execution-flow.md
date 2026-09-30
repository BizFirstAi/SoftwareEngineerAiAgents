# Workflow Execution Flow & Error Handling

## Execution Model

### Sequential Execution (Default)
```
Node A → Wait for completion → Node B → Wait for completion → Node C
         ↓                               ↓
      Output A                       Output B becomes Input C
```
- Each node waits for previous completion
- Current data passed to next node as input
- Standard for most workflows

### Parallel Execution
```
          ┌─→ Node B1 ──┐
Node A ──┤─→ Node B2 ──┼─→ Parallel Join → Node C
          └─→ Node B3 ──┘
```
- **parallel-fork** starts N concurrent branches
- **parallel-join** waits for all to complete before proceeding
- Branches execute concurrently (no ordering guarantee)
- Output is aggregated before join

### Conditional Branching
```
Node A → if-condition → [True branch] → Node B
            ↓              [False branch] → Node C
         Expression       (Only one executes)
```
- **if-condition:** Binary true/false route
- **switch:** Multi-way dynamic branching
- Condition evaluated against current data

### Looping
```
Node A → loop(items) → [Iteration 1] → Node B → [Iteration 2] → Node B → ... → Join
                          ↓                          ↓
                    Set current item          Set current item
```
- Loop node accepts array input
- Executes subsequent nodes for each item
- Item available as `context.current_item` or variable
- After all iterations, proceeds to next node

## Data Flow

### Variable Scope
```
Workflow Input
  ↓
[Workflow Variables] — Accessible to all nodes
  ↓
[Node Output] — Available to downstream nodes
  ↓
[Loop Context] — Current item in iteration
  ↓
[Conditional Data] — Passed to branches
```

### Data Passing Between Nodes
- **Direct reference:** `nodes.NodeName.output.fieldName`
- **Transformation:** Use data-mapping or code-execute to transform
- **Loss of fields:** Explicitly map required fields or data lost
- **Type mismatch:** Schema validation catches at deployment

### Example Data Flow
```javascript
// Trigger input
{
  "customer_id": "C123",
  "email": "john@example.com"
}

// If-condition node evaluates
if (InputData.email.includes("@")) {
  // True branch executes
} else {
  // False branch
}

// Next node receives
{
  "customer_id": "C123",
  "email": "john@example.com",
  "nodes": {
    "if-condition": { "result": true }
  }
}
```

## Execution States

| State | Description | Next State |
|-------|-------------|-----------|
| **Pending** | Waiting to start (scheduled or queued) | Running |
| **Running** | Currently executing | Paused / Completed / Failed |
| **Paused** | Awaiting input (approval, HIL chat) | Running |
| **Completed** | Finished successfully | - |
| **Failed** | Stopped due to error | - |
| **Cancelled** | User/system stopped execution | - |

## Error Handling

### Try/Catch/Finally Pattern
```
[Try Block]
  ↓ (if error)
[Catch Block] ← Handle error
  ↓
[Finally Block] ← Always execute
  ↓
Continue or Fail
```
- **Try:** Normal execution path
- **Catch:** Error handler (specific error types or catch-all)
- **Finally:** Cleanup (always runs)

### Error Paths (Transition-Level)
```
Node A → [If success] → Node B
    ↓
    [If error] → Error Handler Node
```
- Define alternate transition on node failure
- Error handler receives error details
- Can log, notify, retry, or fail gracefully

### Retry Strategy
- **Max retries:** 3 (configurable per node)
- **Backoff:** Exponential (1s, 2s, 4s)
- **Retry conditions:** Transient errors (timeout, 5xx, rate limit)
- **Non-retryable:** 4xx (auth, validation), business logic errors

### Timeout Handling
- **Node timeout:** 5 minutes (configurable)
- **Workflow timeout:** 24 hours (configurable)
- **On timeout:** Node fails, triggers error path
- **Long operations:** Use delay node or async pattern

### Error Propagation
1. Node execution fails
2. Check for local error path → Execute
3. Check for try/catch → Execute catch block
4. No handler → Propagate to parent (or fail workflow)
5. Finally block always executes

## Debugging & Observability

### Execution Logs
- **Per-node logs:** Input, output, execution time, errors
- **Workflow timeline:** Sequential view of execution
- **Variable inspector:** Current workflow state at each step
- **Error details:** Stack trace, error code, message

### Common Issues

#### Null/Undefined Output
**Problem:** Node output referenced but node hasn't executed yet
**Solution:** Check transition paths; ensure node before output is executed

#### Type Mismatch
**Problem:** Node expects array, receives object
**Solution:** Validate output schema; use data-mapping to transform

#### Credential Error
**Problem:** "Credential not found" or "Unauthorized"
**Solution:** Verify credential exists and is active; re-authorize if OAuth2

#### Timeout
**Problem:** Node takes longer than timeout duration
**Solution:** Increase timeout; split into smaller operations; use async pattern

#### Infinite Loop
**Problem:** Loop doesn't terminate
**Solution:** Check loop condition; ensure items list decreases; add iteration limit

#### Variable Not Found
**Problem:** Referenced variable doesn't exist
**Solution:** Check variable spelling; ensure variable set before reference; check scope

## Performance Optimization

### Sequential vs Parallel Trade-offs
| Approach | Pros | Cons |
|----------|------|------|
| **Sequential** | Simpler logic, clearer order | Slower (serial) |
| **Parallel** | Faster (concurrent) | Harder to debug, resource contention |

### Loop Optimization
- **Small loops (<100 items):** Standard loop node
- **Large loops (>1000 items):** Consider batch processing
- **Complex logic:** Use sub-workflow to encapsulate

### HTTP Request Optimization
- **Parallel requests:** Use parallel-fork + parallel-join
- **Batch endpoints:** Reduce number of calls
- **Caching:** Store results in workflow variables

### Credential Caching
- Credentials loaded once per workflow execution
- Avoid re-authenticating within same workflow
- Particularly important for OAuth2 (token reuse)

## Monitoring & Alerting

### Key Metrics
- **Execution duration:** Total time from trigger to completion
- **Node latency:** Per-node execution time
- **Success rate:** % of executions completing successfully
- **Error rate:** % failing due to errors (by error type)
- **Resource usage:** Tokens consumed, API calls made

### Alerting Rules
- **High error rate:** >10% failure over last hour
- **Slow execution:** >5x baseline duration
- **Credential expiration:** Detected before failure
- **Resource quota:** Approaching limits

## State Machine View

```
        ┌──────────────────────┐
        │     Created          │
        └──────────┬───────────┘
                   │ deploy
        ┌──────────▼───────────┐
   ┌────│   Draft/Testing      │◄────┐
   │    └──────────┬───────────┘     │
   │               │ activate         │
   │    ┌──────────▼───────────┐     │
   │    │   Active/Published   │     │
   │    └──────────┬───────────┘     │
   │               │ trigger         │
   │    ┌──────────▼───────────┐     │
   │    │ Running/Executing    │     │
   │    │ [Pending → Running]  │     │
   │    │ [→ Paused → Running] │     │
   │    └──────────┬───────────┘     │
   │          ┌────┴────┐            │
   │          │         │            │
   │    ┌─────▼──┐  ┌───▼─────┐    │
   │    │ Complete│  │ Failed  │    │
   │    └────────┬┘  └───┬─────┘    │
   │            │         │          │
   └────────────┴─────────┴──────────┘
         [Retest/Fix]
```
