# Deploy Workflow to Production

## Prerequisites

- [ ] Workflow passes validation (`validate_workflow`)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] End-to-end test successful
- [ ] Error paths tested
- [ ] Credentials configured and valid
- [ ] Test report generated

## Deployment Steps

### Step 1: Final Validation

```
validate_workflow(
  workflow_id: "wf_abc123"
)
```

**Expected:** No errors or warnings

If errors found, fix and re-validate.

### Step 2: Create Backup (Optional)

Create a version record:

```
get_workflow_versions(
  workflow_id: "wf_abc123"
)
```

Keep record of current version number for rollback if needed.

### Step 3: Deploy Workflow

```
deploy_workflow(
  workflow_id: "wf_abc123"
)
```

**Expected:** Workflow transitions to "active" status

### Step 4: Verify Deployment

```
get_workflow(
  workflow_id: "wf_abc123"
)
```

Check:
- Status is "active"
- Published timestamp updated
- All node configurations persisted

### Step 5: Monitor First Executions

After deployment, monitor early executions:

```
get_execution_history(
  workflow_id: "wf_abc123",
  limit: 20
)
```

Watch for:
- All executions completing
- No unexpected errors
- Performance baseline met
- Side effects working (emails sent, records created, etc.)

## Deployment Checklist

- [ ] Validation passes
- [ ] All tests pass
- [ ] Code review approved
- [ ] Credentials verified
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Deploy command executed
- [ ] Deployment confirmed
- [ ] First executions monitored

## Rollback Procedure

If workflow causes issues:

### Step 1: Deactivate Workflow

Get previous version and redeploy:

```
get_workflow_versions(
  workflow_id: "wf_abc123"
)
```

Identify previous working version number.

### Step 2: Restore Previous Version

Create new version from previous:

```
update_workflow(
  workflow_id: "wf_abc123",
  version: "previous_version_number"
)

deploy_workflow(
  workflow_id: "wf_abc123"
)
```

### Step 3: Verify Rollback

```
execute_workflow(
  workflow_id: "wf_abc123",
  input_data: { test: "data" }
)

get_execution_status(execution_id)
```

Confirm workflow returns to previous behavior.

### Step 4: Root Cause Analysis

After rollback:
1. Identify root cause
2. Fix in new version
3. Re-test thoroughly
4. Re-deploy

## Post-Deployment Monitoring

### Key Metrics

Track for 24-48 hours:
- **Execution count:** How many times triggered?
- **Success rate:** % completing successfully
- **Error rate:** % failing
- **Average latency:** Per-node and total
- **Resource usage:** CPU, memory, API calls

### Alert Thresholds

Set up alerts for:
- **High error rate:** >5% failures
- **Slow execution:** >2x baseline latency
- **Timeout:** More than baseline
- **Credential error:** Any JWT/OAuth2 failures
- **Rate limit:** Service responding with 429

### Observability

Access logs:
```
get_execution_history(
  workflow_id: "wf_abc123",
  limit: 100
)
```

For each execution, review:
- Node execution times
- Error messages
- Output data quality
- Credential usage

## Common Deployment Issues

### Issue: Credential Fails in Production

**Cause:** Credential different in production environment

**Fix:**
1. Verify production credential exists
2. Test credential manually
3. Update workflow to use production credential ID
4. Redeploy

### Issue: Rate Limit Errors

**Cause:** Unexpected high volume of executions

**Fix:**
1. Implement rate limiting in workflow (delay nodes)
2. Use parallel-fork for parallel but rate-limited calls
3. Contact external service to increase quota
4. Redeploy

### Issue: Data Format Mismatch

**Cause:** Production data different from test data

**Fix:**
1. Add code-execute node to inspect actual data
2. Update node configurations
3. Add data transformation
4. Re-test and redeploy

## Deployment Notification

Notify team of deployment:

**Template:**
```
🚀 Workflow Deployed: [Workflow Name]

Status: Active
Version: [v1.2.3]
Deployed: [Date Time]
Deployed By: [Name]

Changes:
- [Change 1]
- [Change 2]

Monitoring:
- Success Rate: [%]
- Avg Latency: [ms]
- Error Rate: [%]

Alerts:
- Contact [team] if issues

Rollback:
- Previous version: [v1.2.2]
- Rollback command available if needed
```

## See Also

- [05-test-workflow.md](05-test-workflow.md) — Pre-deployment testing
- [Knowledge/WorkflowAgent/06-mcp-server-reference.md](../../Knowledge/WorkflowAgent/06-mcp-server-reference.md) — MCP deployment tools
