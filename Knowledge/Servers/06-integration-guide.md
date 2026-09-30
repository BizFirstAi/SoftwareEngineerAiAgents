# Integration Guide

How agents provision and manage servers within BizFirst workflows.

## Agent Roles & Responsibilities

### ServerDeveloper Agent
**Responsibility:** Provision, configure, and manage server infrastructure

**Workflows:**
1. Plan infrastructure capacity (CPU, memory, network)
2. Provision new servers (call Servers API)
3. Configure runtime environment (.NET, Node, runtimes)
4. Deploy applications and services
5. Monitor health and scale as needed
6. Troubleshoot issues

**Constraints:**
- Cannot delete critical production servers without human approval
- Must maintain minimum 2 redundant servers (HA)
- Cannot exceed tenant quota without escalation
- Must follow security hardening checklist

### InstallHub (Backend Service)
**Responsibility:** Server lifecycle orchestration, tenant registration

**Integration Points:**
- Receives `server.provision` request from ServerDeveloper
- Validates quota (not over-allocated)
- Registers ServerID in database with TenantID
- Assigns IP addressing scheme
- Triggers provisioning webhooks

### NodeHost (Backend Service)
**Responsibility:** Package deployment, service management

**Integration Points:**
- Registers server for deployment
- Pushes packages (apps, configs, dependencies)
- Manages service startup/restart
- Runs health checks
- Reports deployment status back to agents

## Typical Server Provisioning Workflow

```
ServerDeveloper Agent
    ↓
    ├─ Analyze requirements
    │  - CPU: 8 cores (for 1000 req/s)
    │  - Memory: 16GB (for cache + app memory)
    │  - Storage: 100GB SSD (for logs, data)
    │  - Network: Public + private subnets
    │
    ├─ Call API: POST /servers/provision
    │  {
    │    "name": "api-prod-2",
    │    "type": "CloudInstance",
    │    "cpuCores": 8,
    │    "memoryGB": 16,
    │    "tenantID": "550e8400-...",
    │    ...
    │  }
    │
    ├─ InstallHub validates
    │  - Check tenant quota: 2 instances running, limit 10 ✓
    │  - Assign IP: 10.0.1.50
    │  - Create database record
    │
    ├─ Cloud provider provisions VM
    │  - Allocate vCPU, memory
    │  - Attach network interfaces
    │  - Boot OS from image
    │
    ├─ Boot sequence (1-2 min)
    │  - OS starts
    │  - Network configures
    │  - Cloud-init runs setup scripts
    │
    ├─ ServerDeveloper polls health
    │  - GET /servers/api-prod-2/health
    │  - Check for "Running" status
    │
    └─ Configure & Deploy (2-5 min)
       - Install .NET Runtime 9.0
       - Deploy BizFirst API package
       - Run database migrations
       - Enable monitoring
       - Verify health checks pass
```

## Common Patterns

### Pattern 1: Auto-Scaling on High Load

```
Monitoring detects: CPU > 80% for 5 minutes

ServerDeveloper receives alert:
  ├─ Check current server count (3 instances)
  ├─ Call API: POST /servers/provision (auto-scale policy)
  │  - Name: "api-prod-4"
  │  - Config: Clone from existing
  │  - Strategy: "AutoScale"
  ├─ New server provisions (3-5 min)
  ├─ Load balancer adds to pool
  ├─ Traffic redistributes
  ├─ CPU normalizes to 45%
  └─ Monitor for 15 min to confirm stability
```

### Pattern 2: Rolling Deployment

```
App Version: 9.0.0 → 9.0.1
Servers: [api-prod-1, api-prod-2, api-prod-3]

Phase 1 (api-prod-1):
  ├─ Drain connections
  ├─ Deploy v9.0.1
  ├─ Run smoke tests
  └─ Return to load balancer

Phase 2 (api-prod-2):
  ├─ Repeat Phase 1
  └─ Monitor for errors vs. api-prod-1

Phase 3 (api-prod-3):
  ├─ Repeat Phase 1
  └─ All servers running v9.0.1
```

### Pattern 3: Disaster Recovery Failover

```
Primary DC: Network outage detected

ServerDeveloper:
  ├─ Confirm primary unreachable (3 health checks)
  ├─ Activate secondary DC servers
  ├─ Promote standby database
  ├─ Update DNS to secondary IPs
  ├─ Update load balancer targets
  ├─ Verify secondary health (all green)
  └─ Notify customers: "Service restored, investigating"
```

## Error Handling & Retry

```
Scenario: Provisioning times out after 10 minutes

ServerDeveloper:
  ├─ Check status: GET /servers/api-prod-2
  ├─ Status: "Provisioning" (ongoing)
  │
  ├─ Retry 1 (after 2 min): Still provisioning
  │
  ├─ Retry 2 (after 5 min): Still provisioning
  │
  ├─ Escalate to human
  │  └─ Check cloud provider logs
  │     └─ Find: "Insufficient capacity in zone"
  │
  ├─ Recommendation: Retry in different zone
  │
  └─ Call API: POST /servers/provision
     { "region": "us-west-1", ... }
```

## Monitoring Integration

### Metrics to Track
- **Provision Time** — How long from request to Running (target: 3-5 min)
- **Deployment Success Rate** — % deployments that succeed (target: 99.9%)
- **Auto-Scale Latency** — Time from alert to new server in load balancer (target: <10 min)
- **Failover Time** — Time to detect failure + activate secondary (target: <5 min)

### Alerts to Configure
```
Alert: ProvisioningFailure
  - Condition: Status = Provisioning for > 15 minutes
  - Action: Page oncall, escalate to platform team

Alert: HealthDegraded
  - Condition: CPUUsage > 85% or MemoryUsage > 90%
  - Action: Trigger auto-scale, monitor

Alert: FailoverRequired
  - Condition: Primary DC unreachable for 3 consecutive checks
  - Action: Page incident commander, activate DR

Alert: DeploymentFailure
  - Condition: Deployment status = Failed
  - Action: Rollback, notify, page on-call
```

## Best Practices

1. **Always maintain redundancy** — Never have single point of failure
   - Minimum 2 servers in load-balanced pool
   - Database replicated across zones

2. **Plan capacity ahead** — Monitor trends, add servers before crisis
   - Review metrics weekly
   - Forecast 1 month ahead
   - Add servers during low-traffic windows

3. **Test disaster recovery monthly** — Don't assume failover will work
   - Restore database from backup
   - Test failover in non-prod first
   - Document runbook and practice it

4. **Use immutable infrastructure** — Never ssh into production and edit files
   - Update configuration → rebuild container/AMI
   - Deploy new server → decommission old
   - Makes rollback safe and repeatable

5. **Monitor everything** — If you can't measure it, you can't manage it
   - Enable application-level metrics
   - Track business metrics (transactions, errors)
   - Set up meaningful alerts (not noise)

6. **Document runbooks** — Automation is great, but humans must understand
   - Write step-by-step procedures
   - Include decision trees (if X, then Y)
   - Test with new team members

## Next Steps
- [Procedure: Provision Server](../../Procedure/Servers/provision-server.md)
- [Procedure: Configure Server](../../Procedure/Servers/configure-server.md)
- [Procedure: Deploy Application](../../Procedure/Servers/deploy-application.md)
